import ms from 'ms'

export function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  return now > then ? ms(now - then) : ms(then - now)
}

const REASON_LABELS: Record<string, string> = {
  review_requested: 'Review requested',
  mention: 'Mentioned',
  subscribed: 'Subscribed',
  author: 'Author',
  ci_activity: 'CI',
  comment: 'Comment',
  assign: 'Assigned',
  state_change: 'State changed',
  team_mention: 'Team mentioned',
}

export function reasonLabel(reason: string): string {
  return REASON_LABELS[reason] || reason
}
