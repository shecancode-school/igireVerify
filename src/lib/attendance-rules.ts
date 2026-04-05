export interface AttendanceRules {
  checkInStart: string;
  checkInEnd: string;
  classStart: string;
  checkOutStart: string;
  checkOutEnd: string;
  lateAfter: string;
  days: string[];
}

export const PROGRAM_RULES: Record<string, AttendanceRules> = {
  'web-fundamentals': {
    checkInStart: '13:45',
    checkInEnd: '14:15',
    classStart: '14:00',
    checkOutStart: '20:00',
    checkOutEnd: '21:00',
    lateAfter: '14:15',
    days: ['Monday', 'Wednesday', 'Friday']
  },
  'advanced-frontend': {
    checkInStart: '08:00',
    checkInEnd: '08:30',
    classStart: '08:30',
    checkOutStart: '16:00',
    checkOutEnd: '17:30',
    lateAfter: '08:30',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  'advanced-backend': {
    checkInStart: '08:00',
    checkInEnd: '08:30',
    classStart: '08:30',
    checkOutStart: '16:00',
    checkOutEnd: '17:30',
    lateAfter: '08:30',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  }
};

export const STAFF_RULES: AttendanceRules = {
  checkInStart: '08:00',
  checkInEnd: '08:45',
  classStart: '08:45',
  checkOutStart: '17:30',
  checkOutEnd: '18:00',
  lateAfter: '08:45',
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
};

export function isValidAttendanceDay(programId: string, date: Date): boolean {
  const rules = PROGRAM_RULES[programId] || STAFF_RULES;
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  return rules.days.includes(dayName);
}

export function getAttendanceStatus(checkInTime: Date, rules: AttendanceRules): 'on-time' | 'late' | 'absent' {
  const checkInTimeStr = checkInTime.toTimeString().slice(0, 5); // HH:MM format

  // On-time: checked in before or at checkInEnd
  if (checkInTimeStr <= rules.checkInEnd) {
    return 'on-time';
  }
  // Late: checked in after checkInEnd but before class ends (arbitrary cutoff)
  else if (checkInTimeStr <= '23:59') {
    return 'late';
  }
  // Absent: should not reach here, but mark as absent if past end of day
  else {
    return 'absent';
  }
}

export function canCheckOut(checkInTime: Date, rules: AttendanceRules, currentTime: Date): boolean {
  const currentTimeStr = currentTime.toTimeString().slice(0, 5);

  // Must have checked in today
  const checkInDate = checkInTime.toDateString();
  const currentDate = currentTime.toDateString();

  if (checkInDate !== currentDate) {
    return false;
  }

  // Must be after class start
  return currentTimeStr >= rules.classStart;
}

export function isWithinCheckOutWindow(rules: AttendanceRules, currentTime: Date): boolean {
  const currentTimeStr = currentTime.toTimeString().slice(0, 5);
  return currentTimeStr >= rules.checkOutStart && currentTimeStr <= rules.checkOutEnd;
}