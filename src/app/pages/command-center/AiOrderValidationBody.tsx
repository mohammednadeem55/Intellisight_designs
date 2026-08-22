import { useState } from "react";
import { toast } from "sonner";
import { Archive, ArrowRight, ChevronDown, ChevronRight, CircleCheck, CircleX, Download, FileImage, FileSpreadsheet, FileText, Info, MapPin, TriangleAlert } from "lucide-react";
import { TextField } from "../../components/common/TextField";

// Mock OA (Order Acknowledgement) validation results — a fixed set of automated checks run against the
// order, each either passed, failed, or flagged for manual review. Counts are kept internally consistent
// (5 failed/review + 18 passed = 23 total) so the column headers, sidebar stats, and "View More" counts
// all agree with each other.
type CheckStatus = "failed" | "warning" | "passed";
type ValidationCheck = { label: string; status: CheckStatus; reason: string; recommendedAction?: string };

const FAILED_AND_REVIEW_CHECKS: ValidationCheck[] = [
  {
    label: "Embassy and Sanctioned Country",
    status: "failed",
    reason: "Customer is located in a sanctioned country. Manual review and compliance officer approval required before proceeding.",
    recommendedAction: "Escalate to compliance team for review",
  },
  {
    label: "Customer Export Screening",
    status: "failed",
    reason: "Customer name partially matches an entry on the denied parties list. Requires manual clearance before booking.",
    recommendedAction: "Run a manual denied-party screening and attach clearance evidence",
  },
  {
    label: "Quote Validity",
    status: "warning",
    reason: "Quote QT-5000 expired 4 days ago. Pricing may no longer be valid.",
    recommendedAction: "Request an updated quote from the account manager",
  },
  {
    label: "Customer Name - PII vs Quote",
    status: "warning",
    reason: "Customer name on the PO differs slightly from the name on the quote (\"MACOM Technology Solutions Inc.\" vs \"MACOM Technology Solutions\").",
    recommendedAction: "Confirm the legal entity name matches before proceeding",
  },
  {
    label: "Currency Mismatch",
    status: "warning",
    reason: "PO currency (EUR) does not match the account's default currency (USD).",
    recommendedAction: "Confirm the correct currency with the customer",
  },
];

const PASSED_CHECKS: ValidationCheck[] = [
  { label: "Non-English Language Check", status: "passed", reason: "All language checks passed successfully." },
  { label: "Purchase Order (PO) Format Check", status: "passed", reason: "PO format matches the expected schema for this account." },
  { label: "Country Comparison - PII vs Quote", status: "passed", reason: "Shipping country on the PO matches the country on the quote." },
  { label: "Typologies / Export Language", status: "passed", reason: "No restricted export terminology detected in the order description." },
  { label: "Accepting Legal Entity", status: "passed", reason: "The accepting legal entity is active and in good standing." },
  { label: "Duplicate Order Check", status: "passed", reason: "No duplicate orders found for this PO number in the last 90 days." },
  { label: "Credit Hold Status", status: "passed", reason: "Account has no active credit holds." },
  { label: "Product Export Classification (ECCN)", status: "passed", reason: "All line items have a valid export classification on file." },
  { label: "Bill-To vs Ship-To Match", status: "passed", reason: "Bill-to and ship-to accounts are both verified and linked." },
  { label: "Tax Exemption Certificate", status: "passed", reason: "A valid tax exemption certificate is on file for this account." },
  { label: "Denied Party Screening", status: "passed", reason: "No matches found against restricted or denied party lists." },
  { label: "Contract Terms Alignment", status: "passed", reason: "Order terms are consistent with the active master agreement." },
  { label: "Currency Conversion Accuracy", status: "passed", reason: "Converted amounts match the daily exchange rate within tolerance." },
  { label: "Payment Terms Validation", status: "passed", reason: "Payment terms on the PO match the account's approved terms." },
  { label: "Incoterms Consistency", status: "passed", reason: "Incoterms on the PO match the quote." },
  { label: "Order Quantity vs Quote", status: "passed", reason: "Ordered quantities match the quoted quantities for every line item." },
  { label: "Unit Price vs Quote", status: "passed", reason: "Unit prices match the quoted prices for every line item." },
  { label: "Restricted End-Use Check", status: "passed", reason: "No restricted end-use or end-user flags detected." },
];

const TOTAL_CHECKS = FAILED_AND_REVIEW_CHECKS.length + PASSED_CHECKS.length;
const FAILED_COUNT = FAILED_AND_REVIEW_CHECKS.filter(c => c.status === "failed").length;
const REVIEW_COUNT = FAILED_AND_REVIEW_CHECKS.filter(c => c.status === "warning").length;

const SHIP_TO = {
  company: "MACOM Technology Solutions Inc.",
  address: "100 Chelmsford Street",
  cityState: "Lowell, MA 01851",
  country: "United States",
};

