import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Archive, ArrowRight, BookmarkCheck, Check, ChevronDown, ChevronRight, CircleCheck, ClipboardPen, Clock, Download, FileImage, FileSpreadsheet, FileText, MapPin, MessageSquare, RotateCcw, ShieldOff, ThumbsDown, ThumbsUp, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { TextField } from "../../components/common/TextField";
import { WaveLoader } from "../../components/common/Loader";
import { Button } from "../../components/common/Button";
import { EmailTableTooltip } from "../../components/common/EmailTable";
import { AttachmentPreviewModal } from "../../components/common/AttachmentPreviewModal";
import { OTHER_REASON, ReasonSelect, WRONG_REASON_OPTIONS } from "../../components/common/ReasonSelect";
import { useOrderValidation, regenerateValidation, type CheckCategory, type OrderValidationData, type ValidationCheck } from "./useOrderValidation";

export type ValidationAuditEntry = { action: string; icon?: LucideIcon; detail?: string };
// A field change made while a given version was the active one — e.g. committing Freight Terms. Kept
// separate from the check-result snapshot itself so "what changed" reads as a distinct line from "what the
// checks looked like".
type FieldChange = { label: string; icon?: LucideIcon; at: Date };
type ValidationVersion = { version: number; at: Date; data: OrderValidationData; changes: FieldChange[] };

// AISO-658 — the two check categories, each with its own accent color and vocabulary (a failed Mandatory
// check is "Verification Required" since the workflow is blocked; a failed Red Flag check is "Review
// Required" since it isn't).
const CATEGORY_META: Record<CheckCategory, { tag: string; icon: LucideIcon; sectionTitle: string; sectionHint: string; accent: string; failedLabel: string; passedLabel: string; blocking: boolean; canJustify: boolean }> = {
  mandatory: { tag: "Mandatory", icon: ClipboardPen, sectionTitle: "Mandatory Checks (Order Entry)", sectionHint: "Must be resolved or justified before order creation", accent: "#BA1C1C", failedLabel: "Verification Required", passedLabel: "Verified", blocking: true, canJustify: true },
  redFlag: { tag: "Red Flag", icon: BookmarkCheck, sectionTitle: "Mandatory Checks (Order Booking)", sectionHint: "Must be resolved before order booking", accent: "#823E81", failedLabel: "Verification Required", passedLabel: "Verified", blocking: false, canJustify: false },
};

