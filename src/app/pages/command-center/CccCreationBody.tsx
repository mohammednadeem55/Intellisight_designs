import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Archive, Check, ChevronDown, Download, FileImage, FileSpreadsheet, FileText, HelpCircle, MapPin, type LucideIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { TextField, ReviewField, type FieldSourceBadge } from "../../components/common/TextField";
import { WaveLoader } from "../../components/common/Loader";
import { Button } from "../../components/common/Button";
import { AttachmentPreviewModal } from "../../components/common/AttachmentPreviewModal";
import { useCccExtraction, ENQUIRY_TYPE_OPTIONS, type CccField, type CccFieldSource, type EnquiryTrack } from "./useCccExtraction";

// One accent for AI-sourced fields (the majority of this page) so they're visible at a glance; every other
// source (Auto/System/CSR/JitterBit) shares a neutral grey and is distinguished by its label text instead —
// mirrors color for one meaningful split rather than a badge per source, which read as noisier than useful.
function sourceBadgeFor(source?: CccFieldSource): FieldSourceBadge | undefined {
  if (!source) return undefined;
  if (source === "AI") return { label: "AI", fg: "#30578D", bg: "#EAF1FB" };
  return { label: source, fg: "#6b7280", bg: "#ffffff" };
}

// Once a person has actually typed or chosen a value, the field's provenance IS manual now — the badge
// switches to say so instead of continuing to claim AI/Auto/whatever it originally arrived as.
const MANUAL_SOURCE_BADGE: FieldSourceBadge = { label: "Manual", fg: "#387D85", bg: "#E7F3F3" };

// Icon + color per file type — matches the same ext-based helper duplicated across the order pages.
function docMeta(name: string): { icon: typeof FileText; bg: string; fg: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: FileText, bg: "#FDECEA", fg: "#DC2626" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: FileSpreadsheet, bg: "#E8F5E9", fg: "#2E7D32" };
  if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) return { icon: FileImage, bg: "#EAF1FB", fg: "#30578D" };
  if (["zip", "rar", "7z"].includes(ext)) return { icon: Archive, bg: "#FDF3E7", fg: "#92600B" };
  return { icon: FileText, bg: "#f3f4f6", fg: "#6b7280" };
}

const AI_SUGGESTION_GROUPS: { label: string; options: string[] }[] = [
  { label: "Trade Quote Number", options: ["Q-12345", "Q-67890", "Q-54321"] },
  { label: "Prod Interest", options: ["10083C-001", "20094D-002", "30056E-003"] },
  { label: "Dest Country", options: ["United States", "Germany", "France"] },
  { label: "Product", options: ["N1055A Probe", "Calibration Service"] },
];

function extractionBand(pct: number): { label: string; bg: string; text: string } {
  if (pct >= 80) return { label: "Nearly complete", bg: "#E8F5E9", text: "#2E7D32" };
  if (pct >= 50) return { label: "In progress", bg: "#FDF3E7", text: "#92600B" };
  return { label: "Needs attention", bg: "#FDECEA", text: "#BA1C1C" };
}

function fieldCounts(fields: CccField[]) {
  return { matched: fields.filter(f => f.status === "matched").length, total: fields.length };
}

export type CccFieldAuditEntry = { action: string; icon?: LucideIcon; detail?: string };