const DOCUMENTS = [
  { name: "Quotation.pdf", size: "1.2 MB" },
  { name: "Purchase_Order.docs", size: "1.2 MB" },
  { name: "LoremIpsum.CSV", size: "1.2 MB" },
];

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

export function AiOrderValidationBody() {
  const [resultsOpen, setResultsOpen] = useState(true);
  const [freightTerms, setFreightTerms] = useState("");
  const [discountApproval, setDiscountApproval] = useState("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      {/* Left: check results + collapsed secondary sections */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-[8px] border border-[#ebebeb]">
          <button
            onClick={() => setResultsOpen(v => !v)}
            className={`w-full flex items-center justify-between gap-2 px-5 py-4 cursor-pointer flex-wrap ${resultsOpen ? "border-b border-[#f3f4f6]" : ""}`}
          >
            <div className="flex items-center gap-2">
              <ChevronDown size={15} className={`text-[#6b7280] transition-transform duration-200 ${resultsOpen ? "" : "-rotate-90"}`} />
              <h3 className="text-[14px] font-bold text-[#111827]">OA Validation Results</h3>
            </div>
            <p className="flex items-center gap-1.5 text-[11.5px] text-[#9ca3af]">
              <Info size={12} className="shrink-0" /> {TOTAL_CHECKS} checks by Oracle · click any check to see its reason
            </p>
          </button>
          {resultsOpen && (
            <div className="px-5 py-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CheckColumn title="Failed & Needs Attention" accentColor="#BA1C1C" checks={FAILED_AND_REVIEW_CHECKS} />
              <CheckColumn title="Passed" accentColor="#468657" checks={PASSED_CHECKS} />
            </div>
          )}
        </div>

        <CollapsibleSection title="PO Parsing Results" badge="14/18 matched">
          <TextField label="PO Number" variant="matched" value="1514444" readOnly />
          <TextField label="Line Items" variant="matched" value="8 line items parsed" readOnly />
          <TextField label="Ship-To Address" variant="matched" value="100 Chelmsford St, Lowell, MA 01851" readOnly />
          <TextField label="Freight Terms" variant="missing" value={freightTerms} onChange={setFreightTerms} placeholder="Select to apply or type" />
        </CollapsibleSection>

        <CollapsibleSection title="Sales Force - Manager Quotes" badge="07/08 matched">
          <TextField label="Quote Number" variant="matched" value="QT-5000" readOnly />
          <TextField label="Quote Owner" variant="matched" value="Jagdish K." readOnly />
          <TextField label="Approval Status" variant="matched" value="Manager Approved" readOnly />
          <TextField label="Discount Approval" variant="missing" value={discountApproval} onChange={setDiscountApproval} placeholder="Select to apply or type" />
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
                <span className="text-[20px] font-bold text-[#468657] leading-none">{PASSED_CHECKS.length}/{TOTAL_CHECKS}</span>
              </div>
              <span className="text-[10.5px] font-medium text-[#6b7280] text-center leading-tight">Checks Passed</span>
            </div>
            <div className="rounded-[8px] bg-[#FDF3E7] px-2.5 py-3 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <TriangleAlert size={18} className="text-[#E67919] shrink-0" />
                <span className="text-[20px] font-bold text-[#92600B] leading-none">{REVIEW_COUNT}</span>
              </div>
              <span className="text-[10.5px] font-medium text-[#6b7280] text-center leading-tight">Needs Review</span>
            </div>
            <div className="rounded-[8px] bg-[#FDECEA] px-2.5 py-3 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <CircleX size={18} className="text-[#BA1C1C] shrink-0" />
                <span className="text-[20px] font-bold text-[#BA1C1C] leading-none">{FAILED_COUNT}</span>
              </div>
              <span className="text-[10.5px] font-medium text-[#6b7280] text-center leading-tight">Failed</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#f3f4f6]">
            <div>
              <p className="text-[10.5px] text-[#9ca3af]">Screening Started</p>
              <p className="text-[12.5px] font-semibold text-[#111827] mt-0.5">31 Jul 2026, 10:52 PM</p>
            </div>
            <div>
              <p className="text-[10.5px] text-[#9ca3af]">Screening Completed</p>
              <p className="text-[12.5px] font-semibold text-[#111827] mt-0.5">31 Jul 2026, 10:52 PM</p>
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
            {DOCUMENTS.map(doc => {
              const meta = docMeta(doc.name);
              return (
                <button
                  key={doc.name}
                  onClick={() => toast.info(`Downloading ${doc.name}`)}
                  className="group flex items-center gap-2.5 px-3 py-2 rounded-[8px] border border-[#ebebeb] hover:border-[#d1d5db] hover:bg-[#f8fafc] cursor-pointer transition-colors text-left w-full"
                >
                  <div className="size-[32px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg }}>
                    <meta.icon size={15} style={{ color: meta.fg }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-[#111827] truncate">{doc.name}</p>
                    <p className="text-[11px] text-[#9ca3af]">{doc.size}</p>
                  </div>
                  <Download size={14} className="text-[#9ca3af] group-hover:text-[#111827] transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
