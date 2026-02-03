import { Octokit } from '@octokit/rest'
import { RequestCache } from './request-cache.js'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fetchCached, Fetcher } from './fetch.js'

export type HuBoxNotification = {
  id: string
  reason: string
  repository: {
    full_name: string
    owner: {
      login: string
    }
    name: string
  }
  subject: {
    title: string
    type: string
    url: string | null
    latest_comment_url: string | null
  }
  updated_at: string
  unread: boolean
  url: string
  // App-level state
  isRead?: boolean // Our custom read state
  isDone?: boolean // User marked as done
  priority?: number // Custom priority
  lastViewedAt?: number // Timestamp
}

export type NotificationDetails = {
  notification: HuBoxNotification
  comments?: any[]
  issue?: any
  pullRequest?: any
}

type StorageData = {
  notifications: HuBoxNotification[]
  lastSync: number
  activeBatchIds: string[]
  customStates: Record<
    string,
    {
      isRead?: boolean
      isDone?: boolean
      priority?: number
      lastViewedAt?: number
    }
  >
}

export class NotificationManager {
  private okit: Octokit
  private inProgressNotifications: HuBoxNotification[] = []
  private allNotifications: HuBoxNotification[] = []
  private activeBatchIds: string[] = []
  private customStates: Map<
    string,
    {
      isRead?: boolean
      isDone?: boolean
      priority?: number
      lastViewedAt?: number
    }
  > = new Map()
  private storageFile: string
  private isOnline = true
  private lastSyncTime = 0
  private cacheStore: RequestCache

  constructor(
    token: string,
    private maxActive: number,
    storagePath: string,
    cacheTTL: number = 5 * 60 * 1000,
    { fetch = globalThis.fetch } = {}
  ) {
    // Initialize request cache
    this.cacheStore = new RequestCache(cacheTTL, storagePath)
    const request: Fetcher = fetchCached({
      fetch: fetch,
      cache: this.cacheStore,
    })

    this.okit = new Octokit({
      auth: token,
      request: {
        fetch: request,
      },
    })

    // Set storage location
    this.storageFile = path.join(storagePath, 'github-notifications.json')

    // Initialize from storage
    this.loadFromStorage().catch(console.error)
  }

