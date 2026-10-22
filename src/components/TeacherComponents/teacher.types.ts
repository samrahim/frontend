import { TeacherPaymentFrequency, TeacherPaymentType } from "../../graphql";

/**
 * Payment rules (must match the backend NormalizeTeacherPayment):
 *  - paymentAnchorDate = FIRST payment date, required for ALL types.
 *  - ONCE:     the single payment date. Frequency is set to ONCE by the backend.
 *  - WEEKLY:   every 7 days from the anchor (weekday comes from the anchor).
 *  - BIWEEKLY: every 14 days from the anchor.
 *  - MONTHLY:  same day of month as the anchor.
 *  => no weekday field and no separate "once date" field anymore.
 */
export interface TeacherFormData {
  firstName: string;
  lastName: string;
  phone: string;
  paymentAmount: number;
  paymentType: TeacherPaymentType;
  paymentFrequency: TeacherPaymentFrequency | null;

  /** First payment date as "YYYY-MM-DD" (value of <input type="date">). */
  paymentAnchorDate: string | null;

  gender: string;
  dateOfBirth: string;
  email: string;
  active: boolean;
  address: string;
}

const TZ = "Africa/Algiers";
const TZ_OFFSET = "+01:00"; // Algeria is UTC+1 all year (no DST)
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const isPeriodicType = (type: TeacherPaymentType) =>
  type === TeacherPaymentType.Hourly || type === TeacherPaymentType.Session;

/** Today as "YYYY-MM-DD" in Algiers time. */
export const todayInAlgiers = (): string =>
  new Date().toLocaleDateString("en-CA", { timeZone: TZ });

/**
 * "2026-10-20" -> "2026-10-20T00:00:00+01:00"
 * The backend `Time` scalar only accepts RFC3339, and building the string from
 * the date (not from a JS Date) keeps the day correct in any browser timezone.
 */
export function toBackendDateTime(
  date: string | null | undefined
): string | null {
  if (!date) return null;
  return DATE_ONLY.test(date) ? `${date}T00:00:00${TZ_OFFSET}` : date;
}

/** Backend value (RFC3339) -> "YYYY-MM-DD" for <input type="date"> (Algiers day). */
export function toDateInput(value: string | null | undefined): string | null {
  if (!value) return null;
  if (DATE_ONLY.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/**
 * @param originalAnchor the anchor already saved (edit mode). A past date is
 * accepted only when it was not changed.
 */
export function validatePayment(
  f: TeacherFormData,
  originalAnchor?: string | null
): string | null {
  if (!f.paymentAmount || f.paymentAmount <= 0) {
    return "Enter a valid payment amount";
  }

  if (!f.paymentAnchorDate) {
    return f.paymentType === TeacherPaymentType.Once
      ? "Select the payment date"
      : "Select the first payment date";
  }

  const unchanged =
    !!originalAnchor && toDateInput(originalAnchor) === f.paymentAnchorDate;
  if (!unchanged && f.paymentAnchorDate < todayInAlgiers()) {
    return "The first payment date cannot be in the past";
  }

  return null;
}

export function buildPaymentInput(f: TeacherFormData) {
  const isOnce = f.paymentType === TeacherPaymentType.Once;

  return {
    paymentType: f.paymentType,
    paymentAmount: Number(f.paymentAmount),
    // ONCE: the backend sets the frequency to ONCE itself.
    paymentFrequency: isOnce
      ? null
      : f.paymentFrequency ?? TeacherPaymentFrequency.Monthly,
    // The weekday is derived from the anchor by the backend.
    paymentWeekday: null,
    paymentAnchorDate: toBackendDateTime(f.paymentAnchorDate),
  };
}

/** Short human text to show under the date field. */
export function describePayment(f: TeacherFormData): string {
  const d = f.paymentAnchorDate;
  if (!d) return "";

  if (f.paymentType === TeacherPaymentType.Once) {
    return `One-time payment on ${d}`;
  }

  const freq = f.paymentFrequency ?? TeacherPaymentFrequency.Monthly;
  const weekday = new Date(`${d}T12:00:00${TZ_OFFSET}`).toLocaleDateString(
    "en-US",
    { weekday: "long", timeZone: TZ }
  );

  switch (freq) {
    case TeacherPaymentFrequency.Weekly:
      return `Every ${weekday}, starting ${d}`;
    case TeacherPaymentFrequency.Biweekly:
      return `Every 2 weeks on ${weekday}, starting ${d}`;
    default: {
      const day = Number(d.slice(8, 10));
      return day > 28
        ? `Monthly on day ${day} (last day in shorter months), starting ${d}`
        : `Monthly on day ${day}, starting ${d}`;
    }
  }
}
