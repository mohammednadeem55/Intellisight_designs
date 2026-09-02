import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  Clock,
  Database,
  DollarSign,
  History,
  Layers,
  MapPin,
  Maximize2,
  MessageSquareText,
  Minimize2,
  NotebookPen,
  RefreshCw,
  Search,
  TriangleAlert,
  UserCog,
  X,
} from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { EMAIL_TABLE_NAVY, EMPTY_SET, EmailTableColumnFilterButton, TruncateTooltip } from "../../components/common/EmailTable";
import { TableToolbarApplyReset, TableToolbarMultiSelect, TableToolbarSearch, useExclusiveOpen, useStagedMultiSelect } from "../../components/common/TableToolbar";
import { TableFilterPanel, TableFilterTrigger, type TableColumnDef } from "../../components/common/TableFilterPanel";
import { TableColumnMgmtPanel, TableColumnMgmtTrigger } from "../../components/common/TableColumnMgmtPanel";
import { TablePagination, type RowDensity } from "../../components/common/TablePagination";
import { ALL_ORDERS, AUDIT_HISTORY_ENTRIES, AUDIT_NOTES, HOLD_ROWS } from "./holdManagementData";

type HoldRow = (typeof HOLD_ROWS)[number];
type ColumnKey = "name" | "category" | "level" | "workflow" | "owner" | "impact" | "erd" | "notes";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "name", label: "Hold Name" },
  { key: "category", label: "Category" },
  { key: "level", label: "Level/Line" },
  { key: "workflow", label: "Workflow" },
  { key: "owner", label: "Owner" },
  { key: "impact", label: "Impact" },
  { key: "erd", label: "ERD" },
  { key: "notes", label: "Notes Preview" },
];
const FILTER_COLUMNS: TableColumnDef[] = COLUMNS.filter((c) => c.key !== "erd" && c.key !== "notes" && c.key !== "name");

const HOLD_CATEGORIES = Array.from(new Set(HOLD_ROWS.map((r) => r.category)));
const HOLD_TYPES = Array.from(new Set(HOLD_ROWS.map((r) => r.name)));

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  "On Track": { color: "#468657", bg: "#EFF6F1" },
  "At Risk": { color: "#E67919", bg: "#FDF3E7" },
  Breached: { color: "#C83737", bg: "#FAEBEB" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE["On Track"];
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 rounded-[8px] text-[12px] font-medium whitespace-nowrap" style={{ color: s.color, backgroundColor: s.bg }}>
      {status}
    </span>
  );
}

// Each order belongs to exactly one hold group, driven by its hold type — distinct from order.status
// (SLA state), which is a separate axis. Colors match the panel accent colors on Hold Management Overview.
const HOLD_GROUP_BY_TYPE: Record<string, { label: string; color: string }> = {
  "Bill Only Line Order": { label: "Shipment Impacting Holds", color: EMAIL_TABLE_NAVY },
  "Invoice Hold": { label: "Invoicing Only Holds", color: "#823E81" },
  "Credit Check Order": { label: "Non CC Holds", color: "#387D85" },
};
const DEFAULT_HOLD_GROUP = { label: "Shipment Impacting Holds", color: EMAIL_TABLE_NAVY };

function HoldGroupBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 rounded-[8px] text-[12px] font-medium whitespace-nowrap" style={{ color, backgroundColor: `${color}1A` }}>
      {label}
    </span>
  );
}

const RELEASE_REASONS = [
  { code: "PASS_CREDIT", label: "Passed credit check" },
  { code: "CREDIT RELEASED", label: "Manual credit hold release" },
  { code: "CIA RECEIVED", label: "Cash in advance received" },
  { code: "LOC RECEIVED", label: "Letter of credit received" },
  { code: "CUSTOMER RELEASED", label: "Customer hold released" },
  { code: "RPL CLEARED", label: "Restricted party cleared" },
  { code: "SRQ CONFIRMED", label: "Purchase order confirmed" },
];
type ReleaseFormState = Record<number, { reason: string; comment: string }>;