// Renders one extracted field via the shared field components — TextField covers matched/missing,
// ReviewField covers the two-competing-values "needs review" case. `onAudit` fires only at the same
// "committed" moments a toast already fires (Use/Apply/Revert/blur-with-a-value) — not on every keystroke,
// same granularity as the Classify step only logging on Submit rather than every dropdown pick.
function renderCccField(field: CccField, onFieldChange: (next: CccField) => void, onAudit?: (entry: CccFieldAuditEntry) => void) {
  // System/auto-populated on the CCC Request object itself — never part of the review workflow, so no
  // revert affordance and no red "missing" state even when the mock value happens to be empty (e.g. a
  // request that hasn't closed yet has no Date/Time Closed).
  if (field.readOnly) {
    return <TextField label={field.label} variant="notEditable" value={field.value || "—"} sourceBadge={sourceBadgeFor(field.source)} />;
  }

  if (field.status === "matched") {
    // Two distinct ways a matched field can need a revert: it was resolved here (via Apply/Use/typing into
    // a blank field — `resolvedFrom` set), where revert undoes the resolution back to that prior status; or
    // it arrived already matched (from extraction) and the user has since edited its value directly — where
    // there's no prior status to go back to, so revert just restores the pre-edit value and stays matched.
    const isDirectEdit = !field.resolvedFrom;
    const manuallyFilled = !!field.resolvedFrom || !!field.edited;
    return (
      <TextField
        label={field.label}
        variant="matched"
        value={field.value}
        sourceBadge={manuallyFilled ? MANUAL_SOURCE_BADGE : sourceBadgeFor(field.source)}
        onChange={(v) => {
          const capturingOriginal = isDirectEdit && field.originalValue === undefined && v !== field.value;
          onFieldChange({
            ...field,
            value: v,
            edited: isDirectEdit ? true : field.edited,
            originalValue: capturingOriginal ? field.value : field.originalValue,
          });
        }}
        revertible={manuallyFilled}
        onRevert={() => {
          if (field.resolvedFrom) {
            onFieldChange({ ...field, status: field.resolvedFrom, value: "" });
            onAudit?.({ action: "Field Reverted", detail: `${field.label} reverted` });
          } else {
            const previous = field.originalValue ?? "";
            onFieldChange({ ...field, value: previous, edited: false, originalValue: undefined });
            onAudit?.({ action: "Field Reverted", detail: `${field.label}: ${field.value} → ${previous || "—"}` });
          }
        }}
      />
    );
  }

  if (field.status === "review") {
    return (
      <ReviewField
        label={field.label}
        extracted={field.extracted ?? ""}
        systemLabel="Salesforce"
        systemValue={field.systemValue}
        sourceBadge={field.edited ? MANUAL_SOURCE_BADGE : sourceBadgeFor(field.source)}
        onExtractedChange={(v) => onFieldChange({ ...field, extracted: v, edited: true })}
        onUse={() => {
          onFieldChange({ ...field, status: "matched", value: field.systemValue ?? "", resolvedFrom: "review" });
          onAudit?.({ action: "Field Updated", icon: Check, detail: `${field.label}: ${field.extracted || "—"} → ${field.systemValue} (from Salesforce)` });
          toast.success(`${field.label} updated from Salesforce`);
        }}
      />
    );
  }

  // missing — typing a value directly (not via a suggestion) promotes the field to matched on blur, same
  // as clicking Apply, so it stops counting as missing without requiring a suggestion to exist.
  return (
    <TextField
      label={field.label}
      variant="missing"
      value={field.value}
      sourceBadge={sourceBadgeFor(field.source)}
      onChange={(v) => onFieldChange({ ...field, value: v })}
      onBlur={() => {
        if (field.value.trim()) {
          onFieldChange({ ...field, status: "matched", resolvedFrom: "missing" });
          onAudit?.({ action: "Field Updated", icon: Check, detail: `${field.label}: → ${field.value}` });
        }
      }}
      placeholder="Select to apply or type"
      suggestions={field.suggestions}
      onApplySuggestion={(value) => {
        onFieldChange({ ...field, status: "matched", value, resolvedFrom: "missing" });
        onAudit?.({ action: "Field Applied", icon: Check, detail: `${field.label}: → ${value}` });
        toast.success(`${field.label} applied`);
      }}
    />
  );
}

