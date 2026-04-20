import { toZonedTime } from "date-fns-tz";

type ProgramLike = {
  startDate?: Date;
  endDate?: Date;
};

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Validates that "now" (in program timezone) falls within the program date range.
 * - startDate is inclusive (00:00 local time)
 * - endDate is inclusive (23:59:59.999 local time)
 *
 * Returns a user-friendly error message when outside the range.
 */
export function getProgramDateWindowError(
  nowUTC: Date,
  program: ProgramLike | null | undefined,
  programTimeZone: string
): string | null {
  if (!program?.startDate || !program?.endDate) return null;

  const now = toZonedTime(nowUTC, programTimeZone);
  const start = startOfDay(toZonedTime(program.startDate, programTimeZone));
  const end = endOfDay(toZonedTime(program.endDate, programTimeZone));

  if (now < start) {
    return "This program has not started yet. Attendance is not available until the program start date.";
  }
  if (now > end) {
    return "This program has ended. Attendance is no longer available for this program.";
  }
  return null;
}

/**
 * Same as getProgramDateWindowError, but validates an arbitrary date (UTC) instead of "now".
 * Useful for manual attendance where the admin picks a date.
 */
export function getProgramDateWindowErrorForDate(
  dateUTC: Date,
  program: ProgramLike | null | undefined,
  programTimeZone: string
): string | null {
  if (!program?.startDate || !program?.endDate) return null;

  const dateInZone = toZonedTime(dateUTC, programTimeZone);
  const start = startOfDay(toZonedTime(program.startDate, programTimeZone));
  const end = endOfDay(toZonedTime(program.endDate, programTimeZone));

  if (dateInZone < start) {
    return "Selected date is before the program start date.";
  }
  if (dateInZone > end) {
    return "Selected date is after the program end date.";
  }
  return null;
}

