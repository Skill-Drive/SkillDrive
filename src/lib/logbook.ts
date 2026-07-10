// NSW logbook rules: for learners under 25, one hour of structured driving
// instruction counts as three logbook hours, for the first 10 lessons only.
// (Transport for NSW "3-for-1" rule, capped at 10 hours of lessons.)

import type { LogbookEntry } from '../types';

export const BONUS_MULTIPLIER = 3;
export const BONUS_LESSON_CAP = 10;
export const NSW_REQUIRED_HOURS = 120;

export interface LessonForLogbook {
  start_time: string;
  end_time: string;
}

/** Credited hours for a single lesson given its 1-based position in the learner's history. */
export function creditedHours(actualHours: number, lessonNumber: number): number {
  const credited = lessonNumber <= BONUS_LESSON_CAP ? actualHours * BONUS_MULTIPLIER : actualHours;
  return Math.round(credited * 100) / 100;
}

export function actualHoursOf(lesson: LessonForLogbook): number {
  const ms = new Date(lesson.end_time).getTime() - new Date(lesson.start_time).getTime();
  return Math.round((ms / 3_600_000) * 100) / 100;
}

/** Total credited logbook hours for a chronologically-ordered lesson list. */
export function totalCreditedHours(lessons: LessonForLogbook[]): number {
  const total = lessons.reduce(
    (sum, lesson, idx) => sum + creditedHours(actualHoursOf(lesson), idx + 1),
    0,
  );
  return Math.round(total * 100) / 100;
}

/** CSV export compatible with manual entry into the Service NSW logbook apps. */
export function logbookToCsv(entries: LogbookEntry[]): string {
  const header = 'Date,Start Time,End Time,Instructor,Actual Hours,Credited Hours (3-for-1),Lesson #';
  const rows = entries.map((e) => {
    const start = new Date(e.start_time);
    const end = new Date(e.end_time);
    const fmtDate = start.toLocaleDateString('en-AU');
    const fmtTime = (d: Date) => d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const name = (e.instructor_name ?? '').replace(/"/g, '""');
    return `${fmtDate},${fmtTime(start)},${fmtTime(end)},"${name}",${e.actual_hours},${e.credited_hours},${e.lesson_number}`;
  });
  return [header, ...rows].join('\n');
}

export function downloadCsv(csv: string, filename = 'skilldrive-logbook.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
