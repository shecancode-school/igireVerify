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
  
  if (!rules || !rules.lateAfter) return 'on-time';

  if (checkInTimeStr <= rules.lateAfter) {
    return 'on-time';
  } else {
    return 'late';
  }
}

export function canCheckOut(rules: AttendanceRules, currentTime: Date): boolean {
  const currentTimeStr = formatTimeToHHMM(currentTime);

  return currentTimeStr >= rules.classStart;
}

export function isWithinCheckOutWindow(rules: AttendanceRules, currentTime: Date): boolean {
  const currentTimeStr = formatTimeToHHMM(currentTime);
  return currentTimeStr >= rules.checkOutStart && currentTimeStr <= rules.checkOutEnd;
}

export function formatTimeToHHMM(date: Date): string {
  // Use local methods because the date objects passed to this function 
  // are already shifted to the target timezone (e.g., Africa/Kigali) 
  // by toZonedTime in the API routes. 
  // Using getUTCHours would return the original UTC time, which breaks comparisons.
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function toDisplayTime(value: string): string {

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


  if (!rules.days.includes(dayName)) {
    return `Today (${dayName}) is not a scheduled working day for your program. Please check back during scheduled sessions.`;
  }

  if (type === 'checkin') {
    if (timeStr < rules.checkInStart) {
      return `Check-in hasn't opened yet. It starts at ${toDisplayTime(rules.checkInStart)}.`;
    }
    if (timeStr > rules.checkInEnd) {
      return `The check-in window closed at ${toDisplayTime(rules.checkInEnd)}.`;
    }
  } else {

    if (timeStr < rules.classStart) {
      return `Session officially started at ${toDisplayTime(rules.classStart)}. It's too early for check-out.`;
    }
    if (timeStr < rules.checkOutStart) {
      return `The check-out window opens at ${toDisplayTime(rules.checkOutStart)}. Please remain until the session concludes.`;
    }
    if (timeStr > rules.checkOutEnd) {
      return `The check-out window has already closed (${toDisplayTime(rules.checkOutEnd)}).`;
    }
  }
  return null;
}

import { toZonedTime } from "date-fns-tz";

export function isWindowOpenNow(
  type: 'checkin' | 'checkout',
  rules: AttendanceRules | null | undefined,
  timeZone: string = 'Africa/Kigali'
): { isOpen: boolean; message: string | null } {
  if (!rules) return { isOpen: true, message: null }; 
  
  const now = toZonedTime(new Date(), timeZone);
  const message = getAttendanceWindowMessage(type, rules, now);
  
  return {
    isOpen: message === null,
    message
  };
}