  async resetStorage(): Promise<void> {
    this.allNotifications = []
    this.activeBatchIds = []
    this.inProgressNotifications = []
    this.customStates.clear()
    this.lastSyncTime = 0
    this.isOnline = true
    try {
      await fs.unlink(this.storageFile)
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  async validateToken(): Promise<void> {
    try {
      await this.okit.activity.listNotificationsForAuthenticatedUser({
        all: true,
        page: 1,
        per_page: 1,
      })
      this.isOnline = true
    } catch (error) {
      this.isOnline = false
      throw new Error('Invalid GitHub token or network error')
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = await fs.readFile(this.storageFile, 'utf-8')
      const parsed: StorageData = JSON.parse(data)

      this.allNotifications = parsed.notifications || []
      this.lastSyncTime = parsed.lastSync || 0
      this.activeBatchIds = parsed.activeBatchIds || []
      this.customStates = new Map(Object.entries(parsed.customStates || {}))

      // Apply custom states to notifications
      this.allNotifications.forEach(notif => {
        const state = this.customStates.get(notif.id)
        if (state) {
          Object.assign(notif, state)
        }
      })

      this.updateInProgressList()
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      console.log('No cached notifications found, starting fresh')
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data: StorageData = {
        notifications: this.allNotifications,
        lastSync: this.lastSyncTime,
        activeBatchIds: this.activeBatchIds,
        customStates: Object.fromEntries(this.customStates),
      }

      await fs.mkdir(path.dirname(this.storageFile), { recursive: true })
      await fs.writeFile(
        this.storageFile,
        JSON.stringify(data, null, 2),
        'utf-8'
      )
    } catch (error) {
      console.error('Failed to save notifications:', error)
    }
  }

  private updateInProgressList(): void {
    const availableNotDone = this.allNotifications
      .filter(n => !n.isDone)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )

    const activeSet = new Set(this.activeBatchIds)
    const remainingActive = availableNotDone.filter(n => activeSet.has(n.id))

    const newActive: typeof this.inProgressNotifications = [...remainingActive]
    for (const n of availableNotDone) {
      if (newActive.length >= this.maxActive) break
      if (newActive.find(x => x.id === n.id)) continue
      newActive.push(n)
    }

    this.activeBatchIds = newActive.map(n => n.id)
    this.inProgressNotifications = newActive
  }

  async getInProgress(): Promise<HuBoxNotification[]> {
    // Try to sync if online
    if (this.isOnline) {
      try {
        await this.sync()
      } catch (error) {
        console.error('Sync failed, using cached data:', error)
        this.isOnline = false
      }
    }

    return this.inProgressNotifications
  }

  async getAll(): Promise<HuBoxNotification[]> {
    if (this.isOnline) {
      try {
        await this.fetchAll()
      } catch (error) {
        console.error('Fetch all failed, using cached data:', error)
        this.isOnline = false
      }
    }

    return this.allNotifications
  }

  async fetchAll(): Promise<void> {
    try {
      const allNotifications: HuBoxNotification[] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const response =
          await this.okit.activity.listNotificationsForAuthenticatedUser({
            all: true,
            page: page,
            per_page: 100,
          })

        if (response.data.length === 0) {
          hasMore = false
        } else {
          allNotifications.push(
            ...response.data.map(this.mapNotification.bind(this))
          )
          page++
        }
      }

      // Merge with existing, preserving custom states
      const notifMap = new Map(this.allNotifications.map(n => [n.id, n]))

      allNotifications.forEach(newNotif => {
        const existing = notifMap.get(newNotif.id)
        const customState = this.customStates.get(newNotif.id)

        // Preserve custom states from either existing notification or customStates map
        if (existing || customState) {
          Object.assign(newNotif, {
            isRead: customState?.isRead ?? existing?.isRead,
            isDone: customState?.isDone ?? existing?.isDone,
            priority: customState?.priority ?? existing?.priority,
            lastViewedAt: customState?.lastViewedAt ?? existing?.lastViewedAt,
          })
        }
        notifMap.set(newNotif.id, newNotif)
      })

      this.allNotifications = Array.from(notifMap.values())
      this.lastSyncTime = Date.now()
      this.isOnline = true
      this.updateInProgressList()
      await this.saveToStorage()
    } catch (error) {
      this.isOnline = false
      throw error
    }
  }

  async sync(): Promise<void> {
    try {
      const data =
        await this.okit.activity.listNotificationsForAuthenticatedUser({
          all: true,
          page: 1,
          per_page: 100,
        })

      const newNotifications = data.data.map(this.mapNotification.bind(this))

      // Merge with existing, preserving custom states
      const notifMap = new Map(this.allNotifications.map(n => [n.id, n]))

      newNotifications.forEach(newNotif => {
        const existing = notifMap.get(newNotif.id)
        const customState = this.customStates.get(newNotif.id)

        // Preserve custom states from either existing notification or customStates map
        if (existing || customState) {
          Object.assign(newNotif, {
            isRead: customState?.isRead ?? existing?.isRead,
            isDone: customState?.isDone ?? existing?.isDone,
            priority: customState?.priority ?? existing?.priority,
            lastViewedAt: customState?.lastViewedAt ?? existing?.lastViewedAt,
          })
        }
        notifMap.set(newNotif.id, newNotif)
      })

      this.allNotifications = Array.from(notifMap.values())
      this.lastSyncTime = Date.now()
      this.isOnline = true
      this.updateInProgressList()
      await this.saveToStorage()
    } catch (error) {
      this.isOnline = false
      throw error
    }
  }

  private mapNotification(d: any): HuBoxNotification {
    return {
      id: d.id,
      reason: d.reason,
      repository: {
        full_name: d.repository.full_name,
        owner: {
          login: d.repository.owner.login,
        },
        name: d.repository.name,
      },
      subject: {
        title: d.subject.title,
        type: d.subject.type,
        url: d.subject.url,
        latest_comment_url: d.subject.latest_comment_url,
      },
      updated_at: d.updated_at,
      unread: d.unread,
      url: d.url,
    }
  }