// Type of Enquiry — AI classified, but the eligible values are a fixed enum that depends on which track
// (Trade vs Work Order) the request falls under, so this is a constrained dropdown rather than a free-text
// field like the rest of the matched fields, even though it shares their green/matched styling.
function EnquiryTypeField({ track, value, onChange }: { track: EnquiryTrack; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const options = ENQUIRY_TYPE_OPTIONS[track];

  const toggleOpen = () => {
    if (!open) {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const target = e.target;
      if (target instanceof Node && btnRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide">Type of Enquiry</p>
        <span className="text-[10px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[1px] border" style={{ color: "#30578D", borderColor: "#30578D", backgroundColor: "#EAF1FB" }}>AI</span>
      </div>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        className="w-full flex items-center justify-between gap-2 h-[42px] px-3.5 rounded-[8px] border border-[#468657] bg-[#EFF6F1] text-left cursor-pointer transition-colors"
      >
        <span className="text-[13px] font-medium text-[#111827] truncate">{value}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#30578D] bg-white/70 px-1.5 py-[1px] rounded-[8px]">{track}</span>
          <Check size={15} className="text-[#468657]" strokeWidth={3} />
        </div>
      </button>

      {open && rect && createPortal(
        <div
          className="fixed bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-[9999] py-1 max-h-[260px] overflow-y-auto"
          style={{ top: rect.top, left: rect.left, width: rect.width }}
        >
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-[12.5px] cursor-pointer transition-colors ${
                opt === value ? "font-semibold bg-[#EAF1FB] text-[#30578D]" : "text-[#374151] hover:bg-[#f8fafc]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function CccSection({ title, subtitle, matched, total, plain, defaultOpen = true, children }: {
  title: string;
  subtitle?: string;
  matched?: number;
  total?: number;
  /** Skips the default form-field grid — the content manages its own layout (Request Info's grouped
      label/value list needs its own structure, not the 2-column grid sized for full editable fields). */
  plain?: boolean;
  /** Request Info defaults closed — it's supplementary reference data, not something that needs review,
      so it shouldn't be the first thing taking up space when the page loads. */
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-[8px] border border-[#ebebeb]">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-5 ${plain ? "py-3" : "py-4"} cursor-pointer ${open ? "border-b border-[#f3f4f6]" : ""}`}
      >
        <ChevronDown size={15} className={`text-[#6b7280] transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
        <div className="flex-1 min-w-0 text-left">
          <h3 className={plain ? "text-[13px] font-bold text-[#111827]" : "text-[14px] font-bold text-[#111827]"}>{title}</h3>
          {subtitle && <p className="text-[11px] text-[#9ca3af] mt-0.5">{subtitle}</p>}
        </div>
        {total != null && (
          <span className="text-[11px] font-medium text-[#9ca3af] bg-[#f3f4f6] px-2 py-0.5 rounded-[8px]">{matched}/{total} matched</span>
        )}
      </button>
      {open && (
        <div className={`animate-ks-reveal ${plain ? "px-5 py-2.5" : "px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4"}`}>
          {children}
        </div>
      )}
    </div>
  );
}

export type CccExtractionStatus = { totalMissing: number; totalReview: number };

export function CccCreationBody({ emailId, onStatusChange, onAudit }: { emailId: string; onStatusChange?: (status: CccExtractionStatus) => void; onAudit?: (entry: CccFieldAuditEntry) => void }) {
  const { data: extraction, loading, error, reload } = useCccExtraction(emailId);

  // Editable local copies, seeded once the fetch resolves — separate from `extraction` itself so field
  // edits (Use/Apply/typing) don't need to round-trip through the hook on every keystroke.
  const [requestFields, setRequestFields] = useState<CccField[]>([]);
  const [accountFields, setAccountFields] = useState<CccField[]>([]);
  const [opportunityFields, setOpportunityFields] = useState<CccField[]>([]);
  const [numberFields, setNumberFields] = useState<CccField[]>([]);
  const [orderFields, setOrderFields] = useState<CccField[]>([]);
  const [statusFields, setStatusFields] = useState<CccField[]>([]);
  const [oaFields, setOaFields] = useState<CccField[]>([]);
  const [legacyFields, setLegacyFields] = useState<CccField[]>([]);
  const [additionalInfoFields, setAdditionalInfoFields] = useState<CccField[]>([]);
  const [typeOfEnquiry, setTypeOfEnquiry] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; size: string } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => {
    if (!extraction) return;
    setRequestFields(extraction.requestFields);
    setAccountFields(extraction.accountFields);
    setOpportunityFields(extraction.opportunityFields);
    setNumberFields(extraction.numberFields);
    setOrderFields(extraction.orderFields);
    setStatusFields(extraction.statusFields);
    setOaFields(extraction.oaFields);
    setLegacyFields(extraction.legacyFields);
    setAdditionalInfoFields(extraction.additionalInfoFields);
    setTypeOfEnquiry(extraction.typeOfEnquiry);
  }, [extraction]);

  const updateField = (setter: typeof setAccountFields, index: number) => (next: CccField) => {
    setter(prev => prev.map((f, i) => (i === index ? next : f)));
  };

  const allFieldGroups = [requestFields, accountFields, opportunityFields, numberFields, orderFields, statusFields, oaFields, legacyFields, additionalInfoFields];
  // Read-only fields live in the Request Info card on the right now, not in these left-column sections —
  // so each section's own "X/Y matched" badge counts only what's actually still shown here, not the
  // read-only ones that moved out.
  const requestCounts = fieldCounts(requestFields.filter(f => !f.readOnly && f.label !== "Type" && f.label !== "Subtype" && f.label !== "Status"));
  const accountCounts = fieldCounts(accountFields.filter(f => !f.readOnly));
  const opportunityCounts = fieldCounts(opportunityFields.filter(f => !f.readOnly));
  const numberCounts = fieldCounts(numberFields);
  const orderCounts = fieldCounts(orderFields);
  const statusCounts = fieldCounts(statusFields);
  const legacyCounts = fieldCounts(legacyFields);
  const totalFields = allFieldGroups.reduce((sum, g) => sum + g.length, 0) + 2; // +1 Product Number, +1 Type of Enquiry
  const totalMatched = allFieldGroups.reduce((sum, g) => sum + fieldCounts(g).matched, 0) + 2;
  const allFields = allFieldGroups.flat();
  const totalReview = allFields.filter(f => f.status === "review").length;
  const totalMissing = allFields.filter(f => f.status === "missing").length;
  const completionPct = Math.round((totalMatched / totalFields) * 100);
  const band = extractionBand(completionPct);

  useEffect(() => {
    onStatusChange?.({ totalMissing, totalReview });
  }, [totalMissing, totalReview]);

  if (loading || error) {
    return (
      <div className="bg-white rounded-[8px] border border-[#ebebeb] flex items-center justify-center py-20">
        {error ? (
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <p className="text-[14px] font-semibold text-[#111827]">Couldn't load extraction data</p>
            <p className="text-[12.5px] text-[#9ca3af] max-w-[360px]">{error}</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : (
          <WaveLoader size={40} />
        )}
      </div>
    );
  }

  const productNumbers = extraction?.productNumbers ?? [];
  const shipTo = extraction!.shipTo;
  const documents = extraction!.documents;
  const owner = extraction!.owner;
  const cccRequestNumber = extraction!.cccRequestNumber;
  const enquiryTrack = extraction!.enquiryTrack;
  // Reads off the live, editable `requestFields` (not the static `extraction` snapshot) so this stays in
  // sync if Status gets changed in the Request Details section below.
  const cccStatus = requestFields.find(f => f.label === "Status")?.value || "—";

  // Read-only fields (Owner, CCC Request Number, and anything flagged `readOnly` across the review
  // sections) aren't part of the review workflow — nothing to match/revert/apply here — so they're pulled
  // out into one reference list, grouped by where they came from rather than one undifferentiated grid of
  // identical grey tiles (which read as a wall of noise rather than something scannable).
  const infoGroups: { label: string; rows: { label: string; value: string }[] }[] = [
    { label: "Identity", rows: [{ label: "Owner", value: owner }] },
    { label: "Timeline", rows: requestFields.filter(f => f.readOnly).map(f => ({ label: f.label, value: f.value })) },
    {
      label: "Account & Opportunity",
      rows: [
        ...accountFields.filter(f => f.readOnly).map(f => ({ label: f.label, value: f.value })),
        ...opportunityFields.filter(f => f.readOnly).map(f => ({ label: f.label, value: f.value })),
      ],
    },
    { label: "OA", rows: oaFields.map(f => ({ label: f.label, value: f.value })) },
    { label: "Audit Trail", rows: additionalInfoFields.map(f => ({ label: f.label, value: f.value })) },
  ];
  // Split 3|2 across two columns — left carries the first three groups, right the last two.
  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      {/* Left: extraction review sections */}
      <div className="flex flex-col gap-4">
        <CccSection title="Request Details" matched={requestCounts.matched} total={requestCounts.total}>
          <EnquiryTypeField
            track={enquiryTrack}
            value={typeOfEnquiry}
            onChange={(v) => {
              setTypeOfEnquiry(v);
              onAudit?.({ action: "Field Updated", icon: Check, detail: `Type of Enquiry: → ${v}` });
            }}
          />
          {["Origin", "Awaiting Reason"].map((label) => {
            const i = requestFields.findIndex(f => f.label === label);
            if (i === -1) return null;
            return <div key={i} className="contents">{renderCccField(requestFields[i], updateField(setRequestFields, i), onAudit)}</div>;
          })}
        </CccSection>

        <CccSection title="Account & Contact" matched={accountCounts.matched} total={accountCounts.total}>
          {accountFields.map((f, i) => !f.readOnly && (
            <div key={i} className="contents">{renderCccField(f, updateField(setAccountFields, i), onAudit)}</div>
          ))}
        </CccSection>

        <CccSection title="Opportunity & Billing" matched={opportunityCounts.matched} total={opportunityCounts.total}>
          {opportunityFields.map((f, i) => !f.readOnly && (
            <div key={i} className="contents">{renderCccField(f, updateField(setOpportunityFields, i), onAudit)}</div>
          ))}
        </CccSection>

        <CccSection title="Product">
          <div className="sm:col-span-2">
            <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide mb-1.5">Product Number</p>
            <div className="flex items-center gap-2 flex-wrap px-3.5 py-2 min-h-[42px] rounded-[8px] border border-[#468657] bg-[#EFF6F1]">
              {productNumbers.map((p, i) => (
                <span key={i} className="text-[12.5px] font-medium text-[#111827] bg-white/70 px-2 py-1 rounded-[6px]">{p}</span>
              ))}
              <Check size={15} className="text-[#468657] shrink-0 ml-auto" strokeWidth={3} />
            </div>
          </div>
        </CccSection>

        <CccSection title="Extracted Numbers" matched={numberCounts.matched} total={numberCounts.total}>
          {numberFields.map((f, i) => (
            <div key={i} className="contents">{renderCccField(f, updateField(setNumberFields, i), onAudit)}</div>
          ))}
        </CccSection>

        <CccSection title="Order Info" matched={orderCounts.matched} total={orderCounts.total}>
          {orderFields.map((f, i) => (
            <div key={i} className="contents">{renderCccField(f, updateField(setOrderFields, i), onAudit)}</div>
          ))}
        </CccSection>

        <CccSection title="Status & Notes" matched={statusCounts.matched} total={statusCounts.total}>
          {statusFields.map((f, i) => (
            <div key={i} className="contents">{renderCccField(f, updateField(setStatusFields, i), onAudit)}</div>
          ))}
        </CccSection>

        <CccSection title="Legacy Case" matched={legacyCounts.matched} total={legacyCounts.total}>
          {legacyFields.map((f, i) => (
            <div key={i} className="contents">{renderCccField(f, updateField(setLegacyFields, i), onAudit)}</div>
          ))}
        </CccSection>
      </div>

      {/* Right: status + AI suggestions + ship-to + documents */}
      <div className="flex flex-col gap-4">
        {/* CCC Number + Status — quick-glance identity for the request, always visible without needing to
            dig into the sections below to find Status. Type/Subtype ride along here too — they're just
            Category/Sub-category carried over from the Classify Intent step, view-only, not new information
            to review. "Show/Hide info details" expands the same card in place to show the read-only
            reference fields. */}
        <div className="bg-white rounded-[8px] border border-[#ebebeb] overflow-hidden">
          <div className="px-5 pt-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide">Type</p>
              <p className="text-[14px] font-bold text-[#111827] mt-0.5 truncate">{requestFields.find(f => f.label === "Type")?.value || "—"}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide">Subtype</p>
              <p className="text-[14px] font-bold text-[#111827] mt-0.5 truncate">{requestFields.find(f => f.label === "Subtype")?.value || "—"}</p>
            </div>
          </div>

          <div className="px-5 pb-4 pt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide">CCC Request Number</p>
              <p className="text-[14px] font-bold text-[#111827] mt-0.5 truncate">{cccRequestNumber}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide">Status</p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold mt-0.5" style={{ backgroundColor: "#EAF1FB", color: "#30578D" }}>
                {cccStatus}
              </span>
            </div>
          </div>

          <button
            onClick={() => setDetailsOpen(v => !v)}
            className="w-full flex items-center justify-center gap-1.5 text-[11.5px] font-semibold text-[#30578D] cursor-pointer px-5 py-2.5 border-t border-[#f3f4f6] hover:bg-[#f7f8fa] transition-colors"
          >
            <ChevronDown size={13} className={`transition-transform duration-200 ${detailsOpen ? "" : "-rotate-90"}`} />
            {detailsOpen ? "Hide info details" : "Show info details"}
          </button>

          {detailsOpen && (
            <div className="animate-ks-reveal px-5 pb-4 pt-1 flex flex-col gap-1.5">
              {infoGroups.filter(g => g.rows.length > 0).map((group, gi) => (
                <div key={group.label} className={gi > 0 ? "pt-2.5 border-t border-[#f3f4f6]" : ""}>
                  <p className="text-[11px] font-bold text-[#30578D] uppercase tracking-wider mb-1.5">{group.label}</p>
                  <div className="flex flex-col gap-0.5">
                    {group.rows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-3 text-[12px] leading-[1.6]">
                        <span className="text-[#9ca3af] shrink-0">{row.label}</span>
                        <span className="font-semibold text-[#111827] text-right truncate">{row.value || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Extraction Status — hidden for now, keeping the block around to re-enable later */}
        {false && (
        <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-[14px] font-bold text-[#111827]">Extraction Status</h3>
              <p className="text-[12px] text-[#9ca3af] mt-0.5">Matched, review, and missing fields.</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold whitespace-nowrap" style={{ backgroundColor: band.bg, color: band.text }}>
              {completionPct}% complete
            </span>
          </div>
          <div className="flex h-[6px] rounded-full overflow-hidden bg-[#f1f2f4] mt-3">
            <div className="bg-[#468657] transition-[width] duration-300" style={{ width: `${(totalMatched / totalFields) * 100}%` }} />
            <div className="bg-[#E67919] transition-[width] duration-300" style={{ width: `${(totalReview / totalFields) * 100}%` }} />
            <div className="bg-[#BA1C1C] transition-[width] duration-300" style={{ width: `${(totalMissing / totalFields) * 100}%` }} />
          </div>

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 mt-3">
            <span className="flex items-center gap-1.5 text-[12px] text-[#4b5563]">
              <span className="size-[8px] rounded-full bg-[#468657] shrink-0" />{totalMatched} Matched
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-[#4b5563]">
              <span className="size-[8px] rounded-full bg-[#E67919] shrink-0" />{totalReview} Review
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-[#4b5563]">
              <span className="size-[8px] rounded-full bg-[#BA1C1C] shrink-0" />{totalMissing} Missing
            </span>
          </div>
        </div>
        )}

        {/* AI Suggestions — hidden for now, keeping the block around to re-enable later */}
        {false && (
        <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
          <h3 className="text-[14px] font-bold text-[#111827]">AI Suggestions</h3>
          <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">Overview of matched, review, and missing fields</p>
          <div className="flex flex-col">
            {AI_SUGGESTION_GROUPS.map((group, gi) => (
              <div key={group.label} className={`py-3 ${gi > 0 ? "border-t border-[#f3f4f6]" : "pt-0"}`}>
                <p className="flex items-center gap-1 text-[11.5px] font-semibold text-[#111827] mb-2">
                  {group.label}
                  <HelpCircle size={11} className="text-[#9ca3af]" />
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => toast.success(`Applied "${opt}" to ${group.label}`)}
                      className="px-2 py-1 rounded-[8px] bg-[#EAF1FB] text-[11px] font-medium text-[#30578D] hover:bg-[#DCE7F5] cursor-pointer transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
          <h3 className="text-[14px] font-bold text-[#111827]">Ship To</h3>
          <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">Products shipping address</p>
          <div className="flex items-start gap-3 rounded-[8px] bg-[#f7f8fa] px-3.5 py-3">
            <div className="size-[34px] rounded-[8px] bg-[#EAF1FB] flex items-center justify-center shrink-0">
              <MapPin size={16} className="text-[#30578D]" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#111827] truncate">{shipTo.company}</p>
              <p className="text-[12px] text-[#6b7280] mt-1 leading-[1.6]">
                {shipTo.address}<br />
                {shipTo.cityState}<br />
                {shipTo.country}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
          <h3 className="text-[14px] font-bold text-[#111827]">Documents</h3>
          <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">{documents.length} file{documents.length !== 1 ? "s" : ""} attached</p>
          <div className="flex flex-col gap-2">
            {documents.map(doc => {
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
    </>
  );
}
