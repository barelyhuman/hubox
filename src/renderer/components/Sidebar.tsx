import type { ComponentChildren } from 'preact'
import type { NotificationStats } from '../github'
import { Icon, ICON_PATHS } from './icons'
import { relativeTime } from '../lib/utils'

export type View = 'inbox' | 'all' | 'done'

export const VIEW_TITLES: Record<View, string> = {
  inbox: 'Inbox',
  all: 'All Notifications',
  done: 'Done',
}

const NAV_ITEMS: { view: View; icon: string | readonly string[]; label: string; badge?: (s: NotificationStats) => ComponentChildren }[] = [
  { view: 'inbox', icon: ICON_PATHS.inbox, label: 'Inbox', badge: s => s.appUnread > 0 && <span class="nav-badge">{s.appUnread}</span> },
  { view: 'all', icon: ICON_PATHS.all, label: 'All', badge: s => <span class="nav-count">{s.total}</span> },
  { view: 'done', icon: ICON_PATHS.check, label: 'Done', badge: s => <span class="nav-count">{s.done}</span> },
]

export function Sidebar({ activeView, onNavigate, stats, onLogout }: { activeView: View; onNavigate: (v: View) => void; stats: NotificationStats; onLogout: () => void }) {
  return (
    <aside class="sidebar">
      <div class="title-bar">
        <div class="title-bar-drag"></div>
      </div>
      <div class="sidebar-header">
        <span class="sidebar-logo">hubox</span>
      </div>
      <nav class="sidebar-nav">
        {NAV_ITEMS.map(({ view, icon, label, badge }) => (
          <button
            key={view}
            class={`nav-item ${activeView === view ? 'nav-item--active' : ''}`}
            onClick={() => onNavigate(view)}
          >
            <Icon d={icon} />
            <span>{label}</span>
            {badge?.(stats)}
          </button>
        ))}
      </nav>
      <div class="sidebar-footer">
        <div class="sync-status">
          <span class={`sync-dot ${stats.isOnline ? 'sync-dot--online' : ''}`} />
          <span class="sync-text">Synced {relativeTime(new Date(stats.lastSync).toISOString())} ago</span>
        </div>
        <button class="logout-btn" onClick={onLogout}>
          <Icon d={ICON_PATHS.signOut} size={14} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  )
}
