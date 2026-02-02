import type { HuBoxNotification, NotificationStats } from '../github'

function mockNotif(id: string, repo: string, title: string, type: 'PullRequest' | 'Issue', reason: string, minutesAgo: number, extra?: Partial<HuBoxNotification>): HuBoxNotification {
  const [owner, name] = repo.split('/')
  return {
    id,
    reason,
    repository: { full_name: repo, owner: { login: owner }, name },
    subject: { title, type, url: null, latest_comment_url: null },
    updated_at: new Date(Date.now() - minutesAgo * 60000).toISOString(),
    unread: true,
    url: '',
    ...extra,
  }
}

export const mockNotifications: HuBoxNotification[] = [
  mockNotif('1', 'vercel/next.js', 'fix: resolve hydration mismatch in app router', 'PullRequest', 'review_requested', 3),
  mockNotif('2', 'denoland/deno', 'Node compat: support for crypto.subtle in workers', 'Issue', 'mention', 12),
  mockNotif('3', 'preactjs/preact', 'Signals: batch updates not flushing correctly', 'Issue', 'subscribed', 45, { unread: true, isRead: true }),
  mockNotif('4', 'electron/electron', 'feat: add BrowserWindow.setWindowButtonVisibility API', 'PullRequest', 'author', 120, { unread: false, isRead: true }),
  mockNotif('5', 'vitejs/vite', 'CI: build pipeline failing on Windows arm64', 'Issue', 'ci_activity', 180, { unread: false, isRead: true }),
  mockNotif('6', 'tailwindlabs/tailwindcss', 'Add support for container query units', 'PullRequest', 'review_requested', 300),
  mockNotif('7', 'vercel/next.js', 'RFC: Server Actions streaming support', 'Issue', 'comment', 480, { unread: false, isRead: true }),
  mockNotif('8', 'oven-sh/bun', 'fix: memory leak in fetch() with large response bodies', 'Issue', 'assign', 1440),
]

export const mockDone: HuBoxNotification[] = [
  mockNotif('90', 'nodejs/node', 'test: fix flaky async_hooks test on CI', 'PullRequest', 'subscribed', 2880, { unread: false, isDone: true, isRead: true }),
  mockNotif('91', 'biomejs/biome', 'feat: add CSS nesting support to formatter', 'Issue', 'mention', 4320, { unread: false, isDone: true, isRead: true }),
]

export const allNotifications = [...mockNotifications, ...mockDone]

export const mockStats: NotificationStats = {
  total: 10,
  unread: 5,
  appUnread: 4,
  done: 2,
  inProgress: 8,
  lastSync: Date.now() - 1000 * 60 * 2,
  isOnline: true,
}
