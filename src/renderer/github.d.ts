// Type definitions for the GitHub API exposed to renderer
export interface HuBoxNotification {
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
  isRead?: boolean
  isDone?: boolean
  priority?: number
  lastViewedAt?: number
}

export interface NotificationDetails {
  notification: HuBoxNotification
  comments?: any[]
  issue?: any
  pullRequest?: any
}

export interface NotificationStats {
  total: number
  unread: number
  appUnread: number
  done: number
  inProgress: number
  lastSync: number
  isOnline: boolean
}

declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, data: unknown) => void
      platform: NodeJS.Platform
      onWindowMaximized: (callback: () => void) => void
      onWindowUnmaximized: (callback: () => void) => void
    }
    githubAPI: {
      initialize: (token: string) => Promise<{ success: boolean }>
      updateToken: (token: string) => Promise<{ success: boolean }>
      getInProgress: () => Promise<HuBoxNotification[]>
      getAll: () => Promise<HuBoxNotification[]>
      sync: () => Promise<void>
      getDetails: (
        notificationId: string
      ) => Promise<NotificationDetails | null>
      markAsRead: (notificationId: string) => Promise<void>
      markAsDone: (notificationId: string) => Promise<void>
      markAsUnread: (notificationId: string) => Promise<void>
      setPriority: (notificationId: string, priority: number) => Promise<void>
      getStats: () => Promise<NotificationStats>
    }
  }
}

export {}
