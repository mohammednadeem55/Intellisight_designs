import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { AlertCircle, Building2, Calendar, Clock, DollarSign, Info, Layers, List, MapPin, Maximize2, MessageSquareText, Minimize2, Plus, RefreshCw, ShieldCheck, ThumbsDown, ThumbsUp, TriangleAlert, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { EMAIL_TABLE_NAVY, InfoTile } from "../../components/common/EmailTable";
import { ColumnResizeHandle, useResizableColumns } from "../../components/common/ResizableColumns";
import { DatePickerPopover } from "../../components/common/DatePickerPopover";
import { ReasonSelect } from "../../components/common/ReasonSelect";
import {
  ORACLE_UPDATE_REQUEST_TYPES,
  REQUEST_TYPES,
  isBlockedLine,
  orderLinesFor,
  type CaseLine,
  type RequestType,
  type SsdSoeCase,
} from "./ssdSoeData";
import { updateCase, usePersona, useSsdSoeCases } from "./ssdSoeStore";
import { AMBER, GREEN, KindPill, PersonaSwitcher, PURPLE, RED, StatusPill } from "./ssdSoeUi";

type NavProps = {
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
};

const today = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-");
const ME = { name: "Arman Singh", tag: "AS" };

function primaryBtn(disabled?: boolean) {
  return `flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] text-white text-[12.5px] font-semibold transition-opacity ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-90 cursor-pointer"}`;
}
const secondaryBtn = "flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] font-semibold text-[#4D4D4D] hover:bg-[#F7F7F7] cursor-pointer transition-colors";

function Modal({ title, subtitle, onClose, children, footer, wide }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-[8px] shadow-xl w-full ${wide ? "max-w-[980px]" : "max-w-[560px]"} max-h-[88vh] flex flex-col overflow-hidden`}>
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#DEDEDE] shrink-0">
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-[#262626]">{title}</h2>
            {subtitle && <p className="text-[12px] text-[#97999B] mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors shrink-0" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">{children}</div>
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-[#DEDEDE] shrink-0">{footer}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#97999B]">
      {children} {required && <span style={{ color: RED }}>(required)</span>}
    </p>
  );
}

// Reference "now" for aging: the sample cases are dated Jul/Aug 2026, so aging is measured against a fixed mock date.
const MOCK_NOW = new Date(2026, 7, 10);
function parseCaseDate(d: string): Date | null {
  const m = /^(\d{2})-([A-Za-z]{3})-(\d{2})$/.exec(d);
  if (!m) return null;
  const date = new Date(`${m[1]} ${m[2]} 20${m[3]}`);
  return Number.isNaN(date.getTime()) ? null : date;
}
const TH = "relative sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE] text-[12px] font-semibold text-[#4D4D4D]";
const iconBtn = "flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer";

export function SsdSoeCaseDetailPage(nav: NavProps) {
  const navigate = useNavigate();
  const { caseNo } = useParams<{ caseNo: string }>();
  const persona = usePersona();
  const cases = useSsdSoeCases();
  const c = cases.find((x) => x.caseNo === caseNo);
  const rc = useResizableColumns("ssdSoe.caseLines");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [tab, setTab] = useState<"lines" | "comments">("lines");
  const [refExpanded, setRefExpanded] = useState(true);
  const [fullOpen, setFullOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [rmeOpen, setRmeOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [oracleField, setOracleField] = useState<"ssd" | "sad" | null>(null);

  const isCsr = persona === "csr";
  const lines = c?.lines ?? [];
  const allSelected = lines.length > 0 && lines.every((l) => selected.has(l.line));
  const toggleIn = (set: Set<string>, id: string) => { const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); return n; };
  const hasProposal = lines.some((l) => l.factoryBestSsd);
  const allComments = useMemo(() => lines.flatMap((l) => l.comments.map((cm) => ({ ...cm, line: l.line }))), [lines]);
  const handleRefresh = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => { setSyncing(false); toast.success("Synced"); }, 900);
  };

  const shell = (body: React.ReactNode) => (
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
          <AppHeader activeNav="SSD / SOE" {...nav} />
        </div>
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 flex flex-col gap-4">{body}</div>
        </main>
      </div>
    </div>
  );

  if (!c) {
    return shell(
      <div className="bg-white rounded-[8px] border border-[#E2E6E9] py-16 text-center">
        <p className="text-[14px] font-semibold text-[#374151]">Case {caseNo} was not found</p>
        <button onClick={() => navigate("/ssd-soe")} className="mt-3 text-[12.5px] font-semibold hover:underline cursor-pointer" style={{ color: EMAIL_TABLE_NAVY }}>Back to My Cases</button>
      </div>
    );
  }

  const addComment = (line: CaseLine, text: string): CaseLine => ({ ...line, comments: [{ at: today(), by: ME.tag, text }, ...line.comments] });

  // CSR: approve / reject a factory-proposed SSD change
  const approveProposal = () => {
    updateCase(c.caseNo, (x) => ({
      ...x,
      status: "Approved",
      ssdCaseStatus: "Approved",
      lines: x.lines.map((l) => addComment({ ...l, status: "Approved", ssd: l.factoryBestSsd || l.ssd, rescheduleSsd: l.factoryBestSsd || l.rescheduleSsd, updatedInOracle: true }, `Approved. Oracle SSD / SAD updated${l.factoryBestSsd ? ` to ${l.factoryBestSsd}` : ""}.`)),
    }));
    toast.success(`${c.caseNo} approved. Oracle SSD / SAD updated and the factory notified.`);
  };
  const rejectProposal = (reason: string) => {
    updateCase(c.caseNo, (x) => ({
      ...x,
      status: "Rejected",
      ssdCaseStatus: "Rejected",
      lines: x.lines.map((l) => addComment({ ...l, status: "Rejected" }, `Rejected: ${reason}`)),
    }));
    setRejectOpen(false);
    toast.success(`${c.caseNo} rejected. The factory has been notified.`);
  };

  // CSR: push a chosen SSD or SAD date to Oracle for the selected lines (Jitterbit call is simulated)
  const pushToOracle = (field: "ssd" | "sad", iso: string) => {
    const d = new Date(iso + "T00:00:00");
    const txt = `${String(d.getDate()).padStart(2, "0")}-${d.toLocaleDateString("en-GB", { month: "short" })}-${String(d.getFullYear()).slice(2)}`;
    updateCase(c.caseNo, (x) => ({
      ...x,
      lines: x.lines.map((l) => (selected.has(l.line) ? addComment({ ...l, [field]: txt, updatedInOracle: true }, `${field.toUpperCase()} updated in Oracle to ${txt}.`) : l)),
    }));
    setOracleField(null);
    toast.success(`${field.toUpperCase()} updated in Oracle to ${txt} for ${selected.size} line${selected.size === 1 ? "" : "s"}.`);
  };

  // RME / SPOC: feedback on a P1 RME exception
  const giveFeedback = (decision: "Accepted" | "Declined", feedback: string) => {
    updateCase(c.caseNo, (x) => ({
      ...x,
      status: "In Progress",
      rme: x.rme ? { ...x.rme, status: decision, feedback, feedbackBy: "SPOC Reviewer", feedbackAt: today() } : x.rme,
      lines: x.lines.map((l) => addComment({ ...l, status: "In Progress" }, `RME feedback (${decision.toLowerCase()}): ${feedback}`)),
    }));
    toast.success(`Feedback sent. ${c.caseNo} is back with the CSR.`);
  };

  const ssdDates = lines.map((l) => parseCaseDate(l.ssd)).filter((d): d is Date => d !== null).sort((a, b) => a.getTime() - b.getTime());
  const earliestSsd = ssdDates[0] ? ssdDates[0].toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "-";
  const submitted = parseCaseDate(c.dateSubmitted);
  const closed = parseCaseDate(c.dateClosed);
  const agingDays = submitted ? Math.max(0, Math.round(((closed ?? MOCK_NOW).getTime() - submitted.getTime()) / 86_400_000)) : 0;
  const refItems = [
    { label: "CUSTOMER", value: c.customer, icon: Building2, accent: EMAIL_TABLE_NAVY },
    { label: "OU", value: c.ou, icon: MapPin, accent: "#823E81" },
    { label: "CASE LINES", value: String(lines.length).padStart(2, "0"), icon: Layers, accent: EMAIL_TABLE_NAVY },
    { label: "EARLIEST SSD", value: earliestSsd, icon: Calendar, accent: "#E67919" },
    { label: closed ? "TIME TO CLOSE" : "AGING", value: `${agingDays} days`, icon: Clock, accent: "#E67919" },
    { label: "ORDER VALUE (USD)", value: `$${Number(c.totalPriceUsd).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, icon: DollarSign, accent: "#468657" },
  ];

  const toolbarBtn = "flex items-center gap-1.5 h-[34px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] font-semibold text-[#4D4D4D] hover:border-[#30578D] hover:bg-[#EAF1FB] hover:text-[#30578D] cursor-pointer transition-colors";
  const needLines = () => toast.info("Tick one or more lines first");
  const cell = "px-4 py-3 text-[12.5px] text-[#4D4D4D] border-b border-[#DEDEDE] whitespace-nowrap";

  return (
    <>
      {shell(
        <>
          {/* Page header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Breadcrumbs items={[{ label: "SSD / SOE" }, { label: "My Cases", onClick: () => navigate("/ssd-soe") }, { label: `Case ${c.caseNo}` }]} />
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Case {c.caseNo}</h1>
                <button
                  onClick={() => setFullOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-[8px] border border-[#E2E6E9] text-[11.5px] font-semibold hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                  style={{ color: EMAIL_TABLE_NAVY }}
                >
                  <Info size={12} />
                  Full Case Details
                </button>
                <KindPill kind={c.kind} />
                <StatusPill status={c.status} />
              </div>
              <p className="text-[12px] text-[#97999B] mt-0.5">
                {c.kind === "SOE" ? "Sales Order Exception" : "Schedule Shipment Date change"} · {c.source === "Factory" ? "Factory upload" : "Salesforce"} · Order {c.orderNo}
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <button onClick={() => navigate("/communication")} title="Open Communication" className={iconBtn}><MessageSquareText size={14} /></button>
              <button onClick={handleRefresh} disabled={syncing} title="Refresh" className={`${iconBtn} disabled:opacity-60 disabled:cursor-not-allowed`}>
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              </button>
              <button onClick={() => setRefExpanded((v) => !v)} title={refExpanded ? "Collapse case summary" : "Expand case summary"} className={iconBtn}>
                {refExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <PersonaSwitcher persona={persona} />
            </div>
          </div>

          {/* What needs doing on this case, by persona */}
          {isCsr && c.status === "Awaiting Approval" && (
            <div className="rounded-[8px] border border-[#F5DDB8] bg-[#FDF3E7] px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: AMBER }}><TriangleAlert size={15} /> The factory proposed new ship dates</p>
                <p className="text-[12px] text-[#4D4D4D] mt-0.5">Approving updates the SSD / SAD in Oracle and sends the status back to the factory.</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button onClick={() => setRejectOpen(true)} className="flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] border text-[12.5px] font-semibold cursor-pointer hover:bg-[#FDECEA] transition-colors" style={{ borderColor: RED, color: RED }}>
                  <ThumbsDown size={14} /> Reject
                </button>
                <button onClick={approveProposal} className={primaryBtn()} style={{ backgroundColor: GREEN }}>
                  <ThumbsUp size={14} /> Approve
                </button>
              </div>
            </div>
          )}
          {persona === "factory" && (
            <div className="rounded-[8px] border border-[#E2E6E9] bg-white px-5 py-3 text-[12.5px] text-[#4D4D4D]">
              {c.status === "Awaiting Approval" && "Your proposal is with the CSR. You will see Approved or Rejected here once they decide."}
              {c.status === "Approved" && "Approved. The SSD / SAD has been updated in Oracle."}
              {c.status === "Rejected" && "Rejected by the CSR. See the comments for the reason, then upload a new proposal."}
              {!["Awaiting Approval", "Approved", "Rejected"].includes(c.status) && `Status: ${c.status}.`}
              <span className="text-[#97999B]"> You have read-only access. The CSR updates this case in Oracle.</span>
            </div>
          )}
          {c.rme && <RmeCard c={c} canRespond={persona === "rme" && c.rme.status === "Open"} onRespond={giveFeedback} />}

          {/* Reference strip */}
          {refExpanded && (
            <div className="bg-white rounded-[8px] border border-[#E2E6E9] flex items-stretch flex-wrap">
              {refItems.map((item, i, arr) => (
                <div key={item.label} className={`flex-1 min-w-[160px] px-5 py-3.5 flex items-start gap-3 ${i < arr.length - 1 ? "border-r border-[#E2E6E9]" : ""}`}>
                  <div className="size-[32px] rounded-[8px] flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${item.accent}1A` }}>
                    <item.icon size={15} style={{ color: item.accent }} />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] font-semibold text-[#97999B] uppercase tracking-wide">{item.label}</span>
                    <span className="text-[15px] font-bold text-[#262626] truncate">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Line items / comments, tabbed in one card like Order Details' Hold / Line Listing */}
          <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col">
            <div className="px-5 py-3 shrink-0 border-b border-[#E2E6E9] flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex items-center gap-1 p-1 rounded-[8px] bg-[#F1F2F4]">
                {([["lines", "Line Items", List, lines.length], ["comments", "Comments", MessageSquareText, allComments.length]] as const).map(([key, label, Icon, n]) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className="flex items-center gap-1.5 px-3 h-[30px] rounded-[6px] text-[12.5px] font-semibold cursor-pointer transition-colors"
                      style={active ? { backgroundColor: "#fff", color: EMAIL_TABLE_NAVY, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#666666" }}
                    >
                      <Icon size={13} /> {label} <span className="text-[11px] font-medium text-[#97999B]">{n}</span>
                    </button>
                  );
                })}
              </div>
              {isCsr && tab === "lines" && (
                <div className="flex items-center gap-2.5 flex-wrap">
                  {hasProposal && (
                    <p className="flex items-center gap-1.5 text-[12px] font-medium mr-1" style={{ color: AMBER }}>
                      <AlertCircle size={13} /> SSD reschedule request exists for marked lines
                    </p>
                  )}
                  <button onClick={() => (selected.size === 0 ? needLines() : setEditOpen(true))} className={primaryBtn()} style={{ backgroundColor: EMAIL_TABLE_NAVY, height: 34 }}>
                    Update{selected.size > 0 ? ` (${selected.size})` : ""}
                  </button>
                  <button onClick={() => (selected.size === 0 ? needLines() : setOracleField("ssd"))} className={toolbarBtn}><Calendar size={14} /> Update SSD in Oracle</button>
                  <button onClick={() => (selected.size === 0 ? needLines() : setOracleField("sad"))} className={toolbarBtn}><Calendar size={14} /> Update SAD in Oracle</button>
                  <button onClick={() => (selected.size === 0 ? needLines() : setRmeOpen(true))} className={toolbarBtn}>
                    <ShieldCheck size={14} /> Requires RME
                  </button>
                  <button onClick={() => setAddOpen(true)} className={toolbarBtn}><Plus size={14} /> Add Line Item</button>
                </div>
              )}
            </div>

            {tab === "lines" ? (
              <div className="overflow-x-auto">
                <table className={`w-full min-w-[1500px] border-separate border-spacing-0 ${rc.tableClass}`} style={rc.tableStyle}>
                  {rc.colgroup}
                  <thead>
                    <tr className="bg-[#F7F7F7]">
                      {isCsr && (
                        <th className="sticky top-0 z-10 bg-[#F7F7F7] w-[44px] px-3 h-[42px] border-b border-[#DEDEDE]">
                          <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(lines.map((l) => l.line)))} className="size-[15px] accent-[#30578D] cursor-pointer" aria-label="Select all lines" />
                        </th>
                      )}
                      {["Line", "Part Number", "Qty", "Factory", "Booked Date", "Current SSD", "CRD", "SRT", "Request Type", "Factory Best SSD", "Case Owner", "Status", "P1 RME", "Oracle"].map((label, i) => (
                        <th key={label} className={TH}>
                          {label}
                          {label && <ColumnResizeHandle rc={rc} label={label} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => {
                      return (
                          <tr onClick={() => setActiveLine(l.line)} className={`cursor-pointer transition-colors ${activeLine === l.line ? "bg-[#EEF2F7]" : selected.has(l.line) ? "bg-[#F5F9FE]" : "hover:bg-[#EEF2F7]"}`}>
                            {isCsr && (
                              <td className="px-3 py-3 border-b border-[#DEDEDE]" onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" checked={selected.has(l.line)} onChange={() => setSelected((p) => toggleIn(p, l.line))} className="size-[15px] accent-[#30578D] cursor-pointer" aria-label={`Select line ${l.line}`} />
                              </td>
                            )}
                            <td className={`${cell} font-semibold text-[#262626]`}>{l.line}</td>
                            <td className={cell}>{l.partNumber}</td>
                            <td className={cell}>{l.quantity}</td>
                            <td className={cell}>{l.factory}</td>
                            <td className={cell}>{l.bookedDate}</td>
                            <td className={`${cell} font-semibold text-[#262626]`}>{l.ssd}</td>
                            <td className={cell}>{l.crd}</td>
                            <td className={cell}>{l.srt}</td>
                            <td className={cell}>{l.requestType}</td>
                            <td className={cell}>{l.factoryBestSsd || <span className="text-[#BFC1C4]">-</span>}</td>
                            <td className={cell}>{l.caseOwner}</td>
                            <td className={cell}><StatusPill status={l.status} /></td>
                            <td className={cell}>{l.p1Rme ? <span className="font-semibold" style={{ color: PURPLE }}>Yes</span> : "No"}</td>
                            <td className={cell}>{l.updatedInOracle ? "Updated" : <span className="text-[#BFC1C4]">-</span>}</td>
                          </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-4 flex flex-col gap-2.5">
                {allComments.length === 0 ? (
                  <p className="text-[13px] text-[#97999B] text-center py-8">No comments on this case yet.</p>
                ) : (
                  allComments.map((cm, i) => (
                    <div key={i} className="rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F7] px-3.5 py-3">
                      <p className="text-[11px] text-[#97999B]">{cm.at} · {cm.by} · line {cm.line}</p>
                      <p className="text-[12.5px] text-[#262626] mt-1 leading-[1.55]">{cm.text}</p>
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === "lines" && activeLine && lines.find((l) => l.line === activeLine) && (
              <LinePanel
                key={activeLine}
                line={lines.find((l) => l.line === activeLine)!}
                index={lines.findIndex((l) => l.line === activeLine)}
                total={lines.length}
                author={persona === "csr" ? ME.tag : persona === "factory" ? "Factory" : "SPOC"}
                onNav={(d) => setActiveLine(lines[lines.findIndex((l) => l.line === activeLine) + d]?.line ?? activeLine)}
                onClose={() => setActiveLine(null)}
                onComment={(text) => {
                  updateCase(c.caseNo, (x) => ({ ...x, lines: x.lines.map((l) => (l.line === activeLine ? { ...l, comments: [{ at: today(), by: persona === "csr" ? ME.tag : persona === "factory" ? "Factory" : "SPOC", text }, ...l.comments] } : l)) }));
                  toast.success(`Comment added to line ${activeLine}`);
                }}
              />
            )}
            <p className="px-5 py-2.5 border-t border-[#DEDEDE] text-[11.5px] text-[#97999B]">Click a line to open its planner, pricing, Oracle and comment details.</p>
          </div>
        </>
      )}

      {fullOpen && <FullCaseModal c={c} onClose={() => setFullOpen(false)} />}
      {editOpen && (
        <EditLinesModal
          c={c}
          lineIds={[...selected]}
          onClose={() => setEditOpen(false)}
          onSave={(v) => {
            updateCase(c.caseNo, (x) => ({
              ...x,
              lines: x.lines.map((l) => {
                if (!selected.has(l.line)) return l;
                let next: CaseLine = { ...l, requestType: v.requestType };
                if (v.soeStatus === "Cancelled") next = { ...next, status: "Cancelled" };
                if (v.soeStatus === "Re-Open") next = { ...next, status: "In Progress", reopenDate: today() };
                if (v.updatedInOracle) next = { ...next, updatedInOracle: true };
                return v.comment ? addComment(next, v.comment) : next;
              }),
              status: v.soeStatus === "Cancelled" && x.lines.every((l) => selected.has(l.line)) ? "Cancelled" : x.status === "New" ? "In Progress" : x.status,
            }));
            setEditOpen(false);
            setSelected(new Set());
            toast.success(`${selected.size} line${selected.size === 1 ? "" : "s"} updated`);
          }}
        />
      )}
      {addOpen && (
        <AddLinesModal
          c={c}
          onClose={() => setAddOpen(false)}
          onSave={(picked, requestType, comment) => {
            const base = c.lines[0];
            const added: CaseLine[] = picked.map((p) => ({
              ...base,
              line: p.line, partNumber: p.partNumber, quantity: 1, factory: p.factory, bookedDate: p.bookedDate, ssd: p.ssd, srt: p.srt, requestType,
              status: "New", p1Rme: false, requireRme: false, factoryBestSsd: "", rescheduleSsd: "NA", updatedInOracle: false, reopenDate: "", comments: [{ at: today(), by: ME.tag, text: comment }],
            }));
            updateCase(c.caseNo, (x) => ({ ...x, lines: [...x.lines, ...added] }));
            setAddOpen(false);
            toast.success(`${added.length} line${added.length === 1 ? "" : "s"} added to ${c.caseNo}`);
          }}
        />
      )}
      {rmeOpen && (
        <RmeModal
          c={c}
          count={selected.size}
          onClose={() => setRmeOpen(false)}
          onSubmit={(reason) => {
            const routedTo = c.region === "AP" ? "SPOC team" : "RME team";
            updateCase(c.caseNo, (x) => ({
              ...x,
              status: "Pending RME",
              lines: x.lines.map((l) => (selected.has(l.line) ? addComment({ ...l, status: "Pending RME", requireRme: true, p1Rme: true }, `Raised P1 RME. ${reason}`) : l)),
              rme: { raisedBy: ME.name, raisedAt: today(), routedTo, reason, status: "Open" },
            }));
            setRmeOpen(false);
            setSelected(new Set());
            toast.success(`P1 RME raised and routed to the ${routedTo}`);
          }}
        />
      )}
      {oracleField && <OracleDateModal field={oracleField} count={selected.size} onClose={() => setOracleField(null)} onSubmit={(iso) => pushToOracle(oracleField, iso)} />}
      {rejectOpen && <RejectModal onClose={() => setRejectOpen(false)} onSubmit={rejectProposal} />}
    </>
  );
}

// "Full Case Details": every header field, grouped the same way as Order Details' Full Order Details modal.
// Same chrome as Hold Mgmt's "Full Order Details" modal: plain header with title + subtitle and a bare X,
// navy uppercase section headings separated by hairlines, and an InfoTile grid with no boxed background.
function FullCaseModal({ c, onClose }: { c: SsdSoeCase; onClose: () => void }) {
  const sections: { title: string; tiles: [string, React.ReactNode][] }[] = [
    { title: "Case", tiles: [["Case number", c.caseNo], ["Type", c.kind], ["Status", c.status], ["Source", c.source === "Factory" ? "Factory upload" : "Salesforce"], ["SSD case number", c.ssdCaseNo], ["SSD case status", c.ssdCaseStatus], ["Linked case", c.linkedCase]] },
    { title: "Order", tiles: [["Order number", c.orderNo], ["Order status", c.orderStatus], ["Customer PO", c.customerPo], ["CRDD type", c.crddType], ["CRDD date", c.crddDate], ["Total unit selling price (USD)", c.totalPriceUsd], ["Header hold info", c.headerHold]] },
    { title: "Customer & Region", tiles: [["Customer", c.customer], ["Operating unit", c.ou], ["Region", c.region], ["Destination", c.destination], ["Field engineer", c.fieldEngineer], ["Original request", c.originalRequest]] },
    { title: "People & Dates", tiles: [["Requester", c.requester], ["CSR", c.csr], ["Date submitted", c.dateSubmitted], ["Date closed", c.dateClosed]] },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[820px] max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE] shrink-0">
          <div className="min-w-0">
            <span className="text-[16px] font-bold text-[#262626] truncate">Full Case Details</span>
            <p className="text-[12px] text-[#97999B] mt-0.5 truncate">Case #{c.caseNo}</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-6 py-5 flex flex-col gap-5">
          {sections.map((sec, i) => (
            <div key={sec.title} className={i > 0 ? "border-t border-[#F1F2F4] pt-5" : ""}>
              <h3 className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: EMAIL_TABLE_NAVY }}>{sec.title}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5">
                {sec.tiles.map(([label, value]) => (
                  <InfoTile key={label} label={label} value={value || "-"} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-[#DEDEDE] shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function RmeCard({ c, canRespond, onRespond }: { c: SsdSoeCase; canRespond: boolean; onRespond: (d: "Accepted" | "Declined", fb: string) => void }) {
  const rme = c.rme!;
  const [fb, setFb] = useState("");
  const tone = rme.status === "Open" ? { fg: PURPLE, bg: "#F4ECF4", border: "#E2CDE2" } : rme.status === "Accepted" ? { fg: GREEN, bg: "#EFF6F1", border: "#C9E2D1" } : { fg: RED, bg: "#FDECEA", border: "#F3C6C6" };
  return (
    <div className="rounded-[8px] border px-5 py-4" style={{ borderColor: tone.border, backgroundColor: tone.bg }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: tone.fg }}>
            <ShieldCheck size={15} /> P1 RME / SOE exception ({rme.status})
          </p>
          <p className="text-[11.5px] text-[#4D4D4D] mt-0.5">Raised by {rme.raisedBy} on {rme.raisedAt}. Routed to the <span className="font-semibold">{rme.routedTo}</span> for {c.region}.</p>
        </div>
      </div>
      <p className="text-[12.5px] text-[#262626] mt-2.5"><span className="font-semibold">Why:</span> {rme.reason}</p>
      {rme.feedback && (
        <p className="text-[12.5px] text-[#262626] mt-1.5"><span className="font-semibold">Feedback ({rme.feedbackBy}, {rme.feedbackAt}):</span> {rme.feedback}</p>
      )}
      {canRespond && (
        <div className="mt-3 bg-white rounded-[8px] border border-[#E2E6E9] p-3">
          <FieldLabel required>Your feedback to the CSR</FieldLabel>
          <textarea value={fb} onChange={(e) => setFb(e.target.value)} rows={3} placeholder="Can the proposed date be accepted? If not, what is the alternative?" className="mt-1.5 w-full px-3 py-2 rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F8] text-[12.5px] text-[#262626] outline-none focus:border-[#30578D] focus:bg-white transition-colors resize-y" />
          <div className="flex items-center justify-end gap-2.5 mt-2.5">
            <button disabled={!fb.trim()} onClick={() => onRespond("Declined", fb.trim())} className="flex items-center gap-1.5 h-[34px] px-4 rounded-[8px] border text-[12.5px] font-semibold enabled:cursor-pointer enabled:hover:bg-[#FDECEA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors" style={{ borderColor: RED, color: RED }}>
              <ThumbsDown size={14} /> Decline date
            </button>
            <button disabled={!fb.trim()} onClick={() => onRespond("Accepted", fb.trim())} className={primaryBtn(!fb.trim())} style={{ backgroundColor: GREEN }}>
              <ThumbsUp size={14} /> Accept date
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditLinesModal({ c, lineIds, onClose, onSave }: { c: SsdSoeCase; lineIds: string[]; onClose: () => void; onSave: (v: { requestType: RequestType; soeStatus: string; comment: string; updatedInOracle: boolean }) => void }) {
  const picked = c.lines.filter((l) => lineIds.includes(l.line));
  const [requestType, setRequestType] = useState<string>(picked[0]?.requestType ?? "");
  const [soeStatus, setSoeStatus] = useState("");
  const [comment, setComment] = useState("");
  const [updatedInOracle, setUpdatedInOracle] = useState(false);
  const valid = Boolean(requestType);
  return (
    <Modal
      wide
      title="Edit multiple lines"
      subtitle={`Case ${c.caseNo} · ${picked.length} line${picked.length === 1 ? "" : "s"} selected`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={secondaryBtn}>Close</button>
          <button disabled={!valid} onClick={() => onSave({ requestType: requestType as RequestType, soeStatus, comment: comment.trim(), updatedInOracle })} className={primaryBtn(!valid)} style={{ backgroundColor: EMAIL_TABLE_NAVY }}>Save changes</button>
        </>
      }
    >
      <div className="overflow-x-auto rounded-[8px] border border-[#E2E6E9]">
        <table className="w-full min-w-[820px] border-separate border-spacing-0 text-[12.5px]">
          <thead>
            <tr className="bg-[#F7F7F7]">
              {["Line", "Part number", "Factory", "Booked date", "SSD", "Case owner", "Request type", "Status", "Quantity"].map((h) => (
                <th key={h} className="px-3 h-[38px] text-left whitespace-nowrap border-b border-[#DEDEDE] text-[12px] font-semibold text-[#4D4D4D]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {picked.map((l) => (
              <tr key={l.line}>
                <td className="px-3 py-2.5 border-b border-[#DEDEDE]">{l.line}</td>
                <td className="px-3 py-2.5 border-b border-[#DEDEDE]">{l.partNumber}</td>
                <td className="px-3 py-2.5 border-b border-[#DEDEDE]">{l.factory}</td>
                <td className="px-3 py-2.5 border-b border-[#DEDEDE]">{l.bookedDate}</td>
                <td className="px-3 py-2.5 border-b border-[#DEDEDE]">{l.ssd}</td>
                <td className="px-3 py-2.5 border-b border-[#DEDEDE]">{l.caseOwner}</td>
                <td className="px-3 py-2.5 border-b border-[#DEDEDE]">{l.requestType}</td>
                <td className="px-3 py-2.5 border-b border-[#DEDEDE]">{l.status}</td>
                <td className="px-3 py-2.5 border-b border-[#DEDEDE]">{l.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>Request type</FieldLabel>
          <ReasonSelect value={requestType} onChange={setRequestType} options={REQUEST_TYPES} invalid={!requestType} placeholder="Please select" />
        </div>
        <div>
          <FieldLabel>SOE status</FieldLabel>
          <ReasonSelect value={soeStatus} onChange={setSoeStatus} options={["Cancelled", "Re-Open"]} invalid={false} placeholder="Please select" />
        </div>
        <div className="md:col-span-2">
          <FieldLabel>Add comment</FieldLabel>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-1.5 w-full px-3 py-2 rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F8] text-[12.5px] text-[#262626] outline-none focus:border-[#30578D] focus:bg-white transition-colors resize-y" />
        </div>
        <label className="md:col-span-2 flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={updatedInOracle} onChange={(e) => setUpdatedInOracle(e.target.checked)} className="size-[15px] mt-0.5 accent-[#30578D] cursor-pointer" />
          <span className="text-[12.5px] text-[#262626]">
            <span className="font-semibold">Updated in Oracle</span>
            <span className="block text-[11.5px] mt-0.5" style={{ color: RED }}>Applicable for request types: {ORACLE_UPDATE_REQUEST_TYPES.join(", ")}</span>
          </span>
        </label>
      </div>
    </Modal>
  );
}

function AddLinesModal({ c, onClose, onSave }: { c: SsdSoeCase; onClose: () => void; onSave: (lines: ReturnType<typeof orderLinesFor>, requestType: RequestType, comment: string) => void }) {
  const options = useMemo(() => orderLinesFor(c.orderNo), [c.orderNo]);
  const inCase = new Set(c.lines.map((l) => l.line));
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [requestType, setRequestType] = useState("");
  const [comment, setComment] = useState("");
  const selectable = options.filter((o) => !isBlockedLine(o) && !inCase.has(o.line));
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const valid = picked.size > 0 && Boolean(requestType) && Boolean(comment.trim());
  return (
    <Modal
      wide
      title="Add multiple lines"
      subtitle={`Order ${c.orderNo}. Pick the lines to bring into case ${c.caseNo}.`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={secondaryBtn}>Close</button>
          <button disabled={!valid} onClick={() => onSave(options.filter((o) => picked.has(o.line)), requestType as RequestType, comment.trim())} className={primaryBtn(!valid)} style={{ backgroundColor: EMAIL_TABLE_NAVY }}>
            Add {picked.size > 0 ? `${picked.size} line${picked.size === 1 ? "" : "s"}` : "lines"}
          </button>
        </>
      }
    >
      <p className="flex items-center gap-1.5 text-[12px] mb-3" style={{ color: RED }}><AlertCircle size={13} /> Line items with SRT under 2 weeks for F01 / F48 will not be available for selection.</p>
      <div className="overflow-x-auto rounded-[8px] border border-[#E2E6E9]">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-[12.5px]">
          <thead>
            <tr className="bg-[#F7F7F7]">
              <th className="px-3 h-[38px] w-[40px] border-b border-[#DEDEDE]">
                <input type="checkbox" checked={selectable.length > 0 && selectable.every((o) => picked.has(o.line))} onChange={() => setPicked(selectable.every((o) => picked.has(o.line)) ? new Set() : new Set(selectable.map((o) => o.line)))} className="size-[15px] accent-[#30578D] cursor-pointer" aria-label="Select all lines" />
              </th>
              {["Line", "Part number", "Factory", "Booked date", "SSD", "CRDD type", "CRDD date", "Line flow status", "SRT"].map((h) => (
                <th key={h} className="px-3 h-[38px] text-left whitespace-nowrap border-b border-[#DEDEDE] text-[12px] font-semibold text-[#4D4D4D]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {options.map((o) => {
              const blocked = isBlockedLine(o);
              const already = inCase.has(o.line);
              const disabled = blocked || already;
              return (
                <tr key={o.line} className={disabled ? "opacity-50" : picked.has(o.line) ? "bg-[#F5F9FE]" : "hover:bg-[#F7F9FC]"} title={already ? "Already in this case" : blocked ? "SRT under 2 weeks for this factory" : undefined}>
                  <td className="px-3 py-2 text-center border-b border-[#DEDEDE]">
                    <input type="checkbox" disabled={disabled} checked={picked.has(o.line)} onChange={() => toggle(o.line)} className="size-[15px] accent-[#30578D] cursor-pointer disabled:cursor-not-allowed" aria-label={`Select line ${o.line}`} />
                  </td>
                  <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.line}</td>
                  <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.partNumber}</td>
                  <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.factory}</td>
                  <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.bookedDate}</td>
                  <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.ssd}</td>
                  <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.crddType}</td>
                  <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.crddDate}</td>
                  <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.flowStatus}</td>
                  <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.srt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>Request type</FieldLabel>
          <ReasonSelect value={requestType} onChange={setRequestType} options={REQUEST_TYPES} invalid={!requestType} placeholder="Please select" />
        </div>
        <div className="md:col-span-2">
          <FieldLabel required>Add comment</FieldLabel>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-1.5 w-full px-3 py-2 rounded-[8px] border bg-[#F7F7F8] text-[12.5px] text-[#262626] outline-none focus:border-[#30578D] focus:bg-white transition-colors resize-y" style={{ borderColor: comment.trim() ? "#E2E6E9" : RED }} />
        </div>
      </div>
    </Modal>
  );
}

function RmeModal({ c, count, onClose, onSubmit }: { c: SsdSoeCase; count: number; onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const routedTo = c.region === "AP" ? "SPOC team" : "RME team";
  return (
    <Modal
      title="Raise P1 RME / SOE"
      subtitle={`Case ${c.caseNo} · ${count} line${count === 1 ? "" : "s"}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={secondaryBtn}>Cancel</button>
          <button disabled={!reason.trim()} onClick={() => onSubmit(reason.trim())} className={primaryBtn(!reason.trim())} style={{ backgroundColor: PURPLE }}>Raise P1 RME</button>
        </>
      }
    >
      <p className="text-[12.5px] text-[#4D4D4D] leading-[1.6]">
        Use this when the customer does not accept the factory proposed date. It is routed by region: for <span className="font-semibold">{c.region}</span> it goes to the <span className="font-semibold">{routedTo}</span>, who review it and send feedback back to this case.
      </p>
      <div className="mt-4">
        <FieldLabel required>Why does the customer need this?</FieldLabel>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-1.5 w-full px-3 py-2 rounded-[8px] border bg-[#F7F7F8] text-[12.5px] text-[#262626] outline-none focus:border-[#30578D] focus:bg-white transition-colors resize-y" style={{ borderColor: reason.trim() ? "#E2E6E9" : RED }} />
      </div>
    </Modal>
  );
}

function LinePanel({ line: l, index, total, author, onNav, onClose, onComment }: { line: CaseLine; index: number; total: number; author: string; onNav: (d: -1 | 1) => void; onClose: () => void; onComment: (text: string) => void }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, []);
  const groups: { title: string; icon: typeof Calendar; items: [string, string][] }[] = [
    { title: "Dates", icon: Calendar, items: [["Booked", l.bookedDate], ["Current SSD", l.ssd], ["Reschedule SSD", l.rescheduleSsd], ["SAD", l.sad], ["CRD", l.crd], ["Ship date", l.shipDate || "-"], ["Follow-up", l.followupDate || "-"], ["Re-open", l.reopenDate || "-"]] },
    { title: "Planning", icon: Layers, items: [["Planner", l.planner], ["Planner code", l.plannerCode], ["Planning priority", String(l.planningPriority)], ["PL", l.pl], ["SRT", String(l.srt)], ["Factory", l.factory]] },
    { title: "Oracle & pricing", icon: DollarSign, items: [["Oracle line status", l.oracleLineStatus], ["Updated in Oracle", l.updatedInOracle ? "Yes" : "No"], ["Ext selling price ($)", l.extSellingPrice.toFixed(2)], ["Owner email", l.ownerEmail]] },
  ];
  const send = () => { if (text.trim()) { onComment(text.trim()); setText(""); } };
  return (
    <div ref={ref} className="border-t-2 border-[#30578D] bg-[#F7F7F8]">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#DEDEDE]">
        <div className="flex items-center gap-3 min-w-0">
          <p className="text-[14px] font-bold text-[#262626]">Line {l.line}</p>
          <p className="text-[12px] text-[#97999B] truncate">{l.partNumber} · Qty {l.quantity} · {l.requestType}</p>
          <StatusPill status={l.status} />
          {l.p1Rme && <span className="text-[11.5px] font-semibold" style={{ color: PURPLE }}>P1 RME</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[12px] text-[#97999B]">{index + 1} of {total}</span>
          <button disabled={index === 0} onClick={() => onNav(-1)} className={`${secondaryBtn} !h-[30px] ${index === 0 ? "opacity-40 cursor-not-allowed" : ""}`}>Previous</button>
          <button disabled={index === total - 1} onClick={() => onNav(1)} className={`${secondaryBtn} !h-[30px] ${index === total - 1 ? "opacity-40 cursor-not-allowed" : ""}`}>Next</button>
          <button onClick={onClose} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer" aria-label="Close details"><X size={18} /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(360px,34%)] gap-5 px-5 py-4">
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <div key={g.title} className="rounded-[8px] border border-[#E2E6E9] bg-white overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[#E2E6E9] bg-[#F7F7F7]">
                <span className="size-[24px] rounded-[6px] flex items-center justify-center bg-white border border-[#E2E6E9]"><g.icon size={13} className="text-[#666666]" /></span>
                <p className="text-[13px] font-bold text-[#262626]">{g.title}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3.5 px-4 py-3.5">{g.items.map(([k, v]) => <InfoTile key={k} label={k} value={v} />)}</div>
            </div>
          ))}
        </div>
        <div className="rounded-[8px] border border-[#E2E6E9] bg-white flex flex-col self-start w-full">
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[#E2E6E9] bg-[#F7F7F7]">
            <span className="size-[24px] rounded-[6px] flex items-center justify-center bg-white border border-[#E2E6E9]"><MessageSquareText size={13} className="text-[#666666]" /></span>
            <p className="text-[13px] font-bold text-[#262626]">Comments <span className="font-medium text-[#97999B]">{l.comments.length}</span></p>
          </div>
          <div className="px-4 py-3 text-[12px] text-[#374151] leading-[1.6] flex flex-col gap-1.5 overflow-y-auto max-h-[200px]">
            {l.comments.length === 0 ? <p className="text-[#97999B]">No comments yet.</p> : l.comments.map((cm, i) => (
              <p key={i}><span className="text-[#97999B]">{cm.at} [{cm.by}]:</span> {cm.text}</p>
            ))}
          </div>
          <div className="border-t border-[#E2E6E9] p-3 flex flex-col gap-2">
            <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} rows={2} placeholder="Add a comment…" className="w-full px-3 py-2 rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F8] text-[12.5px] text-[#262626] outline-none focus:border-[#30578D] focus:bg-white transition-colors resize-y" />
            <button disabled={!text.trim()} onClick={send} className={`${primaryBtn(!text.trim())} self-end !h-[32px]`} style={{ backgroundColor: EMAIL_TABLE_NAVY }}>Add comment</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OracleDateModal({ field, count, onClose, onSubmit }: { field: "ssd" | "sad"; count: number; onClose: () => void; onSubmit: (iso: string) => void }) {
  const [date, setDate] = useState("");
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const label = field.toUpperCase();
  return (
    <Modal
      title={`Update ${label} in Oracle`}
      subtitle={`Applies to ${count} selected line${count === 1 ? "" : "s"}.`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={secondaryBtn}>Cancel</button>
          <button disabled={!date} onClick={() => onSubmit(date)} className={primaryBtn(!date)} style={{ backgroundColor: EMAIL_TABLE_NAVY }}>Update in Oracle</button>
        </>
      }
    >
      <FieldLabel required>New {label}</FieldLabel>
      <button ref={anchor} type="button" onClick={() => setOpen((o) => !o)} className="mt-1.5 w-full flex items-center justify-between px-3 py-2 rounded-[8px] border bg-white text-[12.5px] cursor-pointer" style={{ borderColor: open ? "#30578D" : date ? "#E2E6E9" : RED }}>
        <span className={date ? "text-[#262626]" : "text-[#97999B]"}>{date || "Select a date"}</span>
        <Calendar size={14} className="text-[#97999B]" />
      </button>
      <DatePickerPopover open={open} anchorRef={anchor} onOpenChange={setOpen} value={date} onChange={(iso) => { setDate(iso); setOpen(false); }} />
    </Modal>
  );
}

function RejectModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Modal
      title="Reject proposed ship dates"
      subtitle="The factory is told why, so they can send a new proposal."
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={secondaryBtn}>Cancel</button>
          <button disabled={!reason.trim()} onClick={() => onSubmit(reason.trim())} className={primaryBtn(!reason.trim())} style={{ backgroundColor: RED }}>Reject</button>
        </>
      }
    >
      <FieldLabel required>Reason</FieldLabel>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-1.5 w-full px-3 py-2 rounded-[8px] border bg-[#F7F7F8] text-[12.5px] text-[#262626] outline-none focus:border-[#30578D] focus:bg-white transition-colors resize-y" style={{ borderColor: reason.trim() ? "#E2E6E9" : RED }} />
    </Modal>
  );
}

