import { format, toZonedTime } from 'date-fns-tz';

export function getUserTimezone(date: Date): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export function formatTimeWithZone(date: Date, timeZone: string): string {
  const zoned = toZonedTime(date, timeZone);
  return format(zoned, 'hh:mm aaaa (zzz)', { timeZone });
}

