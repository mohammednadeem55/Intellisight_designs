import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Archive, ArrowRight, Check, ChevronDown, ChevronRight, CircleCheck, CircleX, Clock, Download, FileImage, FileSpreadsheet, FileText, Info, MapPin, RotateCcw, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { TextField } from "../../components/common/TextField";
import { WaveLoader } from "../../components/common/Loader";
import { Button } from "../../components/common/Button";
import { AttachmentPreviewModal } from "../../components/common/AttachmentPreviewModal";
import { useOrderValidation, regenerateValidation, type CheckStatus, type OrderValidationData, type ValidationCheck } from "./useOrderValidation";

export type ValidationAuditEntry = { action: string; icon?: LucideIcon; detail?: string };
// A field change made while a given version was the active one — e.g. committing Freight Terms. Kept
// separate from the check-result snapshot itself so "what changed" reads as a distinct line from "what the
// checks looked like".
type FieldChange = { label: string; icon?: LucideIcon; at: Date };
type ValidationVersion = { version: number; at: Date; data: OrderValidationData; changes: FieldChange[] };

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

const CHECK_META: Record<CheckStatus, { Icon: typeof CircleCheck; color: string; panelBg: string; reasonLabel: string }> = {
  failed: { Icon: CircleX, color: "#BA1C1C", panelBg: "#FDECEA", reasonLabel: "Failed Reason" },
  warning: { Icon: TriangleAlert, color: "#E67919", panelBg: "#FDF3E7", reasonLabel: "Needs Review Reason" },
  passed: { Icon: CircleCheck, color: "#468657", panelBg: "#EFF6F1", reasonLabel: "Passed Reason" },
};

