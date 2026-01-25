/**
 * Formats a date string into a relative time string (e.g., "Just now", "5m ago", "2h ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Groups notifications by time period (Today, Yesterday, Earlier)
 */
export function getNotificationTimeGroup(dateString: string): 'today' | 'yesterday' | 'earlier' {
  const date = new Date(dateString);
  const now = new Date();

  // Reset times to midnight for comparison
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateDay.getTime() === today.getTime()) {
    return 'today';
  } else if (dateDay.getTime() === yesterday.getTime()) {
    return 'yesterday';
  }
  return 'earlier';
}
