import { describe, expect, it } from 'vitest';
import {
  actualHoursOf,
  creditedHours,
  logbookToCsv,
  totalCreditedHours,
} from '../logbook';
import type { LogbookEntry } from '../../types';

const lesson = (startHour: number, durationHours = 1) => ({
  start_time: new Date(Date.UTC(2026, 0, 1, startHour)).toISOString(),
  end_time: new Date(Date.UTC(2026, 0, 1, startHour + durationHours)).toISOString(),
});

describe('NSW 3-for-1 logbook rule', () => {
  it('credits triple hours within the first 10 lessons', () => {
    expect(creditedHours(1, 1)).toBe(3);
    expect(creditedHours(1.5, 10)).toBe(4.5);
  });

  it('credits actual hours from lesson 11 onwards', () => {
    expect(creditedHours(1, 11)).toBe(1);
    expect(creditedHours(2, 15)).toBe(2);
  });

  it('computes actual hours from timestamps', () => {
    expect(actualHoursOf(lesson(9, 1))).toBe(1);
    expect(actualHoursOf(lesson(9, 2))).toBe(2);
  });

  it('totals credited hours across the cap boundary', () => {
    // 12 one-hour lessons: first 10 at 3h credit, last 2 at 1h.
    const lessons = Array.from({ length: 12 }, (_, i) => lesson(6 + i));
    expect(totalCreditedHours(lessons)).toBe(10 * 3 + 2);
  });

  it('handles an empty history', () => {
    expect(totalCreditedHours([])).toBe(0);
  });
});

describe('logbook CSV export', () => {
  it('escapes quotes and includes every entry', () => {
    const entries: LogbookEntry[] = [
      {
        booking_id: 'b1',
        learner_id: 'l1',
        instructor_id: 'i1',
        instructor_name: 'Jane "Ace" Smith',
        start_time: new Date(Date.UTC(2026, 0, 5, 22)).toISOString(),
        end_time: new Date(Date.UTC(2026, 0, 5, 23)).toISOString(),
        actual_hours: 1,
        lesson_number: 1,
        bonus_applied: true,
        credited_hours: 3,
      },
    ];
    const csv = logbookToCsv(entries);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('Credited Hours');
    expect(lines[1]).toContain('"Jane ""Ace"" Smith"');
    expect(lines[1]).toContain(',3,1');
  });
});
