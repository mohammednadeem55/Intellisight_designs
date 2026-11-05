import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { CalendarDays, Check, CheckCircle2, ChevronDown, Database, Download, Equal, Inbox, Info, Minus, TriangleAlert } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { ColumnResizeHandle, useResizableColumns } from "../../components/common/ResizableColumns";
import { EMAIL_TABLE_NAVY, TruncateTooltip } from "../../components/common/EmailTable";
import {
  DATA_MAX_DATE,
  DATA_MIN_DATE,
  LATEST_RECONCILIATION,
  RANGE_PRESET_LABELS,
  RECONCILIATION_HISTORY,
  dayOutcome,
  filterDay,
  formatReconDate,
  presetRange,
  rangeLabel,
  summarizeRange,
  type DayOutcome,
  type MissingEmailStatus,
  type RangePreset,
  type RangeSummary,
} from "./emailReconciliationData";
import { MAILBOXES } from "./emailData";

const GREEN = "#468657";
const GREEN_LIGHT = "#EFF6F1";
const RED = "#BA1C1C";
const RED_LIGHT = "#FDECEA";
const AMBER = "#92600B";
const AMBER_LIGHT = "#FDF3E7";

const OUTCOME_STYLE: Record<DayOutcome, { fg: string; bg: string }> = {
  Reconciled: { fg: GREEN, bg: GREEN_LIGHT },
  Open: { fg: RED, bg: RED_LIGHT },
  Resolved: { fg: AMBER, bg: AMBER_LIGHT },
};

const MISSING_STATUS_STYLE: Record<MissingEmailStatus, { fg: string; bg: string }> = {
  Investigating: { fg: RED, bg: RED_LIGHT },
  Recovered: { fg: GREEN, bg: GREEN_LIGHT },
};

function Pill({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ color: fg, backgroundColor: bg }}>
      {label}
    </span>
  );
}

function downloadReport(range: { from: string; to: string }, summary: RangeSummary, mailboxes: string[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    ["Email reconciliation report", rangeLabel(range.from, range.to)],
    ["Mailboxes", mailboxes.join("; ")],
    ["Emails received in mailbox", summary.received],
    ["Emails ingested into ICC", summary.ingested],
    ["Variance", summary.variance],
    [],
    ["Date", "Received", "Ingested", "Variance"],
    ...summary.days.map((d) => [d.date, d.received, d.ingested, d.variance]),
    [],
    ["Message ID", "Date", "Sender", "Subject", "Received", "Mailbox", "IT owner", "Status"],
    ...summary.missing.map((m) => [m.id, m.date, m.sender, m.subject, m.receivedAt, m.mailbox, m.owner, m.status]),
  ];
  const csv = lines.map((row) => row.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `email-reconciliation-${range.from}${range.from === range.to ? "" : `_to_${range.to}`}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Report for ${rangeLabel(range.from, range.to)} downloaded`);
}

// Small status chip for the Command Center Overview: the latest day's result at a glance, linking to the full
// report. Most days it just says everything arrived; it only draws the eye when something is missing.
export function IngestionStatusChip() {
  const navigate = useNavigate();
  const day = LATEST_RECONCILIATION;
  const outcome = dayOutcome(day);
  const style = outcome === "Reconciled" ? { fg: GREEN, bg: GREEN_LIGHT, border: "#C9E2D1" } : outcome === "Open" ? { fg: RED, bg: RED_LIGHT, border: "#F3C6C6" } : { fg: AMBER, bg: AMBER_LIGHT, border: "#F5DDB8" };
  const label = outcome === "Reconciled" ? "Ingestion: 0 missing" : `Ingestion: ${day.variance} missing`;
  return (
    <button
      onClick={() => navigate("/command-center/email-reconciliation")}
      title={`Mailbox vs ICC on ${formatReconDate(day.date)}: ${day.received.toLocaleString()} received, ${day.ingested.toLocaleString()} ingested. Click for the full report.`}
      className="flex items-center gap-1.5 h-[30px] px-3 rounded-full border text-[11.5px] font-semibold whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
      style={{ color: style.fg, backgroundColor: style.bg, borderColor: style.border }}
    >
      {outcome === "Reconciled" ? <CheckCircle2 size={13} /> : <TriangleAlert size={13} />}
      {label}
    </button>
  );
}

