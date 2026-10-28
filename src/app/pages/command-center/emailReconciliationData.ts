import { MAILBOXES } from "./emailData";

// Mock data for the daily mailbox-vs-ICC reconciliation. In the real system IT's automated job produces these
// numbers (and alerts IT when variance isn't zero); this page is the business-facing record of it.
// Variance = emails received in the Contact Center mailbox minus emails ingested into ICC, and should be 0.

export type MissingEmailStatus = "Investigating" | "Recovered";

export type MissingEmail = {
  id: string;
  date: string; // ISO date it was received
  sender: string;
  subject: string;
  receivedAt: string; // "HH:MM"
  mailbox: string;
  owner: string; // IT owns every missing email — never the business or regions
  status: MissingEmailStatus;
  note?: string;
};

export type MailboxCount = { received: number; ingested: number };

export type DailyReconciliation = {
  date: string; // ISO yyyy-mm-dd
  received: number;
  ingested: number;
  variance: number;
  missing: MissingEmail[];
  /** Same day split per mailbox — received/ingested always add up to the totals above. */
  byMailbox: Record<string, MailboxCount>;
};

/** The same day narrowed to the selected mailboxes: totals, variance and missing emails all recomputed. */
export function filterDay(day: DailyReconciliation, mailboxes: string[]): DailyReconciliation {
  const byMailbox = Object.fromEntries(mailboxes.filter((m) => day.byMailbox[m]).map((m) => [m, day.byMailbox[m]]));
  const counts = Object.values(byMailbox);
  const received = counts.reduce((sum, c) => sum + c.received, 0);
  const ingested = counts.reduce((sum, c) => sum + c.ingested, 0);
  return { ...day, received, ingested, variance: received - ingested, missing: day.missing.filter((m) => mailboxes.includes(m.mailbox)), byMailbox };
}

export type DayOutcome = "Reconciled" | "Open" | "Resolved";

export function dayOutcome(day: DailyReconciliation): DayOutcome {
  if (day.variance === 0) return "Reconciled";
  return day.missing.every((m) => m.status === "Recovered") ? "Resolved" : "Open";
}

const IT_OWNERS = ["Rahul Menon (IT Ops)", "Elena Petrova (IT Ops)"];

const SENDERS = [
  ["purchasing@globaltech.com", "PO 4500123456 - Calibration services"],
  ["ap.team@acmeindustries.com", "Order confirmation request 7782110"],
  ["procurement@nordlicht.de", "Quote Q-240763 revision"],
  ["s.tanaka@nihondenpa.co.jp", "Re: Service agreement renewal"],
  ["orders@meridianoptics.sg", "PO MO-POQ-9981203 attached"],
  ["claire.dubois@lumenfr.com", "Delivery date change for order 5500871"],
  ["accounts@siliconware.com.tw", "Payment terms query"],
  ["buyer@coralglobal.com.au", "Updated PO with new ship-to address"],
];

function missingFor(dateIso: string, count: number, status: MissingEmailStatus): MissingEmail[] {
  return Array.from({ length: count }, (_, i) => {
    const [sender, subject] = SENDERS[(dateIso.charCodeAt(9) + i * 3) % SENDERS.length];
    const hour = 8 + ((i * 5 + dateIso.charCodeAt(8)) % 9);
    const minute = (i * 17 + dateIso.charCodeAt(9) * 3) % 60;
    return {
      id: `MSG-${dateIso.replace(/-/g, "")}-${String(i + 1).padStart(2, "0")}`,
      date: dateIso,
      sender,
      subject,
      receivedAt: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      mailbox: MAILBOXES[(i * 2 + dateIso.charCodeAt(9)) % MAILBOXES.length],
      owner: IT_OWNERS[(i + dateIso.charCodeAt(9)) % IT_OWNERS.length],
      status,
      note: status === "Recovered" ? "Re-ingested manually after connector retry failed" : undefined,
    };
  });
}

// Variance on a handful of days: [days ago, missing emails, status]. Everything else reconciles to zero.
const VARIANCE_DAYS: Record<number, [number, MissingEmailStatus]> = {
  1: [3, "Investigating"],
  5: [1, "Recovered"],
  11: [2, "Recovered"],
  18: [1, "Recovered"],
  26: [4, "Recovered"],
  34: [2, "Recovered"],
  41: [1, "Recovered"],
  47: [3, "Recovered"],
  58: [1, "Recovered"],
  66: [2, "Recovered"],
  79: [1, "Recovered"],
  93: [2, "Recovered"],
  104: [1, "Recovered"],
};

