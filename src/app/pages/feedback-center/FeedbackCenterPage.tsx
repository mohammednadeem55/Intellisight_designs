import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, Bookmark, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Copy, ExternalLink, Flag, Info, Maximize2, Minimize2, RefreshCw, Search, SlidersHorizontal, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { EMAIL_TABLE_NAVY } from "../../components/common/EmailTable";
import { TableToolbarMultiSelect, TableToolbarSearch, useExclusiveOpen } from "../../components/common/TableToolbar";
import { EMPTY_PANEL_FILTERS, loadSavedFeedbackFilters, saveSavedFeedbackFilters, type AiResultFilter, type PanelFilters, type SavedFeedbackFilter } from "./feedbackCenterSavedFilters";
import { CHECK_GUIDE_BY_DOC_TYPE, DOC_TYPE_LABELS, FEEDBACK_CHECK_NAMES, QUEUE_BY_DOC_TYPE, checkCounts, type CheckGuideEntry, type DocType, type ReviewItem, type ReviewCheck, type CheckStatus } from "./feedbackCenterData";

// Feedback Center uses the app's brand red (matches AppHeader's active-nav color) as its own accent instead
// of the navy used everywhere else — this section is deliberately visually distinct since it's an
// attention/urgency-driven review queue, not a regular data listing.
const ACCENT = "#CC0025";
const DATE_OPTIONS = ["Today", "Yesterday", "This Week", "Last Week"];
const OUTCOME_OPTIONS = ["Passed it", "Failed it", "Flagged", "Ran it"];
// "Ran it" = the check executed at all, whatever its result — so it matches every status.
const OUTCOME_STATUS: Record<string, CheckStatus[]> = { "Passed it": ["pass"], "Failed it": ["fail"], Flagged: ["flag"], "Ran it": ["pass", "fail", "flag"] };

// Filters panel — a form of field filters (text boxes match as "contains", case-insensitive) plus the AI result
// picker; staged behind the panel's Save like the other table filter panels.
const AI_RESULT_OPTIONS: AiResultFilter[] = ["All results", "Flagged only", "Clean only"];
const PANEL_TEXT_FIELDS: { key: "ccc" | "po" | "quote" | "customer" | "requestor"; label: string; placeholder: string }[] = [
  { key: "ccc", label: "CCC Request #", placeholder: "CCC-2680148" },
  { key: "po", label: "PO Number", placeholder: "PO number" },
  { key: "quote", label: "Quote Number", placeholder: "Quote number" },
  { key: "customer", label: "Customer", placeholder: "Account name" },
  { key: "requestor", label: "Requestor", placeholder: "Who raised it" },
];
const panelFilterCountOf = (f: PanelFilters) => (f.aiResult !== "All results" ? 1 : 0) + PANEL_TEXT_FIELDS.filter((t) => f[t.key].trim() !== "").length;
const samePanel = (a: PanelFilters, b: PanelFilters) => a.aiResult === b.aiResult && PANEL_TEXT_FIELDS.every((t) => a[t.key].trim() === b[t.key].trim());

type CheckVerdict = "pending" | "correct" | "incorrect";

function statusPill(status: CheckStatus): { label: string; fg: string; bg: string } {
  if (status === "flag") return { label: "AI Flag", fg: "#92600B", bg: "#FDF3E7" };
  if (status === "fail") return { label: "Fail", fg: "#BA1C1C", bg: "#FDECEA" };
  return { label: "Pass", fg: "#468657", bg: "#EFF6F1" };
}

