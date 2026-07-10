import { describe, expect, it } from 'vitest';
import {
  cancellationMessage,
  isRefundableCancellation,
  isReschedulable,
} from '../policy';

const NOW = new Date('2026-07-10T12:00:00Z');
const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 3_600_000);

describe('24-hour cancellation window', () => {
  it('is refundable when the lesson is more than 24h away', () => {
    expect(isRefundableCancellation(hoursFromNow(25), NOW)).toBe(true);
    expect(isRefundableCancellation(hoursFromNow(24.01), NOW)).toBe(true);
  });

  it('is not refundable at or inside 24h', () => {
    expect(isRefundableCancellation(hoursFromNow(24), NOW)).toBe(false);
    expect(isRefundableCancellation(hoursFromNow(2), NOW)).toBe(false);
    expect(isRefundableCancellation(hoursFromNow(-1), NOW)).toBe(false);
  });

  it('accepts ISO strings', () => {
    expect(isRefundableCancellation(hoursFromNow(48).toISOString(), NOW)).toBe(true);
  });

  it('rescheduling follows the same window', () => {
    expect(isReschedulable(hoursFromNow(30), NOW)).toBe(true);
    expect(isReschedulable(hoursFromNow(10), NOW)).toBe(false);
  });

  it('produces a matching user-facing message', () => {
    expect(cancellationMessage(hoursFromNow(48), NOW)).toMatch(/full refund/i);
    expect(cancellationMessage(hoursFromNow(3), NOW)).toMatch(/not refundable/i);
  });
});
