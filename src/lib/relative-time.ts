export function formatRelativeTime(occurredAt: string | Date, now: Date) {
  const timestamp =
    typeof occurredAt === 'string'
      ? new Date(occurredAt).getTime()
      : occurredAt.getTime();
  const minutes = Math.floor((now.getTime() - timestamp) / 60_000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}시간 전`;

  return `${Math.floor(hours / 24)}일 전`;
}