function formatVersionDateTime(d: Date) {
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// Lists every version newest-first (current version pinned at the top), lets the user click into any past
// one to view it read-only, or jump back to Latest. Distinct from the Audit Trail modal — this browses full
// snapshots of the validation results, plus the field changes made while each version was active.
function VersionHistoryModal({
  versions,
  currentVersionNumber,
  currentAt,
  currentChanges,
  viewingVersion,
  onSelectVersion,
  onClose,
}: {
  versions: ValidationVersion[];
  currentVersionNumber: number;
  currentAt: Date;
  currentChanges: FieldChange[];
  viewingVersion: number | null;
  onSelectVersion: (version: number | null) => void;
  onClose: () => void;
}) {
  const rows = [
    { version: currentVersionNumber, at: currentAt, isLatest: true, changes: currentChanges },
    ...versions.slice().reverse().map(v => ({ version: v.version, at: v.at, isLatest: false, changes: v.changes })),
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[400px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE] shrink-0">
          <h2 className="text-[16px] font-bold text-[#262626]">Version History</h2>
          <button onClick={onClose} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-3 py-3 flex flex-col gap-1 overflow-y-auto">
          {rows.map(row => {
            const active = viewingVersion === null ? row.isLatest : viewingVersion === row.version;
            return (
              <button
                key={row.version}
                onClick={() => { onSelectVersion(row.isLatest ? null : row.version); onClose(); }}
                className={`w-full text-left px-3.5 py-2.5 rounded-[8px] cursor-pointer transition-colors ${active ? "bg-[#30578D]/[0.08]" : "hover:bg-[#F7F7F7]"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-[#262626]">Version {row.version}{row.isLatest ? " (Latest)" : ""}</p>
                  {active && <Check size={14} className="shrink-0" style={{ color: "#30578D" }} />}
                </div>
                <p className="text-[11px] text-[#97999B] mt-0.5">{formatVersionDateTime(row.at)}</p>
                {row.changes.length > 0 && (
                  <div className="mt-1.5 flex flex-col gap-1 border-t border-[#F1F2F4] pt-1.5">
                    {row.changes.map((c, i) => (
                      <p key={i} className="flex items-center gap-1.5 text-[11px] text-[#4D4D4D]">
                        {c.icon && <c.icon size={10} className="text-[#97999B] shrink-0" />}
                        <span className="truncate">{c.label}</span>
                      </p>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Same icon + color per file type as the Workflow email thread's attachment chips, so a document reads
// the same way everywhere in the app instead of every file type looking identical here.
function docMeta(name: string): { icon: typeof FileText; bg: string; fg: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: FileText, bg: "#FDECEA", fg: "#DC2626" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: FileSpreadsheet, bg: "#E8F5E9", fg: "#2E7D32" };
  if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) return { icon: FileImage, bg: "#EAF1FB", fg: "#30578D" };
  if (["zip", "rar", "7z"].includes(ext)) return { icon: Archive, bg: "#FDF3E7", fg: "#92600B" };
  return { icon: FileText, bg: "#f3f4f6", fg: "#6b7280" };
}

// AISO-603 — every rerun scope (All / Failed Only / Selected — tick one row to rerun just that check) reduces to "here's a list of check
// ids to rerun", so one menu drives all of them instead of separate controls scattered around the page. A
// menu rather than N separate buttons so the header row has room for more scopes later without growing again.
function RerunSplitButton({ selectedCount, onSelect }: { selectedCount: number; onSelect: (targetIds: string[], label: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border text-[11.5px] font-semibold cursor-pointer transition-colors shrink-0"
        style={{ borderColor: "#E9002933", color: "#E90029" }}
      >
        <RotateCcw size={12} />
        Rerun Validation
        <ChevronDown size={11} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-[240px] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg py-1 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(["__all__"], "All Checks"); setOpen(false); }}
            className="w-full text-left px-3.5 py-2 text-[12.5px] font-medium text-[#374151] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
          >
            Rerun All Checks
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(["__failed__"], "Verification Required Checks Only"); setOpen(false); }}
            className="w-full text-left px-3.5 py-2 text-[12.5px] font-medium text-[#374151] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
          >
            Rerun Verification Required Only
          </button>
          <button
            disabled={selectedCount === 0}
            onClick={(e) => { e.stopPropagation(); if (selectedCount === 0) return; onSelect(["__selected__"], "Selected Checks"); setOpen(false); }}
            className="w-full text-left px-3.5 py-2 text-[12.5px] font-medium text-[#374151] hover:bg-[#F7F7F7] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            Rerun Selected {selectedCount > 0 ? `(${selectedCount})` : ""}
          </button>
        </div>
      )}
    </div>
  );
}

// Small checkbox used for bulk-selecting failed checks to rerun — same square/check-glyph shape used
// elsewhere in the app (e.g. Hold Management's group-member picker) rather than a native checkbox input.
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`flex items-center justify-center size-[16px] rounded-[4px] border-[1.5px] shrink-0 transition-colors cursor-pointer ${checked ? "border-transparent" : "border-[#B8BCC2] bg-white"}`}
      style={checked ? { backgroundColor: "#30578D" } : undefined}
    >
      {checked && <Check size={11} className="text-white" strokeWidth={3.5} />}
    </button>
  );
}

// A failed/review check — the only rows that carry a checkbox (tick it, then "Rerun Selected" from the
// Rerun Validation menu — no separate per-row rerun button) and the bypass-with-reason flow (AISO-652). Mandatory vs Red Flag only changes color/vocabulary; the
// mechanics (bypass requires a non-empty reason, both are audited) are identical for both categories.
function FailedCheckRow({
  check,
  category,
  selected,
  onToggleSelect,
  expanded,
  onToggleExpand,
  canJustify,
  onBypass,
}: {
  check: ValidationCheck;
  category: CheckCategory;
  /** Order Booking checks must be resolved, never justified — so no Justify action on those rows. */
  canJustify: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  /** Open/closed is owned by the section so one "Expand all" button can drive every row. */
  expanded: boolean;
  onToggleExpand: () => void;
  onBypass: (reason: string) => void;
}) {
  const [bypassFormOpen, setBypassFormOpen] = useState(false);
  const [reasonDraft, setReasonDraft] = useState("");
  const accent = CATEGORY_META[category].accent;

  const submitBypass = () => {
    const reason = reasonDraft.trim();
    if (!reason) return; // no reason, no bypass — enforced here, not just via disabled state
    onBypass(reason);
    setBypassFormOpen(false);
    setReasonDraft("");
  };

  // Same plain row shape as VerifiedCheckRow (not a separate card style) so Failed and Passed read as one
  // consistent list, not two different components. Only Bypass sits outside the expand toggle — the reason/
  // recommended-action detail goes back to being collapsed by default, same as everything else in this list.
  return (
    <div className="border-b border-[#f3f4f6] last:border-b-0">
      <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#f8fafc] transition-colors">
        <Checkbox checked={selected} onChange={onToggleSelect} />
        <button onClick={onToggleExpand} className="flex-1 min-w-0 flex items-center gap-2.5 text-left cursor-pointer">
          <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-[#111827] truncate">{check.label}</span>
        </button>
        {canJustify && !check.bypass && (
          <EmailTableTooltip label="Justify">
            <button
              onClick={(e) => { e.stopPropagation(); setBypassFormOpen(v => !v); }}
              className="shrink-0 flex items-center justify-center size-[26px] rounded-[6px] text-[#9ca3af] hover:text-[#30578D] hover:bg-[#eef0f3] cursor-pointer transition-colors"
            >
              <ShieldOff size={12} />
            </button>
          </EmailTableTooltip>
        )}
        <button onClick={onToggleExpand} className="shrink-0 cursor-pointer">
          <ChevronDown size={13} className={`text-[#9ca3af] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Bypass state/form — always visible (not behind the expand toggle) once triggered from the icon
          above, since it's the one action you might take without needing to read the full reason first. */}
      {(check.bypass || bypassFormOpen) && (
        <div className="px-4 pb-2.5">
          {check.bypass ? (
            <div className="flex items-start gap-2 rounded-[6px] px-2.5 py-2 border" style={{ backgroundColor: "#30578D1A", borderColor: "#30578D33" }}>
              <ShieldOff size={12} className="shrink-0 mt-[1px]" style={{ color: "#30578D" }} />
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] text-[#374151] leading-[1.4]"><span className="font-semibold" style={{ color: "#30578D" }}>Justified:</span> {check.bypass.reason}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#30578DCC" }}>{check.bypass.by} · {check.bypass.at}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-[6px] p-2.5 border border-[#E2E6E9] bg-[#F7F7F7] flex flex-col gap-2">
              <textarea
                autoFocus
                value={reasonDraft}
                onChange={(e) => setReasonDraft(e.target.value)}
                placeholder="Justification for this check (required)..."
                rows={2}
                className="w-full px-2.5 py-2 rounded-[6px] border border-[#E2E6E9] bg-white text-[12px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors resize-none"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setBypassFormOpen(false); setReasonDraft(""); }}
                  className="px-3 py-1.5 rounded-[6px] text-[11.5px] font-semibold text-[#666666] hover:bg-[#EFEFEF] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!reasonDraft.trim()}
                  onClick={submitBypass}
                  className="px-3 py-1.5 rounded-[6px] text-[11.5px] font-semibold text-white cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#30578D" }}
                >
                  Confirm Justification
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div className="px-4 pt-[2px] pb-3">
          <div className="rounded-[8px] px-3.5 py-2.5" style={{ backgroundColor: `${accent}14` }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: accent }}>{CATEGORY_META[category].failedLabel} Reason</p>
            <p className="text-[12px] text-[#374151] leading-[1.5]">{check.reason}</p>
            {check.recommendedAction && (
              <p className="flex items-start gap-1.5 text-[11.5px] font-medium mt-2" style={{ color: accent }}>
                <ArrowRight size={11} className="shrink-0 mt-[2.5px]" />
                <span>Recommended Action: {check.recommendedAction}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// A verified/passed check — simple read-only row, no selection or bypass affordances since there's nothing
// to act on.
function VerifiedCheckRow({ check, category, expanded, onToggleExpand }: { check: ValidationCheck; category: CheckCategory; expanded: boolean; onToggleExpand: () => void }) {
  const meta = CATEGORY_META[category];
  return (
    <div className="border-b border-[#f3f4f6] last:border-b-0">
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left cursor-pointer hover:bg-[#f8fafc] transition-colors"
      >
        <CircleCheck size={15} className="shrink-0 text-[#468657]" />
        <span className="flex-1 min-w-0 text-[12.5px] font-medium text-[#111827] truncate">{check.label}</span>
        <ChevronDown size={13} className={`text-[#9ca3af] transition-transform duration-200 shrink-0 ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="px-4 pt-[2px] pb-3">
          <div className="rounded-[8px] px-3.5 py-2.5" style={{ backgroundColor: "#EFF6F1" }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1 text-[#468657]">{meta.passedLabel} Reason</p>
            <p className="text-[12px] text-[#374151] leading-[1.5]">{check.reason}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const CHECK_COLUMN_THRESHOLD = 5;

// Failed checks for one category, always fully shown since these need attention. The select-all checkbox at the
// top ticks this category's failed rows; selections persist across accordions and feed "Rerun Selected".
function FailedCheckColumn({
  title,
  accent,
  checks,
  expandedIds,
  onToggleExpand,
  canJustify,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onBypass,
  onBypassAll,
}: {
  /** Section heading — "Verification Required" for both categories. */
  title: string;
  /** The section's own colour (red for Order Entry, purple for Order Booking). */
  accent: string;
  checks: ValidationCheck[];
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  /** False for Order Booking: those checks have to be resolved, so Justify / Justify all aren't offered. */
  canJustify: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[], select: boolean) => void;
  onBypass: (id: string, reason: string) => void;
  onBypassAll: (ids: string[], reason: string) => void;
}) {
  const ids = checks.map(c => c.id);
  const allSelected = ids.length > 0 && ids.every(id => selectedIds.has(id));
  // "Bypass all" only ever touches checks that aren't bypassed yet — an existing per-check reason is never
  // overwritten by the shared one.
  const unbypassedIds = checks.filter(c => !c.bypass).map(c => c.id);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState("");
  const submitBulk = () => {
    const reason = bulkReason.trim();
    if (!reason || unbypassedIds.length === 0) return;
    onBypassAll(unbypassedIds, reason);
    setBulkOpen(false);
    setBulkReason("");
  };

  return (
    <div className="rounded-[8px] border border-[#ebebeb]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f3f4f6]">
        <span className="w-[3px] h-[14px] rounded-full shrink-0" style={{ backgroundColor: accent }} />
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: accent }}>{title} ({checks.length})</p>
      </div>
      {checks.length === 0 ? (
        <p className="text-[12px] text-[#9ca3af] text-center py-6">Nothing requires verification.</p>
      ) : (
        <>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#fafafa] border-b border-[#f3f4f6]">
            <Checkbox checked={allSelected} onChange={() => onSelectAll(ids, !allSelected)} />
            <span className="text-[11px] font-medium text-[#6b7280]">Select all</span>
            {canJustify && unbypassedIds.length > 0 && (
              <button
                onClick={() => setBulkOpen(v => !v)}
                className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[11px] font-semibold cursor-pointer transition-colors hover:bg-[#eef0f3]"
                style={{ color: "#30578D" }}
              >
                <ShieldOff size={12} />
                Justify all
              </button>
            )}
          </div>
          {canJustify && bulkOpen && unbypassedIds.length > 0 && (
            <div className="px-4 py-2.5 border-b border-[#f3f4f6]">
              <div className="rounded-[6px] p-2.5 border border-[#E2E6E9] bg-[#F7F7F7] flex flex-col gap-2">
                <p className="text-[11px] text-[#6b7280]">
                  One reason will be recorded against all {unbypassedIds.length} check{unbypassedIds.length === 1 ? "" : "s"} requiring verification that {unbypassedIds.length === 1 ? "is" : "are"} not yet justified. Each one is audited individually.
                </p>
                <textarea
                  autoFocus
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Justification for these checks (required)..."
                  rows={2}
                  className="w-full px-2.5 py-2 rounded-[6px] border border-[#E2E6E9] bg-white text-[12px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors resize-none"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => { setBulkOpen(false); setBulkReason(""); }}
                    className="px-3 py-1.5 rounded-[6px] text-[11.5px] font-semibold text-[#666666] hover:bg-[#EFEFEF] cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!bulkReason.trim()}
                    onClick={submitBulk}
                    className="px-3 py-1.5 rounded-[6px] text-[11.5px] font-semibold text-white cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#30578D" }}
                  >
                    Justify {unbypassedIds.length} check{unbypassedIds.length === 1 ? "" : "s"}
                  </button>
                </div>
              </div>
            </div>
          )}
          <div>
            {checks.map(c => (
              <FailedCheckRow
                key={c.id}
                check={c}
                category={c.category}
                selected={selectedIds.has(c.id)}
                onToggleSelect={() => onToggleSelect(c.id)}
                expanded={expandedIds.has(c.id)}
                onToggleExpand={() => onToggleExpand(c.id)}
                canJustify={canJustify}
                onBypass={(reason) => onBypass(c.id, reason)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Passed checks for one category (same "View More" pattern as before).
function PassedCheckColumn({ checks, expandedIds, onToggleExpand }: { checks: ValidationCheck[]; expandedIds: Set<string>; onToggleExpand: (id: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  const needsToggle = checks.length > CHECK_COLUMN_THRESHOLD;
  const visible = !needsToggle || showAll ? checks : checks.slice(0, CHECK_COLUMN_THRESHOLD);
  const remaining = checks.length - CHECK_COLUMN_THRESHOLD;

  return (
    <div className="rounded-[8px] border border-[#ebebeb]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f3f4f6]">
        <span className="w-[3px] h-[14px] rounded-full shrink-0" style={{ backgroundColor: "#468657" }} />
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#468657" }}>Verified ({checks.length})</p>
      </div>
      <div>
        {visible.map(c => (
          <VerifiedCheckRow key={c.id} check={c} category={c.category} expanded={expandedIds.has(c.id)} onToggleExpand={() => onToggleExpand(c.id)} />
        ))}
      </div>
      {needsToggle && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full text-center py-2.5 text-[12px] font-semibold text-[#30578D] hover:underline cursor-pointer border-t border-[#f3f4f6]"
        >
          {showAll ? "View Less" : `View More (${String(remaining).padStart(2, "0")})`}
        </button>
      )}
    </div>
  );
}

// One accordion per check category (Mandatory / Red Flag). Each holds that category's own Failed and Passed
// lists, so "what's blocking me" and "what needs a look" are separated at the top level instead of being
// mixed together and told apart by an asterisk. A section opens by default whenever something in it needs
// verification (both are required, so neither should hide behind a collapsed header); an all-verified one stays closed.
function CategoryAccordion({
  category,
  open,
  onToggleOpen,
  checks,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onBypass,
  onBypassAll,
}: {
  category: CheckCategory;
  /** Open/closed lives in the parent so it survives rerenders, reruns and collapsing the whole results card. */
  open: boolean;
  onToggleOpen: () => void;
  checks: ValidationCheck[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[], select: boolean) => void;
  onBypass: (id: string, reason: string) => void;
  onBypassAll: (ids: string[], reason: string) => void;
}) {
  const meta = CATEGORY_META[category];
  const failed = checks.filter(c => c.status === "failed");
  const passed = checks.filter(c => c.status === "passed");
  const needsAction = failed.filter(c => !c.bypass).length;
  // One Expand all / Collapse all for both lists in this section (Verification Required and Verified).
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const allExpanded = checks.length > 0 && checks.every(c => expandedIds.has(c.id));
  const toggleOne = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const total = checks.length;
  const Icon = meta.icon;

  return (
    <div className="rounded-[8px] border overflow-hidden" style={{ borderColor: failed.length > 0 ? `${meta.accent}33` : "#ebebeb" }}>
      <button
        onClick={onToggleOpen}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left cursor-pointer hover:brightness-[0.985] transition flex-wrap ${open ? "border-b border-[#f3f4f6]" : ""}`}
        style={{ background: `linear-gradient(135deg, ${meta.accent}${failed.length > 0 ? "12" : "08"}, #ffffff 65%)` }}
      >
        <span className="flex items-center gap-3 min-w-0">
          <ChevronDown size={14} className={`shrink-0 text-[#6b7280] transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
          <span className="size-[36px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.accent}1A` }}>
            <Icon size={17} style={{ color: meta.accent }} />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-bold text-[#111827]">{meta.sectionTitle}</span>
            </span>
            <span className="block text-[11.5px] text-[#6b7280] mt-0.5">
              {meta.sectionHint}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-4 shrink-0">
          <span
            className="hidden sm:inline text-[12px] font-semibold text-[#374151] whitespace-nowrap"
            title={needsAction < failed.length ? `${failed.length - needsAction} check${failed.length - needsAction === 1 ? "" : "s"} requiring verification justified` : undefined}
          >
            {passed.length}/{total} verified
          </span>
          {failed.length > 0 ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold" style={{ color: meta.accent, backgroundColor: `${meta.accent}1A` }}>
              {failed.length} verification required{needsAction < failed.length ? ` · ${needsAction} open` : ""}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold text-[#468657] bg-[#EFF6F1]">
              <Check size={12} /> All verified
            </span>
          )}
        </span>
      </button>
      {open && (
        <div className="p-4 pt-2.5">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setExpandedIds(allExpanded ? new Set() : new Set(checks.map(c => c.id)))}
              className="text-[12px] font-semibold hover:underline cursor-pointer"
              style={{ color: "#30578D" }}
            >
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <FailedCheckColumn
            title="Verification Required"
            accent={meta.accent}
            checks={failed}
            expandedIds={expandedIds}
            onToggleExpand={toggleOne}
            canJustify={meta.canJustify}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onSelectAll={onSelectAll}
            onBypass={onBypass}
            onBypassAll={onBypassAll}
          />
          <PassedCheckColumn checks={passed} expandedIds={expandedIds} onToggleExpand={toggleOne} />
          </div>
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-[8px] border border-[#ebebeb]">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-5 py-4 cursor-pointer ${open ? "border-b border-[#f3f4f6]" : ""}`}
      >
        <ChevronRight size={15} className={`text-[#6b7280] transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
        <h3 className="text-[14px] font-bold text-[#111827]">{title}</h3>
        {badge && <span className="text-[11px] font-medium text-[#9ca3af] bg-[#f3f4f6] px-2 py-0.5 rounded-[8px]">{badge}</span>}
      </button>
      {open && <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>}
    </div>
  );
}

// Feedback on how the AI did across every check — passed and failed alike — in the same spirit as the Feedback
// Center review: thumbs up/down per check, a required reason when it's thumbs-down, and anything left unmarked
// counts as confirmed correct. The draft lives here until Submit; the parent keeps what was last submitted so
// reopening the modal shows it again.
type FeedbackVerdict = "correct" | "incorrect";
type ValidationFeedback = {
  verdicts: Record<string, FeedbackVerdict>;
  reasons: Record<string, string>;
  notes: Record<string, string>;
};

function FeedbackCheckRow({
  check,
  verdict,
  reason,
  note,
  expanded,
  onToggleExpand,
  onVerdict,
  onReason,
  onNote,
}: {
  check: ValidationCheck;
  verdict: FeedbackVerdict | undefined;
  reason: string;
  note: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onVerdict: (v: FeedbackVerdict | undefined) => void;
  onReason: (v: string) => void;
  onNote: (v: string) => void;
}) {
  const failed = check.status === "failed";
  const noteRequired = verdict === "incorrect" && reason === OTHER_REASON;
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
      <div className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer" onClick={onToggleExpand}>
        <ChevronRight size={13} className={`shrink-0 text-[#9ca3af] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-[#111827] truncate">{check.label}</p>
          {verdict === "incorrect" && reason && <p className="text-[10.5px] text-[#9ca3af] truncate">{reason}</p>}
        </div>
        <span
          className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap"
          style={failed ? { color: CATEGORY_META[check.category].accent, backgroundColor: `${CATEGORY_META[check.category].accent}14` } : { color: "#468657", backgroundColor: "#EFF6F1" }}
        >
          {failed ? "Verification Required" : "Verified"}
        </span>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span className="text-[11px] font-medium whitespace-nowrap w-[56px] text-right" style={{ color: verdict === "correct" ? "#468657" : verdict === "incorrect" ? "#BA1C1C" : "#97999B" }}>
            {verdict === "correct" ? "Correct" : verdict === "incorrect" ? "Incorrect" : "Pending"}
          </span>
          {verdict !== "incorrect" && (
            <button
              onClick={() => onVerdict(verdict === "correct" ? undefined : "correct")}
              title="AI got this right"
              className="flex items-center justify-center size-[26px] rounded-[6px] border cursor-pointer transition-colors"
              style={verdict === "correct" ? { borderColor: "#468657", backgroundColor: "#EFF6F1", color: "#468657" } : { borderColor: "#E2E6E9", color: "#666666", backgroundColor: "#fff" }}
            >
              <ThumbsUp size={13} fill={verdict === "correct" ? "#468657" : "none"} />
            </button>
          )}
          {verdict !== "correct" && (
            <button
              onClick={() => onVerdict(verdict === "incorrect" ? undefined : "incorrect")}
              title="AI got this wrong"
              className="flex items-center justify-center size-[26px] rounded-[6px] border cursor-pointer transition-colors"
              style={verdict === "incorrect" ? { borderColor: "#BA1C1C", backgroundColor: "#FDECEA", color: "#BA1C1C" } : { borderColor: "#E2E6E9", color: "#666666", backgroundColor: "#fff" }}
            >
              <ThumbsDown size={13} fill={verdict === "incorrect" ? "#BA1C1C" : "none"} />
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t px-4 py-3.5 flex flex-col gap-3 bg-white/60" style={{ borderColor: verdict === "incorrect" ? "#F3C6C6" : verdict === "correct" ? "#C9E2D1" : "#E2E6E9" }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#97999B]">AI reasoning</p>
            <p className="text-[12.5px] text-[#262626] leading-[1.55] mt-1">{check.reason}</p>
          </div>
          {verdict === "incorrect" && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#97999B]">
                What did the AI get wrong? <span className="text-[#BA1C1C]">(required)</span>
              </p>
              <ReasonSelect value={reason} onChange={onReason} options={WRONG_REASON_OPTIONS} invalid={!reason} />
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#97999B]">
              {noteRequired ? (
                <>
                  Your note <span className="text-[#BA1C1C]">(required for "{OTHER_REASON}")</span>
                </>
              ) : (
                "Your note (optional)"
              )}
            </p>
            <textarea
              value={note}
              onChange={(e) => onNote(e.target.value)}
              rows={2}
              className="mt-1.5 w-full px-3 py-2 rounded-[8px] border bg-[#F7F7F8] text-[12.5px] text-[#262626] outline-none focus:border-[#30578D] focus:bg-white transition-colors resize-y"
              style={{ borderColor: noteRequired && !note.trim() ? "#BA1C1C" : "#E2E6E9" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ValidationFeedbackModal({
  checks,
  versionLabel,
  initial,
  alreadySent,
  onSubmit,
  onClose,
}: {
  checks: ValidationCheck[];
  versionLabel: string;
  initial: ValidationFeedback | undefined;
  alreadySent: boolean;
  onSubmit: (fb: ValidationFeedback) => void;
  onClose: () => void;
}) {
  const [verdicts, setVerdicts] = useState<Record<string, FeedbackVerdict>>(initial?.verdicts ?? {});
  const [reasons, setReasons] = useState<Record<string, string>>(initial?.reasons ?? {});
  const [notes, setNotes] = useState<Record<string, string>>(initial?.notes ?? {});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "failed" | "passed">("all");

  const setVerdict = (id: string, v: FeedbackVerdict | undefined) => {
    setVerdicts(prev => {
      const next = { ...prev };
      if (v) next[id] = v;
      else delete next[id];
      return next;
    });
    if (v === "incorrect") setExpanded(prev => new Set(prev).add(id));
  };
  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const markedCount = checks.filter(c => verdicts[c.id]).length;
  const incorrectCount = checks.filter(c => verdicts[c.id] === "incorrect").length;
  const missing = checks.filter(c => {
    if (verdicts[c.id] !== "incorrect") return false;
    if (!reasons[c.id]) return true;
    return reasons[c.id] === OTHER_REASON && !(notes[c.id] ?? "").trim();
  }).length;
  const failedCount = checks.filter(c => c.status === "failed").length;

  const visible = checks.filter(c => filter === "all" || c.status === filter);

  const submit = () => {
    if (missing > 0) return;
    // Only keep reasons for checks that are actually still marked incorrect.
    const keptReasons: Record<string, string> = {};
    checks.forEach(c => { if (verdicts[c.id] === "incorrect" && reasons[c.id]) keptReasons[c.id] = reasons[c.id]; });
    onSubmit({ verdicts, reasons: keptReasons, notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[860px] max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#DEDEDE] shrink-0">
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-[#262626]">Order Acceptance Validation Feedback</h2>
            <p className="text-[12px] text-[#97999B] mt-0.5">
              {versionLabel} · {checks.length} checks ({failedCount} requiring verification). Thumbs-down only what the AI got wrong. Anything you leave unmarked is submitted as correct.
            </p>
          </div>
          <button onClick={onClose} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-3 border-b border-[#f3f4f6] shrink-0">
          <p className="text-[13px] font-bold text-[#111827]">
            Validate each check <span className="font-normal text-[#9ca3af]">{markedCount} / {checks.length}</span>
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center p-0.5 rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F8]">
              {([["all", "All"], ["failed", "Verification Required"], ["passed", "Verified"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className="px-3 h-[26px] rounded-[6px] text-[12px] font-semibold cursor-pointer transition-colors"
                  style={filter === key ? { backgroundColor: "#fff", color: "#30578D", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#666666" }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setVerdicts(prev => {
                const next = { ...prev };
                checks.forEach(c => { if (!next[c.id]) next[c.id] = "correct"; });
                return next;
              })}
              className="text-[12px] font-semibold hover:underline cursor-pointer"
              style={{ color: "#30578D" }}
            >
              Mark remaining as correct
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 flex flex-col gap-5">
          {(["mandatory", "redFlag"] as const).map(cat => {
            const rows = visible.filter(c => c.category === cat).sort((a, b) => (a.status === b.status ? 0 : a.status === "failed" ? -1 : 1));
            if (rows.length === 0) return null;
            const meta = CATEGORY_META[cat];
            return (
              <div key={cat}>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: meta.accent }}>
                  {meta.sectionTitle} <span className="font-medium text-[#97999B] normal-case tracking-normal">· {rows.length} check{rows.length === 1 ? "" : "s"}</span>
                </p>
                <div className="flex flex-col gap-2">
                  {rows.map(c => (
                    <FeedbackCheckRow
                      key={c.id}
                      check={c}
                      verdict={verdicts[c.id]}
                      reason={reasons[c.id] ?? ""}
                      note={notes[c.id] ?? ""}
                      expanded={expanded.has(c.id)}
                      onToggleExpand={() => toggleExpand(c.id)}
                      onVerdict={(v) => setVerdict(c.id, v)}
                      onReason={(r) => setReasons(prev => ({ ...prev, [c.id]: r }))}
                      onNote={(n) => setNotes(prev => ({ ...prev, [c.id]: n }))}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {visible.length === 0 && <p className="text-[12.5px] text-[#97999B] text-center py-8">No checks in this view.</p>}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-3.5 border-t border-[#DEDEDE] shrink-0">
          {missing > 0 ? (
            <p className="flex items-center gap-1.5 text-[12px] text-[#BA1C1C]">
              <AlertCircle size={14} className="shrink-0" />
              Pick a reason{missing > 1 ? "s" : ""} for {missing} check{missing > 1 ? "s" : ""} marked incorrect before submitting.
            </p>
          ) : (
            <p className="text-[12px] text-[#9ca3af]">
              {incorrectCount > 0 ? `${incorrectCount} check${incorrectCount > 1 ? "s" : ""} flagged as incorrect.` : "Nothing flagged. All checks will be submitted as correct."}
            </p>
          )}
          <div className="flex items-center gap-2.5">
            <button onClick={onClose} className="px-4 h-[36px] rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={missing > 0}
              className="px-5 h-[36px] rounded-[8px] text-[13px] font-semibold text-white transition-opacity enabled:hover:opacity-90 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: "#30578D" }}
            >
              {alreadySent ? "Update feedback" : "Submit feedback"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AiOrderValidationBody({ emailId, withPageLoader, onGateChange, onAudit }: {
  emailId: string;
  /** Same page-level loading overlay WorkflowPage's footer actions (Save, Back, ...) use, passed down so
      the in-section Rerun button gets the same loading UX instead of inventing its own. */
  withPageLoader?: (label: string, action: () => void) => void;
  /** AISO-658 AC7/AC9-12 — reports whether Proceed should be blocked: true whenever any Mandatory check is
      failed and not bypassed. Red Flag checks never affect this. WorkflowPage owns the Proceed button, so it
      needs this to disable it — the gating state itself lives here, next to the checks it's derived from. */
  onGateChange?: (gate: { canProceed: boolean; blockingCount: number }) => void;
  onAudit?: (entry: ValidationAuditEntry) => void;
}) {
  const { data: validation, loading, error, reload } = useOrderValidation(emailId);
  const [resultsOpen, setResultsOpen] = useState(true);
  // undefined = "use the default" (a section opens by itself when it has checks needing verification); set once the user toggles one.
  const [categoryOpen, setCategoryOpen] = useState<Partial<Record<CheckCategory, boolean>>>({});
  const [freightTerms, setFreightTerms] = useState("");
  const [freightTermsFilled, setFreightTermsFilled] = useState(false);
  const [discountApproval, setDiscountApproval] = useState("");
  const [discountApprovalFilled, setDiscountApprovalFilled] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; size: string } | null>(null);

  // Versioning — each Re-Validate snapshots the currently-displayed data into `versions` before replacing
  // it with a freshly regenerated result, so every prior run stays browsable via the Version History modal.
  const [versions, setVersions] = useState<ValidationVersion[]>([]);
  const [overrideData, setOverrideData] = useState<OrderValidationData | null>(null);
  const [currentVersionNumber, setCurrentVersionNumber] = useState(1);
  const [currentVersionAt, setCurrentVersionAt] = useState(() => new Date());
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [versionsModalOpen, setVersionsModalOpen] = useState(false);
  // Feedback on the check results, kept per version since a re-validation produces a different set of results.
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackByVersion, setFeedbackByVersion] = useState<Record<number, ValidationFeedback>>({});
  // Field changes committed while the current (not-yet-superseded) version is active — rolled into that
  // version's `changes` and reset once Re-Validate closes it out and opens the next one.
  const [currentVersionChanges, setCurrentVersionChanges] = useState<FieldChange[]>([]);
  const latestData = overrideData ?? validation;

  // AISO-603/652 — checks currently ticked for a bulk rerun; always a subset of currently-failed ids.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const logFieldChange = (label: string, icon: LucideIcon) => {
    setCurrentVersionChanges(prev => [...prev, { label, icon, at: new Date() }]);
  };

  // Mutates a single check in place without touching versions/timestamps — bypassing is documentation, not a
  // revalidation run (AISO-652 AC4: "Saving or updating a justification shall not trigger OA revalidation").
  const updateCheck = (id: string, updater: (c: ValidationCheck) => ValidationCheck) => {
    if (!latestData) return;
    setOverrideData({ ...latestData, checks: latestData.checks.map(c => (c.id === id ? updater(c) : c)) });
  };

  const handleBypass = (id: string, reason: string) => {
    const check = latestData?.checks.find(c => c.id === id);
    if (!check) return;
    updateCheck(id, c => ({ ...c, bypass: { reason, by: "Jagdish K.", at: new Date().toLocaleString("en-US", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true }) } }));
    onAudit?.({
      action: check.category === "mandatory" ? "Mandatory Check Justified" : "Red Flag Check Justified",
      icon: ShieldOff,
      detail: `${check.label}: ${reason}`,
    });
    toast.success(`Justified "${check.label}"`);
  };

  // Same rules as a single bypass (non-empty reason, no revalidation, audited), applied in one state update.
  // Each check still gets its own audit entry so the trail shows exactly which checks were bypassed.
  const handleBypassAll = (ids: string[], reason: string) => {
    if (!latestData) return;
    const targets = latestData.checks.filter(c => ids.includes(c.id) && !c.bypass);
    if (targets.length === 0) return;
    const at = new Date().toLocaleString("en-US", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
    const targetIds = new Set(targets.map(c => c.id));
    setOverrideData({
      ...latestData,
      checks: latestData.checks.map(c => (targetIds.has(c.id) ? { ...c, bypass: { reason, by: "Jagdish K.", at } } : c)),
    });
    targets.forEach(check =>
      onAudit?.({
        action: check.category === "mandatory" ? "Mandatory Check Justified" : "Red Flag Check Justified",
        icon: ShieldOff,
        detail: `${check.label}: ${reason} (bulk justification)`,
      })
    );
    toast.success(`Justified ${targets.length} check${targets.length === 1 ? "" : "s"}`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAllFailed = (ids: string[], select: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => (select ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const revalidate = (targetIds: string[], label: string) => {
    if (!latestData) return;
    // Sentinels resolved here (rather than by the caller) since only this scope knows the current failed/
    // selected sets — keeps RerunSplitButton itself free of any check-data knowledge.
    const allFailedIds = latestData.checks.filter(c => c.status === "failed").map(c => c.id);
    const resolvedIds =
      targetIds[0] === "__all__" ? latestData.checks.map(c => c.id) :
      targetIds[0] === "__failed__" ? allFailedIds :
      targetIds[0] === "__selected__" ? Array.from(selectedIds) :
      targetIds;
    if (resolvedIds.length === 0) return;

    setVersions(prev => [...prev, { version: currentVersionNumber, at: currentVersionAt, data: latestData, changes: currentVersionChanges }]);
    const next = regenerateValidation(latestData, resolvedIds);
    setOverrideData(next);
    setCurrentVersionNumber(n => n + 1);
    setCurrentVersionAt(new Date());
    setCurrentVersionChanges([]);
    setViewingVersion(null);
    setSelectedIds(new Set());
    const stillFailed = next.checks.filter(c => c.status === "failed").length;
    onAudit?.({
      action: `Re-Validated (${label})`,
      icon: RotateCcw,
      detail: `Version ${currentVersionNumber + 1} generated: ${resolvedIds.length} check${resolvedIds.length === 1 ? "" : "s"} targeted, ${stillFailed} still outstanding`,
    });
    toast.success(`Re-validated ${label.toLowerCase()}, now viewing version ${currentVersionNumber + 1}`);
  };

  const handleRerun = (targetIds: string[], label: string) => {
    const loaderLabel = `Re-validating ${label.toLowerCase()}...`;
    if (withPageLoader) withPageLoader(loaderLabel, () => revalidate(targetIds, label));
    else revalidate(targetIds, label);
  };

  // AISO-658 gating — recomputed from `latestData` (the real current state), not whatever historical version
  // is being browsed, since Proceed always acts on the latest state regardless of what's on screen.
  useEffect(() => {
    if (!latestData) return;
    const blocking = latestData.checks.filter(c => c.category === "mandatory" && c.status === "failed" && !c.bypass);
    onGateChange?.({ canProceed: blocking.length === 0, blockingCount: blocking.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestData]);

  if (loading || error) {
    return (
      <div className="bg-white rounded-[8px] border border-[#ebebeb] flex items-center justify-center py-20">
        {error ? (
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <p className="text-[14px] font-semibold text-[#111827]">Couldn't load validation results</p>
            <p className="text-[12.5px] text-[#9ca3af] max-w-[360px]">{error}</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : (
          <WaveLoader size={40} />
        )}
      </div>
    );
  }

  // `overrideData`/`validation` guaranteed non-null past the loading/error guard above.
  const displayedData = viewingVersion !== null ? (versions.find(ver => ver.version === viewingVersion)?.data ?? latestData!) : latestData!;
  const v = displayedData;
  const isViewingHistory = viewingVersion !== null;
  // Overall status shown beside the section title: "Validating" while any check still needs verification (failed and
  // not justified), "Completed" once nothing is outstanding.
  const verifying = v.checks.some(c => c.status === "failed" && !c.bypass);
  const mandatoryChecks = v.checks.filter(c => c.category === "mandatory");
  const redFlagChecks = v.checks.filter(c => c.category === "redFlag");

  return (
    <>
    {isViewingHistory && (
      <div className="mb-4 flex items-center justify-between gap-3 rounded-[8px] px-4 py-2.5" style={{ backgroundColor: "#FDF3E7" }}>
        <p className="text-[12px] font-medium" style={{ color: "#92600B" }}>
          Viewing Version {viewingVersion} (read-only) · {formatVersionDateTime(versions.find(ver => ver.version === viewingVersion)?.at ?? currentVersionAt)}
        </p>
        <button onClick={() => setViewingVersion(null)} className="text-[11.5px] font-semibold underline cursor-pointer shrink-0" style={{ color: "#92600B" }}>
          Back to Latest
        </button>
      </div>
    )}
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      {/* Left: check results + collapsed secondary sections */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-[8px] border border-[#ebebeb]">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setResultsOpen(v => !v)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setResultsOpen(v => !v); }}
            className={`w-full flex items-center justify-between gap-2 px-5 py-4 cursor-pointer flex-wrap ${resultsOpen ? "border-b border-[#f3f4f6]" : ""}`}
          >
            <div className="flex items-center gap-2">
              <ChevronDown size={15} className={`shrink-0 text-[#6b7280] transition-transform duration-200 ${resultsOpen ? "" : "-rotate-90"}`} />
              <h3 className="text-[14px] font-bold text-[#111827]">Order Acceptance Validation</h3>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
                style={verifying ? { color: "#30578D", backgroundColor: "#EAF1FB" } : { color: "#468657", backgroundColor: "#EFF6F1" }}
              >
                {verifying ? <span className="size-[6px] rounded-full animate-pulse" style={{ backgroundColor: "#30578D" }} /> : <Check size={12} strokeWidth={3} />}
                {verifying ? "Validating" : "Completed"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setFeedbackOpen(true); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-[#e5e7eb] text-[11.5px] font-semibold text-[#374151] hover:bg-[#f8fafc] cursor-pointer transition-colors shrink-0"
              >
                {feedbackByVersion[viewingVersion ?? currentVersionNumber] ? <Check size={12} style={{ color: "#468657" }} /> : <MessageSquare size={12} />}
                {feedbackByVersion[viewingVersion ?? currentVersionNumber] ? "Feedback sent" : "Feedback"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setVersionsModalOpen(true); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-[#e5e7eb] text-[11.5px] font-semibold text-[#374151] hover:bg-[#f8fafc] cursor-pointer transition-colors shrink-0"
              >
                <Clock size={12} />
                {isViewingHistory ? `Version ${viewingVersion}` : `Version ${currentVersionNumber} (Latest)`}
                <ChevronDown size={11} />
              </button>
              <RerunSplitButton selectedCount={selectedIds.size} onSelect={handleRerun} />
            </div>
          </div>
          {resultsOpen && (
            <div className="px-5 py-5 flex flex-col gap-3">
              {(["mandatory", "redFlag"] as const).map(cat => {
                const catChecks = v.checks.filter(c => c.category === cat);
                const defaultOpen = catChecks.some(c => c.status === "failed");
                const open = categoryOpen[cat] ?? defaultOpen;
                return (
                <CategoryAccordion
                  key={cat}
                  category={cat}
                  open={open}
                  onToggleOpen={() => setCategoryOpen(prev => ({ ...prev, [cat]: !open }))}
                  checks={catChecks}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onSelectAll={selectAllFailed}
                  onBypass={handleBypass}
                  onBypassAll={handleBypassAll}
                />
                );
              })}
            </div>
          )}
        </div>

        <CollapsibleSection title="PO Parsing Results" badge={`${v.poParsing.matched}/${v.poParsing.total} matched`}>
          <TextField label="PO Number" variant="matched" value={v.poParsing.poNumber} readOnly />
          <TextField label="Line Items" variant="matched" value={v.poParsing.lineItems} readOnly />
          <TextField label="Ship-To Address" variant="matched" value={v.poParsing.shipToAddress} readOnly />
          <TextField
            label="Freight Terms"
            variant={freightTermsFilled ? "matched" : "missing"}
            manuallyFilled={freightTermsFilled}
            value={freightTerms}
            onChange={setFreightTerms}
            onBlur={() => {
              if (!freightTerms.trim()) return;
              setFreightTermsFilled(true);
              onAudit?.({ action: "Field Updated", icon: Check, detail: `Freight Terms: → ${freightTerms}` });
              logFieldChange(`Freight Terms: → ${freightTerms}`, Check);
            }}
            placeholder="Select to apply or type"
            readOnly={isViewingHistory}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Sales Force - Manager Quotes" badge={`${v.salesForceQuote.matched}/${v.salesForceQuote.total} matched`}>
          <TextField label="Quote Number" variant="matched" value={v.salesForceQuote.quoteNumber} readOnly />
          <TextField label="Quote Owner" variant="matched" value={v.salesForceQuote.quoteOwner} readOnly />
          <TextField label="Approval Status" variant="matched" value={v.salesForceQuote.approvalStatus} readOnly />
          <TextField
            label="Discount Approval"
            variant={discountApprovalFilled ? "matched" : "missing"}
            manuallyFilled={discountApprovalFilled}
            value={discountApproval}
            onChange={setDiscountApproval}
            onBlur={() => {
              if (!discountApproval.trim()) return;
              setDiscountApprovalFilled(true);
              onAudit?.({ action: "Field Updated", icon: Check, detail: `Discount Approval: → ${discountApproval}` });
              logFieldChange(`Discount Approval: → ${discountApproval}`, Check);
            }}
            placeholder="Select to apply or type"
            readOnly={isViewingHistory}
          />
        </CollapsibleSection>
      </div>

      {/* Right: check summary + ship-to + documents */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-[8px] border border-[#ebebeb] px-4 py-3">
          <h3 className="text-[16px] font-bold leading-tight" style={{ color: "#30578D" }}>Validation Checks</h3>
          <p className="text-[12px] font-medium text-[#6b7280] mt-0.5 mb-3">Trade Order</p>
          <div className="flex flex-col divide-y divide-[#f3f4f6]">
            {([
              { cat: "mandatory" as const, title: "Mandatory Checks (Order Entry)", checks: mandatoryChecks, requiredLabel: "Verification Required (Before Order Entry)" },
              { cat: "redFlag" as const, title: "Mandatory Checks (Order Booking)", checks: redFlagChecks, requiredLabel: "Verification Required (Before Order Booking)" },
            ]).map(({ cat, title, checks, requiredLabel }) => {
              const verified = checks.filter(c => c.status === "passed").length;
              const required = checks.filter(c => c.status === "failed").length;
              const clear = required === 0;
              const accent = CATEGORY_META[cat].accent; // red for Order Entry, purple for Order Booking, same as the sections below
              const fg = clear ? "#468657" : accent;
              const bg = clear ? "#EFF6F1" : `${accent}14`;
              return (
                <div key={cat} className="py-2 first:pt-0">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#97999B] mb-1.5">{title}</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-[8px] bg-[#EFF6F1] px-3 py-2.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <CircleCheck size={20} className="text-[#468657] shrink-0" />
                        <span className="text-[24px] font-bold text-[#468657] leading-none">{verified}/{checks.length}</span>
                      </div>
                      <p className="text-[12px] font-semibold text-[#468657] mt-1.5 leading-tight">Verified</p>
                    </div>
                    <div className="rounded-[8px] px-3 py-2.5 min-w-0" style={{ backgroundColor: bg }}>
                      <div className="flex items-center gap-2">
                        {clear ? <CircleCheck size={20} className="shrink-0" style={{ color: fg }} /> : <TriangleAlert size={20} className="shrink-0" style={{ color: accent }} />}
                        <span className="text-[24px] font-bold leading-none" style={{ color: fg }}>{required}</span>
                      </div>
                      <p className="text-[12px] font-semibold mt-1.5 leading-tight" style={{ color: fg }}>{clear ? "Nothing to verify" : requiredLabel}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[#9ca3af] mt-2.5 pt-2.5 border-t border-[#f3f4f6]">
            Screening completed <span className="font-semibold text-[#111827]">{v.screeningCompletedAt}</span>
          </p>
        </div>

        <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
          <h3 className="text-[14px] font-bold text-[#111827]">Ship To</h3>
          <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">Products shipping address</p>
          <div className="flex items-start gap-3 rounded-[8px] bg-[#f7f8fa] px-3.5 py-3">
            <div className="size-[34px] rounded-[8px] bg-[#EAF1FB] flex items-center justify-center shrink-0">
              <MapPin size={16} className="text-[#30578D]" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#111827] truncate">{v.shipTo.company}</p>
              <p className="text-[12px] text-[#6b7280] mt-1 leading-[1.6]">
                {v.shipTo.address}<br />
                {v.shipTo.cityState}<br />
                {v.shipTo.country}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
          {/* The OA validation summary is generated from the results being shown (so it follows the version in view),
              and sits first so it's the easy one to find among the order's own attached files. */}
          {(() => {
            const summaryVersion = viewingVersion ?? currentVersionNumber;
            const docs: { name: string; size: string; generated?: boolean }[] = [
              { name: `OA_Validation_Summary_v${summaryVersion}.pdf`, size: "184 KB", generated: true },
              ...v.documents,
            ];
            return (
              <>
                <h3 className="text-[14px] font-bold text-[#111827]">Documents</h3>
                <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">{docs.length} file{docs.length !== 1 ? "s" : ""} attached</p>
                <div className="flex flex-col gap-2">
                  {docs.map(doc => {
                    const meta = docMeta(doc.name);
                    return (
                      <button
                        key={doc.name}
                        onClick={() => setPreviewAttachment(doc)}
                        className="group flex items-center gap-2.5 px-3 py-2 rounded-[8px] border border-[#ebebeb] hover:border-[#d1d5db] hover:bg-[#f8fafc] cursor-pointer transition-colors text-left w-full"
                      >
                        <div className="size-[32px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg }}>
                          <meta.icon size={15} style={{ color: meta.fg }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[12.5px] font-medium text-[#111827] truncate">{doc.name}</span>
                            {doc.generated && (
                              <span className="shrink-0 px-1.5 py-[1px] rounded-[4px] text-[9.5px] font-bold uppercase tracking-wide" style={{ color: "#30578D", backgroundColor: "#EAF1FB" }}>
                                Summary
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#9ca3af]">
                            {doc.size}
                            {doc.generated && <> · Generated {v.screeningCompletedAt}</>}
                          </p>
                        </div>
                        <Download
                          size={14}
                          className="text-[#9ca3af] group-hover:text-[#111827] cursor-pointer transition-colors shrink-0"
                          onClick={(e) => { e.stopPropagation(); toast.info(`Downloading ${doc.name}`); }}
                        />
                      </button>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
    <AttachmentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    {feedbackOpen && (
      <ValidationFeedbackModal
        checks={v.checks}
        versionLabel={isViewingHistory ? `Version ${viewingVersion}` : `Version ${currentVersionNumber} (Latest)`}
        initial={feedbackByVersion[viewingVersion ?? currentVersionNumber]}
        alreadySent={Boolean(feedbackByVersion[viewingVersion ?? currentVersionNumber])}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={(fb) => {
          const version = viewingVersion ?? currentVersionNumber;
          const flagged = v.checks.filter(c => fb.verdicts[c.id] === "incorrect").length;
          setFeedbackByVersion(prev => ({ ...prev, [version]: fb }));
          setFeedbackOpen(false);
          onAudit?.({
            action: "Validation Feedback Submitted",
            icon: MessageSquare,
            detail: `Version ${version}: ${flagged > 0 ? `${flagged} check${flagged === 1 ? "" : "s"} marked incorrect` : "all checks confirmed correct"}`,
          });
          toast.success(flagged > 0 ? `Feedback submitted: ${flagged} check${flagged === 1 ? "" : "s"} flagged as incorrect` : "Feedback submitted: all checks confirmed correct");
        }}
      />
    )}
    {versionsModalOpen && (
      <VersionHistoryModal
        versions={versions}
        currentVersionNumber={currentVersionNumber}
        currentAt={currentVersionAt}
        currentChanges={currentVersionChanges}
        viewingVersion={viewingVersion}
        onSelectVersion={setViewingVersion}
        onClose={() => setVersionsModalOpen(false)}
      />
    )}
    </>
  );
}
