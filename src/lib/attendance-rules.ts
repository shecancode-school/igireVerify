export interface AttendanceRules {
  checkInStart: string;
  checkInEnd: string;
  classStart: string;
  checkOutStart: string;
  checkOutEnd: string;
  lateAfter: string;
  days: string[];
}

export const STAFF_RULES: AttendanceRules = {
  checkInStart: '08:00',
  checkInEnd: '08:30',
  classStart: '08:30',
  checkOutStart: '16:30',
  checkOutEnd: '17:30',
  lateAfter: '08:30',
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
};

export function isValidAttendanceDay(rules: AttendanceRules, date: Date): boolean {
  if (!rules || !rules.days) return false;
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  return rules.days.includes(dayName);
}

export function getAttendanceStatus(checkInTime: Date, rules: AttendanceRules): 'on-time' | 'late' | 'absent' {
  const checkInTimeStr = formatTimeToHHMM(checkInTime);

  // On-time: checked in before or at lateAfter
  if (checkInTimeStr <= rules.lateAfter) {
    return 'on-time';
  }
  // Late: checked in after lateAfter but before class ends (or end of day)
  else {
    return 'late';
  }
}

export function canCheckOut(rules: AttendanceRules, currentTime: Date): boolean {
  const currentTimeStr = formatTimeToHHMM(currentTime);
  // Must be after class start
  return currentTimeStr >= rules.classStart;
}

export function isWithinCheckOutWindow(rules: AttendanceRules, currentTime: Date): boolean {
  const currentTimeStr = formatTimeToHHMM(currentTime);
  return currentTimeStr >= rules.checkOutStart && currentTimeStr <= rules.checkOutEnd;
}

export function formatTimeToHHMM(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function toDisplayTime(value: string): string {
  // Handle 24h values coming from <input type="time">, e.g. "20:25".
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return value;
  const h = Number(m[1]);
  const min = m[2];
  if (!Number.isFinite(h) || h < 0 || h > 23) return value;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12.toString().padStart(2, "0")}:${min} ${period}`;
}

export function getAttendanceWindowMessage(
  type: 'checkin' | 'checkout',
  rules: AttendanceRules,
  currentTime: Date
): string | null {
  const timeStr = formatTimeToHHMM(currentTime);
  const dayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' });

  // 1. Check if it's a scheduled day
  if (!rules.days.includes(dayName)) {
    return `Today (${dayName}) is not a scheduled working day for your program. Please check back during scheduled sessions: ${rules.days.join(", ")}.`;
  }

  if (type === 'checkin') {
    if (timeStr < rules.checkInStart) {
      return `Check-in opens at ${toDisplayTime(rules.checkInStart)}. Please return during the scheduled time window.`;
    }
  } else {
    // Checkout
    if (timeStr < rules.classStart) {
      return `It's too early to check out. Session officially started at ${toDisplayTime(rules.classStart)}.`;
    }
    if (timeStr < rules.checkOutStart) {
      return `Check-out window hasn't opened yet. It starts at ${toDisplayTime(rules.checkOutStart)}. Please stay until the session ends.`;
    }
    if (timeStr > rules.checkOutEnd) {
      return `Check-out is only allowed between ${toDisplayTime(rules.checkOutStart)} and ${toDisplayTime(rules.checkOutEnd)}. Please return during the scheduled window.`;
    }
  }

  return null; // All good
}

/**
 * Quick client-side check to see if submission should even be attempted
 */
export function isWindowOpenNow(
  type: 'checkin' | 'checkout',
  rules: AttendanceRules | null | undefined
): { isOpen: boolean; message: string | null } {
  if (!rules) return { isOpen: true, message: null }; // Fallback to server validation if rules missing
  
  const now = new Date();
  const message = getAttendanceWindowMessage(type, rules, now);
  
  return {
    isOpen: message === null,
    message
  };
}
