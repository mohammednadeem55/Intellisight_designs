import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  Clock,
  Copy,
  Database,
  DollarSign,
  Download,
  History,
  Layers,
  List,
  MapPin,
  Maximize2,
  MessageSquareText,
  Minimize2,
  NotebookPen,
  Plus,
  RefreshCw,
  Search,
  Star,
  TriangleAlert,
  UserCog,
  X,
} from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { EMAIL_TABLE_NAVY, EMPTY_SET, EmailTableColumnFilterButton, TruncateTooltip } from "../../components/common/EmailTable";
import { TableToolbarApplyReset, TableToolbarMultiSelect, TableToolbarSearch, useExclusiveOpen, useStagedMultiSelect } from "../../components/common/TableToolbar";
import { TableFilterPanel, TableFilterTrigger, type TableColumnDef } from "../../components/common/TableFilterPanel";
import { TableColumnMgmtPanel, TableColumnMgmtTrigger } from "../../components/common/TableColumnMgmtPanel";
import { TablePagination, type RowDensity } from "../../components/common/TablePagination";
import {
  ALL_ORDERS,
  AUDIT_HISTORY_ENTRIES,
  AUDIT_NOTES,
  CREDIT_HOLD_TYPES,
  FOLLOWUP_ESCALATION_LOG,
  HOLD_ROWS,
  LINE_LISTING_ROWS,
  type FollowUpEscalationEntry,
  type LineListingRow,
} from "./holdManagementData";
import { loadFavoriteOrderIds, saveFavoriteOrderIds } from "./favoritesStorage";
import { exportRowsToExcel } from "../../components/common/exportExcel";
import { DatePickerPopover } from "../../components/common/DatePickerPopover";

type FollowUpLogEntry = FollowUpEscalationEntry;

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

// Line Listing (Credit view only) — same shared-table system as Hold Listings above.
type LineColumnKey = "lineNum" | "lineId" | "item" | "description" | "level" | "holdStatus" | "status" | "response";
const LINE_COLUMNS: { key: LineColumnKey; label: string }[] = [
  { key: "lineNum", label: "Line #" },
  { key: "lineId", label: "Line ID" },
  { key: "item", label: "Item" },
  { key: "description", label: "Description" },
  { key: "level", label: "Level" },
  { key: "holdStatus", label: "Hold Status" },
  { key: "status", label: "Status" },
  { key: "response", label: "Response" },
];
const LINE_FILTER_COLUMNS: TableColumnDef[] = LINE_COLUMNS.filter((c) => c.key === "level" || c.key === "holdStatus" || c.key === "status");
const LINE_LEVELS = Array.from(new Set(LINE_LISTING_ROWS.map((r) => r.level)));
const LINE_STATUSES = Array.from(new Set(LINE_LISTING_ROWS.map((r) => r.status)));

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
  { code: "PO RECEIVED", label: "Signed purchase order received" },
  { code: "PO AMENDED", label: "Purchase order amended to match order" },
  { code: "DEPOSIT RECEIVED", label: "Customer deposit received" },
  { code: "PAYMENT CONFIRMED", label: "Full payment confirmed" },
  { code: "PARTIAL PAYMENT", label: "Partial payment accepted" },
  { code: "WIRE CONFIRMED", label: "Wire transfer confirmed by finance" },
  { code: "CARD AUTHORIZED", label: "Credit card payment authorized" },
  { code: "TAX EXEMPT VERIFIED", label: "Tax exemption certificate verified" },
  { code: "TAX ID RECEIVED", label: "Missing tax ID received" },
  { code: "VAT CONFIRMED", label: "VAT registration confirmed" },
  { code: "INVOICE ADDR CONFIRMED", label: "Invoice address confirmed with customer" },
  { code: "SHIP ADDR CONFIRMED", label: "Ship-to address confirmed with customer" },
  { code: "END USER CONFIRMED", label: "End user identity confirmed" },
  { code: "EXPORT LICENSE APPROVED", label: "Export license approved" },
  { code: "ECCN CLEARED", label: "Export classification (ECCN) cleared" },
  { code: "DENIED PARTY CLEARED", label: "Denied party screening cleared" },
  { code: "SANCTIONS CLEARED", label: "Sanctions/embargo screening cleared" },
  { code: "COMPLIANCE APPROVED", label: "Trade compliance approval received" },
  { code: "LEGAL APPROVED", label: "Legal review completed" },
  { code: "CONTRACT SIGNED", label: "Contract/agreement signed" },
  { code: "MSA CONFIRMED", label: "Master service agreement on file confirmed" },
  { code: "NDA SIGNED", label: "NDA executed" },
  { code: "PRICING APPROVED", label: "Non-standard pricing approved" },
  { code: "DISCOUNT APPROVED", label: "Discount exception approved" },
  { code: "MARGIN APPROVED", label: "Below-floor margin approved" },
  { code: "QUOTE MATCHED", label: "Order matches approved quote" },
  { code: "CONFIG VALIDATED", label: "Product configuration validated" },
  { code: "SERIAL ALLOCATED", label: "Serial numbers allocated" },
  { code: "INVENTORY CONFIRMED", label: "Inventory availability confirmed" },
  { code: "FORECAST CONFIRMED", label: "Demand forecast confirmed" },
  { code: "MOQ WAIVED", label: "Minimum order quantity waived" },
  { code: "LEAD TIME ACCEPTED", label: "Extended lead time accepted by customer" },
  { code: "SHIP DATE CONFIRMED", label: "Requested ship date confirmed" },
  { code: "CARRIER ASSIGNED", label: "Freight carrier assigned" },
  { code: "INCOTERMS CONFIRMED", label: "Incoterms confirmed with customer" },
  { code: "CUSTOMS DOCS READY", label: "Customs documentation prepared" },
  { code: "IMPORT LICENSE RECEIVED", label: "Customer import license received" },
  { code: "CERT OF ORIGIN READY", label: "Certificate of origin prepared" },
  { code: "INSURANCE CONFIRMED", label: "Shipping insurance confirmed" },
  { code: "QUALITY HOLD CLEARED", label: "Quality inspection hold cleared" },
  { code: "ENG APPROVAL RECEIVED", label: "Engineering change approval received" },
  { code: "CALIBRATION COMPLETE", label: "Calibration/test complete" },
  { code: "DUP ORDER RESOLVED", label: "Duplicate order flag resolved" },
  { code: "SYSTEM ERROR CLEARED", label: "System/EDI error corrected" },
  { code: "MANAGER OVERRIDE", label: "Manager override applied" },
];
type ReleaseFormState = Record<number, { reason: string; comment: string }>;

