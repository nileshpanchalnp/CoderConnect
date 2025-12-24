export const formatDistanceToNow = (dateString?: string): string => {
  if (!dateString) return 'invalid date';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'invalid date';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const isFuture = diffInSeconds < 0;
  const absSeconds = Math.abs(diffInSeconds);

  if (absSeconds < 60) return 'just now';

  const intervals: Record<string, number> = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const count = Math.floor(absSeconds / secondsInUnit);
    if (count >= 1) {
      const suffix = isFuture ? 'from now' : 'ago';
      return `${count} ${unit}${count > 1 ? 's' : ''} ${suffix}`;
    }
  }

  return 'just now';
};
