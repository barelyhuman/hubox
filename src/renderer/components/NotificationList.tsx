import type { HuBoxNotification } from '../github'
import { Icon, ICON_PATHS, TypeIcon } from './icons'
import { relativeTime, reasonLabel } from '../lib/utils'

function NotificationItem({ notification: n, selected, onSelect }: { notification: HuBoxNotification; selected: boolean; onSelect: () => void }) {
  return (
    <button
      class={`notif-item ${selected ? 'notif-item--selected' : ''} ${!n.isRead && n.unread ? 'notif-item--unread' : ''}`}
      onClick={onSelect}
    >
      <div class="notif-unread-indicator" />
      <TypeIcon type={n.subject.type} />
      <div class="notif-content">
        <div class="notif-title">{n.subject.title}</div>
        <div class="notif-meta">
          <span class="notif-repo">{n.repository.full_name}</span>
          <span class="notif-sep">&middot;</span>
          <span class="notif-reason">{reasonLabel(n.reason)}</span>
          <span class="notif-sep">&middot;</span>
          <span class="notif-time">{relativeTime(n.updated_at)}</span>
        </div>
      </div>
    </button>
  )
}

export function NotificationList({ title, notifications, selectedId, onSelect }: { title: string; notifications: HuBoxNotification[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <main class="list-pane">
      <div class="list-header">
        <h2 class="list-title">{title}</h2>
      </div>
      <div class="list-items">
        {notifications.length === 0 ? (
          <div class="list-empty">
            <Icon d={ICON_PATHS.check} size={24} opacity="0.3" />
            <p>All caught up</p>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationItem key={n.id} notification={n} selected={selectedId === n.id} onSelect={() => onSelect(n.id)} />
          ))
        )}
      </div>
    </main>
  )
}
