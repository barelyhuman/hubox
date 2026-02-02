import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { Sidebar, VIEW_TITLES, type View } from './components/Sidebar'
import { NotificationList } from './components/NotificationList'
import { DetailPane } from './components/DetailPane'
import { TokenSetup } from './components/TokenSetup'
import type {
  HuBoxNotification,
  NotificationDetails,
  NotificationStats,
} from './github'

type Screen = 'loading' | 'token-setup' | 'app'

const SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes

const DEFAULT_STATS: NotificationStats = {
  total: 0,
  unread: 0,
  appUnread: 0,
  done: 0,
  inProgress: 0,
  lastSync: 0,
  isOnline: false,
}

export const App = () => {
  const [screen, setScreen] = useState<Screen>('loading')
  const [activeView, setActiveView] = useState<View>('inbox')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<HuBoxNotification[]>([])
  const [stats, setStats] = useState<NotificationStats>(DEFAULT_STATS)
  const [details, setDetails] = useState<NotificationDetails | null>(null)
  const activeViewRef = useRef(activeView)
  activeViewRef.current = activeView

  const loadData = useCallback(async (view?: View, throwOnError = false) => {
    const v = view ?? activeViewRef.current
    try {
      const [notifs, newStats] = await Promise.all([
        v === 'inbox'
          ? window.githubAPI.getInProgress()
          : window.githubAPI
              .getAll()
              .then(all => (v === 'done' ? all.filter(n => n.isDone) : all)),
        window.githubAPI.getStats(),
      ])
      setNotifications(notifs)
      setStats(newStats)
    } catch (err) {
      console.error('Failed to load data:', err)
      if (throwOnError) throw err
    }
  }, [])

  const initializeApp = useCallback(
    async (token: string) => {
      await window.githubAPI.initialize(token)
      await loadData(undefined, true)
      setScreen('app')
    },
    [loadData]
  )

  // Startup: check for existing token
  useEffect(() => {
    window.tokenAPI
      .get()
      .then(async token => {
        if (!token) {
          setScreen('token-setup')
          return
        }
        setScreen('app')
      })
      .catch(() => {
        setScreen('token-setup')
      })
  }, [initializeApp])

  // Periodic sync
  useEffect(() => {
    if (screen !== 'app') return
    const id = setInterval(async () => {
      try {
        await window.githubAPI.sync()
        await loadData()
      } catch (err) {
        console.error('Sync failed:', err)
      }
    }, SYNC_INTERVAL)
    return () => clearInterval(id)
  }, [screen, loadData])

  // Reload when view changes
  useEffect(() => {
    if (screen === 'app') {
      loadData(activeView)
    }
  }, [activeView, screen, loadData])

  // Fetch details when selection changes
  useEffect(() => {
    if (!selectedId) {
      setDetails(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [det] = await Promise.all([
          window.githubAPI.getDetails(selectedId),
          window.githubAPI.markAsRead(selectedId),
        ])
        if (!cancelled) setDetails(det)
      } catch (err) {
        console.error('Failed to load details:', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const handleTokenSaved = useCallback(
    async (token: string) => {
      try {
        await window.githubAPI.updateToken(token)
        await loadData(undefined, true)
        setScreen('app')
      } catch (error) {
        // Delete the invalid token
        await window.tokenAPI.delete()
        setScreen('token-setup')
        throw error
      }
    },
    [initializeApp]
  )

  const handleLogout = async () => {
    await window.tokenAPI.delete()
    setNotifications([])
    setStats(DEFAULT_STATS)
    setDetails(null)
    setSelectedId(null)
    setScreen('token-setup')
  }

  const handleMarkDone = async (id: string) => {
    await window.githubAPI.markAsDone(id)
    if (selectedId === id) {
      setSelectedId(null)
      setDetails(null)
    }
    await loadData()
  }

  if (screen === 'loading') return null
  if (screen === 'token-setup')
    return <TokenSetup onTokenSaved={handleTokenSaved} />

  const selected = notifications.find(n => n.id === selectedId) || null

  return (
    <div class="app-layout">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        stats={stats}
        onLogout={handleLogout}
      />
      <NotificationList
        title={VIEW_TITLES[activeView]}
        notifications={notifications}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <DetailPane
        notification={selected}
        details={details}
        onMarkDone={handleMarkDone}
      />
    </div>
  )
}
