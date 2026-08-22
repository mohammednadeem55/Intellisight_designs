import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, Download, FileText, HelpCircle, MapPin } from "lucide-react";
import { TextField, ReviewField } from "../../components/common/TextField";

// Mock extraction-review data for the CCC Creation step — matched/review/missing per field, same shape
// regardless of section, so one field component can render all three states consistently. `resolvedFrom`
// is set when a review/missing field gets resolved (Use / Apply) so it can be reverted back to that state
// without losing the original extracted/systemValue/suggestions data.
type CccFieldStatus = "matched" | "review" | "missing";
type CccField = {
  label: string;
  status: CccFieldStatus;
  value: string; // matched — the current, editable value
  extracted?: string; // review — the extracted value
  systemValue?: string; // review — the trusted/system-of-record value; if absent, there's nothing to compare and the field is just editable
  suggestions?: string[]; // missing — AI-suggested values to pick from; omit/empty for no suggestions
  resolvedFrom?: "review" | "missing"; // set once Use/Apply is clicked — enables the revert icon
};

const ACCOUNT_CONTACT_FIELDS: CccField[] = [
  { label: "Account Name", status: "matched", value: "Keysight Technology Solutions Inc." },
  { label: "Contact Name", status: "matched", value: "Julie Magner" },
  { label: "Email", status: "review", value: "", extracted: "julie.magner@macom.com.invalid", systemValue: "julie.magner@keysight.com" },
  { label: "Phone", status: "review", value: "", extracted: "+1 978 656-2514", systemValue: "+1 (978) 656-2500" },
  { label: "Job Title", status: "review", value: "", extracted: "VP of Engineering" },
  { label: "Address", status: "matched", value: "100 Chelmsford St, Lowell, MA 01851" },
  { label: "Shipping Instructions", status: "missing", value: "", suggestions: ["10083C-001", "10083C-002", "10083C-003"] },
  { label: "Address", status: "matched", value: "100 Chelmsford St, Lowell, MA 01851" },
  { label: "Billing Instructions", status: "missing", value: "" },
];

const EXTRACTED_NUMBER_FIELDS: CccField[] = [
  { label: "PO Number", status: "matched", value: "1514444" },
  { label: "Quote Number", status: "missing", value: "", suggestions: ["10083C-001", "Q-2026-441"] },
  { label: "Ship Number", status: "missing", value: "" },
  { label: "Sales Order", status: "missing", value: "" },
];

const ORDER_INFO_FIELDS: CccField[] = [
  { label: "PO Date", status: "matched", value: "03 Aug 2026" },
  { label: "Quote Expiry", status: "missing", value: "" },
  { label: "Payment Terms", status: "review", value: "", extracted: "Net 30" },
];

const PRODUCT_NUMBERS = ["10083C-001", "20094D-002", "30056E-003"];

const AI_SUGGESTION_GROUPS: { label: string; options: string[] }[] = [
  { label: "Trade Quote Number", options: ["Q-12345", "Q-67890", "Q-54321"] },
  { label: "Prod Interest", options: ["10083C-001", "20094D-002", "30056E-003"] },
  { label: "Dest Country", options: ["United States", "Germany", "France"] },
  { label: "Product", options: ["N1055A Probe", "Calibration Service"] },
];

const SHIP_TO = {
  company: "MACOM Technology Solutions Inc.",
  address: "100 Chelmsford Street",
  cityState: "Lowell, MA 01851",
  country: "United States",
};

const DOCUMENTS = [{ name: "Order_details.pdf", size: "1.2 MB" }];

function extractionBand(pct: number): { label: string; bg: string; text: string } {
  if (pct >= 80) return { label: "Nearly complete", bg: "#E8F5E9", text: "#2E7D32" };
  if (pct >= 50) return { label: "In progress", bg: "#FDF3E7", text: "#92600B" };
  return { label: "Needs attention", bg: "#FDECEA", text: "#BA1C1C" };
}

function fieldCounts(fields: CccField[]) {
  return { matched: fields.filter(f => f.status === "matched").length, total: fields.length };
}

