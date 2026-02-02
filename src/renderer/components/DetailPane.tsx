import type { HuBoxNotification, NotificationDetails } from '../github'
import { Icon, ICON_PATHS, TypeIcon } from './icons'
import { relativeTime, reasonLabel } from '../lib/utils'
import { renderMarkdown } from '../lib/markdown'

type Props = {
  notification: HuBoxNotification | null
  details: NotificationDetails | null
  onMarkDone: (id: string) => void
}

function getHtmlUrl(details: NotificationDetails | null): string | null {
  if (!details) return null
  const item = details.issue ?? details.pullRequest
  return item?.html_url ?? null
}

export function DetailPane({ notification, details, onMarkDone }: Props) {
  if (!notification) {
    return (
      <section class="detail-pane">
        <div class="detail-empty">
          <Icon d={ICON_PATHS.inbox} size={32} opacity="0.2" />
          <p>Select a notification</p>
        </div>
      </section>
    )
  }

  const n = notification
  const htmlUrl = getHtmlUrl(details)

  return (
    <section class="detail-pane detail-pane--open">
      <div class="detail-header">
        <div class="detail-type-row">
          <TypeIcon type={n.subject.type} />
          <span class="detail-type-label">
            {n.subject.type === 'PullRequest' ? 'Pull Request' : 'Issue'}
          </span>
        </div>
        <h1 class="detail-title">{n.subject.title}</h1>
        <div class="detail-repo">{n.repository.full_name}</div>
      </div>
      <div class="detail-meta-bar">
        <span class={`detail-reason-badge detail-reason-badge--${n.reason}`}>
          {reasonLabel(n.reason)}
        </span>
        <span class="detail-time">
          Updated {relativeTime(n.updated_at)} ago
        </span>
      </div>
      <div class="detail-actions">
        <button
          class="action-btn action-btn--primary"
          onClick={() => onMarkDone(n.id)}
        >
          <Icon d={ICON_PATHS.check} size={14} />
          <span>Done</span>
        </button>
        {htmlUrl && (
          <button
            class="action-btn"
            onClick={() => window.open(htmlUrl, '_blank')}
          >
            <Icon d={ICON_PATHS.openExternal} size={14} />
            <span>Open on GitHub</span>
          </button>
        )}
      </div>
      <div class="detail-body">
        {details?.comments && details.comments.length > 0 ? (
          details.comments.map((comment: any) => (
            <div key={comment.id} class="detail-comment">
              <div class="detail-comment-header">
                <strong>{comment.user?.login}</strong>
                <span class="detail-time">
                  {relativeTime(comment.created_at)}
                </span>
              </div>
              <div
                class="detail-comment-body"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(comment.body),
                }}
              />
            </div>
          ))
        ) : (
          <div class="detail-placeholder">
            <Icon d={ICON_PATHS.document} size={24} opacity="0.3" />
            <p>{details ? 'No comments yet' : 'Loading details…'}</p>
          </div>
        )}
      </div>
    </section>
  )
}
