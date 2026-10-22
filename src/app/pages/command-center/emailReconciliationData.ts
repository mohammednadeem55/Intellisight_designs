// Mock data for the daily mailbox-vs-ICC reconciliation. In the real system IT's automated job produces these
// numbers (and alerts IT when variance isn't zero); this page is the business-facing record of it.
// Variance = emails received in the Contact Center mailbox minus emails ingested into ICC, and should be 0.

export type MissingEmailStatus = "Investigating" | "Recovered";

export type MissingEmail = {
  id: string;
  sender: string;
  subject: string;
  receivedAt: string; // "HH:MM"
  mailbox: string;
  owner: string; // IT owns every missing email — never the business or regions
  status: MissingEmailStatus;
  note?: string;
};

export type DailyReconciliation = {
  date: string; // ISO yyyy-mm-dd
  received: number;
  ingested: number;
  variance: number;
  missing: MissingEmail[];
};

export type DayOutcome = "Reconciled" | "Open" | "Resolved";

export function dayOutcome(day: DailyReconciliation): DayOutcome {
  if (day.variance === 0) return "Reconciled";
  return day.missing.every((m) => m.status === "Recovered") ? "Resolved" : "Open";
}

const MAILBOX = "Contact Center";
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
      sender,
      subject,
      receivedAt: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      mailbox: MAILBOX,
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
};

// "Today" in this mock app is Monday 6 July 2026 (same date the Command Center Overview shows), so the
// latest completed day is Sunday 5 July.
const TODAY = new Date(2026, 6, 6);

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const RECONCILIATION_HISTORY: DailyReconciliation[] = Array.from({ length: 30 }, (_, n) => {
  const daysAgo = n + 1;
  const d = new Date(TODAY);
  d.setDate(TODAY.getDate() - daysAgo);
  const dateIso = iso(d);
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const received = (weekend ? 410 : 1180) + ((daysAgo * 37) % 160);
  const [missingCount, status] = VARIANCE_DAYS[daysAgo] ?? [0, "Recovered" as MissingEmailStatus];
  return {
    date: dateIso,
    received,
    ingested: received - missingCount,
    variance: missingCount,
    missing: missingFor(dateIso, missingCount, status),
  };
});

export function formatReconDate(isoDate: string, opts: { weekday?: boolean } = {}) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: opts.weekday ? "short" : undefined, day: "numeric", month: "short", year: "numeric" });
}

export const LATEST_RECONCILIATION = RECONCILIATION_HISTORY[0];