// Search-as-you-type reason picker — the input itself is the trigger, not a button that opens a separate
// panel with a search box inside it, matching the same pattern used for the Bill To/Ship To Account fields
// on the Quote Update step. Unlike that field, though, this one doesn't gate the dropdown behind typing at
// all — focusing it browses the full 50+-item list right away (scrollable), and typing 3+ letters narrows
// it down. A hold's release reason isn't something a CSR always arrives already knowing the code for, so
// browsing has to stay possible, not just searching.
function ReasonSearchField({ value, onSelect }: { value: string; onSelect: (code: string) => void }) {
  const selected = RELEASE_REASONS.find((r) => r.code === value);
  const displayText = (r: (typeof RELEASE_REASONS)[number]) => `${r.code} - ${r.label}`;
  const [query, setQuery] = useState(selected ? displayText(selected) : "");
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keeps the field in sync if the selection changes from outside (e.g. a revert action elsewhere).
  useEffect(() => {
    setQuery(selected ? displayText(selected) : "");
  }, [value]);

  // Closes on scroll/resize — this is a `position: fixed` portal positioned once when it opens, so it has
  // no way to track the field if the page (or an ancestor) scrolls underneath it. Scrolling *within* the
  // results panel itself also fires a scroll event, though — excluded via the containment check below,
  // otherwise scrolling the 50+-item list to see more reasons closed it immediately.
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.target instanceof Node && panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = q.length < 3 ? RELEASE_REASONS : RELEASE_REASONS.filter((r) => r.code.toLowerCase().includes(q) || r.label.toLowerCase().includes(q));

  const positionAndOpen = () => {
    const r = boxRef.current?.getBoundingClientRect();
    if (r) setRect({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 280) });
    setOpen(true);
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); positionAndOpen(); }}
        onFocus={() => { setQuery(""); positionAndOpen(); }}
        onBlur={() => { setQuery(selected ? displayText(selected) : ""); setOpen(false); }}
        placeholder="Type 3+ letters to search, or browse below"
        className={`w-full h-[34px] px-2.5 ${value ? "pr-8" : ""} rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors`}
      />
      {value && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { onSelect(""); setQuery(""); setOpen(false); }}
          title="Clear reason"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors"
        >
          <X size={13} />
        </button>
      )}
      {open && rect && createPortal(
        <div
          ref={panelRef}
          className="fixed bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-[9999] py-1 max-h-[240px] overflow-y-auto"
          style={{ top: rect.top, left: rect.left, width: rect.width }}
        >
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-[12px] text-[#97999B] text-center">No matching reasons</p>
          ) : (
            results.map((r) => (
              <button
                key={r.code}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onSelect(r.code); setQuery(displayText(r)); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
              >
                <span className={r.code === value ? "font-bold text-[#30578D]" : "font-semibold text-[#262626]"}>{r.code}</span>
                <span className="text-[#666666]"> - {r.label}</span>
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// One row per hold being released — works the same whether it's a single row (per-row Release button) or
// several at once (bulk "Release Selected"), since the table just renders whatever `rows` it's given.
function ReleaseHoldModal({ rows, orderId, onClose, onConfirm }: {
  rows: HoldRow[];
  orderId: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [form, setForm] = useState<ReleaseFormState>({});
  const setReason = (id: number, reason: string) => setForm((prev) => ({ ...prev, [id]: { reason, comment: prev[id]?.comment ?? "" } }));
  const setComment = (id: number, comment: string) => setForm((prev) => ({ ...prev, [id]: { reason: prev[id]?.reason ?? "", comment } }));

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
                  <th className="w-[320px] text-left px-4 py-2.5 text-[11px] font-semibold text-[#666666] uppercase tracking-wide border-b border-[#E2E6E9]">Reason</th>
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
                      <ReasonSearchField value={form[row.id]?.reason ?? ""} onSelect={(code) => setReason(row.id, code)} />
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
          <button onClick={confirm} className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer" style={{ backgroundColor: EMAIL_TABLE_NAVY }}>
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
function FollowUpEscalateModal({ row, onClose, onNavigateCommunication, onSent }: {
  row: HoldRow;
  onClose: () => void;
  onNavigateCommunication?: () => void;
  onSent: (entry: FollowUpLogEntry) => void;
}) {
  const [tab, setTab] = useState<"followup" | "escalation">("followup");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(`Re: ${row.name}`);
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<(typeof ESCALATION_PRIORITIES)[number]["label"] | null>(null);

  const send = () => {
    if (!to.trim()) { toast.warning("Enter a recipient"); return; }
    if (tab === "escalation" && !priority) { toast.warning("Select an escalation priority"); return; }
    onSent({
      id: Date.now(),
      type: tab,
      holdName: row.name,
      agent: "You",
      date: new Date().toLocaleDateString(),
      ago: "Just now",
      to,
      subject,
      message: message || subject,
      priority: tab === "escalation" ? (priority ?? undefined) : undefined,
    });
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

        <div className="flex items-center justify-between gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
          <button
            onClick={() => onNavigateCommunication?.()}
            className="text-[12.5px] font-semibold cursor-pointer hover:underline"
            style={{ color: EMAIL_TABLE_NAVY }}
          >
            View full thread in Communication →
          </button>
          <div className="flex items-center gap-2.5">
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
    </div>
  );
}

// Stand-ins for concepts this page doesn't otherwise model yet: who's logged in (no shared "current user"
// exists here) and the order's primary hold reason (HOLD_ROWS is a flat shared list, not filtered per
// order). Matches the page's existing pattern of a static descriptive subtitle under the order header.
const CURRENT_USER_NAME = "Jagdish Kumar";
const ORDER_HOLD_REASON = "Customer Tax Issue";

function formatDisplayDate(iso: string): string {
  if (!iso) return "Not set";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "Not set";
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `${day}-${month}-${d.getFullYear()}`;
}

// Own local ref/open state per row — simpler than the page tracking a `Record<rowId, ref>` registry, since
// each cell only ever needs to know about its own button and popover.
function ErdDateCell({ value, onChange, rowName }: { value: string; onChange: (v: string) => void; rowName: string }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-[32px] w-[136px] bg-white border border-[#E2E6E9] rounded-[8px] px-2.5 text-left cursor-pointer hover:border-[#D9D9D6] transition-colors"
      >
        <Calendar size={12} className="shrink-0 text-[#97999B]" />
        <span className={`flex-1 min-w-0 truncate text-[12px] ${value ? "text-[#262626] font-medium" : "text-[#97999B]"}`}>
          {value ? formatDisplayDate(value) : "Set ERD"}
        </span>
      </button>
      <DatePickerPopover
        open={open}
        anchorRef={btnRef}
        onOpenChange={setOpen}
        value={value}
        onChange={(v) => { onChange(v); if (v) toast.success(`ERD saved for "${rowName}"`); }}
      />
    </div>
  );
}

// Picking a Follow-up date no longer opens a separate modal — it drops the same context (HIS flag,
// current date, who's logged in, the new FUD, hold reason) straight into the Notes composer at the bottom
// of the page as pre-filled, still-editable text, so the CSR can add anything else before choosing
// Save Note locally / Save Note to Oracle.
function buildFollowUpNoteText(fud: string, isHighImpact: boolean, holdReason: string): string {
  const lines = [
    isHighImpact ? "HIS: Yes (High Impacting Shipment)" : null,
    `FUD: ${formatDisplayDate(fud)}`,
    `Hold Reason: ${holdReason}`,
    "Status: Awaiting customer response",
  ];
  return lines.filter(Boolean).join("\n");
}

// Oracle's own "Additional Notes" records for the order — distinct from the CSR-authored Notes/Follow-up
// tabs above; these are read-only, keyed by sequence number, and each carries the fixed Oracle field set
// (category/title/description/content) rather than free text.
const ORACLE_NOTE_SEQUENCES = [
  {
    sequence: 10,
    category: "Order Status URL",
    title: "",
    description: "OS URL on Ack Header US",
    content:
      "You can check the status of your order anytime by selecting the following link: http://www.keysight.com/find/orderstatus.\nPlease contact us if you notice any discrepancies in the details of this order acknowledgement.",
  },
  {
    sequence: 98,
    category: "Dashboard",
    title: "",
    description: "Dashboard link on Ack Header US",
    content:
      "Track your order in real time through the Keysight Order Dashboard: http://www.keysight.com/find/dashboard.\nContact your CSR if you need access enabled for your account.",
  },
];

// Sequence picker + the four Oracle fields + full note content, with copy support on the content since
// that's the piece a CSR is most likely to need to paste elsewhere (e.g. into a reply to the customer).
function AdditionalOracleNotesModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [selectedSeq, setSelectedSeq] = useState(ORACLE_NOTE_SEQUENCES[0].sequence);
  const [seqOpen, setSeqOpen] = useState(false);
  const [seqRect, setSeqRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const seqBtnRef = useRef<HTMLButtonElement>(null);
  const current = ORACLE_NOTE_SEQUENCES.find((s) => s.sequence === selectedSeq) ?? ORACLE_NOTE_SEQUENCES[0];

  const toggleSeqOpen = () => {
    if (!seqOpen) {
      const r = seqBtnRef.current?.getBoundingClientRect();
      if (r) setSeqRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setSeqOpen((v) => !v);
  };

  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[620px] max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#DEDEDE]">
          <div>
            <span className="text-[16px] font-bold text-[#262626]">Additional Notes — Order #{orderId}</span>
            <p className="text-[11px] text-[#97999B] mt-0.5">Oracle order notes · read-only</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-6 py-5 flex flex-col gap-4">
          <button
            ref={seqBtnRef}
            onClick={toggleSeqOpen}
            className="w-full flex items-center justify-between gap-2 h-[38px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-left cursor-pointer hover:bg-[#F7F7F7] transition-colors"
          >
            <span className="text-[13px] font-semibold text-[#262626]">Sequence {current.sequence} — {current.category}</span>
            <ChevronDown size={14} className={`text-[#97999B] transition-transform duration-200 ${seqOpen ? "rotate-180" : ""}`} />
          </button>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 rounded-[8px] bg-[#F7F7F7] border border-[#E2E6E9] px-4 py-3.5">
            <div>
              <p className={fieldLabelClass}>Sequence Number</p>
              <p className="text-[13px] font-semibold text-[#262626]">{current.sequence}</p>
            </div>
            <div>
              <p className={fieldLabelClass}>Category</p>
              <p className="text-[13px] font-semibold text-[#262626]">{current.category}</p>
            </div>
            <div>
              <p className={fieldLabelClass}>Title</p>
              <p className="text-[13px] font-semibold text-[#262626]">{current.title || "—"}</p>
            </div>
            <div>
              <p className={fieldLabelClass}>Description</p>
              <p className="text-[13px] font-semibold text-[#262626]">{current.description}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide">Short Text / Complete Note Content</p>
              <button
                onClick={() => copyText("Note content", current.content)}
                title="Copy text"
                className="flex items-center gap-1.5 text-[11.5px] font-semibold cursor-pointer hover:underline"
                style={{ color: EMAIL_TABLE_NAVY }}
              >
                <Copy size={12} />
                Copy
              </button>
            </div>
            <div className="rounded-[8px] bg-[#F7F7F7] border border-[#E2E6E9] px-4 py-3.5 max-h-[220px] overflow-y-auto">
              <p className="text-[13px] text-[#262626] leading-[1.7] whitespace-pre-line">{current.content}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-[#DEDEDE]">
          <button onClick={onClose} className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>

      {seqOpen && seqRect && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setSeqOpen(false)} />
          <div
            className="fixed bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-[9999] py-1 max-h-[240px] overflow-y-auto"
            style={{ top: seqRect.top, left: seqRect.left, width: seqRect.width }}
          >
            {ORACLE_NOTE_SEQUENCES.map((s) => (
              <button
                key={s.sequence}
                onClick={() => { setSelectedSeq(s.sequence); setSeqOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[13px] cursor-pointer transition-colors ${
                  s.sequence === selectedSeq ? "font-semibold bg-[#EAF1FB]" : "text-[#262626] hover:bg-[#F7F7F7]"
                }`}
                style={s.sequence === selectedSeq ? { color: EMAIL_TABLE_NAVY } : undefined}
              >
                Sequence {s.sequence} — {s.category}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
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

const ESCALATION_PRIORITY_COLOR: Record<string, string> = { Critical: "#C83737", High: "#E67919", Low: "#666666" };

// Log of who followed up or escalated a hold, when, and what was said — same card treatment as NoteCard so
// the two tabs read as one consistent activity feed, just filtered to a different kind of event.
function FollowUpLogCard({ entry }: { entry: FollowUpLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = entry.message.length > NOTE_COLLAPSE_LENGTH;
  const shownText = isLong && !expanded ? `${entry.message.slice(0, NOTE_COLLAPSE_LENGTH).trimEnd()}…` : entry.message;
  const isEscalation = entry.type === "escalation";

  return (
    <div className="rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F7] px-3.5 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-[24px] rounded-full flex items-center justify-center shrink-0 bg-white border border-[#E2E6E9]">
            {isEscalation ? <TriangleAlert size={11} className="text-[#C83737]" strokeWidth={2.5} /> : <MessageSquareText size={11} className="text-[#30578D]" strokeWidth={2.5} />}
          </span>
          <div className="min-w-0">
            <p className="text-[12px] leading-tight truncate">
              <span className="text-[#666666]">{isEscalation ? "Escalated by" : "Followed up by"}</span>{" "}
              <span className="font-semibold cursor-pointer hover:underline" style={{ color: EMAIL_TABLE_NAVY }}>{entry.agent}</span>
            </p>
            <p className="text-[10.5px] text-[#97999B] truncate mt-0.5">{entry.holdName} · To: {entry.to}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {entry.priority && (
            <span
              className="inline-flex items-center gap-1 px-1.5 h-[16px] rounded-[8px] text-[9.5px] font-bold uppercase"
              style={{ color: ESCALATION_PRIORITY_COLOR[entry.priority], backgroundColor: `${ESCALATION_PRIORITY_COLOR[entry.priority]}14` }}
            >
              {entry.priority}
            </span>
          )}
          <div className="text-right">
            <p className="text-[10.5px] text-[#666666] leading-tight">{entry.date}</p>
            <p className="text-[10px] text-[#97999B] leading-tight">{entry.ago}</p>
          </div>
        </div>
      </div>
      <p className="text-[12.5px] font-semibold text-[#262626] mt-2">{entry.subject}</p>
      <p className="text-[#4D4D4D] text-[12.5px] leading-[1.6] whitespace-pre-wrap mt-1">{shownText}</p>
      {isLong && (
        <button onClick={() => setExpanded((v) => !v)} className="text-[11px] font-semibold mt-1.5 cursor-pointer hover:underline" style={{ color: EMAIL_TABLE_NAVY }}>
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

// Credit-only: apply a hold to one or several selected lines at once. Same modal chrome as
// ReleaseHoldModal/FollowUpEscalateModal (white header, navy primary action) rather than the reference's
// dark header/red button.
function ApplyHoldModal({ rows, orderId, onClose, onConfirm }: {
  rows: LineListingRow[];
  orderId: string;
  onClose: () => void;
  onConfirm: (holdType: string) => void;
}) {
  const [holdType, setHoldType] = useState("");
  const [holdTypeOpen, setHoldTypeOpen] = useState(false);
  const [holdUntil, setHoldUntil] = useState("");
  const [holdUntilOpen, setHoldUntilOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [linesExpanded, setLinesExpanded] = useState(false);
  const holdUntilRef = useRef<HTMLButtonElement>(null);

  const LINES_COLLAPSED_COUNT = 3;
  const visibleLineRows = linesExpanded ? rows : rows.slice(0, LINES_COLLAPSED_COUNT);

  const confirm = () => {
    if (!holdType) { toast.warning("Select a hold type"); return; }
    if (!reason.trim()) { toast.warning("Enter a reason for applying this hold"); return; }
    onConfirm(holdType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[480px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
          <div>
            <span className="text-[16px] font-bold text-[#262626]">Apply Hold</span>
            <p className="text-[12px] text-[#97999B] mt-0.5">Order #{orderId} · {rows.length} record{rows.length > 1 ? "s" : ""} selected</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-6 py-5 flex flex-col gap-4">
          <div>
            <label className={fieldLabelClass}>Lines ({rows.length})</label>
            <div className="rounded-[8px] border border-[#E2E6E9] overflow-hidden">
              {visibleLineRows.map((row, i) => (
                <div key={row.id} className={`flex items-center gap-3 px-3 py-2 ${i > 0 ? "border-t border-[#E2E6E9]" : ""}`}>
                  <span
                    className="shrink-0 inline-flex items-center justify-center min-w-[46px] px-2 py-1 rounded-[6px] text-[11px] font-bold whitespace-nowrap"
                    style={{ color: EMAIL_TABLE_NAVY, backgroundColor: "#EAF1FB" }}
                  >
                    {row.lineNum}
                  </span>
                  <span className="text-[12.5px] text-[#262626] font-medium truncate">{row.item !== "—" ? row.item : row.holdStatus}</span>
                </div>
              ))}
              {rows.length > LINES_COLLAPSED_COUNT && (
                <button
                  onClick={() => setLinesExpanded((v) => !v)}
                  className="w-full flex items-center justify-center gap-1 py-2 text-[12px] font-semibold border-t border-[#E2E6E9] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                  style={{ color: EMAIL_TABLE_NAVY }}
                >
                  {linesExpanded ? "View less" : `View ${rows.length - LINES_COLLAPSED_COUNT} more`}
                  <ChevronDown size={13} className={`transition-transform duration-200 ${linesExpanded ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className={fieldLabelClass}>Hold Type *</label>
            <div className="relative">
              <button
                onClick={() => setHoldTypeOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 h-[38px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[13px] text-left cursor-pointer hover:bg-[#F7F7F7] transition-colors"
              >
                <span className={holdType ? "text-[#262626]" : "text-[#97999B]"}>{holdType || "— Select a hold type (required) —"}</span>
                <ChevronDown size={14} className={`text-[#97999B] shrink-0 transition-transform duration-200 ${holdTypeOpen ? "rotate-180" : ""}`} />
              </button>
              {holdTypeOpen && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-20 py-1">
                  {CREDIT_HOLD_TYPES.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setHoldType(opt); setHoldTypeOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[12.5px] cursor-pointer transition-colors ${
                        opt === holdType ? "font-semibold text-[#30578D] bg-[#EAF1FB]" : "text-[#4D4D4D] hover:bg-[#F7F7F7]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={fieldLabelClass}>Hold Until Date</label>
            <button
              ref={holdUntilRef}
              onClick={() => setHoldUntilOpen((v) => !v)}
              className="relative w-full flex items-center gap-2 h-[38px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-left cursor-pointer hover:bg-[#F7F7F7] transition-colors"
            >
              <Calendar size={13} className="text-[#97999B] shrink-0" />
              <span className={`text-[13px] ${holdUntil ? "text-[#262626]" : "text-[#97999B]"}`}>{holdUntil ? formatDisplayDate(holdUntil) : "Select date (optional)"}</span>
            </button>
            <DatePickerPopover open={holdUntilOpen} anchorRef={holdUntilRef} onOpenChange={setHoldUntilOpen} value={holdUntil} onChange={setHoldUntil} />
          </div>

          <div>
            <label className={fieldLabelClass}>Hold Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for applying this hold (required)…"
              className="w-full min-h-[100px] px-3 py-2.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
          <button onClick={onClose} className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={confirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: EMAIL_TABLE_NAVY }}
          >
            <Plus size={14} />
            Confirm Apply Hold
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrderDetailsPage({ orderId, view, entrySource, onLogout, onViewAllNotifications, onNavigateHome, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateNewOverview, onNavigateOverview, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateCommunication, onNavigateEmailTemplate, onNavigateFeedbackCenter, onNavigateEmailWorkflow }: {
  orderId: string;
  /** "credit" when this order was reached via the Overview page's Credit view — shows the credit-only Line
      Listing table (with per-line Apply Hold) alongside the usual Hold Listings. */
  view?: string;
  /** Which page this order was actually reached from — drives the breadcrumb's middle segment (or omits it
      entirely for a direct jump, e.g. the Overview page's "Go to Order #" search). */
  entrySource?: "listing" | "released";
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateOverview: () => void;
  onNavigateOrderListing: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateCommunication?: (source?: { orderId?: string }) => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  const order = ALL_ORDERS.find((o) => o.id === orderId) ?? ALL_ORDERS[0];
  const holdGroup = HOLD_GROUP_BY_TYPE[order.holdType] ?? DEFAULT_HOLD_GROUP;

  // Starred state, re-read per orderId so navigating between orders (via search, breadcrumb, etc.) shows
  // the right star without a stale value carried over from whichever order was open before.
  const [isFavorite, setIsFavorite] = useState(() => loadFavoriteOrderIds().includes(orderId));
  useEffect(() => setIsFavorite(loadFavoriteOrderIds().includes(orderId)), [orderId]);
  const toggleFavorite = () => {
    const ids = loadFavoriteOrderIds();
    const next = ids.includes(orderId) ? ids.filter((id) => id !== orderId) : [...ids, orderId];
    saveFavoriteOrderIds(next);
    setIsFavorite(next.includes(orderId));
  };

  const [activeTab, setActiveTab] = useState<"notes" | "followup">("notes");
  const [notes, setNotes] = useState(AUDIT_NOTES);
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

  const [followUpDate, setFollowUpDate] = useState("2026-08-21");
  const followUpInputRef = useRef<HTMLButtonElement>(null);
  const [followUpDateOpen, setFollowUpDateOpen] = useState(false);
  // Picking a follow-up date jumps the page down to the Notes composer (pre-filled, still editable) and
  // briefly highlights it so it's obvious why the view just moved — cleared as soon as the CSR interacts
  // with it, with a timeout fallback in case they don't.
  const addNoteSectionRef = useRef<HTMLDivElement>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [noteHighlighted, setNoteHighlighted] = useState(false);
  useEffect(() => {
    if (!noteHighlighted) return;
    const t = setTimeout(() => setNoteHighlighted(false), 3000);
    return () => clearTimeout(t);
  }, [noteHighlighted]);
  const [oracleNotesOpen, setOracleNotesOpen] = useState(false);
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

  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const toggleRow = (id: number) => setCheckedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [releaseRows, setReleaseRows] = useState<HoldRow[] | null>(null);
  // Credit-view orders show Hold Listing and Line Listing as tabs of one card instead of two stacked cards.
  const [listingTab, setListingTab] = useState<"hold" | "line">("hold");
  const [followUpRow, setFollowUpRow] = useState<HoldRow | null>(null);
  const [followUpLog, setFollowUpLog] = useState<FollowUpLogEntry[]>(FOLLOWUP_ESCALATION_LOG);

  // Line Listing — Credit view only.
  const [checkedLineRows, setCheckedLineRows] = useState<Set<number>>(new Set());
  const toggleLineRow = (id: number) => setCheckedLineRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [applyHoldRows, setApplyHoldRows] = useState<LineListingRow[] | null>(null);

  // Line Listing toolbar/table state — independent instances of the same shared-table hooks Hold Listings
  // uses above, so both tables can have their own open filter/column panel at the same time.
  const { openKey: lineOpenKey, setOpenKey: setLineOpenKey, registerRef: registerLineRef } = useExclusiveOpen();
  const lineLevelFilter = useStagedMultiSelect(LINE_LEVELS);
  const lineStatusFilter = useStagedMultiSelect(LINE_STATUSES);
  const lineToolbarFiltersDirty = lineLevelFilter.dirty || lineStatusFilter.dirty;
  const applyLineToolbarFilters = () => { lineLevelFilter.apply(); lineStatusFilter.apply(); setLineOpenKey(null); setLinePage(1); };
  const resetLineToolbarFilters = () => { lineLevelFilter.reset(); lineStatusFilter.reset(); };

  const [lineSearchQuery, setLineSearchQuery] = useState("");
  const [linePage, setLinePage] = useState(1);

  const [lineColumnFilters, setLineColumnFilters] = useState<Record<string, Set<string>>>({});
  const lineColumnFilterOptions = (key: string): [string, number][] => {
    const counts: Record<string, number> = {};
    for (const r of LINE_LISTING_ROWS) {
      const v = String(r[key as LineColumnKey]);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };
  const toggleLineColumnFilterValue = (key: string, value: string) => {
    setLineColumnFilters((prev) => {
      const next = { ...prev };
      const set = new Set(next[key] ?? []);
      if (set.has(value)) set.delete(value); else set.add(value);
      next[key] = set;
      return next;
    });
    setLinePage(1);
  };
  const clearLineColumnFilter = (key: string) => {
    setLineColumnFilters((prev) => ({ ...prev, [key]: new Set() }));
    setLinePage(1);
  };
  const lineActiveFilterCount = Object.values(lineColumnFilters).reduce((sum, set) => sum + set.size, 0);

  const [lineOpenPanel, setLineOpenPanel] = useState<"filter" | "columns" | null>(null);

  const [lineSortKey, setLineSortKey] = useState<LineColumnKey>("lineNum");
  const [lineSortDirection, setLineSortDirection] = useState<"asc" | "desc">("asc");
  const toggleLineSort = (key: LineColumnKey) => {
    if (lineSortKey === key) {
      setLineSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setLineSortKey(key);
      setLineSortDirection("asc");
    }
  };

  const [lineColOrder, setLineColOrder] = useState<LineColumnKey[]>(LINE_COLUMNS.map((c) => c.key));
  const lineVisibleColumnList = lineColOrder.map((key) => LINE_COLUMNS.find((c) => c.key === key)).filter((c): c is { key: LineColumnKey; label: string } => Boolean(c));

  const [lineRowDensity, setLineRowDensity] = useState<RowDensity>("large");
  const [lineRowsPerPage, setLineRowsPerPage] = useState(10);
  const changeLineRowsPerPage = (n: number) => { setLineRowsPerPage(n); setLinePage(1); };

  const lineSortedRows = useMemo(() => {
    const q = lineSearchQuery.trim().toLowerCase();
    let filtered = LINE_LISTING_ROWS.filter((r) => {
      if (q && !r.lineId.toLowerCase().includes(q) && !r.item.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q) && !r.holdStatus.toLowerCase().includes(q)) return false;
      if (lineLevelFilter.applied.length > 0 && !lineLevelFilter.applied.includes(r.level)) return false;
      if (lineStatusFilter.applied.length > 0 && !lineStatusFilter.applied.includes(r.status)) return false;
      for (const col of LINE_FILTER_COLUMNS) {
        const active = lineColumnFilters[col.key];
        if (active && active.size > 0 && !active.has(String(r[col.key as LineColumnKey]))) return false;
      }
      return true;
    });
    filtered = filtered.slice().sort((a, b) => {
      const cmp = String(a[lineSortKey]).localeCompare(String(b[lineSortKey]), undefined, { numeric: true, sensitivity: "base" });
      return lineSortDirection === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [lineSearchQuery, lineLevelFilter.applied, lineStatusFilter.applied, lineColumnFilters, lineSortKey, lineSortDirection]);

  const lineTotalPages = Math.max(1, Math.ceil(lineSortedRows.length / lineRowsPerPage));
  const linePageRows = lineSortedRows.slice((linePage - 1) * lineRowsPerPage, linePage * lineRowsPerPage);
  const lineRowPadY = lineRowDensity === "small" ? "py-1.5" : lineRowDensity === "medium" ? "py-2.5" : "py-3.5";

  const renderLineCell = (key: LineColumnKey, row: LineListingRow) => {
    switch (key) {
      case "description":
        return (
          <TruncateTooltip
            label={row.description}
            className={`text-[12.5px] max-w-[220px] ${row.description === "—" ? "text-[#4D4D4D]" : "text-[#262626] font-semibold"}`}
          />
        );
      case "level":
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
            style={row.level === "Header" ? { color: "#7C3AED", backgroundColor: "#EDE9FE" } : { color: EMAIL_TABLE_NAVY, backgroundColor: "#EAF1FB" }}
          >
            {row.level}
          </span>
        );
      case "holdStatus":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ color: "#C83737", backgroundColor: "#FAEBEB" }}>
            <Ban size={10} />
            {row.holdStatus}
          </span>
        );
      case "status":
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
            style={row.status === "Booked" ? { color: "#468657", backgroundColor: "#EFF6F1" } : { color: "#E67919", backgroundColor: "#FDF3E7" }}
          >
            {row.status}
          </span>
        );
      case "response":
        if (!row.response) return <span className="text-[12px] text-[#D9D9D6]">—</span>;
        if (row.responseFailed) return <TruncateTooltip label={row.response} className="text-[11.5px] text-[#C83737] max-w-[140px]" />;
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ color: "#468657", backgroundColor: "#EFF6F1" }}>
            {row.response}
          </span>
        );
      default:
        return <span className="text-[12.5px] text-[#4D4D4D] whitespace-nowrap">{row[key]}</span>;
    }
  };

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

  // Exports every hold currently matching search/filters (not just the current page), using whichever
  // columns — and order — are presently visible, same convention as Order Listing's export.
  const exportHoldListings = () => {
    const headers = visibleColumnList.map((c) => c.label);
    const rows = sortedRows.map((row) =>
      visibleColumnList.map((col) => (col.key === "erd" ? erdValues[row.id] ?? row.erd ?? "" : row[col.key]))
    );
    exportRowsToExcel(`order-${orderId}-hold-listing`, headers, rows, "Hold Listing");
    toast.success(`Exported ${sortedRows.length} hold${sortedRows.length === 1 ? "" : "s"}`);
  };

  const releasableCount = HOLD_ROWS.filter((r) => r.name !== "CIA Hold").length;
  const ownersInvolved = Array.from(new Set(HOLD_ROWS.map((r) => r.owner))).join(", ");

  const lineAppliedCount = LINE_LISTING_ROWS.filter((r) => r.response && !r.responseFailed).length;
  const linePendingCount = LINE_LISTING_ROWS.filter((r) => !r.response).length;
  const lineFailedCount = LINE_LISTING_ROWS.filter((r) => r.responseFailed).length;

  const renderCell = (key: ColumnKey, row: HoldRow) => {
    switch (key) {
      case "category":
        return <span className="text-[#30578D] text-[12.5px] font-semibold hover:underline cursor-pointer">{row.category}</span>;
      case "erd": {
        const value = erdValues[row.id] ?? row.erd ?? "";
        return <ErdDateCell value={value} onChange={(v) => setErdValues((prev) => ({ ...prev, [row.id]: v }))} rowName={row.name} />;
      }
      case "notes":
        return <TruncateTooltip label={row.notes} className="text-[12.5px] text-[#4D4D4D] max-w-[180px]" />;
      default:
        return <span className="text-[12.5px] text-[#4D4D4D]">{row[key]}</span>;
    }
  };

  // Hold Listings' header/table/pagination — rendered as its own standalone card on CSR-view orders, or as
  // one of two tabs (alongside Line Listing) inside a single card on credit-view orders. The "Hold Listings"
  // title only shows standalone, since the tab strip itself names the section when tabbed.
  const holdListingsContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
        <div className="shrink-0">
          {view !== "credit" && <h2 className="text-[14px] font-bold text-[#262626] whitespace-nowrap leading-none mb-1.5">Hold Listings</h2>}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-semibold">
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
            <button
              onClick={exportHoldListings}
              title="Export to Excel"
              className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
            >
              <Download size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Table body — Filter and Column Mgmt slide-in panels overlay this area only */}
      <div className="relative overflow-hidden">
        <div className="overflow-auto" style={{ minHeight: 240, maxHeight: 360 }}>
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
                <th className="sticky top-0 right-0 z-30 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE] shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)]">
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
                    className={`group transition-colors ${checked ? "bg-[#30578D]/[0.06] hover:bg-[#30578D]/[0.09]" : "hover:bg-[#F7F7F7]"}`}
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
                    <td
                      className={`sticky right-0 z-10 px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE] shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)] transition-colors ${
                        checked ? "bg-[#EAF1FB] group-hover:bg-[#DCE9FA]" : "bg-white group-hover:bg-[#F7F7F7]"
                      }`}
                    >
                      {row.name === "CIA Hold" ? (
                        <button
                          onClick={() => setFollowUpRow(row)}
                          disabled={checkedRows.size > 1}
                          title={checkedRows.size > 1 ? "Clear the current selection to act on this row individually" : undefined}
                          className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] text-[12px] font-semibold hover:border-[#30578D] hover:bg-[#EAF1FB] hover:text-[#30578D] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#E2E6E9] disabled:hover:bg-white disabled:hover:text-[#4D4D4D]"
                        >
                          <MessageSquareText size={13} />
                          Follow-up / Escalate
                        </button>
                      ) : (
                        <button
                          onClick={() => setReleaseRows([row])}
                          disabled={checkedRows.size > 1}
                          title={checkedRows.size > 1 ? "Clear the current selection to act on this row individually" : undefined}
                          className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] text-[12px] font-semibold hover:border-[#30578D] hover:bg-[#EAF1FB] hover:text-[#30578D] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#E2E6E9] disabled:hover:bg-white disabled:hover:text-[#4D4D4D]"
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
    </>
  );

  // Line Listing's header/table/pagination — only ever shown as the second tab alongside Hold Listings
  // (credit-view orders only), so it has no standalone title of its own; the tab strip names it.
  const lineListingContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
        <div className="shrink-0 flex items-center gap-1.5 flex-wrap text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1" style={{ color: EMAIL_TABLE_NAVY }}>
            <List size={11} />
            {LINE_LISTING_ROWS.length} Lines
          </span>
          <span className="text-[#D9D9D6]">•</span>
          <span className="inline-flex items-center gap-1 text-[#468657]">
            <CheckCircle2 size={11} />
            {lineAppliedCount} Applied
          </span>
          <span className="text-[#D9D9D6]">•</span>
          <span className="inline-flex items-center gap-1 text-[#E67919]">
            <Clock size={11} />
            {linePendingCount} Pending
          </span>
          <span className="text-[#D9D9D6]">•</span>
          <span className="inline-flex items-center gap-1 text-[#C83737]">
            <TriangleAlert size={11} />
            {lineFailedCount} Failed
          </span>
        </div>

        <TableToolbarSearch value={lineSearchQuery} onCommit={(v) => { setLineSearchQuery(v); setLinePage(1); }} placeholder="Search lines..." />

        <div className="flex items-center gap-2.5 ml-auto flex-wrap">
          {checkedLineRows.size > 0 && (
            <>
              <button
                onClick={() => setApplyHoldRows(lineSortedRows.filter((r) => checkedLineRows.has(r.id)))}
                className="flex items-center gap-1.5 h-[36px] pl-3 pr-2 rounded-[8px] text-white text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: EMAIL_TABLE_NAVY }}
              >
                <Plus size={13} />
                Apply Hold
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/25 text-[10.5px] font-bold">
                  {checkedLineRows.size}
                </span>
              </button>
              <button
                onClick={() => setCheckedLineRows(new Set())}
                title="Clear selection"
                className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
              >
                <X size={14} />
              </button>
              <div className="w-px h-5 bg-[#E2E6E9]" />
            </>
          )}
          <TableToolbarMultiSelect
            label="Level"
            options={LINE_LEVELS}
            pending={lineLevelFilter.pending}
            onToggle={lineLevelFilter.toggle}
            onToggleAll={lineLevelFilter.toggleAll}
            onClear={lineLevelFilter.clear}
            open={lineOpenKey === "level"}
            onOpenChange={(o) => setLineOpenKey(o ? "level" : null)}
            containerRef={registerLineRef("level")}
            appliedCount={lineLevelFilter.applied.length}
            dirty={lineLevelFilter.dirty}
            width={180}
          />
          <TableToolbarMultiSelect
            label="Status"
            options={LINE_STATUSES}
            pending={lineStatusFilter.pending}
            onToggle={lineStatusFilter.toggle}
            onToggleAll={lineStatusFilter.toggleAll}
            onClear={lineStatusFilter.clear}
            open={lineOpenKey === "status"}
            onOpenChange={(o) => setLineOpenKey(o ? "status" : null)}
            containerRef={registerLineRef("status")}
            appliedCount={lineStatusFilter.applied.length}
            dirty={lineStatusFilter.dirty}
            width={180}
          />
          <TableToolbarApplyReset dirty={lineToolbarFiltersDirty} onApply={applyLineToolbarFilters} onReset={resetLineToolbarFilters} />

          <div className="w-px h-5 bg-[#E2E6E9]" />

          <div className="flex items-center gap-2.5 shrink-0">
            <TableFilterTrigger open={lineOpenPanel === "filter"} onOpenChange={(o) => setLineOpenPanel(o ? "filter" : null)} activeCount={lineActiveFilterCount} />
            <TableColumnMgmtTrigger open={lineOpenPanel === "columns"} onOpenChange={(o) => setLineOpenPanel(o ? "columns" : null)} />
          </div>
        </div>
      </div>

      {/* Table body — Filter and Column Mgmt slide-in panels overlay this area only */}
      <div className="relative overflow-hidden">
        <div className="overflow-auto" style={{ minHeight: 240, maxHeight: 360 }}>
          <table className="w-full min-w-[1080px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#F7F7F7]">
                <th className="sticky top-0 z-10 bg-[#F7F7F7] w-[42px] px-4 h-[42px] border-b border-[#DEDEDE]">
                  <button
                    onClick={() => {
                      const allIds = lineSortedRows.map((r) => r.id);
                      const allChecked = allIds.length > 0 && allIds.every((id) => checkedLineRows.has(id));
                      setCheckedLineRows(allChecked ? new Set() : new Set(allIds));
                    }}
                    className={`flex items-center justify-center size-[16px] rounded-[4px] border-[1.5px] shrink-0 transition-colors cursor-pointer ${
                      lineSortedRows.length > 0 && lineSortedRows.every((r) => checkedLineRows.has(r.id)) ? "border-transparent" : "border-[#B8BCC2] bg-white"
                    }`}
                    style={lineSortedRows.length > 0 && lineSortedRows.every((r) => checkedLineRows.has(r.id)) ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                  >
                    {lineSortedRows.length > 0 && lineSortedRows.every((r) => checkedLineRows.has(r.id)) && (
                      <Check size={11} className="text-white" strokeWidth={3.5} />
                    )}
                  </button>
                </th>
                {lineVisibleColumnList.map((col) => {
                  const active = lineSortKey === col.key;
                  const SortIcon = lineSortDirection === "desc" ? ArrowDown : ArrowUp;
                  return (
                    <th key={col.key} className="group sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => toggleLineSort(col.key)} className="flex items-center gap-1 cursor-pointer">
                          <span className={`text-[12px] font-semibold ${active ? "text-[#262626]" : "text-[#4D4D4D]"}`}>{col.label}</span>
                          {active ? (
                            <SortIcon size={12} style={{ color: EMAIL_TABLE_NAVY }} />
                          ) : (
                            <ChevronsUpDown size={12} className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" style={{ color: "#97999B" }} />
                          )}
                        </button>
                        {LINE_FILTER_COLUMNS.some((c) => c.key === col.key) && (
                          <EmailTableColumnFilterButton
                            colKey={col.key}
                            getOptions={lineColumnFilterOptions}
                            selected={lineColumnFilters[col.key] ?? EMPTY_SET}
                            onToggle={(v) => toggleLineColumnFilterValue(col.key, v)}
                            onClear={() => clearLineColumnFilter(col.key)}
                          />
                        )}
                      </div>
                    </th>
                  );
                })}
                <th className="sticky top-0 right-0 z-30 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE] shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)]">
                  <span className="text-[12px] font-semibold text-[#4D4D4D]">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {linePageRows.length === 0 ? (
                <tr>
                  <td colSpan={lineVisibleColumnList.length + 2} className="px-4 py-16 text-center text-[13px] text-[#97999B]">No lines match your filters</td>
                </tr>
              ) : (
                linePageRows.map((row) => {
                  const checked = checkedLineRows.has(row.id);
                  return (
                    <tr key={row.id} className={`group transition-colors ${checked ? "bg-[#30578D]/[0.06] hover:bg-[#30578D]/[0.09]" : "hover:bg-[#F7F7F7]"}`}>
                      <td className={`px-4 ${lineRowPadY} border-b border-[#DEDEDE]`}>
                        <button
                          onClick={() => toggleLineRow(row.id)}
                          className={`flex items-center justify-center size-[16px] rounded-[4px] border-[1.5px] shrink-0 transition-colors cursor-pointer ${checked ? "border-transparent" : "border-[#B8BCC2] bg-white"}`}
                          style={checked ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                        >
                          {checked && <Check size={11} className="text-white" strokeWidth={3.5} />}
                        </button>
                      </td>
                      {lineVisibleColumnList.map((col) => (
                        <td key={col.key} className={`px-4 ${lineRowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          {renderLineCell(col.key, row)}
                        </td>
                      ))}
                      <td
                        className={`sticky right-0 z-10 px-4 ${lineRowPadY} whitespace-nowrap border-b border-[#DEDEDE] shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)] transition-colors ${
                          checked ? "bg-[#EAF1FB] group-hover:bg-[#DCE9FA]" : "bg-white group-hover:bg-[#F7F7F7]"
                        }`}
                      >
                        <button
                          onClick={() => setApplyHoldRows([row])}
                          disabled={checkedLineRows.size > 1}
                          title={checkedLineRows.size > 1 ? "Clear the current selection to act on this row individually" : undefined}
                          className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] text-[12px] font-semibold hover:border-[#30578D] hover:bg-[#EAF1FB] hover:text-[#30578D] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#E2E6E9] disabled:hover:bg-white disabled:hover:text-[#4D4D4D]"
                        >
                          <Plus size={13} />
                          Apply Hold
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TableFilterPanel
          open={lineOpenPanel === "filter"}
          onOpenChange={(o) => setLineOpenPanel(o ? "filter" : null)}
          columns={LINE_FILTER_COLUMNS}
          columnFilters={lineColumnFilters}
          getOptions={lineColumnFilterOptions}
          onApply={(next) => { setLineColumnFilters(next); setLinePage(1); }}
        />

        <TableColumnMgmtPanel
          open={lineOpenPanel === "columns"}
          onOpenChange={(o) => setLineOpenPanel(o ? "columns" : null)}
          columns={LINE_COLUMNS}
          value={lineColOrder}
          onApply={(next) => setLineColOrder(next as LineColumnKey[])}
        />
      </div>

      <TablePagination
        showing={linePageRows.length}
        total={lineSortedRows.length}
        density={lineRowDensity}
        onDensityChange={setLineRowDensity}
        rowsPerPage={lineRowsPerPage}
        onRowsPerPageChange={changeLineRowsPerPage}
        page={linePage}
        totalPages={lineTotalPages}
        onPageChange={setLinePage}
      />
    </>
  );

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
            onNavigateFeedbackCenter={onNavigateFeedbackCenter}
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
          />
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 flex flex-col gap-4">

            {/* Page header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-start gap-2.5">
                <div>
                  <Breadcrumbs
                    items={[
                      { label: "Hold Mgmt", onClick: onNavigateOverview },
                      ...(entrySource === "listing"
                        ? [{ label: "Order Listing", onClick: onNavigateOrderListing }]
                        : entrySource === "released"
                          ? [{ label: "Released Orders", onClick: onNavigateReleasedOrders }]
                          : []),
                      { label: `Order #${orderId}` },
                    ]}
                  />
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
                <button
                  onClick={toggleFavorite}
                  title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                >
                  <Star size={15} className={isFavorite ? "text-[#E67919]" : "text-[#97999B]"} fill={isFavorite ? "#E67919" : "none"} />
                </button>
                <div className="relative">
                  <button
                    ref={followUpInputRef}
                    onClick={() => setFollowUpDateOpen((v) => !v)}
                    className="flex items-center gap-2 h-[36px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                  >
                    <Calendar size={14} className="text-[#97999B]" />
                    <span>{followUpDate ? `Follow-up: ${formatDisplayDate(followUpDate)}` : "Follow-up date"}</span>
                  </button>
                  <DatePickerPopover
                    open={followUpDateOpen}
                    anchorRef={followUpInputRef}
                    onOpenChange={setFollowUpDateOpen}
                    value={followUpDate}
                    onChange={(next) => {
                      setFollowUpDate(next);
                      if (!next) return;
                      setActiveTab("notes");
                      setNoteText(buildFollowUpNoteText(next, true, ORDER_HOLD_REASON));
                      setNoteHighlighted(true);
                      setTimeout(() => {
                        addNoteSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        noteTextareaRef.current?.focus();
                      }, 0);
                    }}
                  />
                </div>
                <button
                  onClick={() => onNavigateCommunication?.({ orderId })}
                  title="Open Communication"
                  className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                >
                  <MessageSquareText size={14} />
                </button>
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

            {/* Hold Listings / Line Listing card — tabbed together on credit-view orders (Line Listing only
                exists there); Hold Listings renders as its own standalone card otherwise. */}
            {view === "credit" ? (
              <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col">
                <div className="px-5 py-3 shrink-0 border-b border-[#E2E6E9]">
                  <div className="inline-flex items-center gap-1 p-1 rounded-[8px] bg-[#F1F2F4]">
                    {(["hold", "line"] as const).map((tab) => {
                      const active = listingTab === tab;
                      const Icon = tab === "hold" ? Layers : List;
                      const label = tab === "hold" ? "Hold Listing" : "Line Listing";
                      const count = tab === "hold" ? HOLD_ROWS.length : LINE_LISTING_ROWS.length;
                      return (
                        <button
                          key={tab}
                          onClick={() => setListingTab(tab)}
                          className={`flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-[6px] text-[12px] font-semibold cursor-pointer transition-colors ${
                            active ? "bg-white text-[#262626] shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-[#666666] hover:text-[#262626]"
                          }`}
                        >
                          <Icon size={13} style={{ color: active ? EMAIL_TABLE_NAVY : "#97999B" }} />
                          {label}
                          <span
                            className="flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-white text-[9.5px] font-bold"
                            style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {listingTab === "hold" ? holdListingsContent : lineListingContent}
              </div>
            ) : (
              <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col">
                {holdListingsContent}
              </div>
            )}

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
                  <button
                    onClick={() => setOracleNotesOpen(true)}
                    className="ml-auto mb-2.5 flex items-center gap-1.5 h-[30px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[12px] font-semibold text-[#4D4D4D] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                  >
                    <Database size={13} className="text-[#97999B]" />
                    Additional Oracle Notes
                  </button>
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
                    <div className="min-h-[220px] max-h-[360px] overflow-y-auto px-5 flex flex-col gap-2.5">
                      {(() => {
                        const filtered = notes.filter((n) => n.text.toLowerCase().includes(noteSearch.trim().toLowerCase()));
                        if (filtered.length === 0) {
                          return <p className="text-[12.5px] text-[#97999B] text-center py-8">No notes match "{noteSearch}"</p>;
                        }
                        return filtered.map((note) => <NoteCard key={note.id} note={note} />);
                      })()}
                    </div>

                    {/* Add Notes — target of the Follow-up date flow: jumped to, pre-filled, and the input
                        box itself briefly beats with a pulsing blue glow (see .animate-ks-note-highlight in
                        globals.css) — stops once the CSR types (not merely focuses — the flow itself
                        programmatically focuses this field to jump to it, so clearing on focus made the
                        highlight get switched on and immediately back off before it could ever paint), or
                        after a few seconds either way. No `overflow-hidden` here (unlike other bordered boxes
                        on this page) since that would clip the glow, which renders outside the box's edge. */}
                    <div ref={addNoteSectionRef} className="px-5 pt-4 pb-5 mt-3 border-t border-[#E2E6E9] flex flex-col gap-2.5">
                      <label className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide">Add a note</label>
                      <div className={`border border-[#E2E6E9] rounded-[8px] focus-within:border-[#30578D] transition-colors ${noteHighlighted ? "animate-ks-note-highlight" : ""}`}>
                        <textarea
                          ref={noteTextareaRef}
                          value={noteText}
                          onChange={(e) => { setNoteText(e.target.value); setNoteHighlighted(false); }}
                          placeholder="Type your note here"
                          className="w-full px-4 py-3 text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none resize-none border-0 bg-transparent min-h-[80px]"
                        />
                      </div>
                      <div className="flex justify-end gap-2.5">
                        <button
                          onClick={() => {
                            if (!noteText.trim()) return;
                            setNotes((prev) => [
                              { id: Date.now(), date: new Date().toLocaleDateString("en-GB"), ago: "Just now", agent: CURRENT_USER_NAME, source: "manual", text: noteText.trim() },
                              ...prev,
                            ]);
                            toast.success("Note saved locally");
                            setNoteText("");
                            setNoteHighlighted(false);
                          }}
                          disabled={!noteText.trim()}
                          className="h-[34px] px-4 rounded-[8px] border text-[12.5px] font-semibold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ borderColor: EMAIL_TABLE_NAVY, color: EMAIL_TABLE_NAVY }}
                        >
                          Save Note locally
                        </button>
                        <button
                          onClick={() => {
                            if (!noteText.trim()) return;
                            setNotes((prev) => [
                              { id: Date.now(), date: new Date().toLocaleDateString("en-GB"), ago: "Just now", agent: CURRENT_USER_NAME, source: "oracle", text: noteText.trim() },
                              ...prev,
                            ]);
                            toast.success("Note saved to Oracle");
                            setNoteText("");
                            setNoteHighlighted(false);
                          }}
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
                  <div className="min-h-[220px] px-5 py-4 flex flex-col gap-2.5">
                    {followUpLog.length === 0 ? (
                      <p className="text-[13px] text-[#97999B] text-center py-8">No follow-ups or escalations logged for this order yet.</p>
                    ) : (
                      followUpLog.map((entry) => <FollowUpLogCard key={entry.id} entry={entry} />)
                    )}
                  </div>
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

                <div className="min-h-[220px] px-5 py-4 flex flex-col gap-2.5">
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

      {followUpRow && (
        <FollowUpEscalateModal
          row={followUpRow}
          onClose={() => setFollowUpRow(null)}
          onNavigateCommunication={() => onNavigateCommunication?.({ orderId })}
          onSent={(entry) => { setFollowUpLog((prev) => [entry, ...prev]); setActiveTab("followup"); }}
        />
      )}

      {oracleNotesOpen && (
        <AdditionalOracleNotesModal orderId={orderId} onClose={() => setOracleNotesOpen(false)} />
      )}

      {applyHoldRows && (
        <ApplyHoldModal
          rows={applyHoldRows}
          orderId={orderId}
          onClose={() => setApplyHoldRows(null)}
          onConfirm={(holdType) => {
            toast.success(`${holdType} applied to ${applyHoldRows.length} line${applyHoldRows.length > 1 ? "s" : ""}`);
            setCheckedLineRows((prev) => { const n = new Set(prev); applyHoldRows.forEach((r) => n.delete(r.id)); return n; });
            setApplyHoldRows(null);
          }}
        />
      )}
    </div>
  );
}