// Toolbar popovers for this page. Checks gets its own dropdown (rather than the shared multi-select) because it
// needs a Match any/all switch and a filter box on top of the checkbox list — the list is long (20+ checks).
function SegmentedToggle<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-[3px] p-[3px] bg-[#F1F2F4] border border-[#E2E6E9] rounded-[8px]">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 h-[26px] px-2.5 rounded-[6px] text-[11px] font-medium whitespace-nowrap cursor-pointer transition-all ${value === o.value ? "bg-white shadow-sm" : "text-[#666666] hover:text-[#4D4D4D]"}`}
          style={value === o.value ? { color: EMAIL_TABLE_NAVY } : undefined}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const toolbarButtonClass = (open: boolean, active: boolean) =>
  `relative flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${
    open || active ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7]"
  }`;

function FiltersPopover({
  filters, count, onChange, open, onOpenChange, containerRef,
}: {
  filters: PanelFilters; count: number; onChange: (f: PanelFilters) => void;
  open: boolean; onOpenChange: (o: boolean) => void; containerRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="relative" ref={containerRef}>
      <button onClick={() => onOpenChange(!open)} className={toolbarButtonClass(open, count > 0)}>
        <SlidersHorizontal size={13} />
        Filters
        {count > 0 && (
          <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-[8px] text-white text-[10px] font-bold" style={{ backgroundColor: EMAIL_TABLE_NAVY }}>{count}</span>
        )}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-[460px] max-w-[90vw] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 p-4 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-[#97999B]">AI result</span>
            <SegmentedToggle value={filters.aiResult} onChange={(v) => onChange({ ...filters, aiResult: v })} options={AI_RESULT_OPTIONS.map((o) => ({ value: o, label: o }))} />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            {PANEL_TEXT_FIELDS.map((t) => (
              <div key={t.key} className="flex flex-col gap-1.5 min-w-0">
                <label className="text-[10.5px] font-bold uppercase tracking-wide text-[#97999B]">{t.label}</label>
                <div className="relative">
                  <input
                    value={filters[t.key]}
                    onChange={(e) => onChange({ ...filters, [t.key]: e.target.value })}
                    placeholder={t.placeholder}
                    className="w-full h-[36px] pl-3 pr-8 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
                  />
                  {filters[t.key] && (
                    <button onClick={() => onChange({ ...filters, [t.key]: "" })} aria-label={`Clear ${t.label}`} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {count > 0 && (
            <div className="flex justify-end -mb-1">
              <button onClick={() => onChange(EMPTY_PANEL_FILTERS)} className="text-[12px] font-semibold hover:underline cursor-pointer" style={{ color: EMAIL_TABLE_NAVY }}>Clear filters</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SavedSearchesDropdown({
  saved, activeId, activeName, canSave, onApply, onDelete, onSave, open, onOpenChange, containerRef,
}: {
  saved: SavedFeedbackFilter[]; activeId: string | undefined; activeName: string | undefined; canSave: boolean;
  onApply: (f: SavedFeedbackFilter) => void; onDelete: (f: SavedFeedbackFilter) => void; onSave: (name: string) => void;
  open: boolean; onOpenChange: (o: boolean) => void; containerRef: React.Ref<HTMLDivElement>;
}) {
  const [name, setName] = useState("");
  const submit = () => { if (name.trim() && canSave) { onSave(name); setName(""); } };
  return (
    <div className="relative" ref={containerRef}>
      <button onClick={() => onOpenChange(!open)} className={`${toolbarButtonClass(open, !!activeName)} max-w-[220px]`}>
        <Bookmark size={13} className="shrink-0" fill={activeName ? "currentColor" : "none"} />
        <span className="truncate">{activeName ?? "Saved"}</span>
        <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-[300px] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 flex flex-col">
          <div className="max-h-[220px] overflow-y-auto p-1.5">
            {saved.length === 0 ? (
              <p className="px-2.5 py-3 text-[12px] text-[#97999B]">No saved searches yet.</p>
            ) : (
              saved.map((f) => (
                <div key={f.id} className={`group flex items-center gap-1 rounded-[6px] transition-colors ${f.id === activeId ? "bg-[#30578D]/[0.06]" : "hover:bg-[#F7F7F7]"}`}>
                  <button
                    onClick={() => onApply(f)}
                    className={`flex-1 min-w-0 text-left px-2.5 py-2 text-[12.5px] truncate cursor-pointer ${f.id === activeId ? "font-semibold" : ""}`}
                    style={{ color: f.id === activeId ? EMAIL_TABLE_NAVY : "#262626" }}
                  >
                    {f.name}
                  </button>
                  <button onClick={() => onDelete(f)} aria-label={`Delete ${f.name}`} className="shrink-0 p-1.5 mr-0.5 rounded-[6px] text-[#97999B] hover:text-[#BA1C1C] cursor-pointer transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-[#E2E6E9] p-3 flex flex-col gap-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-[#97999B]">Save current search</span>
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                disabled={!canSave}
                placeholder={canSave ? "Name this search" : "Apply a filter first"}
                className="flex-1 min-w-0 h-[34px] px-3 rounded-[8px] border border-[#E2E6E9] text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors disabled:bg-[#F7F7F7]"
              />
              <button
                onClick={submit}
                disabled={!name.trim() || !canSave}
                className="h-[34px] px-3.5 rounded-[8px] text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: EMAIL_TABLE_NAVY }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Info icon next to a check's name — hovering (or keyboard focus) shows what the check verifies in general, in a
// light card under the icon. Portaled so it isn't clipped by the card/list scroll containers it sits inside.
function CheckInfoTooltip({ text }: { text: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLButtonElement>(null);
  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, left: Math.min(r.left - 8, window.innerWidth - 470) });
  };
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label="What this check verifies"
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        onFocus={show}
        onBlur={() => setPos(null)}
        className="flex items-center justify-center shrink-0 cursor-help transition-colors"
        style={{ color: pos ? ACCENT : "#9ca3af" }}
      >
        <Info size={13} />
      </button>
      {pos && createPortal(
        <div className="fixed z-[100] w-[450px] max-w-[92vw] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg px-4 py-3 pointer-events-none" style={{ top: pos.top, left: Math.max(8, pos.left) }}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#97999B]">What this check verifies</p>
          <p className="text-[13px] text-[#262626] leading-[1.5] mt-1.5">{text}</p>
        </div>,
        document.body
      )}
    </>
  );
}

// Custom single-select for "What did the AI get wrong?" — styled like the rest of the app's dropdowns
// (trigger + portaled floating list) instead of a native <select>, which can't carry the required-field red
// border or the app's selected-row check glyph consistently across browsers.
function ReasonSelect({ value, onChange, options, invalid }: { value: string; onChange: (v: string) => void; options: readonly string[]; invalid: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const openPanel = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="mt-1.5 w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[8px] border bg-white text-[12.5px] outline-none cursor-pointer transition-colors"
        style={{ borderColor: open ? "#30578D" : invalid ? "#BA1C1C" : "#E2E6E9" }}
      >
        <span className={`truncate text-left ${value ? "text-[#262626]" : "text-[#97999B]"}`}>{value || "Select a reason…"}</span>
        <ChevronDown size={14} className={`shrink-0 text-[#9ca3af] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && pos && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[100] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg py-1.5 overflow-y-auto"
          style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: 260 }}
        >
          {options.map((o) => {
            const selected = o === value;
            return (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2.5 text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
              >
                <span className={`truncate ${selected ? "font-semibold" : "text-[#4D4D4D]"}`} style={selected ? { color: EMAIL_TABLE_NAVY } : undefined}>
                  {o}
                </span>
                {selected && <Check size={13} className="shrink-0" style={{ color: EMAIL_TABLE_NAVY }} />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

const OTHER_REASON = "Other — I'll write my own";
const WRONG_REASON_OPTIONS = [
  "Data is right, verdict is wrong",
  "Supporting document was not considered",
  "Outdated or superseded information",
  "Wrong PO data",
  "Wrong Quote data",
  OTHER_REASON,
];

function CheckRow({
  check,
  verdict,
  expanded,
  note,
  reason,
  onReason,
  onToggleExpand,
  onVerdict,
  onNote,
}: {
  check: ReviewCheck;
  verdict: CheckVerdict;
  expanded: boolean;
  note: string;
  reason: string;
  onReason: (v: string) => void;
  onToggleExpand: () => void;
  onVerdict: (v: CheckVerdict) => void;
  onNote: (v: string) => void;
}) {
  const pill = statusPill(check.status);
  const verdictStyle = verdict === "correct" ? "#468657" : verdict === "incorrect" ? "#BA1C1C" : "#97999B";
  return (
    <div
      className="border rounded-[8px] overflow-hidden transition-colors"
      style={
        verdict === "incorrect"
          ? { borderColor: "#BA1C1C", backgroundColor: "#FDECEA" }
          : verdict === "correct"
          ? { borderColor: "#468657", backgroundColor: "#EFF6F1" }
          : { borderColor: "#E2E6E9", backgroundColor: "#FFFFFF" }
      }
    >
      <div className="flex items-center gap-3 flex-wrap px-4 py-3 cursor-pointer" onClick={onToggleExpand}>
        <button onClick={onToggleExpand} className="text-[#9ca3af] hover:text-[#4D4D4D] cursor-pointer shrink-0 transition-colors">
          <ChevronRight size={14} className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
        </button>
        <div className="w-[220px] shrink-0 group">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="min-w-0 text-[13px] font-semibold text-[#111827] group-hover:underline truncate" title={check.name}>
              {check.name}
            </p>
            <span onClick={(e) => e.stopPropagation()}>
              <CheckInfoTooltip text={check.verifies} />
            </span>
          </div>
          <p className="text-[11px] text-[#9ca3af] mt-0.5 truncate">{check.category}</p>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap" style={{ color: pill.fg, backgroundColor: pill.bg }}>
          {pill.label}
        </span>
        <p className="flex-1 min-w-[200px] text-[12px] text-[#4D4D4D] truncate">{check.description}</p>
        <div className="flex items-center gap-2.5 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
          <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: verdictStyle }}>
            {verdict === "correct" ? "Correct" : verdict === "incorrect" ? "Incorrect" : "Pending"}
          </span>
          <button
            onClick={() => onVerdict(verdict === "correct" ? "pending" : "correct")}
            title="Mark correct"
            className="flex items-center justify-center size-[26px] rounded-[6px] border cursor-pointer transition-colors"
            style={verdict === "correct" ? { borderColor: "#468657", backgroundColor: "#EFF6F1", color: "#468657" } : { borderColor: "#E2E6E9", color: "#666666" }}
          >
            <ThumbsUp size={13} fill={verdict === "correct" ? "#468657" : "none"} />
          </button>
          <button
            onClick={() => onVerdict(verdict === "incorrect" ? "pending" : "incorrect")}
            title="Mark incorrect"
            className="flex items-center justify-center size-[26px] rounded-[6px] border cursor-pointer transition-colors"
            style={verdict === "incorrect" ? { borderColor: "#BA1C1C", backgroundColor: "#FDECEA", color: "#BA1C1C" } : { borderColor: "#E2E6E9", color: "#666666" }}
          >
            <ThumbsDown size={13} fill={verdict === "incorrect" ? "#BA1C1C" : "none"} />
          </button>
        </div>
      </div>

      {expanded && (
        <div
          className="border-t px-4 py-4 flex flex-col gap-4"
          style={{ borderColor: verdict === "incorrect" ? "#F3C6C6" : verdict === "correct" ? "#C9E2D1" : "#E2E6E9" }}
        >
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#97999B]">AI reasoning &amp; evidence</p>
            <p className="text-[13px] text-[#262626] leading-[1.6] mt-1.5">{check.description}</p>
          </div>
          {verdict === "incorrect" && (
            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wide text-[#97999B]">
                What did the AI get wrong? <span className="text-[#BA1C1C]">(required)</span>
              </label>
              <ReasonSelect value={reason} onChange={onReason} options={WRONG_REASON_OPTIONS} invalid={!reason} />
            </div>
          )}
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wide text-[#97999B]">
              {verdict === "incorrect" && reason === OTHER_REASON ? (
                <>
                  Your note <span className="text-[#BA1C1C]">(required for "{OTHER_REASON}")</span>
                </>
              ) : (
                "Your note (optional)"
              )}
            </label>
            <textarea
              value={note}
              onChange={(e) => onNote(e.target.value)}
              rows={3}
              className="mt-1.5 w-full px-3 py-2 rounded-[8px] border bg-[#F7F7F8] text-[12.5px] text-[#262626] outline-none focus:border-[#30578D] focus:bg-white transition-colors resize-y"
              style={{ borderColor: verdict === "incorrect" && reason === OTHER_REASON && !note.trim() ? "#BA1C1C" : "#E2E6E9" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// "Check guide" — the reference narrative a reviewer opens to see what each AI check actually verifies
// (its source data, what it's matched against, and the matching logic), independent of any one transaction.
// Same modal chrome as the rest of the app's dialogs (dimmed backdrop, centered white card, bordered header
// with an X close, scrollable body) rather than a bespoke full-screen page — kept consistent instead of
// introducing a one-off layout for this piece of content.
function CheckGuideModal({ docLabel, entries, onClose }: { docLabel: string; entries: CheckGuideEntry[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? entries.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.rows.some((r) => r.label.toLowerCase().includes(q) || r.source.toLowerCase().includes(q) || r.target.toLowerCase().includes(q) || r.logic.toLowerCase().includes(q))
      )
    : entries;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[1140px] max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#DEDEDE] shrink-0">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide">Narrative Document</p>
            <span className="text-[16px] font-bold text-[#262626] truncate block mt-1">{docLabel} — what each check verifies</span>
            <p className="text-[12px] text-[#97999B] mt-0.5">{entries.length} checks · the source, target, and logic behind each one</p>
            <button
              onClick={() => toast.info("SharePoint link — coming soon")}
              className="flex items-center gap-1.5 text-[11.5px] font-semibold cursor-pointer hover:underline mt-2"
              style={{ color: "#CC0025" }}
            >
              Read the {docLabel} narrative on SharePoint
              <ExternalLink size={11} />
            </button>
          </div>
          <button onClick={onClose} className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-6 py-5">
          <div className="relative mb-5">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name or wording"
              className="w-full h-[38px] pl-10 pr-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-[13px] text-[#97999B] text-center py-16">No checks match "{query}".</p>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((entry) => {
                const number = entries.indexOf(entry) + 1;
                return (
                  <div key={entry.title} className="border border-[#E2E6E9] rounded-[8px] px-5 py-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[12.5px] font-semibold text-[#97999B] shrink-0">{number}</span>
                      <div className="min-w-0">
                        <h2 className="text-[14px] font-bold text-[#262626]">{entry.title}</h2>
                        <p className="text-[12px] text-[#4D4D4D] mt-1 leading-[1.5]">{entry.description}</p>
                      </div>
                    </div>

                    <div className="rounded-[8px] border border-[#E2E6E9] overflow-hidden mt-3">
                      <div className="grid" style={{ gridTemplateColumns: "160px 1fr 1fr 1.3fr" }}>
                        <div className="px-3.5 py-2 bg-[#F7F7F8] border-b border-[#E2E6E9]" />
                        {["Source", "Target", "Logic"].map((h) => (
                          <div key={h} className="px-3.5 py-2 bg-[#F7F7F8] border-b border-l border-[#E2E6E9] text-[10px] font-bold text-[#97999B] uppercase tracking-wide">
                            {h}
                          </div>
                        ))}
                        {entry.rows.map((row, i) => (
                          <Fragment key={row.label}>
                            <div className={`px-3.5 py-2.5 text-[12px] font-semibold text-[#262626] ${i > 0 ? "border-t border-[#E2E6E9]" : ""}`}>{row.label}</div>
                            <div className={`px-3.5 py-2.5 text-[11.5px] text-[#4D4D4D] leading-[1.5] border-l border-[#E2E6E9] ${i > 0 ? "border-t" : ""}`}>{row.source}</div>
                            <div className={`px-3.5 py-2.5 text-[11.5px] text-[#4D4D4D] leading-[1.5] border-l border-[#E2E6E9] ${i > 0 ? "border-t" : ""}`}>{row.target}</div>
                            <div className={`px-3.5 py-2.5 text-[11.5px] text-[#4D4D4D] leading-[1.5] border-l border-[#E2E6E9] ${i > 0 ? "border-t" : ""}`}>{row.logic}</div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FeedbackCenterPage({
  docType,
  onNavigateFeedbackCenter,
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
  onNavigateEmailWorkflow,
}: {
  docType: DocType;
  onNavigateFeedbackCenter?: (docType: DocType) => void;
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
  onNavigateEmailWorkflow?: () => void;
}) {
  const docLabel = DOC_TYPE_LABELS[docType];
  const [queue, setQueue] = useState<ReviewItem[]>(() => QUEUE_BY_DOC_TYPE[docType]);
  const [reviewed, setReviewed] = useState<ReviewItem[]>([]);
  const checkGuide = CHECK_GUIDE_BY_DOC_TYPE[docType];
  const [checkGuideOpen, setCheckGuideOpen] = useState(false);
  const [confirmCorrectItem, setConfirmCorrectItem] = useState<ReviewItem | null>(null);
  const [reviewerInfoOpen, setReviewerInfoOpen] = useState(false);

  // Sync status + KPI collapse — same pattern as HoldManagementOverview's page header.
  const [kpisExpanded, setKpisExpanded] = useState(true);
  const [lastSynced, setLastSynced] = useState("10:45 AM");
  const [syncing, setSyncing] = useState(false);
  const handleRefresh = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => {
      setLastSynced(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      setSyncing(false);
      toast.success("Synced");
    }, 900);
  };
  const [activeTab, setActiveTab] = useState<"queue" | "reviewed" | "analytics">("queue");


  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, Record<string, CheckVerdict>>>({});
  const [expandedCheckIds, setExpandedCheckIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const checkNameOptions: string[] = [...FEEDBACK_CHECK_NAMES];

  // Toolbar filters all apply instantly — the list filters in the browser, so there's nothing to stage behind
  // an Apply button. Checks (with Match any/all), Outcome and Date sit on the toolbar; the Filters popover
  // holds the field-level ones; Saved stores a named snapshot of everything.
  const [searchQuery, setSearchQuery] = useState("");
  const { openKey, setOpenKey, registerRef } = useExclusiveOpen();
  const [checksPicked, setChecksPicked] = useState<string[]>([]);
  const [checksMode, setChecksMode] = useState<"any" | "all">("any");
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [panelFilters, setPanelFilters] = useState<PanelFilters>(EMPTY_PANEL_FILTERS);
  const panelFilterCount = panelFilterCountOf(panelFilters);
  const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const setVerdict = (itemId: string, checkId: string, v: CheckVerdict) => {
    setVerdicts((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? {}), [checkId]: v } }));
  };
  const getVerdict = (itemId: string, checkId: string): CheckVerdict => verdicts[itemId]?.[checkId] ?? "pending";

  const markRemainingCorrect = (item: ReviewItem) => {
    setVerdicts((prev) => {
      const itemVerdicts = { ...(prev[item.id] ?? {}) };
      item.checks.forEach((c) => { if (!itemVerdicts[c.id] || itemVerdicts[c.id] === "pending") itemVerdicts[c.id] = "correct"; });
      return { ...prev, [item.id]: itemVerdicts };
    });
  };

  const toggleExpandAll = (item: ReviewItem) => {
    setExpandedCheckIds((prev) => {
      const allOpen = item.checks.every((c) => prev.has(c.id));
      const next = new Set(prev);
      item.checks.forEach((c) => (allOpen ? next.delete(c.id) : next.add(c.id)));
      return next;
    });
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success(`${id} copied`);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
  };

  const quickApprove = (item: ReviewItem) => {
    setQueue((prev) => prev.filter((x) => x.id !== item.id));
    setReviewed((prev) => [item, ...prev]);
    if (expandedItemId === item.id) setExpandedItemId(null);
    toast.success(`${item.id} marked correct and moved to Reviewed`);
  };

  const missingReasonCount = (item: ReviewItem) =>
    item.checks.filter((c) => {
      if (verdicts[item.id]?.[c.id] !== "incorrect") return false;
      const reason = reasons[c.id];
      if (!reason) return true;
      if (reason === OTHER_REASON && !(notes[c.id] ?? "").trim()) return true;
      return false;
    }).length;

  const submitReview = (item: ReviewItem) => {
    if (missingReasonCount(item) > 0) return;
    const itemVerdicts = verdicts[item.id] ?? {};
    const flaggedCount = item.checks.filter((c) => itemVerdicts[c.id] === "incorrect").length;
    setQueue((prev) => prev.filter((x) => x.id !== item.id));
    setReviewed((prev) => [item, ...prev]);
    setExpandedItemId(null);
    toast.success(flaggedCount > 0 ? `${item.id} submitted — ${flaggedCount} check${flaggedCount > 1 ? "s" : ""} flagged as incorrect` : `${item.id} submitted — all checks confirmed correct`);
  };

  // Saved searches — a named snapshot of everything currently applied (search text, Checks + mode, Outcome,
  // Date, field filters). "Active" is derived by comparing against the live state, so it highlights whether the
  // search was just applied or the same picks were made by hand, and drops the moment anything changes.
  const [savedFilters, setSavedFilters] = useState<SavedFeedbackFilter[]>(() => loadSavedFeedbackFilters(docType));
  const persistSavedFilters = (next: SavedFeedbackFilter[]) => { setSavedFilters(next); saveSavedFeedbackFilters(docType, next); };
  const sameList = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");
  const hasAppliedFilters = checksPicked.length > 0 || outcomes.length > 0 || !!date || panelFilterCount > 0 || searchQuery.trim() !== "";
  const activeSaved = savedFilters.find(
    (f) =>
      sameList(f.checks, checksPicked) && (checksPicked.length < 2 || f.checksMode === checksMode) && sameList(f.outcomes, outcomes) &&
      f.date === date && samePanel(f.panel, panelFilters) && f.search.trim() === searchQuery.trim()
  );
  const applySavedFilter = (f: SavedFeedbackFilter) => {
    setChecksPicked(f.checks); setChecksMode(f.checksMode); setOutcomes(f.outcomes); setDate(f.date);
    setPanelFilters(f.panel); setSearchQuery(f.search);
    setOpenKey(null);
    toast.success(`Applied "${f.name}"`);
  };
  const createSavedFilter = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !hasAppliedFilters) return;
    persistSavedFilters([...savedFilters, { id: `sf-${Date.now()}`, name: trimmed, checks: checksPicked, checksMode, outcomes, date, panel: panelFilters, search: searchQuery }]);
    setOpenKey(null);
    toast.success(`Saved "${trimmed}"`);
  };
  const deleteSavedFilter = (f: SavedFeedbackFilter) => {
    persistSavedFilters(savedFilters.filter((x) => x.id !== f.id));
    toast.info(`Deleted "${f.name}"`);
  };

  const filteredQueue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const wantStatuses = new Set(outcomes.flatMap((o) => OUTCOME_STATUS[o]));
    const picked = new Set(checksPicked);
    return queue.filter((item) => {
      if (q && !item.id.toLowerCase().includes(q) && !item.poNumber.toLowerCase().includes(q) && !item.company.toLowerCase().includes(q)) return false;
      if (picked.size > 0) {
        const names = new Set(item.checks.map((c) => c.name));
        const matches = checksMode === "all" ? checksPicked.every((n) => names.has(n)) : checksPicked.some((n) => names.has(n));
        if (!matches) return false;
      }
      // Outcome applies to the picked check(s) when there are any, otherwise to any check in the transaction.
      if (wantStatuses.size > 0 && !item.checks.some((c) => (picked.size === 0 || picked.has(c.name)) && wantStatuses.has(c.status))) return false;
      const flagged = checkCounts(item).aiFlags > 0;
      if (panelFilters.aiResult === "Flagged only" && !flagged) return false;
      if (panelFilters.aiResult === "Clean only" && flagged) return false;
      const fieldOf: Record<(typeof PANEL_TEXT_FIELDS)[number]["key"], string> = { ccc: item.id, po: item.poNumber, quote: item.quoteNumber, customer: item.company, requestor: item.requestor };
      for (const t of PANEL_TEXT_FIELDS) {
        const needle = panelFilters[t.key].trim().toLowerCase();
        if (needle && !fieldOf[t.key].toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [queue, searchQuery, checksPicked, checksMode, outcomes, panelFilters]);

  // Search is its own always-visible control, so it doesn't count here. (Date is a toolbar pick too, but the
  // mock rows only carry relative timestamps, so it can't narrow the list yet — it still shows as applied.)
  const appliedFilterCount = (checksPicked.length > 0 ? 1 : 0) + (outcomes.length > 0 ? 1 : 0) + (date ? 1 : 0) + panelFilterCount;
  const clearFilters = () => { setChecksPicked([]); setChecksMode("any"); setOutcomes([]); setDate(null); setPanelFilters(EMPTY_PANEL_FILTERS); };

  // Pass/fail rate across every run of the selected check(s) — one check shows its name, several show
  // "N CHECKS" with the combined rate. Independent of the Outcome filter so the rate stays meaningful.
  const checksFilterLabel = checksPicked.length === 1 ? checksPicked[0] : `${checksPicked.length} CHECKS`;
  const checksFilterStats = useMemo(() => {
    if (checksPicked.length === 0) return null;
    const selected = new Set(checksPicked);
    const matching = queue.flatMap((item) => item.checks.filter((c) => selected.has(c.name)));
    const total = matching.length;
    const pass = matching.filter((c) => c.status === "pass").length;
    const fail = total - pass;
    return { total, pass, fail, passPct: total ? Math.round((pass / total) * 100) : 0, failPct: total ? Math.round((fail / total) * 100) : 0 };
  }, [queue, checksPicked]);

  const totalFlagged = queue.reduce((sum, item) => sum + checkCounts(item).aiFlags, 0);
  const expandedItem = expandedItemId ? queue.find((i) => i.id === expandedItemId) ?? null : null;

  return (
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
          <AppHeader
            activeNav="Feedback Center"
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
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
            onNavigateFeedbackCenter={onNavigateFeedbackCenter}
          />
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 flex flex-col gap-4 min-h-full">
            <div className="shrink-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">{docLabel}</h1>
                  <p className="text-[12px] text-[#97999B] mt-0.5">AI execution validation · human-in-the-loop</p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => (checkGuide ? setCheckGuideOpen(true) : toast.info("Check guide — coming soon"))}
                    className="flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border border-[#30578D]/40 text-[#30578D] text-[12.5px] font-semibold hover:bg-[#EAF1FB] cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <Info size={13} /> Check guide
                  </button>
                  <div className="w-px h-5 bg-[#E2E6E9]" />
                  <span className="flex items-center gap-1.5 text-[12px] text-[#4D4D4D] whitespace-nowrap">
                    <span className="size-[7px] rounded-full bg-[#468657]" />
                    Last synced {lastSynced}
                  </span>
                  <button
                    onClick={handleRefresh}
                    disabled={syncing}
                    title="Refresh"
                    className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                  </button>
                  <button
                    onClick={() => setKpisExpanded((v) => !v)}
                    title={kpisExpanded ? "Collapse KPIs" : "Expand KPIs"}
                    className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                  >
                    {kpisExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* KPI strip — same flat gradient-card style as NewOverviewPage's kpis.map() */}
            {kpisExpanded && (
              <div className="flex flex-wrap gap-4 shrink-0">
                {[
                  { label: "Pending Review", value: queue.length, icon: ClipboardList, accent: EMAIL_TABLE_NAVY },
                  { label: "Flagged", value: totalFlagged, icon: Flag, accent: "#C83737" },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="relative overflow-hidden flex-1 min-w-[240px] rounded-[8px] border border-[#E2E6E9] p-5 flex items-center gap-4"
                    style={{ background: `linear-gradient(135deg, ${kpi.accent}10, #ffffff 65%)` }}
                  >
                    <div className="size-[46px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${kpi.accent}1A` }}>
                      <kpi.icon size={21} style={{ color: kpi.accent }} />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide truncate">{kpi.label}</p>
                      <p className="text-[30px] font-bold text-[#262626] leading-none">{kpi.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-[#DEDEDE] -mt-1 shrink-0">
              {(["queue", "reviewed", "analytics"] as const).map((tab) => {
                const active = activeTab === tab;
                const label = tab === "queue" ? `Queue (${queue.length})` : tab === "reviewed" ? `Reviewed (${reviewed.length})` : "Analytics";
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-4 py-3 text-[13px] font-semibold border-b-2 -mb-px cursor-pointer transition-colors"
                    style={active ? { borderColor: EMAIL_TABLE_NAVY, color: EMAIL_TABLE_NAVY } : { borderColor: "transparent", color: "#666666" }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {activeTab === "queue" && (
              <>
                {/* Reviewer guidance — an info icon next to the heading rather than a permanent banner, so it
                    doesn't take up space on every visit but is still one click away. */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <h2 className="text-[14px] font-bold text-[#262626]">Awaiting your review</h2>
                  <div className="relative">
                    <button
                      onClick={() => setReviewerInfoOpen((v) => !v)}
                      aria-label="Reviewer guidance"
                      className="flex items-center justify-center size-[22px] rounded-full cursor-pointer transition-colors hover:bg-[#EAF1FB]"
                      style={{ color: EMAIL_TABLE_NAVY }}
                    >
                      <Info size={15} />
                    </button>
                    {reviewerInfoOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setReviewerInfoOpen(false)} />
                        <div className="absolute left-0 top-full mt-2 w-[420px] max-w-[85vw] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 px-4 py-3.5">
                          <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: EMAIL_TABLE_NAVY }}>Reviewer</p>
                          <p className="text-[12.5px] text-[#262626] leading-[1.6] mt-1.5">
                            Every AI-executed {docLabel} lands here before it is considered closed. Expand a transaction to read the check-by-check
                            breakdown, thumbs down only the checks the AI got wrong, then submit — every check you leave unmarked is recorded as correct.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Content card: toolbar + list — same shape as the Command Center / Order Listing tables. The
                    Advanced Filters panel slides over just the list area, not the whole page. */}
                <div className="flex-1 min-h-[420px] bg-white rounded-[8px] border border-[#E2E6E9] flex flex-col">
                  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#DEDEDE] rounded-t-[8px] flex-wrap">
                    <TableToolbarSearch value={searchQuery} onCommit={setSearchQuery} placeholder="Search CCC #, PO #, customer" />

                    {checksFilterStats && (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide whitespace-nowrap max-w-[160px] truncate" title={checksFilterLabel}>
                          {checksFilterLabel}
                        </span>
                        {/* Pass/fail pills — filled-circle glyph + percentage + muted count, matching the filter
                            bar's control height rather than a tiny inline icon */}
                        <span
                          className="inline-flex items-center gap-2 h-[34px] px-3 rounded-full border text-[11.5px] font-medium whitespace-nowrap"
                          style={{ borderColor: "#46865740", backgroundColor: "#EFF6F1", color: "#468657" }}
                        >
                          <span className="flex items-center justify-center size-[17px] rounded-full shrink-0" style={{ backgroundColor: "#468657" }}>
                            <Check size={10} strokeWidth={3.5} className="text-white" />
                          </span>
                          <span className="text-[15px] font-semibold leading-none">{checksFilterStats.passPct}%</span>
                          <span className="tracking-wide">PASS · {checksFilterStats.pass.toLocaleString()}</span>
                        </span>
                        <span
                          className="inline-flex items-center gap-2 h-[34px] px-3 rounded-full border text-[11.5px] font-medium whitespace-nowrap"
                          style={{ borderColor: "#BA1C1C40", backgroundColor: "#FDECEA", color: "#BA1C1C" }}
                        >
                          <span className="flex items-center justify-center size-[17px] rounded-full shrink-0" style={{ backgroundColor: "#BA1C1C" }}>
                            <X size={10} strokeWidth={3.5} className="text-white" />
                          </span>
                          <span className="text-[15px] font-semibold leading-none">{checksFilterStats.failPct}%</span>
                          <span className="tracking-wide">FAIL · {checksFilterStats.fail.toLocaleString()}</span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 ml-auto flex-wrap">
                      {/* Date — single-select, applies instantly */}
                      <div className="relative" ref={registerRef("date")}>
                        <button onClick={() => setOpenKey(openKey === "date" ? null : "date")} className={toolbarButtonClass(openKey === "date", !!date)}>
                          {date ?? "Date"}
                          <ChevronDown size={13} className={`transition-transform duration-200 ${openKey === "date" ? "rotate-180" : ""}`} />
                        </button>
                        {openKey === "date" && (
                          <div className="absolute top-full left-0 mt-1 w-[150px] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 py-1">
                            {DATE_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => { setDate(opt === date ? null : opt); setOpenKey(null); }}
                                className="w-full text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                                style={opt === date ? { color: EMAIL_TABLE_NAVY, fontWeight: 600 } : { color: "#4D4D4D" }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <TableToolbarMultiSelect
                        label="Checks"
                        options={checkNameOptions}
                        pending={checksPicked}
                        onToggle={(name) => setChecksPicked((prev) => toggleIn(prev, name))}
                        onToggleAll={() => setChecksPicked((prev) => (prev.length === checkNameOptions.length ? [] : [...checkNameOptions]))}
                        onClear={() => setChecksPicked([])}
                        open={openKey === "checks"}
                        onOpenChange={(o) => setOpenKey(o ? "checks" : null)}
                        containerRef={registerRef("checks")}
                        appliedCount={checksPicked.length}
                        dirty={false}
                        width={280}
                        searchable
                        listMaxHeight={190}
                        header={
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-[#97999B]">Match</span>
                            <SegmentedToggle value={checksMode} onChange={setChecksMode} options={[{ value: "any", label: "Any of them" }, { value: "all", label: "All of them" }]} />
                          </div>
                        }
                      />

                      <TableToolbarMultiSelect
                        label="Outcome"
                        options={OUTCOME_OPTIONS}
                        pending={outcomes}
                        onToggle={(o) => setOutcomes((prev) => toggleIn(prev, o))}
                        onToggleAll={() => setOutcomes((prev) => (prev.length === OUTCOME_OPTIONS.length ? [] : [...OUTCOME_OPTIONS]))}
                        onClear={() => setOutcomes([])}
                        open={openKey === "outcome"}
                        onOpenChange={(o) => setOpenKey(o ? "outcome" : null)}
                        containerRef={registerRef("outcome")}
                        appliedCount={outcomes.length}
                        dirty={false}
                        width={200}
                      />

                      <FiltersPopover
                        filters={panelFilters}
                        count={panelFilterCount}
                        onChange={setPanelFilters}
                        open={openKey === "filters"}
                        onOpenChange={(o) => setOpenKey(o ? "filters" : null)}
                        containerRef={registerRef("filters")}
                      />

                      <SavedSearchesDropdown
                        saved={savedFilters}
                        activeId={activeSaved?.id}
                        activeName={activeSaved?.name}
                        canSave={hasAppliedFilters}
                        onApply={applySavedFilter}
                        onDelete={deleteSavedFilter}
                        onSave={createSavedFilter}
                        open={openKey === "saved"}
                        onOpenChange={(o) => setOpenKey(o ? "saved" : null)}
                        containerRef={registerRef("saved")}
                      />

                      {appliedFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-[12.5px] font-semibold hover:underline cursor-pointer whitespace-nowrap" style={{ color: EMAIL_TABLE_NAVY }}>
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 relative">
                    <div className="p-4">
                      {/* Transaction list */}
                      <div className="flex flex-col gap-3">
                        {filteredQueue.length === 0 ? (
                          <div className="bg-white rounded-[8px] border border-[#E2E6E9] py-16 text-center">
                            <p className="text-[13px] text-[#97999B]">No transactions match your filters</p>
                          </div>
                        ) : (
                          filteredQueue.map((item) => {
                            const { total, passed, aiFlags } = checkCounts(item);
                            const itemVerdicts = verdicts[item.id] ?? {};
                            const markedCount = item.checks.filter((c) => itemVerdicts[c.id] && itemVerdicts[c.id] !== "pending").length;
                            const isExpanded = expandedItemId === item.id;
                            return (
                              <div key={item.id} className="bg-white rounded-[8px] border border-[#E2E6E9]">
                                <div
                                  className="flex items-center justify-between gap-3 px-5 py-4 flex-wrap cursor-pointer"
                                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <button
                                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                      className="shrink-0 text-[#6b7280] hover:text-[#111827] cursor-pointer transition-colors"
                                    >
                                      <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`} />
                                    </button>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                          className="text-[14px] font-bold underline decoration-dotted underline-offset-4 hover:decoration-solid cursor-pointer whitespace-nowrap"
                                          style={{ color: ACCENT }}
                                        >
                                          {item.id}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyId(item.id);
                                          }}
                                          title={copiedId === item.id ? "Copied" : "Copy ID"}
                                          className="flex items-center gap-1 cursor-pointer transition-colors"
                                          style={{ color: copiedId === item.id ? "#468657" : "#9ca3af" }}
                                        >
                                          {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                                          {copiedId === item.id && <span className="text-[11px] font-semibold">Copied</span>}
                                        </button>
                                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#F1F2F4] text-[#4D4D4D] whitespace-nowrap">
                                          VERSION {item.version}
                                        </span>
                                        <span className="text-[13px] font-medium text-[#374151] truncate">{item.company}</span>
                                      </div>
                                      <p className="text-[11.5px] text-[#9ca3af] mt-1">
                                        Run by {item.runBy} · PO {item.poNumber}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[#F1F2F4] text-[#4D4D4D] whitespace-nowrap">
                                      <Check size={11} /> {passed}/{total} PASSED
                                    </span>
                                    {aiFlags > 0 && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[#FDF3E7] text-[#92600B] whitespace-nowrap">
                                        <Flag size={11} /> {aiFlags} AI FLAGS
                                      </span>
                                    )}
                                    <div className="w-px h-5 bg-[#E2E6E9]" />
                                    <span className="text-[11.5px] text-[#9ca3af] whitespace-nowrap">{item.timestamp}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmCorrectItem(item);
                                      }}
                                      className="flex items-center gap-1.5 px-3 h-[30px] rounded-[8px] border text-[12px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
                                      style={{ borderColor: "#468657", color: "#468657" }}
                                    >
                                      <ThumbsUp size={12} /> Correct
                                    </button>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="border-t border-[#E2E6E9] px-5 py-4">
                                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                      <p className="text-[13.5px] font-bold text-[#111827]">
                                        Validate each check <span className="font-normal text-[#9ca3af]">{markedCount} / {item.checks.length}</span>
                                      </p>
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => markRemainingCorrect(item)}
                                          className="text-[12px] font-semibold hover:underline cursor-pointer"
                                          style={{ color: EMAIL_TABLE_NAVY }}
                                        >
                                          Mark remaining as correct
                                        </button>
                                        <button
                                          onClick={() => toggleExpandAll(item)}
                                          className="text-[12px] font-semibold hover:underline cursor-pointer"
                                          style={{ color: EMAIL_TABLE_NAVY }}
                                        >
                                          Expand all
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                      {item.checks.map((check) => (
                                        <CheckRow
                                          key={check.id}
                                          check={check}
                                          verdict={getVerdict(item.id, check.id)}
                                          expanded={expandedCheckIds.has(check.id)}
                                          note={notes[check.id] ?? ""}
                                          reason={reasons[check.id] ?? ""}
                                          onReason={(v) => setReasons((prev) => ({ ...prev, [check.id]: v }))}
                                          onNote={(v) => setNotes((prev) => ({ ...prev, [check.id]: v }))}
                                          onToggleExpand={() =>
                                            setExpandedCheckIds((prev) => {
                                              const next = new Set(prev);
                                              next.has(check.id) ? next.delete(check.id) : next.add(check.id);
                                              return next;
                                            })
                                          }
                                          onVerdict={(v) => {
                                            setVerdict(item.id, check.id, v);
                                            if (v === "incorrect" || v === "correct") setExpandedCheckIds((prev) => new Set(prev).add(check.id));
                                          }}
                                        />
                                      ))}
                                    </div>

                                    <div className="sticky bottom-0 z-10 bg-white flex items-center justify-between gap-3 flex-wrap mt-4 pt-4 pb-1 border-t border-[#E2E6E9]">
                                      {missingReasonCount(item) > 0 ? (
                                        <p className="flex items-center gap-1.5 text-[12px] text-[#BA1C1C]">
                                          <AlertCircle size={14} className="shrink-0" />
                                          Pick a reason for {missingReasonCount(item)} check{missingReasonCount(item) > 1 ? "s" : ""} marked incorrect before submitting.
                                        </p>
                                      ) : (
                                        <p className="text-[12px] text-[#9ca3af]">Thumbs down only the checks the AI got wrong — everything you leave unmarked is submitted as correct.</p>
                                      )}
                                      <button
                                        onClick={() => submitReview(item)}
                                        disabled={missingReasonCount(item) > 0}
                                        className="px-5 py-2.5 rounded-[8px] text-[13px] font-semibold text-white transition-opacity whitespace-nowrap enabled:hover:opacity-90 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                        style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                                      >
                                        Submit review
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "reviewed" && (
              <div className="bg-white rounded-[8px] border border-[#E2E6E9] py-16 text-center min-h-0 overflow-auto">
                {reviewed.length === 0 ? (
                  <>
                    <CheckCircle2 size={28} className="mx-auto text-[#D9D9D6]" />
                    <p className="text-[13px] text-[#97999B] mt-3">No transactions reviewed yet</p>
                  </>
                ) : (
                  <div className="text-left px-5 flex flex-col gap-2.5">
                    {reviewed.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-[8px] border border-[#E2E6E9]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckCircle2 size={15} className="text-[#468657] shrink-0" />
                          <span className="text-[13px] font-semibold text-[#262626] whitespace-nowrap">{item.id}</span>
                          <span className="text-[12.5px] text-[#666666] truncate">{item.company}</span>
                        </div>
                        <span className="text-[11.5px] text-[#9ca3af] whitespace-nowrap">PO {item.poNumber}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="bg-white rounded-[8px] border border-[#E2E6E9] py-16 text-center min-h-0 overflow-auto">
                <p className="text-[14px] font-semibold text-[#374151]">Analytics</p>
                <p className="text-[12.5px] text-[#97999B] mt-1.5">Review-quality trends and AI accuracy metrics — coming soon.</p>
              </div>
            )}
          </div>
        </main>
      </div>
      {checkGuideOpen && checkGuide && (
        <CheckGuideModal docLabel={docLabel} entries={checkGuide} onClose={() => setCheckGuideOpen(false)} />
      )}
      {confirmCorrectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmCorrectItem(null)} />
          <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[460px] p-6">
            <p className="text-[15px] font-semibold text-[#111827]">Mark {confirmCorrectItem.id} as correct?</p>
            <p className="text-[13px] text-[#6b7280] mt-2.5 leading-[1.5]">
              All checks will be marked correct and the review will be submitted immediately.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                onClick={() => setConfirmCorrectItem(null)}
                className="px-4 h-[36px] rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  quickApprove(confirmCorrectItem);
                  setConfirmCorrectItem(null);
                }}
                className="px-4 h-[36px] rounded-[8px] text-[13px] font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: EMAIL_TABLE_NAVY }}
              >
                Mark as correct
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
