export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffMin < 1) return 'just now';
  if (diffHour < 1) return `${diffMin}m`;
  if (diffDay < 1) return `${diffHour}h`;
  if (diffWeek < 1) return `${diffDay}d`;
  if (diffMonth < 1) return `${diffWeek}w`;
  if (diffYear < 1) return `${diffMonth}mo`;
  return `${diffYear}y`;
}

export function humanizeReason(reason: string): string {
  const mapping: Record<string, string> = {
    mention: 'Mentioned',
    review_requested: 'Review Requested',
    author: 'Author',
    comment: 'Comment',
    assign: 'Assigned',
    team_mention: 'Team Mention',
    state_change: 'State Change',
    ci_activity: 'CI Activity',
  };

  return mapping[reason] || reason
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getReasonColor(reason: string): string {
  const colors: Record<string, string> = {
    mention: 'bg-blue-100 text-blue-800',
    review_requested: 'bg-purple-100 text-purple-800',
    author: 'bg-green-100 text-green-800',
    comment: 'bg-yellow-100 text-yellow-800',
    assign: 'bg-red-100 text-red-800',
    team_mention: 'bg-indigo-100 text-indigo-800',
  };

  return colors[reason] || 'bg-gray-100 text-gray-800';
}