// Renders one extracted field via the shared field components — TextField covers matched/missing,
// ReviewField covers the two-competing-values "needs review" case.
function renderCccField(field: CccField, onFieldChange: (next: CccField) => void) {
  if (field.status === "matched") {
    return (
      <TextField
        label={field.label}
        variant="matched"
        value={field.value}
        onChange={(v) => onFieldChange({ ...field, value: v })}
        revertible={!!field.resolvedFrom}
        onRevert={() => onFieldChange({ ...field, status: field.resolvedFrom!, value: "" })}
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
        onExtractedChange={(v) => onFieldChange({ ...field, extracted: v })}
        onUse={() => {
          onFieldChange({ ...field, status: "matched", value: field.systemValue ?? "", resolvedFrom: "review" });
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
      onChange={(v) => onFieldChange({ ...field, value: v })}
      onBlur={() => {
        if (field.value.trim()) onFieldChange({ ...field, status: "matched" });
      }}
      placeholder="Select to apply or type"
      suggestions={field.suggestions}
      onApplySuggestion={(value) => {
        onFieldChange({ ...field, status: "matched", value, resolvedFrom: "missing" });
        toast.success(`${field.label} applied`);
      }}
    />
  );
}

function CccSection({ title, matched, total, children }: { title: string; matched?: number; total?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-[8px] border border-[#ebebeb]">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-5 py-4 cursor-pointer ${open ? "border-b border-[#f3f4f6]" : ""}`}
      >
        <ChevronDown size={15} className={`text-[#6b7280] transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
        <h3 className="text-[14px] font-bold text-[#111827]">{title}</h3>
        {total != null && (
          <span className="text-[11px] font-medium text-[#9ca3af] bg-[#f3f4f6] px-2 py-0.5 rounded-[8px]">{matched}/{total} matched</span>
        )}
      </button>
      {open && <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>}
    </div>
  );
}

export type CccExtractionStatus = { totalMissing: number; totalReview: number };

export function CccCreationBody({ onStatusChange }: { onStatusChange?: (status: CccExtractionStatus) => void }) {
  const [accountFields, setAccountFields] = useState(ACCOUNT_CONTACT_FIELDS);
  const [numberFields, setNumberFields] = useState(EXTRACTED_NUMBER_FIELDS);
  const [orderFields, setOrderFields] = useState(ORDER_INFO_FIELDS);

  const updateField = (setter: typeof setAccountFields, index: number) => (next: CccField) => {
    setter(prev => prev.map((f, i) => (i === index ? next : f)));
  };

  const accountCounts = fieldCounts(accountFields);
  const numberCounts = fieldCounts(numberFields);
  const orderCounts = fieldCounts(orderFields);
  const totalFields = accountFields.length + numberFields.length + orderFields.length + 1; // +1 for Product Number
  const totalMatched = accountCounts.matched + numberCounts.matched + orderCounts.matched + 1;
  const totalReview = [...accountFields, ...numberFields, ...orderFields].filter(f => f.status === "review").length;
  const totalMissing = [...accountFields, ...numberFields, ...orderFields].filter(f => f.status === "missing").length;
  const completionPct = Math.round((totalMatched / totalFields) * 100);
  const band = extractionBand(completionPct);

  useEffect(() => {
    onStatusChange?.({ totalMissing, totalReview });
  }, [totalMissing, totalReview]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      {/* Left: extraction review sections */}
      <div className="flex flex-col gap-4">
        <CccSection title="Account & Contact" matched={accountCounts.matched} total={accountCounts.total}>
          {accountFields.map((f, i) => (
            <div key={i} className="contents">{renderCccField(f, updateField(setAccountFields, i))}</div>
          ))}
        </CccSection>

        <CccSection title="Product">
          <div className="sm:col-span-2">
            <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide mb-1.5">Product Number</p>
            <div className="flex items-center gap-2 flex-wrap px-3.5 py-2 min-h-[42px] rounded-[8px] border border-[#468657] bg-[#EFF6F1]">
              {PRODUCT_NUMBERS.map((p, i) => (
                <span key={i} className="text-[12.5px] font-medium text-[#111827] bg-white/70 px-2 py-1 rounded-[6px]">{p}</span>
              ))}
              <Check size={15} className="text-[#468657] shrink-0 ml-auto" strokeWidth={3} />
            </div>
          </div>
        </CccSection>

        <CccSection title="Extracted Numbers" matched={numberCounts.matched} total={numberCounts.total}>
          {numberFields.map((f, i) => (
            <div key={i} className="contents">{renderCccField(f, updateField(setNumberFields, i))}</div>
          ))}
        </CccSection>

        <CccSection title="Order Info" matched={orderCounts.matched} total={orderCounts.total}>
          {orderFields.map((f, i) => (
            <div key={i} className="contents">{renderCccField(f, updateField(setOrderFields, i))}</div>
          ))}
        </CccSection>
      </div>

      {/* Right: status + AI suggestions + ship-to + documents */}
      <div className="flex flex-col gap-4">
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
              <p className="text-[13px] font-semibold text-[#111827] truncate">{SHIP_TO.company}</p>
              <p className="text-[12px] text-[#6b7280] mt-1 leading-[1.6]">
                {SHIP_TO.address}<br />
                {SHIP_TO.cityState}<br />
                {SHIP_TO.country}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
          <h3 className="text-[14px] font-bold text-[#111827]">Documents</h3>
          <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">{DOCUMENTS.length} file{DOCUMENTS.length !== 1 ? "s" : ""} attached</p>
          <div className="flex flex-col gap-2">
            {DOCUMENTS.map(doc => (
              <button
                key={doc.name}
                onClick={() => toast.info(`Downloading ${doc.name}`)}
                className="group flex items-center gap-2.5 px-3 py-2 rounded-[8px] border border-[#ebebeb] hover:border-[#d1d5db] hover:bg-[#f8fafc] cursor-pointer transition-colors text-left w-full"
              >
                <div className="size-[32px] rounded-[8px] bg-[#FDECEA] flex items-center justify-center shrink-0">
                  <FileText size={15} className="text-[#DC2626]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-[#111827] truncate">{doc.name}</p>
                  <p className="text-[11px] text-[#9ca3af]">{doc.size}</p>
                </div>
                <Download size={14} className="text-[#9ca3af] group-hover:text-[#111827] transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
