import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, Info, TriangleAlert } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { ColumnResizeHandle, useResizableColumns } from "../../components/common/ResizableColumns";
import { EMAIL_TABLE_NAVY, TruncateTooltip } from "../../components/common/EmailTable";
import {
  RECONCILIATION_HISTORY,
  LATEST_RECONCILIATION,
  dayOutcome,
  formatReconDate,
  type DailyReconciliation,
  type DayOutcome,
  type MissingEmailStatus,
} from "./emailReconciliationData";

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

function downloadReport(day: DailyReconciliation) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    ["Email reconciliation report", day.date],
    ["Emails received in mailbox", day.received],
    ["Emails ingested into ICC", day.ingested],
    ["Variance", day.variance],
    [],
    ["Message ID", "Sender", "Subject", "Received", "Mailbox", "IT owner", "Status"],
    ...day.missing.map((m) => [m.id, m.sender, m.subject, m.receivedAt, m.mailbox, m.owner, m.status]),
  ];
  const csv = lines.map((row) => row.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `email-reconciliation-${day.date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Report for ${formatReconDate(day.date)} downloaded`);
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
  const [selectedDate, setSelectedDate] = useState(RECONCILIATION_HISTORY[0].date);
  const rcMissing = useResizableColumns("commandCenter.reconciliation.missing");
  const rcHistory = useResizableColumns("commandCenter.reconciliation.history");

  const index = RECONCILIATION_HISTORY.findIndex((d) => d.date === selectedDate);
  const day = RECONCILIATION_HISTORY[index] ?? RECONCILIATION_HISTORY[0];
  const outcome = dayOutcome(day);
  const openCount = day.missing.filter((m) => m.status === "Investigating").length;

  const openDays = useMemo(() => RECONCILIATION_HISTORY.filter((d) => dayOutcome(d) === "Open").length, []);
  const thirtyDayMissing = useMemo(() => RECONCILIATION_HISTORY.reduce((sum, d) => sum + d.variance, 0), []);
  const cleanDays = useMemo(() => RECONCILIATION_HISTORY.filter((d) => d.variance === 0).length, []);

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
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center rounded-[8px] border border-[#E2E6E9] bg-white">
                  <button
                    onClick={() => setSelectedDate(RECONCILIATION_HISTORY[Math.min(RECONCILIATION_HISTORY.length - 1, index + 1)].date)}
                    disabled={index >= RECONCILIATION_HISTORY.length - 1}
                    title="Previous day"
                    className="flex items-center justify-center size-[34px] text-[#4D4D4D] hover:bg-[#F7F7F7] rounded-l-[8px] cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="px-3 text-[12.5px] font-semibold text-[#262626] min-w-[150px] text-center">
                    {formatReconDate(day.date, { weekday: true })}
                    {index === 0 && <span className="ml-1.5 text-[10.5px] font-semibold text-[#97999B]">Latest</span>}
                  </span>
                  <button
                    onClick={() => setSelectedDate(RECONCILIATION_HISTORY[Math.max(0, index - 1)].date)}
                    disabled={index <= 0}
                    title="Next day"
                    className="flex items-center justify-center size-[34px] text-[#4D4D4D] hover:bg-[#F7F7F7] rounded-r-[8px] cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
                <button
                  onClick={() => downloadReport(day)}
                  className="flex items-center gap-1.5 h-[34px] px-3.5 rounded-[8px] text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                >
                  <Download size={14} />
                  Download report
                </button>
              </div>
            </div>

            {/* Result for the selected day — a clear verdict first, then the three numbers behind it. */}
            <div
              role="status"
              className="rounded-[8px] border px-5 py-3.5 flex items-start gap-3"
              style={
                day.variance === 0
                  ? { borderColor: "#C9E2D1", backgroundColor: GREEN_LIGHT }
                  : openCount > 0
                  ? { borderColor: "#F3C6C6", backgroundColor: "#FDF5F5" }
                  : { borderColor: "#F5DDB8", backgroundColor: AMBER_LIGHT }
              }
            >
              {day.variance === 0 ? (
                <CheckCircle2 size={18} className="shrink-0 mt-[1px]" style={{ color: GREEN }} />
              ) : (
                <TriangleAlert size={18} className="shrink-0 mt-[1px]" style={{ color: openCount > 0 ? RED : AMBER }} />
              )}
              <div>
                <p className="text-[13.5px] font-bold" style={{ color: day.variance === 0 ? GREEN : openCount > 0 ? RED : AMBER }}>
                  {day.variance === 0
                    ? "Reconciled: every email in the mailbox was ingested into ICC"
                    : openCount > 0
                    ? `${day.variance} email${day.variance === 1 ? "" : "s"} received in the mailbox ${day.variance === 1 ? "was" : "were"} not ingested into ICC`
                    : `${day.variance} email${day.variance === 1 ? "" : "s"} ${day.variance === 1 ? "was" : "were"} missing and ${day.variance === 1 ? "has" : "have"} since been recovered`}
                </p>
                <p className="text-[12px] text-[#4D4D4D] mt-0.5">
                  {day.variance === 0
                    ? "No investigation needed for this day."
                    : openCount > 0
                    ? `IT owns the investigation and the recovery of ${openCount === day.variance ? "these emails" : `the ${openCount} still open`}. Business teams and regions do not need to chase them.`
                    : "IT investigated and re-ingested every missing email. Kept here for audit."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-[8px] border border-[#E2E6E9] px-5 py-4">
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#97999B]">Received in mailbox</p>
                <p className="text-[28px] font-bold text-[#262626] leading-none mt-2">{day.received.toLocaleString()}</p>
                <p className="text-[11.5px] text-[#97999B] mt-1.5">Contact Center mailbox · {formatReconDate(day.date)}</p>
              </div>
              <div className="bg-white rounded-[8px] border border-[#E2E6E9] px-5 py-4">
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#97999B]">Ingested into ICC</p>
                <p className="text-[28px] font-bold text-[#262626] leading-none mt-2">{day.ingested.toLocaleString()}</p>
                <p className="text-[11.5px] text-[#97999B] mt-1.5">Same 24-hour period</p>
              </div>
              <div
                className="rounded-[8px] border px-5 py-4"
                style={day.variance === 0 ? { borderColor: "#C9E2D1", backgroundColor: GREEN_LIGHT } : { borderColor: "#F3C6C6", backgroundColor: RED_LIGHT }}
              >
                <p className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: day.variance === 0 ? GREEN : RED }}>Variance</p>
                <p className="text-[28px] font-bold leading-none mt-2" style={{ color: day.variance === 0 ? GREEN : RED }}>{day.variance}</p>
                <p className="text-[11.5px] mt-1.5" style={{ color: day.variance === 0 ? GREEN : RED }}>
                  {day.variance === 0 ? "Target: zero. Met." : "Target: zero. Not met."}
                </p>
              </div>
            </div>

            {day.variance > 0 && (
              <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#DEDEDE]">
                  <p className="text-[14px] font-bold text-[#111827]">Missing emails ({day.missing.length})</p>
                  <p className="text-[11.5px] text-[#97999B] mt-0.5">Received in the mailbox on {formatReconDate(day.date)} but never ingested into ICC.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className={`w-full min-w-[980px] border-separate border-spacing-0 ${rcMissing.tableClass}`} style={rcMissing.tableStyle}>
                    {rcMissing.colgroup}
                    <thead>
                      <tr className="bg-[#F7F7F7]">
                        {["Message ID", "Sender", "Subject", "Received", "Mailbox", "IT owner", "Status"].map((label) => (
                          <th key={label} className={TH}>
                            {label}
                            <ColumnResizeHandle rc={rcMissing} label={label} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {day.missing.map((m) => (
                        <tr key={m.id} className="hover:bg-[#F7F9FC] transition-colors">
                          <td className="px-4 py-3 text-[12.5px] font-semibold text-[#262626] whitespace-nowrap border-b border-[#EEF0F2]">{m.id}</td>
                          <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] border-b border-[#EEF0F2]">
                            <TruncateTooltip label={m.sender} />
                          </td>
                          <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] max-w-[320px] border-b border-[#EEF0F2]">
                            <TruncateTooltip label={m.subject} />
                          </td>
                          <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] whitespace-nowrap border-b border-[#EEF0F2]">{m.receivedAt}</td>
                          <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] whitespace-nowrap border-b border-[#EEF0F2]">{m.mailbox}</td>
                          <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] whitespace-nowrap border-b border-[#EEF0F2]">{m.owner}</td>
                          <td className="px-4 py-3 border-b border-[#EEF0F2]" title={m.note}>
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
                  <p className="text-[14px] font-bold text-[#111827]">Last 30 days</p>
                  <p className="text-[11.5px] text-[#97999B] mt-0.5">
                    {cleanDays} of {RECONCILIATION_HISTORY.length} days reconciled to zero · {thirtyDayMissing} emails went missing in total · {openDays} day{openDays === 1 ? "" : "s"} still open
                  </p>
                </div>
                <p className="flex items-center gap-1.5 text-[11.5px] text-[#97999B]">
                  <Info size={12} className="shrink-0" /> Click a day to see its details. Reports are kept for audit and trend analysis.
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
                    {RECONCILIATION_HISTORY.map((d) => {
                      const o = dayOutcome(d);
                      const selected = d.date === day.date;
                      return (
                        <tr
                          key={d.date}
                          onClick={() => setSelectedDate(d.date)}
                          className={`cursor-pointer transition-colors ${selected ? "bg-[#EAF1FB]" : "hover:bg-[#F7F9FC]"}`}
                        >
                          <td className="px-4 py-2.5 text-[12.5px] font-semibold text-[#262626] whitespace-nowrap border-b border-[#EEF0F2]">{formatReconDate(d.date, { weekday: true })}</td>
                          <td className="px-4 py-2.5 text-[12.5px] text-[#4D4D4D] border-b border-[#EEF0F2]">{d.received.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-[12.5px] text-[#4D4D4D] border-b border-[#EEF0F2]">{d.ingested.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-[12.5px] font-semibold border-b border-[#EEF0F2]" style={{ color: d.variance === 0 ? "#97999B" : RED }}>{d.variance}</td>
                          <td className="px-4 py-2.5 border-b border-[#EEF0F2]">
                            <Pill label={o} {...OUTCOME_STYLE[o]} />
                          </td>
                        </tr>
                      );
                    })}
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