// One row per hold being released — works the same whether it's a single row (per-row Release button) or
// several at once (bulk "Release Selected"), since the table just renders whatever `rows` it's given.
function ReleaseHoldModal({ rows, orderId, onClose, onConfirm }: {
  rows: HoldRow[];
  orderId: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [form, setForm] = useState<ReleaseFormState>({});
  const [openReasonFor, setOpenReasonFor] = useState<number | null>(null);
  const [reasonMenuRect, setReasonMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const reasonButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const setReason = (id: number, reason: string) => setForm((prev) => ({ ...prev, [id]: { reason, comment: prev[id]?.comment ?? "" } }));
  const setComment = (id: number, comment: string) => setForm((prev) => ({ ...prev, [id]: { reason: prev[id]?.reason ?? "", comment } }));

  // Menu renders via a portal at a fixed position derived from the trigger button, so it isn't clipped by
  // the table card's rounded border or the modal body's own scroll container — the same reason the ERD
  // date input opens a real calendar rather than a menu confined to the table cell.
  const toggleReasonMenu = (id: number) => {
    if (openReasonFor === id) { setOpenReasonFor(null); return; }
    const btn = reasonButtonRefs.current[id];
    if (btn) {
      const r = btn.getBoundingClientRect();
      setReasonMenuRect({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 260) });
    }
    setOpenReasonFor(id);
  };

  const confirm = () => {
    const missing = rows.some((r) => !form[r.id]?.reason);
    if (missing) { toast.warning("Select a release reason for every hold"); return; }
    toast.success(rows.length > 1 ? `${rows.length} holds released` : `Hold "${rows[0].name}" released`);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[900px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
          <span className="text-[16px] font-bold text-[#262626]">Release Hold</span>
          <button onClick={onClose} className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-6 py-5">
          <div className="rounded-[8px] border border-[#E2E6E9]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F7F7F7]">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#666666] uppercase tracking-wide border-b border-[#E2E6E9]">Sales Order</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#666666] uppercase tracking-wide border-b border-[#E2E6E9]">Hold Type</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#666666] uppercase tracking-wide border-b border-[#E2E6E9]">Level/Line</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#666666] uppercase tracking-wide border-b border-[#E2E6E9]">Reason</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#666666] uppercase tracking-wide border-b border-[#E2E6E9]">Comment</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id} className={i !== rows.length - 1 ? "border-b border-[#E2E6E9]" : ""}>
                    <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] whitespace-nowrap">{orderId}</td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-[#30578D] whitespace-nowrap">{row.name}</td>
                    <td className="px-4 py-3 text-[12.5px] text-[#4D4D4D] whitespace-nowrap">{row.level}</td>
                    <td className="px-4 py-3">
                      <button
                        ref={(el) => { reasonButtonRefs.current[row.id] = el; }}
                        onClick={() => toggleReasonMenu(row.id)}
                        className="w-full flex items-center justify-between gap-2 h-[34px] px-2.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] text-left cursor-pointer hover:bg-[#F7F7F7] transition-colors"
                      >
                        <span className={`truncate ${form[row.id]?.reason ? "text-[#262626]" : "text-[#97999B]"}`}>
                          {form[row.id]?.reason
                            ? `${form[row.id].reason} - ${RELEASE_REASONS.find((r) => r.code === form[row.id].reason)?.label ?? ""}`
                            : "Enter Release Reason"}
                        </span>
                        <ChevronDown size={13} className={`text-[#97999B] shrink-0 transition-transform duration-200 ${openReasonFor === row.id ? "rotate-180" : ""}`} />
                      </button>
                      {openReasonFor === row.id && reasonMenuRect && createPortal(
                        <>
                          <div className="fixed inset-0 z-[9998]" onClick={() => setOpenReasonFor(null)} />
                          <div
                            className="fixed bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-[9999] py-1 max-h-[260px] overflow-y-auto"
                            style={{ top: reasonMenuRect.top, left: reasonMenuRect.left, width: reasonMenuRect.width }}
                          >
                            {RELEASE_REASONS.map((reason) => (
                              <button
                                key={reason.code}
                                onClick={() => { setReason(row.id, reason.code); setOpenReasonFor(null); }}
                                className={`w-full text-left px-3 py-2 text-[12.5px] cursor-pointer transition-colors ${
                                  reason.code === form[row.id]?.reason ? "bg-[#EAF1FB]" : "hover:bg-[#F7F7F7]"
                                }`}
                              >
                                <span className={reason.code === form[row.id]?.reason ? "font-bold text-[#30578D]" : "font-semibold text-[#262626]"}>{reason.code}</span>
                                <span className="text-[#666666]"> - {reason.label}</span>
                              </button>
                            ))}
                          </div>
                        </>,
                        document.body
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={form[row.id]?.comment ?? ""}
                        onChange={(e) => setComment(row.id, e.target.value)}
                        placeholder="Enter comment"
                        className="w-full h-[34px] px-2.5 rounded-[8px] border border-[#E2E6E9] text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
          <button onClick={onClose} className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={confirm} className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer" style={{ backgroundColor: "#468657" }}>
            Confirm Release
          </button>
        </div>
      </div>
    </div>
  );
}

const ESCALATION_PRIORITIES = [
  { label: "Critical", color: "#C83737" },
  { label: "High", color: "#E67919" },
  { label: "Low", color: "#666666" },
] as const;
const fieldInputClass = "w-full h-[38px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors";
const fieldLabelClass = "text-[11px] font-semibold text-[#666666] uppercase tracking-wide mb-1.5 block";

// Reads like a compact composer scoped to one hold — Follow-up is the lighter-weight tab (no priority),
// Escalation adds a priority pick before the same To/Cc/Subject/message fields.
function FollowUpEscalateModal({ row, onClose }: { row: HoldRow; onClose: () => void }) {
  const [tab, setTab] = useState<"followup" | "escalation">("followup");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(`Re: ${row.name}`);
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<(typeof ESCALATION_PRIORITIES)[number]["label"] | null>(null);

  const send = () => {
    if (!to.trim()) { toast.warning("Enter a recipient"); return; }
    if (tab === "escalation" && !priority) { toast.warning("Select an escalation priority"); return; }
    toast.success(tab === "followup" ? "Follow-up sent" : "Escalation sent");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[560px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
          <span className="text-[16px] font-bold text-[#262626]">HOLD: {row.name}</span>
          <button onClick={onClose} className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex shrink-0 border-b border-[#E2E6E9]">
          {(["followup", "escalation"] as const).map((t) => {
            const active = tab === t;
            const Icon = t === "followup" ? MessageSquareText : TriangleAlert;
            const color = t === "followup" ? EMAIL_TABLE_NAVY : "#C83737";
            return (
              <button key={t} onClick={() => setTab(t)} className="flex-1 flex flex-col items-center pt-3 cursor-pointer transition-colors">
                <span className="flex items-center gap-1.5 pb-2.5">
                  <Icon size={14} style={{ color: active ? color : "#97999B" }} />
                  <span className="text-[13px] font-semibold" style={{ color: active ? "#262626" : "#666666" }}>
                    {t === "followup" ? "Follow-up" : "Escalations"}
                  </span>
                </span>
                <div className="h-[2px] w-full" style={{ backgroundColor: active ? color : "transparent" }} />
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-6 py-5 flex flex-col gap-4">
          {row.notes && (
            <div className="flex items-start gap-2 rounded-[8px] bg-[#F7F7F7] border border-[#E2E6E9] px-3 py-2.5">
              <History size={13} className="text-[#97999B] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#666666] leading-[1.5]">
                <span className="font-semibold text-[#4D4D4D]">Latest note: </span>
                {row.notes}
              </p>
            </div>
          )}

          {tab === "escalation" && (
            <div>
              <span className={fieldLabelClass}>Select Escalation Priority</span>
              <div className="flex items-center gap-2">
                {ESCALATION_PRIORITIES.map((p) => {
                  const selected = priority === p.label;
                  return (
                    <button
                      key={p.label}
                      onClick={() => setPriority(p.label)}
                      className="flex items-center gap-1.5 px-3 h-[32px] rounded-[8px] border text-[12.5px] font-semibold cursor-pointer transition-colors"
                      style={selected ? { borderColor: p.color, backgroundColor: `${p.color}14`, color: p.color } : { borderColor: "#E2E6E9", color: "#666666" }}
                    >
                      <span className="size-[7px] rounded-full shrink-0" style={{ backgroundColor: selected ? p.color : "#D9D9D6" }} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabelClass}>To</label>
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Enter recipient email" className={fieldInputClass} />
            </div>
            <div>
              <label className={fieldLabelClass}>Cc</label>
              <input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Enter Cc email" className={fieldInputClass} />
            </div>
          </div>

          <div>
            <label className={fieldLabelClass}>Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={`Re: ${row.name}`} className={fieldInputClass} />
          </div>

          <div>
            <label className={fieldLabelClass}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message"
              className="w-full min-h-[140px] px-3 py-2.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
          <button onClick={onClose} className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={send}
            className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: EMAIL_TABLE_NAVY }}
          >
            {tab === "followup" ? "Send Follow-up" : "Send Escalation"}
          </button>
        </div>
      </div>
    </div>
  );
}

const NOTE_COLLAPSE_LENGTH = 220;

// One note as its own card rather than a bare timeline row — long entries (like the BIZ:SI note) stay
// scannable via a local expand toggle instead of dominating the whole list.
function NoteCard({ note }: { note: (typeof AUDIT_NOTES)[number] }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = note.text.length > NOTE_COLLAPSE_LENGTH;
  const shownText = isLong && !expanded ? `${note.text.slice(0, NOTE_COLLAPSE_LENGTH).trimEnd()}…` : note.text;

  return (
    <div className="rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F7] px-3.5 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-[24px] rounded-full flex items-center justify-center shrink-0 bg-white border border-[#E2E6E9]">
            {note.source === "oracle" ? (
              <Database size={11} className="text-[#666666]" strokeWidth={2.5} />
            ) : (
              <NotebookPen size={11} className="text-[#666666]" strokeWidth={2.5} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[12px] leading-tight truncate">
              <span className="text-[#666666]">{note.source === "oracle" ? "Oracle Note by" : "Note by"}</span>{" "}
              <span className="font-semibold cursor-pointer hover:underline" style={{ color: EMAIL_TABLE_NAVY }}>{note.agent}</span>
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10.5px] text-[#666666] leading-tight">{note.date}</p>
          <p className="text-[10px] text-[#97999B] leading-tight">{note.ago}</p>
        </div>
      </div>
      <p className="text-[#4D4D4D] text-[12.5px] leading-[1.6] whitespace-pre-wrap mt-2">{shownText}</p>
      {isLong && (
        <button onClick={() => setExpanded((v) => !v)} className="text-[11px] font-semibold mt-1.5 cursor-pointer hover:underline" style={{ color: EMAIL_TABLE_NAVY }}>
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export function OrderDetailsPage({ orderId, onLogout, onViewAllNotifications, onNavigateHome, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateNewOverview, onNavigateOverview, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateCommunication, onNavigateEmailTemplate, onNavigateReview, onNavigateEmailWorkflow }: {
  orderId: string;
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateOverview: () => void;
  onNavigateOrderListing: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateCommunication?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateReview?: () => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  const order = ALL_ORDERS.find((o) => o.id === orderId) ?? ALL_ORDERS[0];
  const holdGroup = HOLD_GROUP_BY_TYPE[order.holdType] ?? DEFAULT_HOLD_GROUP;

  const [activeTab, setActiveTab] = useState<"notes" | "followup">("notes");
  const [noteText, setNoteText] = useState("");
  const [noteSearchDraft, setNoteSearchDraft] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const clearNoteSearch = () => { setNoteSearchDraft(""); setNoteSearch(""); };

  const [auditSearchDraft, setAuditSearchDraft] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const clearAuditSearch = () => { setAuditSearchDraft(""); setAuditSearch(""); };
  const [auditSort, setAuditSort] = useState("Release");
  const [auditSortOpen, setAuditSortOpen] = useState(false);
  const [expandedAudit, setExpandedAudit] = useState<Set<number>>(new Set());
  const toggleAuditDetails = (id: number) => setExpandedAudit((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const [followUpDate, setFollowUpDate] = useState("");
  const followUpInputRef = useRef<HTMLInputElement>(null);
  const [refExpanded, setRefExpanded] = useState(true);

  const [syncing, setSyncing] = useState(false);
  const handleRefresh = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success("Synced");
    }, 900);
  };

  const [erdValues, setErdValues] = useState<Record<number, string>>({});
  const erdInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const toggleRow = (id: number) => setCheckedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [releaseRows, setReleaseRows] = useState<HoldRow[] | null>(null);
  const [followUpRow, setFollowUpRow] = useState<HoldRow | null>(null);

  // Toolbar quick filters — same staged multi-select pattern as Order Listing.
  const { openKey, setOpenKey, registerRef } = useExclusiveOpen();
  const categoryFilter = useStagedMultiSelect(HOLD_CATEGORIES);
  const holdTypeFilter = useStagedMultiSelect(HOLD_TYPES);
  const toolbarFiltersDirty = categoryFilter.dirty || holdTypeFilter.dirty;
  const applyToolbarFilters = () => { categoryFilter.apply(); holdTypeFilter.apply(); setOpenKey(null); setPage(1); };
  const resetToolbarFilters = () => { categoryFilter.reset(); holdTypeFilter.reset(); };

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Per-column filters — same funnel-icon-in-header convention as Order Listing / EmailTable.
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const columnFilterOptions = (key: string): [string, number][] => {
    const counts: Record<string, number> = {};
    for (const r of HOLD_ROWS) {
      const v = String(r[key as ColumnKey]);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };
  const toggleColumnFilterValue = (key: string, value: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      const set = new Set(next[key] ?? []);
      if (set.has(value)) set.delete(value); else set.add(value);
      next[key] = set;
      return next;
    });
    setPage(1);
  };
  const clearColumnFilter = (key: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: new Set() }));
    setPage(1);
  };
  const activeFilterCount = Object.values(columnFilters).reduce((sum, set) => sum + set.size, 0);

  const [openPanel, setOpenPanel] = useState<"filter" | "columns" | null>(null);

  const [sortKey, setSortKey] = useState<ColumnKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const toggleSort = (key: ColumnKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const [colOrder, setColOrder] = useState<ColumnKey[]>(COLUMNS.map((c) => c.key));
  const visibleColumnList = colOrder.map((key) => COLUMNS.find((c) => c.key === key)).filter((c): c is { key: ColumnKey; label: string } => Boolean(c));

  const [rowDensity, setRowDensity] = useState<RowDensity>("large");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const changeRowsPerPage = (n: number) => { setRowsPerPage(n); setPage(1); };

  const sortedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = HOLD_ROWS.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.category.toLowerCase().includes(q) && !r.notes.toLowerCase().includes(q)) return false;
      if (categoryFilter.applied.length > 0 && !categoryFilter.applied.includes(r.category)) return false;
      if (holdTypeFilter.applied.length > 0 && !holdTypeFilter.applied.includes(r.name)) return false;
      for (const col of FILTER_COLUMNS) {
        const active = columnFilters[col.key];
        if (active && active.size > 0 && !active.has(String(r[col.key as ColumnKey]))) return false;
      }
      return true;
    });
    filtered = filtered.slice().sort((a, b) => {
      const cmp = String(a[sortKey]).localeCompare(String(b[sortKey]), undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [searchQuery, categoryFilter.applied, holdTypeFilter.applied, columnFilters, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const pageRows = sortedRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const rowPadY = rowDensity === "small" ? "py-1.5" : rowDensity === "medium" ? "py-2.5" : "py-3.5";

  const releasableCount = HOLD_ROWS.filter((r) => r.name !== "CIA Hold").length;
  const ownersInvolved = Array.from(new Set(HOLD_ROWS.map((r) => r.owner))).join(", ");

  const renderCell = (key: ColumnKey, row: HoldRow) => {
    switch (key) {
      case "category":
        return <span className="text-[#30578D] text-[12.5px] font-semibold hover:underline cursor-pointer">{row.category}</span>;
      case "erd": {
        const value = erdValues[row.id] ?? row.erd ?? "";
        return (
          <div className="relative">
            <button
              onClick={() => {
                const el = erdInputRefs.current[row.id];
                if (!el) return;
                if (typeof el.showPicker === "function") el.showPicker();
                else el.focus();
              }}
              className="flex items-center gap-1.5 h-[32px] w-[136px] bg-white border border-[#E2E6E9] rounded-[8px] px-2.5 text-left cursor-pointer hover:border-[#D9D9D6] transition-colors"
            >
              <Calendar size={12} className="shrink-0 text-[#97999B]" />
              <span className={`flex-1 min-w-0 truncate text-[12px] ${value ? "text-[#262626] font-medium" : "text-[#97999B]"}`}>
                {value || "Set ERD"}
              </span>
            </button>
            <input
              ref={(el) => { erdInputRefs.current[row.id] = el; }}
              type="date"
              value={value}
              onChange={(e) => {
                setErdValues((prev) => ({ ...prev, [row.id]: e.target.value }));
                if (e.target.value) toast.success(`ERD saved for "${row.name}"`);
              }}
              className="absolute inset-0 opacity-0 pointer-events-none"
              tabIndex={-1}
            />
          </div>
        );
      }
      case "notes":
        return <TruncateTooltip label={row.notes} className="text-[12.5px] text-[#4D4D4D] max-w-[180px]" />;
      default:
        return <span className="text-[12.5px] text-[#4D4D4D]">{row[key]}</span>;
    }
  };

  return (
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
          <AppHeader
            activeNav="Hold Management"
            onViewAllNotifications={onViewAllNotifications}
            onLogout={onLogout}
            onNavigateHome={onNavigateHome}
            onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
            onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
            onNavigateNewOverview={onNavigateNewOverview}
            onNavigateHoldManagementOverview={onNavigateOverview}
            onNavigateOrderListing={onNavigateOrderListing}
            onNavigateReleasedOrders={onNavigateReleasedOrders}
            onNavigateCommunication={onNavigateCommunication}
            onNavigateEmailTemplate={onNavigateEmailTemplate}
            onNavigateReview={onNavigateReview}
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
          />
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-[1600px] mx-auto px-5 py-5 flex flex-col gap-4">

            {/* Page header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-start gap-2.5">
                <button
                  onClick={onNavigateOrderListing}
                  title="Back to Order Listing"
                  className="text-[#6b7280] hover:text-[#111827] cursor-pointer transition-colors shrink-0 mt-0.5"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Order #{orderId}</h1>
                    <StatusBadge status={order.status} />
                    <HoldGroupBadge {...holdGroup} />
                  </div>
                  <p className="text-[12px] text-[#97999B] mt-0.5">
                    DataCorp APAC · High priority · Waiting for Cash in Advance
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <button
                    onClick={() => {
                      const el = followUpInputRef.current;
                      if (!el) return;
                      if (typeof el.showPicker === "function") el.showPicker();
                      else el.focus();
                    }}
                    className="flex items-center gap-2 h-[36px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                  >
                    <Calendar size={14} className="text-[#97999B]" />
                    <span>{followUpDate ? `Follow-up: ${followUpDate}` : "Follow-up date"}</span>
                  </button>
                  <input
                    ref={followUpInputRef}
                    type="date"
                    value={followUpDate}
                    onChange={(e) => { setFollowUpDate(e.target.value); if (e.target.value) toast.success("Follow-up date set"); }}
                    className="absolute inset-0 opacity-0 pointer-events-none"
                    tabIndex={-1}
                  />
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={syncing}
                  title="Refresh"
                  className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setRefExpanded((v) => !v)}
                  title={refExpanded ? "Collapse order details" : "Expand order details"}
                  className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                >
                  {refExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
            </div>

            {/* Reference strip */}
            {refExpanded && (
            <div className="bg-white rounded-[8px] border border-[#E2E6E9] flex items-stretch flex-wrap">
              {[
                { label: "ACCOUNT", value: "Test Solutions OOD", icon: Building2, accent: EMAIL_TABLE_NAVY },
                { label: "OU", value: "ROC Europe", icon: MapPin, accent: "#823E81" },
                { label: "ORDER LINES", value: "05", icon: Layers, accent: EMAIL_TABLE_NAVY },
                { label: "EARLIEST SSD", value: "Jan 16", delta: "+1d", icon: Calendar, accent: "#E67919" },
                { label: "AGING", value: "7 days", icon: Clock, accent: "#E67919" },
                { label: "ORDER VALUE (USD)", value: "$890K", icon: DollarSign, accent: "#468657" },
              ].map((item, i, arr) => (
                <div key={item.label} className={`flex-1 min-w-[160px] px-5 py-3.5 flex items-start gap-3 ${i < arr.length - 1 ? "border-r border-[#E2E6E9]" : ""}`}>
                  <div className="size-[32px] rounded-[8px] flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${item.accent}1A` }}>
                    <item.icon size={15} style={{ color: item.accent }} />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] font-semibold text-[#97999B] uppercase tracking-wide">{item.label}</span>
                    <span className="text-[15px] font-bold text-[#262626] whitespace-nowrap">
                      {item.value}
                      {item.delta && <span className="ml-1 text-[12px] font-semibold" style={{ color: item.accent }}>{item.delta}</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            )}

            {/* Hold Listings card */}
            <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
                <div className="shrink-0">
                  <h2 className="text-[14px] font-bold text-[#262626] whitespace-nowrap leading-none">Hold Listings</h2>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[11px] font-semibold">
                    <span className="inline-flex items-center gap-1" style={{ color: EMAIL_TABLE_NAVY }}>
                      <Layers size={11} />
                      {HOLD_ROWS.length} Holds
                    </span>
                    <span className="text-[#D9D9D6]">•</span>
                    <span className="inline-flex items-center gap-1 text-[#468657]">
                      <CheckCircle2 size={11} />
                      {releasableCount} Releasable
                    </span>
                    <span className="text-[#D9D9D6]">•</span>
                    <span className="inline-flex items-center gap-1 text-[#E67919]">
                      <Calendar size={11} />
                      ERD Not Set
                    </span>
                    <span className="text-[#D9D9D6]">•</span>
                    <span className="inline-flex items-center gap-1 text-[#387D85]">
                      <UserCog size={11} />
                      {ownersInvolved}
                    </span>
                  </div>
                </div>

                <TableToolbarSearch value={searchQuery} onCommit={(v) => { setSearchQuery(v); setPage(1); }} placeholder="Search holds..." />

                <div className="flex items-center gap-2.5 ml-auto flex-wrap">
                  {checkedRows.size > 0 && (
                    <>
                      <button
                        onClick={() => setReleaseRows(sortedRows.filter((r) => checkedRows.has(r.id)))}
                        className="flex items-center gap-1.5 h-[36px] pl-3 pr-2 rounded-[8px] text-white text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                      >
                        <CheckCircle2 size={13} />
                        Release Selected
                        <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/25 text-[10.5px] font-bold">
                          {checkedRows.size}
                        </span>
                      </button>
                      <button
                        onClick={() => setCheckedRows(new Set())}
                        title="Clear selection"
                        className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                      >
                        <X size={14} />
                      </button>
                      <div className="w-px h-5 bg-[#E2E6E9]" />
                    </>
                  )}
                  <TableToolbarMultiSelect
                    label="Hold Category"
                    options={HOLD_CATEGORIES}
                    pending={categoryFilter.pending}
                    onToggle={categoryFilter.toggle}
                    onToggleAll={categoryFilter.toggleAll}
                    onClear={categoryFilter.clear}
                    open={openKey === "category"}
                    onOpenChange={(o) => setOpenKey(o ? "category" : null)}
                    containerRef={registerRef("category")}
                    appliedCount={categoryFilter.applied.length}
                    dirty={categoryFilter.dirty}
                    width={220}
                  />
                  <TableToolbarMultiSelect
                    label="Hold Type"
                    options={HOLD_TYPES}
                    pending={holdTypeFilter.pending}
                    onToggle={holdTypeFilter.toggle}
                    onToggleAll={holdTypeFilter.toggleAll}
                    onClear={holdTypeFilter.clear}
                    open={openKey === "holdType"}
                    onOpenChange={(o) => setOpenKey(o ? "holdType" : null)}
                    containerRef={registerRef("holdType")}
                    appliedCount={holdTypeFilter.applied.length}
                    dirty={holdTypeFilter.dirty}
                    width={220}
                  />
                  <TableToolbarApplyReset dirty={toolbarFiltersDirty} onApply={applyToolbarFilters} onReset={resetToolbarFilters} />

                  <div className="w-px h-5 bg-[#E2E6E9]" />

                  <div className="flex items-center gap-2.5 shrink-0">
                    <TableFilterTrigger open={openPanel === "filter"} onOpenChange={(o) => setOpenPanel(o ? "filter" : null)} activeCount={activeFilterCount} />
                    <TableColumnMgmtTrigger open={openPanel === "columns"} onOpenChange={(o) => setOpenPanel(o ? "columns" : null)} />
                  </div>
                </div>
              </div>

              {/* Table body — Filter and Column Mgmt slide-in panels overlay this area only */}
              <div className="relative overflow-hidden" style={{ height: 360 }}>
                <div className="h-full min-h-0 overflow-auto">
                  <table className="w-full min-w-[1000px] border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-[#F7F7F7]">
                        <th className="sticky top-0 z-10 bg-[#F7F7F7] w-[42px] px-4 h-[42px] border-b border-[#DEDEDE]">
                          <button
                            onClick={() => {
                              const allIds = sortedRows.map((r) => r.id);
                              const allChecked = allIds.length > 0 && allIds.every((id) => checkedRows.has(id));
                              setCheckedRows(allChecked ? new Set() : new Set(allIds));
                            }}
                            className={`flex items-center justify-center size-[16px] rounded-[4px] border-[1.5px] shrink-0 transition-colors cursor-pointer ${
                              sortedRows.length > 0 && sortedRows.every((r) => checkedRows.has(r.id)) ? "border-transparent" : "border-[#B8BCC2] bg-white"
                            }`}
                            style={sortedRows.length > 0 && sortedRows.every((r) => checkedRows.has(r.id)) ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                          >
                            {sortedRows.length > 0 && sortedRows.every((r) => checkedRows.has(r.id)) && (
                              <Check size={11} className="text-white" strokeWidth={3.5} />
                            )}
                          </button>
                        </th>
                        {visibleColumnList.map((col) => {
                          const active = sortKey === col.key;
                          const SortIcon = sortDirection === "desc" ? ArrowDown : ArrowUp;
                          return (
                            <th key={col.key} className="group sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 cursor-pointer">
                                  <span className={`text-[12px] font-semibold ${active ? "text-[#262626]" : "text-[#4D4D4D]"}`}>{col.label}</span>
                                  {active ? (
                                    <SortIcon size={12} style={{ color: EMAIL_TABLE_NAVY }} />
                                  ) : (
                                    <ChevronsUpDown size={12} className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" style={{ color: "#97999B" }} />
                                  )}
                                </button>
                                {FILTER_COLUMNS.some((c) => c.key === col.key) && (
                                  <EmailTableColumnFilterButton
                                    colKey={col.key}
                                    getOptions={columnFilterOptions}
                                    selected={columnFilters[col.key] ?? EMPTY_SET}
                                    onToggle={(v) => toggleColumnFilterValue(col.key, v)}
                                    onClear={() => clearColumnFilter(col.key)}
                                  />
                                )}
                              </div>
                            </th>
                          );
                        })}
                        <th className="sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                          <span className="text-[12px] font-semibold text-[#4D4D4D]">Action</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.length === 0 ? (
                        <tr>
                          <td colSpan={visibleColumnList.length + 2} className="px-4 py-16 text-center text-[13px] text-[#97999B]">No holds match your filters</td>
                        </tr>
                      ) : (
                        pageRows.map((row) => {
                          const checked = checkedRows.has(row.id);
                          return (
                          <tr
                            key={row.id}
                            className={`transition-colors ${checked ? "bg-[#30578D]/[0.06] hover:bg-[#30578D]/[0.09]" : "hover:bg-[#F7F7F7]"}`}
                          >
                            <td className={`px-4 ${rowPadY} border-b border-[#DEDEDE]`}>
                              <button
                                onClick={() => toggleRow(row.id)}
                                className={`flex items-center justify-center size-[16px] rounded-[4px] border-[1.5px] shrink-0 transition-colors cursor-pointer ${checked ? "border-transparent" : "border-[#B8BCC2] bg-white"}`}
                                style={checked ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                              >
                                {checked && <Check size={11} className="text-white" strokeWidth={3.5} />}
                              </button>
                            </td>
                            {visibleColumnList.map((col) => (
                              <td key={col.key} className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                                {renderCell(col.key, row)}
                              </td>
                            ))}
                            <td className={`px-4 ${rowPadY} border-b border-[#DEDEDE]`}>
                              {row.name === "CIA Hold" ? (
                                <button
                                  onClick={() => setFollowUpRow(row)}
                                  className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] text-[12px] font-semibold hover:border-[#30578D] hover:bg-[#EAF1FB] hover:text-[#30578D] cursor-pointer transition-colors"
                                >
                                  <MessageSquareText size={13} />
                                  Follow-up / Escalate
                                </button>
                              ) : (
                                <button
                                  onClick={() => setReleaseRows([row])}
                                  className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] text-[12px] font-semibold hover:border-[#30578D] hover:bg-[#EAF1FB] hover:text-[#30578D] cursor-pointer transition-colors"
                                >
                                  <CheckCircle2 size={13} />
                                  Release
                                </button>
                              )}
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <TableFilterPanel
                  open={openPanel === "filter"}
                  onOpenChange={(o) => setOpenPanel(o ? "filter" : null)}
                  columns={FILTER_COLUMNS}
                  columnFilters={columnFilters}
                  getOptions={columnFilterOptions}
                  onApply={(next) => { setColumnFilters(next); setPage(1); }}
                />

                <TableColumnMgmtPanel
                  open={openPanel === "columns"}
                  onOpenChange={(o) => setOpenPanel(o ? "columns" : null)}
                  columns={COLUMNS}
                  value={colOrder}
                  onApply={(next) => setColOrder(next as ColumnKey[])}
                />
              </div>

              <TablePagination
                showing={pageRows.length}
                total={sortedRows.length}
                density={rowDensity}
                onDensityChange={setRowDensity}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={changeRowsPerPage}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>

            {/* Notes/Follow-up panel + Audit History panel — two separate cards, side by side */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 items-start">
              {/* Notes / Follow-up-Escalations card */}
              <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col">
                <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#E2E6E9]">
                  {(["notes", "followup"] as const).map((tab) => {
                    const active = activeTab === tab;
                    return (
                      <button key={tab} onClick={() => setActiveTab(tab)} className="flex flex-col items-center pt-1.5 px-4 cursor-pointer transition-colors">
                        <span className="text-[13px] font-semibold pb-2.5" style={{ color: active ? "#262626" : "#666666" }}>
                          {tab === "notes" ? "Notes" : "Follow-up/Escalations"}
                        </span>
                        <div className="h-[2px] w-full" style={{ backgroundColor: active ? EMAIL_TABLE_NAVY : "transparent" }} />
                      </button>
                    );
                  })}
                </div>

                {activeTab === "notes" && (
                  <div className="flex flex-col">
                    <div className="px-5 pt-4 pb-3 shrink-0">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
                        <input
                          value={noteSearchDraft}
                          onChange={(e) => setNoteSearchDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") setNoteSearch(noteSearchDraft); if (e.key === "Escape") clearNoteSearch(); }}
                          placeholder="Search Notes"
                          className="w-full h-[38px] pl-9 pr-9 rounded-[8px] border border-[#E2E6E9] text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
                        />
                        {noteSearchDraft && (
                          <button onClick={clearNoteSearch} title="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#97999B] hover:text-[#262626] cursor-pointer transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notes list — bounded height with its own scroll so the composer below stays put */}
                    <div className="max-h-[360px] overflow-y-auto px-5 flex flex-col gap-2.5">
                      {(() => {
                        const filtered = AUDIT_NOTES.filter((n) => n.text.toLowerCase().includes(noteSearch.trim().toLowerCase()));
                        if (filtered.length === 0) {
                          return <p className="text-[12.5px] text-[#97999B] text-center py-8">No notes match "{noteSearch}"</p>;
                        }
                        return filtered.map((note) => <NoteCard key={note.id} note={note} />);
                      })()}
                    </div>

                    {/* Add Notes */}
                    <div className="px-5 pt-4 pb-5 mt-3 border-t border-[#E2E6E9] flex flex-col gap-2.5">
                      <label className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide">Add a note</label>
                      <div className="border border-[#E2E6E9] rounded-[8px] overflow-hidden focus-within:border-[#30578D] transition-colors">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Type your note here"
                          className="w-full px-4 py-3 text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none resize-none border-0 bg-transparent min-h-[80px]"
                        />
                      </div>
                      <div className="flex justify-end gap-2.5">
                        <button
                          onClick={() => { if (noteText.trim()) { toast.success("Note saved locally"); setNoteText(""); } }}
                          disabled={!noteText.trim()}
                          className="h-[34px] px-4 rounded-[8px] border text-[12.5px] font-semibold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ borderColor: EMAIL_TABLE_NAVY, color: EMAIL_TABLE_NAVY }}
                        >
                          Save Note locally
                        </button>
                        <button
                          onClick={() => { if (noteText.trim()) { toast.success("Note saved to Oracle"); setNoteText(""); } }}
                          disabled={!noteText.trim()}
                          className="h-[34px] px-4 rounded-[8px] text-white text-[12.5px] font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                        >
                          Save Note to Oracle
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "followup" && (
                  <div className="px-5 py-8 text-center text-[#97999B] text-[13px]">No follow-ups or escalations logged for this order yet.</div>
                )}
              </div>

              {/* Audit History card */}
              <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-[#E2E6E9] flex flex-col gap-3">
                  <h2 className="text-[14px] font-bold text-[#262626]">Audit History</h2>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setAuditSortOpen((v) => !v)}
                        className="flex items-center gap-1.5 h-[34px] px-2.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] cursor-pointer hover:bg-[#F7F7F7] transition-colors"
                      >
                        <span className="text-[#666666]">Sort:</span>
                        <span className="font-semibold" style={{ color: EMAIL_TABLE_NAVY }}>{auditSort}</span>
                        <ChevronDown size={13} className={`text-[#97999B] transition-transform duration-200 ${auditSortOpen ? "rotate-180" : ""}`} />
                      </button>
                      {auditSortOpen && (
                        <div className="absolute left-0 top-full mt-1 w-[160px] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-20 py-1">
                          {["Release", "Newest", "Oldest"].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => { setAuditSort(opt); setAuditSortOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-[12.5px] cursor-pointer transition-colors ${
                                opt === auditSort ? "font-semibold text-[#30578D] bg-[#EAF1FB]" : "text-[#4D4D4D] hover:bg-[#F7F7F7]"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative flex-1 min-w-[140px]">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
                      <input
                        value={auditSearchDraft}
                        onChange={(e) => setAuditSearchDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") setAuditSearch(auditSearchDraft); if (e.key === "Escape") clearAuditSearch(); }}
                        placeholder="Search Audit History"
                        className="w-full h-[34px] pl-8 pr-8 rounded-[8px] border border-[#E2E6E9] text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
                      />
                      {auditSearchDraft && (
                        <button onClick={clearAuditSearch} title="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#97999B] hover:text-[#262626] cursor-pointer transition-colors">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 flex flex-col gap-2.5">
                  {(() => {
                    const q = auditSearch.trim().toLowerCase();
                    const filtered = AUDIT_HISTORY_ENTRIES.filter(
                      (e) => e.field.toLowerCase().includes(q) || e.user.toLowerCase().includes(q)
                    );
                    if (filtered.length === 0) {
                      return <p className="text-[12.5px] text-[#97999B] text-center py-8">No audit entries match "{auditSearch}"</p>;
                    }
                    return filtered.map((entry) => {
                      const expanded = expandedAudit.has(entry.id);
                      return (
                        <div key={entry.id} className="rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F7]">
                          <div className="px-3.5 py-3">
                            <div className="flex items-start gap-2.5">
                              <span className="size-[24px] rounded-full flex items-center justify-center shrink-0 bg-white border border-[#E2E6E9] mt-0.5">
                                <History size={11} className="text-[#666666]" strokeWidth={2.5} />
                              </span>
                              <p className="text-[12.5px] text-[#262626] leading-[1.5] min-w-0">
                                <span className="font-semibold cursor-pointer hover:underline" style={{ color: EMAIL_TABLE_NAVY }}>{entry.user}</span>
                                {" "}changed <span className="font-semibold">{entry.field}</span>
                                <span className="block mt-1 text-[11.5px]">
                                  <span className="text-[#97999B] line-through">{entry.from}</span>
                                  <span className="text-[#97999B] mx-1">→</span>
                                  <span className="font-semibold" style={{ color: EMAIL_TABLE_NAVY }}>{entry.to}</span>
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-2 pl-[34px]">
                              <span className="text-[10.5px] text-[#97999B]">{entry.timestamp}</span>
                              <button
                                onClick={() => toggleAuditDetails(entry.id)}
                                className="text-[11px] font-semibold cursor-pointer hover:underline"
                                style={{ color: EMAIL_TABLE_NAVY }}
                              >
                                {expanded ? "Hide Details" : "View Details"}
                              </button>
                            </div>
                          </div>
                          {expanded && (
                            <div className="px-3.5 pb-3 pt-3 border-t border-[#E2E6E9] ml-[34px]">
                              <p className="text-[11.5px] text-[#666666] leading-[1.6]">{entry.details}</p>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {releaseRows && (
        <ReleaseHoldModal
          rows={releaseRows}
          orderId={orderId}
          onClose={() => setReleaseRows(null)}
          onConfirm={() => {
            setCheckedRows((prev) => { const n = new Set(prev); releaseRows.forEach((r) => n.delete(r.id)); return n; });
            setReleaseRows(null);
          }}
        />
      )}

      {followUpRow && <FollowUpEscalateModal row={followUpRow} onClose={() => setFollowUpRow(null)} />}
    </div>
  );
}