  async getNotificationDetails(
    notificationId: string
  ): Promise<NotificationDetails | null> {
    const notification = this.allNotifications.find(
      n => n.id === notificationId
    )
    if (!notification) {
      return null
    }

    try {
      const details: NotificationDetails = { notification }

      // Extract issue/PR number from URL
      const subjectUrl = notification.subject.url
      if (subjectUrl) {
        const urlParts = subjectUrl.split('/')
        const number = parseInt(urlParts[urlParts.length - 1])
        const owner = notification.repository.owner.login
        const repo = notification.repository.name

        if (notification.subject.type === 'Issue') {
          const issue = await this.okit.issues.get({
            owner,
            repo,
            issue_number: number,
          })
          details.issue = issue.data

          // Fetch comments
          const comments = await this.okit.issues.listComments({
            owner,
            repo,
            issue_number: number,
          })
          details.comments = comments.data
        } else if (notification.subject.type === 'PullRequest') {
          const pr = await this.okit.pulls.get({
            owner,
            repo,
            pull_number: number,
          })
          details.pullRequest = pr.data

          // Fetch comments
          const comments = await this.okit.issues.listComments({
            owner,
            repo,
            issue_number: number,
          })
          details.comments = comments.data
        }
      }

      return details
    } catch (error) {
      console.error('Failed to fetch notification details:', error)
      return { notification }
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.allNotifications.find(
      n => n.id === notificationId
    )
    if (notification) {
      notification.isRead = true
      notification.lastViewedAt = Date.now()
      this.customStates.set(notificationId, {
        isRead: true,
        isDone: notification.isDone,
        priority: notification.priority,
        lastViewedAt: notification.lastViewedAt,
      })
      this.updateInProgressList()
      await this.saveToStorage()
    }
  }

  async markAsDone(notificationId: string): Promise<void> {
    const notification = this.allNotifications.find(
      n => n.id === notificationId
    )
    if (notification) {
      notification.isDone = true
      notification.isRead = true
      this.customStates.set(notificationId, {
        isRead: true,
        isDone: true,
        priority: notification.priority,
        lastViewedAt: notification.lastViewedAt,
      })
      this.updateInProgressList()
      await this.saveToStorage()

      // Optionally mark as read on GitHub too
      try {
        await this.okit.activity.markThreadAsDone({
          thread_id: parseInt(notificationId, 10),
        })
      } catch (error) {
        console.error('Failed to mark as read on GitHub:', error)
      }
    }
  }

  async markAsUnread(notificationId: string): Promise<void> {
    const notification = this.allNotifications.find(
      n => n.id === notificationId
    )
    if (notification) {
      notification.isRead = false
      this.customStates.set(notificationId, {
        isRead: false,
        isDone: notification.isDone,
        priority: notification.priority,
        lastViewedAt: notification.lastViewedAt,
      })
      await this.saveToStorage()
    }
  }

  async setPriority(notificationId: string, priority: number): Promise<void> {
    const notification = this.allNotifications.find(
      n => n.id === notificationId
    )
    if (notification) {
      notification.priority = priority
      this.customStates.set(notificationId, {
        isRead: notification.isRead,
        isDone: notification.isDone,
        priority: priority,
        lastViewedAt: notification.lastViewedAt,
      })
      await this.saveToStorage()
    }
  }

  async expandInboxLimit(additionalCount: number = 10): Promise<void> {
    this.maxActive += additionalCount
    this.updateInProgressList()
    await this.saveToStorage()
  }

  getStats() {
    return {
      total: this.allNotifications.length,
      unread: this.allNotifications.filter(n => n.unread).length,
      appUnread: this.inProgressNotifications.filter(n => !n.isRead).length,
      done: this.allNotifications.filter(n => n.isDone).length,
      inProgress: this.inProgressNotifications.length,
      lastSync: this.lastSyncTime,
      isOnline: this.isOnline,
    }
  }
}