// One check row — collapsed to icon + label by default, expands in place to show why it passed/failed and
// (for failed/review checks) a recommended next step.
function ValidationCheckItem({ check }: { check: ValidationCheck }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CHECK_META[check.status];

  return (
    <div className="border-b border-[#f3f4f6] last:border-b-0">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left cursor-pointer hover:bg-[#f8fafc] transition-colors"
      >
        <meta.Icon size={15} className="shrink-0" style={{ color: meta.color }} />
        <span className="flex-1 min-w-0 text-[12.5px] font-medium text-[#111827] truncate">{check.label}</span>
        <ChevronDown size={13} className={`text-[#9ca3af] transition-transform duration-200 shrink-0 ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="px-4 pt-[10px] pb-3">
          <div className="rounded-[8px] px-3.5 py-2.5" style={{ backgroundColor: meta.panelBg }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: meta.color }}>{meta.reasonLabel}</p>
            <p className="text-[12px] text-[#374151] leading-[1.5]">{check.reason}</p>
            {check.recommendedAction && (
              <p className="flex items-start gap-1.5 text-[11.5px] font-medium mt-2" style={{ color: meta.color }}>
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

// One of the two columns (failed/review, or passed) — shows a handful by default with a "View More" to
// reveal the rest, so a long passed-checks list doesn't dominate the page by default.
const CHECK_COLUMN_THRESHOLD = 5;

function CheckColumn({ title, accentColor, checks }: { title: string; accentColor: string; checks: ValidationCheck[] }) {
  const [showAll, setShowAll] = useState(false);
  const needsToggle = checks.length > CHECK_COLUMN_THRESHOLD;
  const visible = !needsToggle || showAll ? checks : checks.slice(0, CHECK_COLUMN_THRESHOLD);
  const remaining = checks.length - CHECK_COLUMN_THRESHOLD;

  return (
    <div className="rounded-[8px] border border-[#ebebeb]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f3f4f6]">
        <span className="w-[3px] h-[14px] rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: accentColor }}>{title} ({checks.length})</p>
      </div>
      <div>
        {visible.map((c, i) => (
          <ValidationCheckItem key={i} check={c} />
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

export function AiOrderValidationBody({ emailId, onRevalidateReady, onAudit }: {
  emailId: string;
  /** Hands the caller (WorkflowPage's footer "Re-Validate" button) a function to trigger revalidation from
      outside this component, since the versioned data lives in here, not at the page level. */
  onRevalidateReady?: (fn: () => void) => void;
  onAudit?: (entry: ValidationAuditEntry) => void;
}) {
  const { data: validation, loading, error, reload } = useOrderValidation(emailId);
  const [resultsOpen, setResultsOpen] = useState(true);
  const [freightTerms, setFreightTerms] = useState("");
  const [discountApproval, setDiscountApproval] = useState("");
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

  const logFieldChange = (label: string, icon: LucideIcon) => {
    setCurrentVersionChanges(prev => [...prev, { label, icon, at: new Date() }]);
  };

  const revalidate = () => {
    if (!latestData) return;
    setVersions(prev => [...prev, { version: currentVersionNumber, at: currentVersionAt, data: latestData, changes: currentVersionChanges }]);
    const next = regenerateValidation(latestData);
    setOverrideData(next);
    setCurrentVersionNumber(n => n + 1);
    setCurrentVersionAt(new Date());
    setCurrentVersionChanges([]);
    setViewingVersion(null);
    onAudit?.({
      action: "Re-Validated",
      icon: RotateCcw,
      detail: `Version ${currentVersionNumber + 1} generated — ${next.failedAndReviewChecks.length} check${next.failedAndReviewChecks.length === 1 ? "" : "s"} still outstanding`,
    });
    toast.success(`Re-validated — now viewing version ${currentVersionNumber + 1}`);
  };

  useEffect(() => {
    onRevalidateReady?.(revalidate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestData, currentVersionNumber, currentVersionAt, versions, currentVersionChanges]);

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
  const totalChecks = v.failedAndReviewChecks.length + v.passedChecks.length;
  const failedCount = v.failedAndReviewChecks.filter(c => c.status === "failed").length;
  const reviewCount = v.failedAndReviewChecks.filter(c => c.status === "warning").length;

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
            </div>
          </div>
          {resultsOpen && (
            <div className="px-5 py-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CheckColumn title="Failed & Needs Attention" accentColor="#BA1C1C" checks={v.failedAndReviewChecks} />
              <CheckColumn title="Passed" accentColor="#468657" checks={v.passedChecks} />
            </div>
          )}
        </div>

        <CollapsibleSection title="PO Parsing Results" badge={`${v.poParsing.matched}/${v.poParsing.total} matched`}>
          <TextField label="PO Number" variant="matched" value={v.poParsing.poNumber} readOnly />
          <TextField label="Line Items" variant="matched" value={v.poParsing.lineItems} readOnly />
          <TextField label="Ship-To Address" variant="matched" value={v.poParsing.shipToAddress} readOnly />
          <TextField
            label="Freight Terms"
            variant="missing"
            value={freightTerms}
            onChange={setFreightTerms}
            onBlur={() => {
              if (!freightTerms.trim()) return;
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
            variant="missing"
            value={discountApproval}
            onChange={setDiscountApproval}
            onBlur={() => {
              if (!discountApproval.trim()) return;
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
          <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">Overview of matched, review, and missing data.</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[8px] bg-[#EFF6F1] px-2.5 py-3 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <CircleCheck size={18} className="text-[#468657] shrink-0" />
                <span className="text-[20px] font-bold text-[#468657] leading-none">{v.passedChecks.length}/{totalChecks}</span>
              </div>
              <span className="text-[10.5px] font-medium text-[#6b7280] text-center leading-tight">Checks Passed</span>
            </div>
            <div className="rounded-[8px] bg-[#FDF3E7] px-2.5 py-3 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <TriangleAlert size={18} className="text-[#E67919] shrink-0" />
                <span className="text-[20px] font-bold text-[#92600B] leading-none">{reviewCount}</span>
              </div>
              <span className="text-[10.5px] font-medium text-[#6b7280] text-center leading-tight">Needs Review</span>
            </div>
            <div className="rounded-[8px] bg-[#FDECEA] px-2.5 py-3 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <CircleX size={18} className="text-[#BA1C1C] shrink-0" />
                <span className="text-[20px] font-bold text-[#BA1C1C] leading-none">{failedCount}</span>
              </div>
              <span className="text-[10.5px] font-medium text-[#6b7280] text-center leading-tight">Failed</span>
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