// "Today" in this mock app is Monday 6 July 2026 (same date the Command Center Overview shows), so the
// latest completed day is Sunday 5 July.
const TODAY = new Date(2026, 6, 6);

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const RECONCILIATION_HISTORY: DailyReconciliation[] = Array.from({ length: 120 }, (_, n) => {
  const daysAgo = n + 1;
  const d = new Date(TODAY);
  d.setDate(TODAY.getDate() - daysAgo);
  const dateIso = iso(d);
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const received = (weekend ? 410 : 1180) + ((daysAgo * 37) % 160);
  const [missingCount, status] = VARIANCE_DAYS[daysAgo] ?? [0, "Recovered" as MissingEmailStatus];
  const missing = missingFor(dateIso, missingCount, status);
  // Split the day's volume across mailboxes by a fixed share (the last one takes the rounding remainder), then
  // take each missing email off the mailbox it was received in, so per-mailbox variance matches the list.
  const SHARES = [0.3, 0.22, 0.12, 0.1, 0.06];
  let remaining = received;
  const byMailbox: Record<string, MailboxCount> = {};
  MAILBOXES.forEach((m, i) => {
    const r = i < MAILBOXES.length - 1 ? Math.round(received * (SHARES[i] ?? 0.1)) : remaining;
    remaining -= r;
    byMailbox[m] = { received: r, ingested: r - missing.filter((x) => x.mailbox === m).length };
  });
  return { date: dateIso, received, ingested: received - missingCount, variance: missingCount, missing, byMailbox };
});

export function formatReconDate(isoDate: string, opts: { weekday?: boolean } = {}) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: opts.weekday ? "short" : undefined, day: "numeric", month: "short", year: "numeric" });
}

export const LATEST_RECONCILIATION = RECONCILIATION_HISTORY[0];

// ── Date ranges ──────────────────────────────────────────────────────────────────────────────────────
export const DATA_MAX_DATE = RECONCILIATION_HISTORY[0].date; // latest completed day
export const DATA_MIN_DATE = RECONCILIATION_HISTORY[RECONCILIATION_HISTORY.length - 1].date;

function fromIso(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function shift(isoDate: string, days: number) {
  const d = fromIso(isoDate);
  d.setDate(d.getDate() + days);
  return iso(d);
}

export type RangePreset = "yesterday" | "7d" | "week" | "month" | "custom";
export const RANGE_PRESET_LABELS: Record<Exclude<RangePreset, "custom">, string> = {
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  week: "Last week",
  month: "Last month",
};

/** from/to (inclusive) for a preset, relative to "today" in this mock app. */
export function presetRange(preset: Exclude<RangePreset, "custom">): { from: string; to: string } {
  const yesterday = iso(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 1));
  if (preset === "yesterday") return { from: yesterday, to: yesterday };
  if (preset === "7d") return { from: shift(yesterday, -6), to: yesterday };
  if (preset === "week") {
    // Previous full Monday to Sunday.
    const dow = (TODAY.getDay() + 6) % 7; // Monday = 0
    const lastSunday = shift(iso(TODAY), -(dow + 1));
    return { from: shift(lastSunday, -6), to: lastSunday };
  }
  // Previous calendar month
  const first = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1);
  const last = new Date(TODAY.getFullYear(), TODAY.getMonth(), 0);
  return { from: iso(first), to: iso(last) };
}

export function rangeLabel(from: string, to: string) {
  return from === to ? formatReconDate(from, { weekday: true }) : `${formatReconDate(from)} to ${formatReconDate(to)}`;
}

export type RangeSummary = {
  days: DailyReconciliation[]; // newest first, already narrowed to the selected mailboxes
  received: number;
  ingested: number;
  variance: number;
  missing: MissingEmail[]; // newest first
  byMailbox: Record<string, MailboxCount>;
  cleanDays: number;
  openDays: number;
};

export function summarizeRange(history: DailyReconciliation[], from: string, to: string): RangeSummary {
  const days = history.filter((d) => d.date >= from && d.date <= to);
  const byMailbox: Record<string, MailboxCount> = {};
  days.forEach((d) =>
    Object.entries(d.byMailbox).forEach(([m, c]) => {
      byMailbox[m] = { received: (byMailbox[m]?.received ?? 0) + c.received, ingested: (byMailbox[m]?.ingested ?? 0) + c.ingested };
    })
  );
  const received = days.reduce((sum, d) => sum + d.received, 0);
  const ingested = days.reduce((sum, d) => sum + d.ingested, 0);
  return {
    days,
    received,
    ingested,
    variance: received - ingested,
    missing: days.flatMap((d) => d.missing),
    byMailbox,
    cleanDays: days.filter((d) => d.variance === 0).length,
    openDays: days.filter((d) => dayOutcome(d) === "Open").length,
  };
}
