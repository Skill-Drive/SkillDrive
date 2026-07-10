// Booking policy rules shared across the UI. The Edge Functions enforce the
// same rules server-side; these mirrors exist so the UI can explain outcomes
// before the user commits to an action.

export const CANCELLATION_WINDOW_HOURS = 24;

/** True if a lesson starting at `startTime` can still be cancelled with a full refund. */
export function isRefundableCancellation(startTime: string | Date, now: Date = new Date()): boolean {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  return start.getTime() - now.getTime() > CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000;
}

/** True if a lesson can still be self-service rescheduled (same 24h window). */
export function isReschedulable(startTime: string | Date, now: Date = new Date()): boolean {
  return isRefundableCancellation(startTime, now);
}

/** Human message shown before the user confirms a cancellation. */
export function cancellationMessage(startTime: string | Date, now: Date = new Date()): string {
  return isRefundableCancellation(startTime, now)
    ? 'You will receive a full refund to your original payment method.'
    : 'This lesson starts within 24 hours — the lesson fee is not refundable under our cancellation policy.';
}
