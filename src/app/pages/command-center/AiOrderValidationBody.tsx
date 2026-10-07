import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Archive, ArrowRight, Check, ChevronDown, ChevronRight, CircleCheck, CircleX, Clock, Download, FileImage, FileSpreadsheet, FileText, Info, MapPin, RotateCcw, ShieldOff, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { TextField } from "../../components/common/TextField";
import { WaveLoader } from "../../components/common/Loader";
import { Button } from "../../components/common/Button";
import { EmailTableTooltip } from "../../components/common/EmailTable";
import { AttachmentPreviewModal } from "../../components/common/AttachmentPreviewModal";
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
const CATEGORY_META: Record<CheckCategory, { tag: string; accent: string; failedLabel: string; passedLabel: string; blocking: boolean }> = {
  mandatory: { tag: "Mandatory", accent: "#BA1C1C", failedLabel: "Verification Required", passedLabel: "Verified", blocking: true },
  redFlag: { tag: "Red Flag", accent: "#E67919", failedLabel: "Review Required", passedLabel: "Passed", blocking: false },
};

// The Mandatory/Red Flag table only tells the app how each check *behaves* (does it block Proceed, can it
// be bypassed) — the results themselves stay in one combined Failed/Passed layout rather than being split
// into separate category sections, with this asterisk — colored by category, attached right at the end of
// the name (not a separate pill off to the side) — as the only visual sign of which type a row is. A legend
// under the results header (see LEGEND below) spells out what each color means.
function CategoryMark({ category }: { category: CheckCategory }) {
  return <span className="font-bold" style={{ color: CATEGORY_META[category].accent }} title={CATEGORY_META[category].tag}> *</span>;
}

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
            onClick={(e) => { e.stopPropagation(); onSelect(["__failed__"], "Failed Checks Only"); setOpen(false); }}
            className="w-full text-left px-3.5 py-2 text-[12.5px] font-medium text-[#374151] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
          >
            Rerun Failed Checks Only
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
  onBypass,
}: {
  check: ValidationCheck;
  category: CheckCategory;
  selected: boolean;
  onToggleSelect: () => void;
  onBypass: (reason: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
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
        <button onClick={() => setExpanded(v => !v)} className="flex-1 min-w-0 flex items-center gap-2.5 text-left cursor-pointer">
          <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-[#111827] truncate">{check.label}<CategoryMark category={category} /></span>
        </button>
        {!check.bypass && (
          <EmailTableTooltip label="Bypass with Reason">
            <button
              onClick={(e) => { e.stopPropagation(); setBypassFormOpen(v => !v); }}
              className="shrink-0 flex items-center justify-center size-[26px] rounded-[6px] text-[#9ca3af] hover:text-[#30578D] hover:bg-[#eef0f3] cursor-pointer transition-colors"
            >
              <ShieldOff size={12} />
            </button>
          </EmailTableTooltip>
        )}
        <button onClick={() => setExpanded(v => !v)} className="shrink-0 cursor-pointer">
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
                <p className="text-[11.5px] text-[#374151] leading-[1.4]"><span className="font-semibold" style={{ color: "#30578D" }}>Bypassed:</span> {check.bypass.reason}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#30578DCC" }}>{check.bypass.by} · {check.bypass.at}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-[6px] p-2.5 border border-[#E2E6E9] bg-[#F7F7F7] flex flex-col gap-2">
              <textarea
                autoFocus
                value={reasonDraft}
                onChange={(e) => setReasonDraft(e.target.value)}
                placeholder="Reason for bypassing this check (required)..."
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
                  Confirm Bypass
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div className="px-4 pt-[2px] pb-3">
          <div className="rounded-[8px] px-3.5 py-2.5" style={{ backgroundColor: `${accent}14` }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: accent }}>{CATEGORY_META[category].failedLabel} — Reason</p>
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
function VerifiedCheckRow({ check, category }: { check: ValidationCheck; category: CheckCategory }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[category];
  return (
    <div className="border-b border-[#f3f4f6] last:border-b-0">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left cursor-pointer hover:bg-[#f8fafc] transition-colors"
      >
        <CircleCheck size={15} className="shrink-0 text-[#468657]" />
        <span className="flex-1 min-w-0 text-[12.5px] font-medium text-[#111827] truncate">{check.label}<CategoryMark category={category} /></span>
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

// Left column — every failed check regardless of category (Mandatory and Red Flag mixed together, each row
// tagged so you can still tell them apart), always fully shown since these need attention. A select-all
// checkbox at the top drives the "Rerun Selected" action across both categories at once.
function FailedCheckColumn({
  checks,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onBypass,
  onBypassAll,
}: {
  checks: ValidationCheck[];
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
        <span className="w-[3px] h-[14px] rounded-full shrink-0" style={{ backgroundColor: "#BA1C1C" }} />
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#BA1C1C" }}>Failed & Needs Attention ({checks.length})</p>
      </div>
      {checks.length === 0 ? (
        <p className="text-[12px] text-[#9ca3af] text-center py-6">No failed checks.</p>
      ) : (
        <>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#fafafa] border-b border-[#f3f4f6]">
            <Checkbox checked={allSelected} onChange={() => onSelectAll(ids, !allSelected)} />
            <span className="text-[11px] font-medium text-[#6b7280]">Select all</span>
            {unbypassedIds.length > 0 && (
              <button
                onClick={() => setBulkOpen(v => !v)}
                className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[11px] font-semibold cursor-pointer transition-colors hover:bg-[#eef0f3]"
                style={{ color: "#30578D" }}
              >
                <ShieldOff size={12} />
                Bypass all with reason
              </button>
            )}
          </div>
          {bulkOpen && unbypassedIds.length > 0 && (
            <div className="px-4 py-2.5 border-b border-[#f3f4f6]">
              <div className="rounded-[6px] p-2.5 border border-[#E2E6E9] bg-[#F7F7F7] flex flex-col gap-2">
                <p className="text-[11px] text-[#6b7280]">
                  One reason will be recorded against all {unbypassedIds.length} failed check{unbypassedIds.length === 1 ? "" : "s"} not yet bypassed. Each one is audited individually.
                </p>
                <textarea
                  autoFocus
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Reason for bypassing these checks (required)..."
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
                    Bypass {unbypassedIds.length} check{unbypassedIds.length === 1 ? "" : "s"}
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
                onBypass={(reason) => onBypass(c.id, reason)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Right column — every passed check, both categories mixed together (same "View More" pattern as before).
function PassedCheckColumn({ checks }: { checks: ValidationCheck[] }) {
  const [showAll, setShowAll] = useState(false);
  const needsToggle = checks.length > CHECK_COLUMN_THRESHOLD;
  const visible = !needsToggle || showAll ? checks : checks.slice(0, CHECK_COLUMN_THRESHOLD);
  const remaining = checks.length - CHECK_COLUMN_THRESHOLD;

  return (
    <div className="rounded-[8px] border border-[#ebebeb]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f3f4f6]">
        <span className="w-[3px] h-[14px] rounded-full shrink-0" style={{ backgroundColor: "#468657" }} />
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#468657" }}>Passed ({checks.length})</p>
      </div>
      <div>
        {visible.map(c => (
          <VerifiedCheckRow key={c.id} check={c} category={c.category} />
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
      action: check.category === "mandatory" ? "Mandatory Check Bypassed" : "Red Flag Check Bypassed",
      icon: ShieldOff,
      detail: `${check.label} — ${reason}`,
    });
    toast.success(`Bypassed "${check.label}"`);
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
        action: check.category === "mandatory" ? "Mandatory Check Bypassed" : "Red Flag Check Bypassed",
        icon: ShieldOff,
        detail: `${check.label} — ${reason} (bulk bypass)`,
      })
    );
    toast.success(`Bypassed ${targets.length} check${targets.length === 1 ? "" : "s"}`);
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
      detail: `Version ${currentVersionNumber + 1} generated — ${resolvedIds.length} check${resolvedIds.length === 1 ? "" : "s"} targeted, ${stillFailed} still outstanding`,
    });
    toast.success(`Re-validated ${label.toLowerCase()} — now viewing version ${currentVersionNumber + 1}`);
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
  const totalChecks = v.checks.length;
  const verifiedCount = v.checks.filter(c => c.status === "passed").length;
  const mandatoryChecks = v.checks.filter(c => c.category === "mandatory");
  const redFlagChecks = v.checks.filter(c => c.category === "redFlag");
  const mandatoryRequiredCount = mandatoryChecks.filter(c => c.status === "failed").length;
  const redFlagRequiredCount = redFlagChecks.filter(c => c.status === "failed").length;

  return (
    <>
    {isViewingHistory && (
      <div className="mb-4 flex items-center justify-between gap-3 rounded-[8px] px-4 py-2.5" style={{ backgroundColor: "#FDF3E7" }}>
        <p className="text-[12px] font-medium" style={{ color: "#92600B" }}>
          Viewing Version {viewingVersion} (read-only) — {formatVersionDateTime(versions.find(ver => ver.version === viewingVersion)?.at ?? currentVersionAt)}
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
              <ChevronDown size={15} className={`text-[#6b7280] transition-transform duration-200 ${resultsOpen ? "" : "-rotate-90"}`} />
              <h3 className="text-[14px] font-bold text-[#111827]">OA Validation Results</h3>
            </div>
            <div className="flex items-center gap-3">
              <p className="flex items-center gap-1.5 text-[11.5px] text-[#9ca3af]">
                <Info size={12} className="shrink-0" /> {totalChecks} checks by Oracle · click any check to see its reason
              </p>
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
            <div className="px-5 py-5 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              <div className="flex flex-col gap-2">
                <FailedCheckColumn
                  checks={v.checks.filter(c => c.status === "failed")}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onSelectAll={selectAllFailed}
                  onBypass={handleBypass}
                  onBypassAll={handleBypassAll}
                />
                <p className="text-[11px] text-[#6b7280] px-1">
                  <span className="font-bold" style={{ color: CATEGORY_META.mandatory.accent }}>(*)</span> Mandatory
                  <span className="ml-3 font-bold" style={{ color: CATEGORY_META.redFlag.accent }}>(*)</span> Red Flag
                </p>
              </div>
              <PassedCheckColumn checks={v.checks.filter(c => c.status === "passed")} />
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
        <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
          <h3 className="text-[14px] font-bold text-[#111827]">Validation Checks</h3>
          <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">Overview by category.</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[8px] bg-[#EFF6F1] px-2.5 py-3 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <CircleCheck size={18} className="text-[#468657] shrink-0" />
                <span className="text-[20px] font-bold text-[#468657] leading-none">{verifiedCount}/{totalChecks}</span>
              </div>
              <span className="text-[10.5px] font-medium text-[#6b7280] text-center leading-tight">Verified</span>
            </div>
            <div className="rounded-[8px] bg-[#FDECEA] px-2.5 py-3 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <CircleX size={18} className="text-[#BA1C1C] shrink-0" />
                <span className="text-[20px] font-bold text-[#BA1C1C] leading-none">{mandatoryRequiredCount}</span>
              </div>
              <span className="text-[10.5px] font-medium text-[#6b7280] text-center leading-tight">Verification Required</span>
            </div>
            <div className="rounded-[8px] bg-[#FDF3E7] px-2.5 py-3 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <TriangleAlert size={18} className="text-[#E67919] shrink-0" />
                <span className="text-[20px] font-bold text-[#92600B] leading-none">{redFlagRequiredCount}</span>
              </div>
              <span className="text-[10.5px] font-medium text-[#6b7280] text-center leading-tight">Review Required</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#f3f4f6]">
            <div>
              <p className="text-[10.5px] text-[#9ca3af]">Screening Started</p>
              <p className="text-[12.5px] font-semibold text-[#111827] mt-0.5">{v.screeningStartedAt}</p>
            </div>
            <div>
              <p className="text-[10.5px] text-[#9ca3af]">Screening Completed</p>
              <p className="text-[12.5px] font-semibold text-[#111827] mt-0.5">{v.screeningCompletedAt}</p>
            </div>
          </div>
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
          <h3 className="text-[14px] font-bold text-[#111827]">Documents</h3>
          <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">{v.documents.length} file{v.documents.length !== 1 ? "s" : ""} attached</p>
          <div className="flex flex-col gap-2">
            {v.documents.map(doc => {
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
                    <p className="text-[12.5px] font-medium text-[#111827] truncate">{doc.name}</p>
                    <p className="text-[11px] text-[#9ca3af]">{doc.size}</p>
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
        </div>
      </div>
    </div>
    <AttachmentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
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