const TH = "relative sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE] text-[12px] font-semibold text-[#4D4D4D]";
const PRESETS = ["yesterday", "7d", "week", "month"] as const;

export function EmailReconciliationPage({
  onViewAllNotifications,
  onLogout,
  onNavigateHome,
  onNavigateNewOverview,
  onNavigateHoldManagementOverview,
  onNavigateOrderListing,
  onNavigateReleasedOrders,
  onNavigateCommunication,
  onNavigateEmailTemplate,
  onNavigateCmdCenterAdvFilter,
  onNavigateFeedbackCenter,
  onNavigateEmailWorkflow,
}: {
  onViewAllNotifications: () => void;
  onLogout?: () => void;
  onNavigateHome?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateCommunication?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateCmdCenterAdvFilter?: () => void;
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  const rcMissing = useResizableColumns("commandCenter.reconciliation.missing");
  const rcHistory = useResizableColumns("commandCenter.reconciliation.history");
  const rcMailboxes = useResizableColumns("commandCenter.reconciliation.mailboxes");

  // Date range: quick presets plus explicit From / To. Picking a preset fills the dates; editing a date (or
  // clicking a day in the chart/table) switches to "Custom".
  const [preset, setPreset] = useState<RangePreset>("yesterday");
  const [range, setRange] = useState(() => presetRange("yesterday"));
  const choosePreset = (p: Exclude<RangePreset, "custom">) => {
    setPreset(p);
    setRange(presetRange(p));
  };
  const setFrom = (v: string) => {
    if (!v) return;
    setPreset("custom");
    setRange((r) => ({ from: v, to: v > r.to ? v : r.to }));
  };
  const setTo = (v: string) => {
    if (!v) return;
    setPreset("custom");
    setRange((r) => ({ from: v < r.from ? v : r.from, to: v }));
  };
  const pickDay = (date: string) => {
    setPreset("custom");
    setRange({ from: date, to: date });
  };

  // Mailbox selection — same staged pick-then-Apply control as the Command Center Overview, so the report can
  // be narrowed to one or more mailboxes instead of always showing every mailbox combined.
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const [appliedMailboxes, setAppliedMailboxes] = useState<string[]>(MAILBOXES);
  const [pendingMailboxes, setPendingMailboxes] = useState<string[]>(MAILBOXES);
  const mailboxRef = useRef<HTMLDivElement>(null);
  const mailboxesDirty = pendingMailboxes.slice().sort().join("|") !== appliedMailboxes.slice().sort().join("|");
  const allMailboxesSelected = pendingMailboxes.length === MAILBOXES.length;
  const someMailboxesSelected = pendingMailboxes.length > 0 && !allMailboxesSelected;
  const toggleMailbox = (m: string) => setPendingMailboxes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  useEffect(() => {
    if (!mailboxOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!mailboxRef.current?.contains(e.target as Node)) {
        setMailboxOpen(false);
        setPendingMailboxes(appliedMailboxes);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [mailboxOpen, appliedMailboxes]);

  const history = useMemo(() => RECONCILIATION_HISTORY.map((d) => filterDay(d, appliedMailboxes)), [appliedMailboxes]);
  const summary = useMemo(() => summarizeRange(history, range.from, range.to), [history, range]);
  const dayCount = summary.days.length;
  const multiDay = range.from !== range.to;
  const periodShort = multiDay ? `${dayCount} days` : formatReconDate(range.from);
  const openCount = summary.missing.filter((m) => m.status === "Investigating").length;
  const mailboxLabel = appliedMailboxes.length === MAILBOXES.length ? "All mailboxes" : appliedMailboxes.length === 1 ? appliedMailboxes[0] : `${appliedMailboxes.length} mailboxes`;
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

  // Bars: at least the 30 days up to the end of the range (more if the range is longer), with the days that fall
  // inside the selected range highlighted — so a one-day or one-week selection still shows its surroundings.
  const chartDays = useMemo(() => history.filter((d) => d.date <= range.to).slice(0, Math.max(30, dayCount)).reverse(), [history, range.to, dayCount]);

  const tone =
    summary.variance === 0
      ? { fg: GREEN, wash: "#46865714", border: "#C9E2D1" }
      : openCount > 0
      ? { fg: RED, wash: "#BA1C1C12", border: "#F3C6C6" }
      : { fg: AMBER, wash: "#92600B12", border: "#F5DDB8" };
  const Verdict = summary.variance === 0 ? CheckCircle2 : TriangleAlert;

  const tile = (icon: typeof Inbox, label: string, value: string, sub: string, color?: string) => {
    const Icon = icon;
    return (
      <div className="flex-1 min-w-[170px] bg-white rounded-[8px] border border-[#E2E6E9] px-4 py-3.5 flex items-center gap-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <span className="size-[42px] rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${color ?? EMAIL_TABLE_NAVY}1A` }}>
          <Icon size={19} style={{ color: color ?? EMAIL_TABLE_NAVY }} />
        </span>
        <span className="min-w-0">
          <span className="block text-[10.5px] font-bold uppercase tracking-wide text-[#97999B]">{label}</span>
          <span className="block text-[30px] font-bold leading-none mt-1" style={{ color: color ?? "#262626" }}>{value}</span>
          <span className="block text-[11px] text-[#97999B] mt-1 truncate">{sub}</span>
        </span>
      </div>
    );
  };
  const op = (Icon: typeof Minus) => (
    <span className="hidden md:flex items-center justify-center size-[26px] rounded-full bg-white border border-[#E2E6E9] text-[#97999B] shrink-0 -mx-1 z-10">
      <Icon size={13} />
    </span>
  );

  return (
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
          <AppHeader
            activeNav="Email Reconciliation"
            onViewAllNotifications={onViewAllNotifications}
            onLogout={onLogout}
            onNavigateHome={onNavigateHome}
            onNavigateNewOverview={onNavigateNewOverview}
            onNavigateHoldManagementOverview={onNavigateHoldManagementOverview}
            onNavigateOrderListing={onNavigateOrderListing}
            onNavigateReleasedOrders={onNavigateReleasedOrders}
            onNavigateCommunication={onNavigateCommunication}
            onNavigateEmailTemplate={onNavigateEmailTemplate}
            onNavigateCmdCenterAdvFilter={onNavigateCmdCenterAdvFilter}
            onNavigateFeedbackCenter={onNavigateFeedbackCenter}
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
          />
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-[1600px] mx-auto px-5 pt-3 pb-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <Breadcrumbs items={[{ label: "Command Center", onClick: onNavigateNewOverview }, { label: "Email Reconciliation" }]} />
                <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Email Reconciliation</h1>
                <p className="text-[12px] text-[#97999B] mt-0.5">
                  Daily check that every email received in the Contact Center mailbox was ingested into ICC. Variance should always be zero.
                </p>
              </div>
              <button
                onClick={() => downloadReport(range, summary, appliedMailboxes)}
                className="flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                style={{ backgroundColor: EMAIL_TABLE_NAVY }}
              >
                <Download size={14} />
                Download report
              </button>
            </div>

            {/* Filter bar: what to look at (mailboxes), when (preset or From/To), in one place. */}
            <div className="bg-white rounded-[8px] border border-[#E2E6E9] px-4 py-3 flex items-center gap-x-4 gap-y-3 flex-wrap">
              <div className="relative" ref={mailboxRef}>
                <button
                  onClick={() => setMailboxOpen((v) => !v)}
                  className="relative flex items-center gap-2 h-[34px] px-3.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] font-semibold text-[#262626] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                >
                  <Inbox size={14} className="text-[#666666]" />
                  Mailboxes
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-[8px] text-white text-[10.5px] font-bold" style={{ backgroundColor: EMAIL_TABLE_NAVY }}>
                    {appliedMailboxes.length}
                  </span>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${mailboxOpen ? "rotate-180" : ""}`} />
                  {mailboxesDirty && <span className="absolute -top-[3px] -right-[3px] size-[8px] rounded-full bg-[#E67919] ring-2 ring-white" />}
                </button>
                {mailboxOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 w-[260px] flex flex-col">
                    <button
                      onClick={() => setPendingMailboxes(allMailboxesSelected ? [] : [...MAILBOXES])}
                      className="w-full flex items-center gap-2.5 text-left px-3.5 py-2.5 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors border-b border-[#E2E6E9]"
                    >
                      <span
                        className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${allMailboxesSelected || someMailboxesSelected ? "border-transparent" : "border-[#D9D9D6]"}`}
                        style={allMailboxesSelected || someMailboxesSelected ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                      >
                        {allMailboxesSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                        {someMailboxesSelected && <span className="w-[7px] h-[2px] bg-white rounded-full" />}
                      </span>
                      <span className="font-semibold text-[#262626]">Select all</span>
                    </button>
                    <div className="max-h-[240px] overflow-y-auto py-1">
                      {MAILBOXES.map((m) => {
                        const checked = pendingMailboxes.includes(m);
                        return (
                          <button
                            key={m}
                            onClick={() => toggleMailbox(m)}
                            className="w-full flex items-center gap-2.5 text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                          >
                            <span
                              className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${checked ? "border-transparent" : "border-[#D9D9D6]"}`}
                              style={checked ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                            >
                              {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                            </span>
                            <span className={`truncate ${checked ? "text-[#262626] font-medium" : "text-[#4D4D4D]"}`}>{m}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-t border-[#E2E6E9]">
                      <button
                        onClick={() => setPendingMailboxes([])}
                        className="text-[11.5px] font-medium text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors"
                      >
                        Clear selection
                      </button>
                      <button
                        onClick={() => {
                          setAppliedMailboxes(pendingMailboxes);
                          setMailboxOpen(false);
                        }}
                        disabled={pendingMailboxes.length === 0}
                        title={pendingMailboxes.length === 0 ? "Pick at least one mailbox" : undefined}
                        className="h-[32px] px-4 rounded-[8px] text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <span className="hidden lg:block w-px h-6 bg-[#E2E6E9]" />
              <div className="inline-flex items-center p-0.5 rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F8]">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => choosePreset(p)}
                    className="px-3 h-[30px] rounded-[6px] text-[12.5px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
                    style={preset === p ? { backgroundColor: "#FFFFFF", color: EMAIL_TABLE_NAVY, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#666666" }}
                  >
                    {RANGE_PRESET_LABELS[p]}
                  </button>
                ))}
                <span
                  className="px-3 h-[30px] inline-flex items-center rounded-[6px] text-[12.5px] font-semibold whitespace-nowrap"
                  style={preset === "custom" ? { backgroundColor: "#FFFFFF", color: EMAIL_TABLE_NAVY, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#97999B" }}
                >
                  Custom
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays size={15} className="text-[#97999B] shrink-0" />
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#97999B]">
                  From
                  <input
                    type="date"
                    value={range.from}
                    min={DATA_MIN_DATE}
                    max={DATA_MAX_DATE}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-[34px] px-2.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] font-medium normal-case tracking-normal text-[#262626] outline-none focus:border-[#30578D] transition-colors cursor-pointer"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#97999B]">
                  To
                  <input
                    type="date"
                    value={range.to}
                    min={DATA_MIN_DATE}
                    max={DATA_MAX_DATE}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-[34px] px-2.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] font-medium normal-case tracking-normal text-[#262626] outline-none focus:border-[#30578D] transition-colors cursor-pointer"
                  />
                </label>
              </div>
              <p className="ml-auto text-[11.5px] text-[#97999B]">
                {mailboxLabel} · {dayCount} {plural(dayCount, "day", "days")}
              </p>
            </div>

            {/* Hero: the verdict, then the sum behind it (received - ingested = variance) so the three numbers read
                as one calculation instead of three unrelated tiles. */}
            <div role="status" className="rounded-[10px] border p-4 sm:p-5" style={{ borderColor: tone.border, background: `linear-gradient(135deg, ${tone.wash}, #ffffff 70%)` }}>
              <div className="flex items-start gap-3.5 mb-4">
                <span className="size-[40px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${tone.fg}1F` }}>
                  <Verdict size={20} style={{ color: tone.fg }} />
                </span>
                <div>
                  <p className="text-[15px] font-bold" style={{ color: tone.fg }}>
                    {summary.variance === 0
                      ? `Reconciled: every email in the mailbox was ingested into ICC${multiDay ? ` across ${dayCount} days` : ""}`
                      : openCount > 0
                      ? `${summary.variance} ${plural(summary.variance, "email", "emails")} received in the mailbox ${plural(summary.variance, "was", "were")} not ingested into ICC`
                      : `${summary.variance} ${plural(summary.variance, "email", "emails")} ${plural(summary.variance, "was", "were")} missing and ${plural(summary.variance, "has", "have")} since been recovered`}
                  </p>
                  <p className="text-[12.5px] text-[#4D4D4D] mt-0.5">
                    {summary.variance === 0
                      ? "No investigation needed."
                      : openCount > 0
                      ? `IT owns the investigation and the recovery of ${openCount === summary.variance ? "these emails" : `the ${openCount} still open`}. Business teams and regions do not need to chase them.${multiDay ? ` ${summary.days.length - summary.cleanDays} of ${dayCount} days had a variance.` : ""}`
                      : "IT investigated and re-ingested every missing email. Kept here for audit."}
                  </p>
                </div>
              </div>
              <div className="flex items-stretch gap-3 flex-wrap md:flex-nowrap">
                {tile(Inbox, "Received in mailbox", summary.received.toLocaleString(), `${mailboxLabel} · ${periodShort}`)}
                {op(Minus)}
                {tile(Database, "Ingested into ICC", summary.ingested.toLocaleString(), `Same period · ${mailboxLabel.toLowerCase()}`)}
                {op(Equal)}
                {tile(summary.variance === 0 ? CheckCircle2 : TriangleAlert, "Variance", String(summary.variance), summary.variance === 0 ? "Target is zero. Met." : "Target is zero. Not met.", tone.fg)}
              </div>
            </div>

            {/* Variance by day — the trend at a glance, and a faster way to jump to a day than scanning the table. */}
            <div className="bg-white rounded-[8px] border border-[#E2E6E9] px-5 py-4">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div>
                  <p className="text-[14px] font-bold text-[#111827]">Variance by day</p>
                  <p className="text-[11.5px] text-[#97999B] mt-0.5">Highlighted days are in your selected range. Flat green means nothing went missing. Click a day to open it.</p>
                </div>
                <div className="flex items-center gap-4 text-[11.5px] text-[#4D4D4D]">
                  {([["Reconciled", GREEN], ["Open", RED], ["Resolved", AMBER]] as const).map(([label, color]) => (
                    <span key={label} className="inline-flex items-center gap-1.5">
                      <span className="size-[8px] rounded-[2px]" style={{ backgroundColor: color }} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              {(() => {
                const max = Math.max(1, ...chartDays.map((d) => d.variance));
                return (
                  <>
                    <div className="flex items-end gap-[3px] h-[84px]">
                      {chartDays.map((d) => {
                        const o = dayOutcome(d);
                        const inRange = d.date >= range.from && d.date <= range.to;
                        const color = o === "Reconciled" ? GREEN : o === "Open" ? RED : AMBER;
                        return (
                          <button
                            key={d.date}
                            onClick={() => pickDay(d.date)}
                            title={`${formatReconDate(d.date, { weekday: true })}: ${d.variance === 0 ? "reconciled" : `${d.variance} missing`}`}
                            className={`flex-1 h-full flex items-end justify-center rounded-[4px] cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#30578D]/40 ${inRange ? "bg-[#EAF1FB]" : "hover:bg-[#F7F9FC]"}`}
                          >
                            <span
                              className="block w-full rounded-t-[3px] transition-all"
                              style={{ height: d.variance === 0 ? 4 : `${Math.max(14, (d.variance / max) * 100)}%`, backgroundColor: color, opacity: inRange || d.variance > 0 ? 1 : 0.45 }}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-[#97999B] mt-1.5">
                      <span>{formatReconDate(chartDays[0].date)}</span>
                      <span>{formatReconDate(chartDays[chartDays.length - 1].date)}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#DEDEDE]">
                <p className="text-[14px] font-bold text-[#111827]">By mailbox</p>
                <p className="text-[11.5px] text-[#97999B] mt-0.5">Where the variance sits, for {rangeLabel(range.from, range.to)}.</p>
              </div>
              <div className="overflow-x-auto">
                <table className={`w-full min-w-[640px] border-separate border-spacing-0 ${rcMailboxes.tableClass}`} style={rcMailboxes.tableStyle}>
                  {rcMailboxes.colgroup}
                  <thead>
                    <tr className="bg-[#F7F7F7]">
                      {["Mailbox", "Received", "Ingested", "Ingestion rate", "Variance"].map((label) => (
                        <th key={label} className={TH}>
                          {label}
                          <ColumnResizeHandle rc={rcMailboxes} label={label} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {appliedMailboxes.map((m) => {
                      const c = summary.byMailbox[m] ?? { received: 0, ingested: 0 };
                      const v = c.received - c.ingested;
                      const rate = c.received === 0 ? 100 : (c.ingested / c.received) * 100;
                      return (
                        <tr key={m} className="hover:bg-[#F7F9FC] transition-colors">
                          <td className="px-4 py-2.5 text-[12.5px] font-semibold text-[#262626] whitespace-nowrap border-b border-[#DEDEDE]">{m}</td>
                          <td className="px-4 py-2.5 text-[12.5px] text-[#4D4D4D] border-b border-[#DEDEDE]">{c.received.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-[12.5px] text-[#4D4D4D] border-b border-[#DEDEDE]">{c.ingested.toLocaleString()}</td>
                          <td className="px-4 py-2.5 border-b border-[#DEDEDE]">
                            <span className="flex items-center gap-2.5">
                              <span className="block w-[90px] h-[6px] rounded-full bg-[#E2E6E9] overflow-hidden">
                                <span className="block h-full rounded-full" style={{ width: `${rate}%`, backgroundColor: v === 0 ? GREEN : RED }} />
                              </span>
                              <span className="text-[12px] text-[#4D4D4D] tabular-nums">{rate.toFixed(2)}%</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 border-b border-[#DEDEDE]">
                            {v === 0 ? <span className="text-[12.5px] text-[#97999B]">0</span> : <Pill label={String(v)} fg={RED} bg={RED_LIGHT} />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {summary.missing.length > 0 && (
              <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#DEDEDE] flex items-center gap-3" style={{ background: "linear-gradient(135deg, #BA1C1C0F, #ffffff 60%)" }}>
                  <span className="size-[34px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: "#BA1C1C1A" }}>
                    <TriangleAlert size={16} style={{ color: RED }} />
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-[#111827]">Missing emails ({summary.missing.length})</p>
                    <p className="text-[11.5px] text-[#97999B] mt-0.5">Received in the mailbox during {rangeLabel(range.from, range.to)} but never ingested into ICC.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className={`w-full min-w-[1080px] border-separate border-spacing-0 ${rcMissing.tableClass}`} style={rcMissing.tableStyle}>
                    {rcMissing.colgroup}
                    <thead>
                      <tr className="bg-[#F7F7F7]">
                        {["Date", "Message ID", "Sender", "Subject", "Received", "Mailbox", "IT owner", "Status"].map((label) => (
                          <th key={label} className={TH}>
                            {label}
                            <ColumnResizeHandle rc={rcMissing} label={label} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {summary.missing.map((m) => (
                        <tr key={m.id} className="hover:bg-[#F7F9FC] transition-colors">
                          <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] whitespace-nowrap border-b border-[#DEDEDE]">{formatReconDate(m.date)}</td>
                          <td className="px-4 py-3 text-[12.5px] font-semibold text-[#262626] whitespace-nowrap border-b border-[#DEDEDE]">{m.id}</td>
                          <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] border-b border-[#DEDEDE]">
                            <TruncateTooltip label={m.sender} />
                          </td>
                          <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] max-w-[320px] border-b border-[#DEDEDE]">
                            <TruncateTooltip label={m.subject} />
                          </td>
                          <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] whitespace-nowrap border-b border-[#DEDEDE]">{m.receivedAt}</td>
                          <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] whitespace-nowrap border-b border-[#DEDEDE]">{m.mailbox}</td>
                          <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] whitespace-nowrap border-b border-[#DEDEDE]">{m.owner}</td>
                          <td className="px-4 py-3 border-b border-[#DEDEDE]" title={m.note}>
                            <Pill label={m.status} {...MISSING_STATUS_STYLE[m.status]} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#DEDEDE] flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[14px] font-bold text-[#111827]">Daily results</p>
                  <p className="text-[11.5px] text-[#97999B] mt-0.5">
                    {summary.cleanDays} of {dayCount} {plural(dayCount, "day", "days")} reconciled to zero · {summary.variance} {plural(summary.variance, "email", "emails")} missing in total · {summary.openDays} {plural(summary.openDays, "day", "days")} still open
                  </p>
                </div>
                <p className="flex items-center gap-1.5 text-[11.5px] text-[#97999B]">
                  <Info size={12} className="shrink-0" /> Click a day to see only that day. Reports are kept for audit and trend analysis.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className={`w-full min-w-[760px] border-separate border-spacing-0 ${rcHistory.tableClass}`} style={rcHistory.tableStyle}>
                  {rcHistory.colgroup}
                  <thead>
                    <tr className="bg-[#F7F7F7]">
                      {["Date", "Received", "Ingested", "Variance", "Result"].map((label) => (
                        <th key={label} className={TH}>
                          {label}
                          <ColumnResizeHandle rc={rcHistory} label={label} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.days.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-[#97999B]">No data for this range.</td>
                      </tr>
                    ) : (
                      summary.days.map((d) => {
                        const o = dayOutcome(d);
                        const single = !multiDay && d.date === range.from;
                        return (
                          <tr
                            key={d.date}
                            onClick={() => pickDay(d.date)}
                            className={`cursor-pointer transition-colors ${single ? "bg-[#EAF1FB]" : "hover:bg-[#F7F9FC]"}`}
                          >
                            <td className="px-4 py-2.5 text-[12.5px] font-semibold text-[#262626] whitespace-nowrap border-b border-[#DEDEDE]">{formatReconDate(d.date, { weekday: true })}</td>
                            <td className="px-4 py-2.5 text-[12.5px] text-[#4D4D4D] border-b border-[#DEDEDE]">{d.received.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-[12.5px] text-[#4D4D4D] border-b border-[#DEDEDE]">{d.ingested.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-[12.5px] font-semibold border-b border-[#DEDEDE]" style={{ color: d.variance === 0 ? "#97999B" : RED }}>{d.variance}</td>
                            <td className="px-4 py-2.5 border-b border-[#DEDEDE]">
                              <Pill label={o} {...OUTCOME_STYLE[o]} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
