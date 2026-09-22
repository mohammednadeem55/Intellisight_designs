import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Archive,
  Bold,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Eraser,
  FileImage,
  FileSpreadsheet,
  FileText,
  Flame,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Mail,
  MessageSquare,
  Package,
  Paperclip,
  Quote,
  Reply as ReplyIcon,
  Search,
  Sparkles,
  Underline,
  X,
} from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { EMAIL_TABLE_NAVY } from "../../components/common/EmailTable";
import { ALL_EMAILS_WITH_CCC, type Email } from "../command-center/emailData";
import { EmailThreadCard, senderDisplayName } from "../command-center/emailThread";

type CommMessage = {
  id: string;
  subject: string;
  reference: string;
  fromName: string;
  from: string;
  body: string;
  date: string;
  type: "followup" | "escalation";
};

type CommOrderThread = {
  orderId: string;
  customer: string;
  to: string;
  date: string;
  messages: CommMessage[];
};

const COMM_ORDERS: CommOrderThread[] = [
  {
    orderId: "7893002", customer: "Tektronix Inc", to: "gtl.compliance@keysight.com", date: "Jul 15, 10:32 AM",
    messages: [
      { id: "m1", subject: "Action Required: Export Hold at Pick", reference: "Re: Q3 roadmap alignment", fromName: "GTL Compliance", from: "gtl.compliance@keysight.com", body: "This order is currently on an export hold pending destination country screening. Please review the attached denied-party screening report and confirm clearance before the pick can proceed.", date: "Mon", type: "followup" },
      { id: "m1b", subject: "Action Required: Export Hold at Pick", reference: "Re: Q3 roadmap alignment", fromName: "GTL Compliance", from: "gtl.compliance@keysight.com", body: "Checking in on this — the destination screening report was sent over yesterday. Let us know if anything further is needed to clear the hold.", date: "Mon", type: "followup" },
      { id: "m1c", subject: "Action Required: Export Hold at Pick", reference: "Re: Q3 roadmap alignment", fromName: "GTL Compliance", from: "gtl.compliance@keysight.com", body: "Second follow-up — we still need sign-off on the screening report to release this order. Please confirm at your earliest convenience.", date: "Tue", type: "followup" },
      { id: "m2", subject: "Action Required: Export Hold at Pick", reference: "Re: Q3 roadmap alignment", fromName: "GTL Compliance", from: "gtl.compliance@keysight.com", body: "Following up again — this hold has now been open for 3 days with no response. Please action as soon as possible to avoid missing the committed ship date.", date: "Yesterday", type: "followup" },
      { id: "m3", subject: "Escalation: SLA Breach Risk", reference: "Re: Order 7893002 hold review", fromName: "Compliance Lead", from: "compliance.lead@keysight.com", body: "Escalating this hold to your attention — it is now at risk of breaching SLA within 24 hours. Please prioritize a response or reassign for immediate action.", date: "Tue", type: "escalation" },
    ],
  },
  {
    orderId: "7893015", customer: "Rohde & Schwarz", to: "credit.review@keysight.com", date: "Jul 14, 3:10 PM",
    messages: [
      { id: "m4", subject: "Credit Check Follow-Up", reference: "Re: Payment terms confirmation", fromName: "Credit Review", from: "credit.review@keysight.com", body: "Still awaiting confirmation on the updated payment terms for this account before the credit hold can be released. Could you confirm by end of day?", date: "2d ago", type: "followup" },
      { id: "m5", subject: "Escalation: Credit Hold Aging", reference: "Re: Order 7893015 credit hold", fromName: "Credit Manager", from: "credit.manager@keysight.com", body: "This credit hold has now aged past 5 days without resolution. Escalating for visibility — please advise on next steps or approve an exception.", date: "3d ago", type: "escalation" },
    ],
  },
  {
    orderId: "7893028", customer: "Anritsu Corp", to: "invoicing@keysight.com", date: "Jul 12, 9:05 AM",
    messages: [
      { id: "m6", subject: "Invoicing Discrepancy Follow-Up", reference: "Re: Invoice #INV-88213", fromName: "Invoicing Team", from: "invoicing@keysight.com", body: "Following up on the invoicing discrepancy flagged last week — the line-item total on INV-88213 doesn't match the PO. Can you confirm the correct amount?", date: "5d ago", type: "followup" },
    ],
  },
  {
    orderId: "7893034", customer: "Siemens AG", to: "gtl.compliance@keysight.com", date: "Jul 11, 4:20 PM",
    messages: [
      { id: "m7", subject: "Destination Screening Pending", reference: "Re: Order 7893034 export review", fromName: "GTL Compliance", from: "gtl.compliance@keysight.com", body: "This shipment is pending destination country screening. Please provide the end-use statement to proceed with clearance.", date: "6d ago", type: "followup" },
    ],
  },
  {
    orderId: "7893041", customer: "National Instruments", to: "credit.review@keysight.com", date: "Jul 10, 11:45 AM",
    messages: [
      { id: "m8", subject: "Credit Limit Exceeded", reference: "Re: Order 7893041 credit review", fromName: "Credit Review", from: "credit.review@keysight.com", body: "This order exceeds the account's approved credit limit. Please confirm whether to proceed with an exception or hold for payment.", date: "1w ago", type: "followup" },
      { id: "m9", subject: "Escalation: Credit Exception Needed", reference: "Re: Order 7893041 credit review", fromName: "Credit Manager", from: "credit.manager@keysight.com", body: "No response received on the credit exception request. Escalating — this order is now blocking a committed customer ship date.", date: "5d ago", type: "escalation" },
    ],
  },
  {
    orderId: "7893052", customer: "Yokogawa Electric", to: "invoicing@keysight.com", date: "Jul 9, 8:15 AM",
    messages: [
      { id: "m10", subject: "PO Mismatch Follow-Up", reference: "Re: Invoice #INV-88240", fromName: "Invoicing Team", from: "invoicing@keysight.com", body: "The PO number on this order doesn't match what's on file. Could you confirm the correct PO before we proceed with invoicing?", date: "1w ago", type: "followup" },
    ],
  },
  {
    orderId: "7893060", customer: "Fortive Corporation", to: "gtl.compliance@keysight.com", date: "Jul 8, 2:35 PM",
    messages: [
      { id: "m11", subject: "Restricted Party Match Review", reference: "Re: Order 7893060 compliance hold", fromName: "GTL Compliance", from: "gtl.compliance@keysight.com", body: "A potential restricted-party match was flagged during screening. Please review the attached report and confirm whether this is a false positive.", date: "1w ago", type: "followup" },
      { id: "m12", subject: "Escalation: Screening Match Unresolved", reference: "Re: Order 7893060 compliance hold", fromName: "Compliance Lead", from: "compliance.lead@keysight.com", body: "This screening match has been open for over a week with no resolution. Escalating to compliance leadership for a final determination.", date: "6d ago", type: "escalation" },
    ],
  },
  {
    orderId: "7893071", customer: "Teledyne LeCroy", to: "credit.review@keysight.com", date: "Jul 7, 10:05 AM",
    messages: [
      { id: "m13", subject: "Payment Terms Confirmation", reference: "Re: Order 7893071 credit hold", fromName: "Credit Review", from: "credit.review@keysight.com", body: "Please confirm the agreed payment terms for this account so we can release the credit hold on this order.", date: "2w ago", type: "followup" },
    ],
  },
  {
    orderId: "7893083", customer: "Advantest Corporation", to: "invoicing@keysight.com", date: "Jul 6, 3:50 PM",
    messages: [
      { id: "m14", subject: "Tax Exemption Certificate Needed", reference: "Re: Invoice #INV-88257", fromName: "Invoicing Team", from: "invoicing@keysight.com", body: "We're missing a valid tax exemption certificate for this order. Please provide an updated copy so invoicing can proceed.", date: "2w ago", type: "followup" },
      { id: "m15", subject: "Escalation: Invoice Blocked", reference: "Re: Invoice #INV-88257", fromName: "Billing Manager", from: "billing.manager@keysight.com", body: "This invoice remains blocked pending the tax exemption certificate. Escalating as it's now impacting month-end close.", date: "1w ago", type: "escalation" },
    ],
  },
  {
    orderId: "7893095", customer: "Viavi Solutions", to: "gtl.compliance@keysight.com", date: "Jul 5, 9:20 AM",
    messages: [
      { id: "m16", subject: "End-Use Statement Requested", reference: "Re: Order 7893095 export review", fromName: "GTL Compliance", from: "gtl.compliance@keysight.com", body: "Please provide a signed end-use statement for this shipment so we can complete export clearance.", date: "2w ago", type: "followup" },
    ],
  },
];

// Which source Communication is showing — same dropdown pattern as Command Center Overview's FCNV/CSR
// toggle. Hold Mgmt keeps the existing order follow-up/escalation threads; Cmd Center shows the email
// worklist's own threads instead, since Communication is now a shared top-level page reachable from both.
const COMM_VIEW_OPTIONS = ["Hold Mgmt", "Cmd Center"] as const;
type CommView = (typeof COMM_VIEW_OPTIONS)[number];

const REPLY_FROM_OPTIONS = ["tradeorders@keysight.com", "compliance@keysight.com"];

const REPLY_TEMPLATES: { label: string; recommended?: boolean; mostUsed?: boolean }[] = [
  { label: "Compliance Clearance Confirmation", recommended: true },
  { label: "Standard Follow-Up Response", mostUsed: true },
  { label: "Escalation Acknowledgement" },
  { label: "Credit Hold Follow-Up" },
  { label: "SLA Breach Response" },
  { label: "Export Hold Status Update" },
  { label: "Requesting Additional Information" },
];

function buildTemplateBody(label: string, recipientName: string, subjectLine: string): string {
  return `Dear ${recipientName},\n\nPlease find our response below regarding "${subjectLine}" — ${label.toLowerCase()}.\n\nKind regards,\nCustomer Service — Trade Orders`;
}

function docMeta(name: string): { icon: typeof FileText; bg: string; fg: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: FileText, bg: "#FDECEA", fg: "#DC2626" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: FileSpreadsheet, bg: "#E8F5E9", fg: "#2E7D32" };
  if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) return { icon: FileImage, bg: "#EAF1FB", fg: "#30578D" };
  if (["zip", "rar", "7z"].includes(ext)) return { icon: Archive, bg: "#FDF3E7", fg: "#92600B" };
  if (ext === "eml") return { icon: Mail, bg: "#EAF1FB", fg: "#30578D" };
  return { icon: FileText, bg: "#F1F2F4", fg: "#666666" };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Same row/toolbar/composer shape as the SOA composer in Command Center's Workflow page (SoaBody.tsx) —
// From/To/Subject rows, formatting toolbar, body textarea, attachments — reused here since that's the
// established "compose an email" pattern in this app; only the content (templates, prefilled To/Subject,
// the original-message preview above it) is specific to replying within a Communication thread.
function ComposerFieldRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 px-6 min-h-[40px]">
      <label className="w-[62px] shrink-0 text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 text-[13px] text-[#262626] outline-none bg-transparent"
      />
    </div>
  );
}

function RecipientRow({ label, value, onRemove, trailing }: { label: string; value: string; onRemove: () => void; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-6 min-h-[40px]">
      <label className="w-[62px] shrink-0 text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide">{label}</label>
      <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap py-1">
        <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-[8px] bg-[#EAF1FB] text-[12px] font-medium text-[#30578D]">
          {value}
          <button onClick={onRemove} className="text-[#30578D]/70 hover:text-[#30578D] cursor-pointer">
            <X size={11} />
          </button>
        </span>
      </div>
      {trailing && <div className="flex items-center gap-2.5 shrink-0">{trailing}</div>}
    </div>
  );
}

// Free-typed, multi-value email field (type + Enter/comma to add a pill, Backspace on empty to pop the
// last one) — used for Cc/Bcc, matching SOA's RecipientPillField exactly.
function RecipientPillField({ label, values, onChange, placeholder, trailing }: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  trailing?: React.ReactNode;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const trimmed = draft.trim().replace(/,+$/, "");
    if (trimmed) onChange([...values, trimmed]);
    setDraft("");
  };

  const removeAt = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div className="flex items-center gap-3 px-6 min-h-[40px]">
      <label className="w-[62px] shrink-0 text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide">{label}</label>
      <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap py-1">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-[8px] bg-[#EAF1FB] text-[12px] font-medium text-[#30578D]"
          >
            {v}
            <button onClick={() => removeAt(i)} className="text-[#30578D]/70 hover:text-[#30578D] cursor-pointer">
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
              removeAt(values.length - 1);
            }
          }}
          onBlur={commit}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[140px] py-0.5 text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none bg-transparent"
        />
      </div>
      {trailing && <div className="flex items-center gap-2.5 shrink-0">{trailing}</div>}
    </div>
  );
}

function ComposerSelectRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-3 px-6 min-h-[40px]">
      <label className="w-[62px] shrink-0 text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide">{label}</label>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 pl-3 pr-2.5 py-1 rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F7] hover:bg-[#F1F2F4] text-[13px] text-[#262626] cursor-pointer transition-colors"
        >
          <span>{value}</span>
          <ChevronDown size={14} className={`text-[#97999B] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 min-w-[220px] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-20 py-1">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[12.5px] cursor-pointer whitespace-nowrap transition-colors ${
                  opt === value ? "font-semibold text-[#30578D] bg-[#EAF1FB]" : "text-[#4D4D4D] hover:bg-[#F7F7F7]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, active, onClick }: { icon: typeof Bold; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex items-center justify-center size-[28px] rounded-[6px] cursor-pointer transition-colors ${
        active ? "bg-[#EAF1FB] text-[#30578D]" : "text-[#666666] hover:bg-[#F1F2F4]"
      }`}
    >
      <Icon size={15} />
    </button>
  );
}

function initialsOf(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("");
}

// One earlier message in the thread — collapsed to a single scannable row by default, expands in place on
// click. Mirrors emailThread.tsx's HistoryMessageItem so a thread reads the same way it does in Command
// Center's Email & Classify stage, just without leaving the page to view it.
function ThreadHistoryRow({ message, expanded, onToggle }: { message: CommMessage; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer hover:bg-[#F7F7F7] transition-colors"
      >
        <div className="size-[24px] rounded-full bg-[#97999B] flex items-center justify-center shrink-0 text-[9.5px] font-bold text-white">
          {initialsOf(message.fromName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-[12.5px] font-medium text-[#4D4D4D] truncate">{message.fromName}</p>
            <span className="text-[11.5px] text-[#97999B] truncate">· {message.from}</span>
          </div>
          {!expanded && <p className="text-[11.5px] text-[#97999B] truncate mt-0.5">{message.subject}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <p className="text-[10.5px] text-[#97999B] whitespace-nowrap">{message.date}</p>
          <ChevronRight size={12} className={`text-[#97999B] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-2.5 border-t border-[#F1F2F4]">
          <p className="text-[12.5px] font-bold text-[#262626] mb-1.5">{message.subject}</p>
          <p className="text-[12px] text-[#4D4D4D] leading-[1.65] whitespace-pre-wrap">{message.body}</p>
        </div>
      )}
    </div>
  );
}

// Thread reading pane for the active tab — the latest message always open, earlier ones collapsible in
// place, exactly like Command Center's Email & Classify stage. No click swaps the view; the reply composer
// underneath always targets the thread's latest message.
function ThreadView({ tabLabel, messages }: { tabLabel: string; messages: CommMessage[] }) {
  const latest = messages[messages.length - 1];
  const earlier = messages.slice(0, -1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {earlier.length > 0 && (
        <p className="text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide">
          {messages.length} {tabLabel.toLowerCase()} in this thread
        </p>
      )}

      <div className="flex items-start gap-3">
        <span
          className="size-[32px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{ backgroundColor: EMAIL_TABLE_NAVY }}
        >
          {initialsOf(latest.fromName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-semibold text-[#262626] truncate">{latest.fromName}</p>
            <p className="text-[11px] text-[#97999B] shrink-0">{latest.date}</p>
          </div>
          <p className="text-[11px] text-[#97999B] truncate">{latest.from}</p>
          <p className="text-[12.5px] font-bold text-[#262626] mt-2 mb-1">{latest.subject}</p>
          <p className="text-[12.5px] text-[#4D4D4D] leading-[1.7] whitespace-pre-wrap">{latest.body}</p>
        </div>
      </div>

      {earlier.length > 0 && (
        <div className="bg-[#F7F7F7] rounded-[8px] px-3 py-3">
          <p className="text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide mb-2 px-1">
            Earlier {tabLabel.toLowerCase()} ({earlier.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {earlier.map((m) => (
              <ThreadHistoryRow key={m.id} message={m} expanded={expandedIds.has(m.id)} onToggle={() => toggle(m.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Templates panel — sibling of the composer, not nested inside it, so it can render as its own panel on
// the right of the page rather than a column squeezed into the composer's card.
function EmailTemplatesPanel({ query, onQueryChange, selectedTemplate, onApply }: {
  query: string;
  onQueryChange: (v: string) => void;
  selectedTemplate: string | null;
  onApply: (label: string) => void;
}) {
  const filteredTemplates = REPLY_TEMPLATES.filter((t) => t.label.toLowerCase().includes(query.toLowerCase())).sort(
    (a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 shrink-0">
        <h3 className="text-[14px] font-bold text-[#262626]">Email Templates</h3>
        <p className="text-[12px] text-[#97999B] mt-0.5 mb-3">Choose a template to replace the reply body.</p>

        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search templates"
            className="w-full pl-8 pr-8 py-2 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
          />
          {query && (
            <button onClick={() => onQueryChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#97999B] hover:text-[#262626] cursor-pointer transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <p className="text-[12.5px] text-[#97999B] text-center px-5 py-6">No templates match "{query}"</p>
        ) : (
          filteredTemplates.map((t, i) => {
            const selected = selectedTemplate === t.label;
            return (
              <button
                key={t.label}
                onClick={() => onApply(t.label)}
                className={`w-full flex items-center gap-2.5 px-5 py-2.5 min-h-[58px] text-left cursor-pointer transition-colors ${
                  i !== 0 ? "border-t border-[#F1F2F4]" : ""
                } ${selected ? "bg-[#EAF1FB]" : "hover:bg-[#F7F7F7]"}`}
              >
                <div className={`size-[26px] rounded-[6px] flex items-center justify-center shrink-0 ${selected ? "bg-white" : "bg-[#F1F2F4]"}`}>
                  <FileText size={13} className={selected ? "text-[#30578D]" : "text-[#97999B]"} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] leading-tight truncate ${selected ? "font-semibold text-[#262626]" : "text-[#4D4D4D]"}`}>{t.label}</p>
                  {(t.recommended || t.mostUsed) && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {t.recommended && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[2px] text-[#7C3BF6] bg-[#7C3BF6]/10">
                          <Sparkles size={9} />
                          Recommended
                        </span>
                      )}
                      {t.mostUsed && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[2px] text-[#387D85] bg-[#387D85]/10">
                          <Flame size={9} />
                          Most Used
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {selected && <Check size={14} className="text-[#30578D] shrink-0" strokeWidth={3} />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// Owns the tabs, the read-in-place thread, and the reply flow for one order. The composer and templates
// panel share state here (lifted up) since the templates panel now renders as a page-level sibling on the
// right rather than nested inside the composer's own card — and both only mount once "Reply" is clicked.
function ThreadAndReply({ order }: { order: CommOrderThread }) {
  const followupCount = order.messages.filter((m) => m.type === "followup").length;
  const escalationCount = order.messages.filter((m) => m.type === "escalation").length;

  const [activeTab, setActiveTab] = useState<"followup" | "escalation">(followupCount > 0 ? "followup" : "escalation");
  const threadMessages = order.messages.filter((m) => m.type === activeTab);
  const latestMessage = threadMessages[threadMessages.length - 1] ?? null;

  const [replyOpen, setReplyOpen] = useState(false);
  const [from, setFrom] = useState(REPLY_FROM_OPTIONS[0]);
  const [subject, setSubject] = useState("");
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [body, setBody] = useState("");
  const [format, setFormat] = useState({ bold: false, italic: false, underline: false, align: "left" as "left" | "center" | "right" });
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateQuery, setTemplateQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const switchTab = (tab: "followup" | "escalation") => {
    setActiveTab(tab);
    setReplyOpen(false);
  };

  const openReply = () => {
    if (!latestMessage) return;
    setFrom(REPLY_FROM_OPTIONS[0]);
    setSubject(`Re: ${latestMessage.subject}`);
    setCc([]);
    setBcc([]);
    setShowCc(false);
    setShowBcc(false);
    setBody("");
    setFormat({ bold: false, italic: false, underline: false, align: "left" });
    setAttachedFiles([]);
    setSelectedTemplate(null);
    setTemplateQuery("");
    setReplyOpen(true);
  };

  const applyTemplate = (label: string) => {
    if (!latestMessage) return;
    setSelectedTemplate(label);
    setBody(buildTemplateBody(label, latestMessage.fromName, subject));
    toast.success(`${label} applied`);
  };

  const handleAttachEmail = () => {
    if (!latestMessage) return;
    const name = `${latestMessage.subject.slice(0, 30)}.eml`;
    setAttachedFiles((prev) => [...prev, { name, size: "24 KB" }]);
    toast.success("Reference email attached");
  };

  const handleUploadAttachment = () => fileInputRef.current?.click();
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setAttachedFiles((prev) => [...prev, ...files.map((f) => ({ name: f.name, size: formatFileSize(f.size) }))]);
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} attached`);
    }
    e.target.value = "";
  };
  const removeAttachment = (i: number) => {
    setAttachedFiles((prev) => {
      const removed = prev[i];
      if (removed) toast.info(`${removed.name} removed`);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const sendReply = () => {
    if (!body.trim()) return;
    toast.success("Reply sent");
    setReplyOpen(false);
  };

  return (
    <div className="flex-1 min-w-0 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col min-h-0">
        <div className="px-5 py-3 shrink-0 border-b border-[#E2E6E9]">
          <div className="inline-flex items-center gap-1 p-1 rounded-[8px] bg-[#F1F2F4]">
            {(["followup", "escalation"] as const).map((tab) => {
              const count = tab === "followup" ? followupCount : escalationCount;
              const disabled = count === 0;
              const active = activeTab === tab && !disabled;
              const Icon = tab === "followup" ? MessageSquare : AlertTriangle;
              const label = tab === "followup" ? "Follow-ups" : "Escalations";
              return (
                <button
                  key={tab}
                  onClick={() => !disabled && switchTab(tab)}
                  disabled={disabled}
                  title={disabled ? `No ${label.toLowerCase()} for this order` : undefined}
                  className={`flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-[6px] text-[12px] font-semibold transition-colors ${
                    disabled
                      ? "text-[#97999B] opacity-50 cursor-not-allowed"
                      : active
                        ? "bg-white text-[#262626] shadow-[0_1px_2px_rgba(15,23,42,0.08)] cursor-pointer"
                        : "text-[#666666] hover:text-[#262626] cursor-pointer"
                  }`}
                >
                  <Icon size={13} className={disabled ? "text-[#97999B]" : active ? (tab === "escalation" ? "text-[#C83737]" : "text-[#30578D]") : "text-[#97999B]"} />
                  {label}
                  <span
                    className={`flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-white text-[9.5px] font-bold ${disabled ? "opacity-70" : ""}`}
                    style={{ backgroundColor: disabled ? "#97999B" : tab === "escalation" ? "#C83737" : "#30578D" }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-4">
          {threadMessages.length === 0 || !latestMessage ? (
            <p className="text-[12px] text-[#97999B] text-center py-8">
              No {activeTab === "followup" ? "follow-ups" : "escalations"} for this order
            </p>
          ) : (
            <>
              {replyOpen && (
                <div className="bg-white rounded-[8px] border border-[#E2E6E9] flex flex-col md:flex-row min-w-0">
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4 border-b border-[#F1F2F4]">
                    <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#262626]">Draft Reply</h2>
                    {selectedTemplate && (
                      <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-[8px] bg-[#EAF1FB] text-[11px] font-semibold text-[#30578D] whitespace-nowrap">
                        Applied: {selectedTemplate}
                        <button
                          onClick={() => { setSelectedTemplate(null); setBody(""); toast.info("Template removed"); }}
                          title="Remove applied template"
                          className="text-[#30578D]/70 hover:text-[#30578D] cursor-pointer transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-[#F1F2F4] border-b border-[#F1F2F4]">
                    <ComposerSelectRow label="From" value={from} options={REPLY_FROM_OPTIONS} onChange={setFrom} />
                    <RecipientRow
                      label="To"
                      value={latestMessage.from}
                      onRemove={() => toast.info("Reply requires at least one recipient")}
                      trailing={
                        <>
                          {!showCc && (
                            <button onClick={() => setShowCc(true)} className="text-[12px] font-semibold text-[#30578D] hover:underline cursor-pointer">
                              Cc
                            </button>
                          )}
                          {!showBcc && (
                            <button onClick={() => setShowBcc(true)} className="text-[12px] font-semibold text-[#30578D] hover:underline cursor-pointer">
                              Bcc
                            </button>
                          )}
                        </>
                      }
                    />
                    <ComposerFieldRow label="Subject" value={subject} onChange={setSubject} />
                    {showCc && (
                      <RecipientPillField
                        label="Cc"
                        values={cc}
                        onChange={setCc}
                        placeholder="Enter Cc email addresses…"
                        trailing={
                          <button onClick={() => { setShowCc(false); setCc([]); }} className="text-[#97999B] hover:text-[#262626] cursor-pointer">
                            <X size={14} />
                          </button>
                        }
                      />
                    )}
                    {showBcc && (
                      <RecipientPillField
                        label="Bcc"
                        values={bcc}
                        onChange={setBcc}
                        placeholder="Enter Bcc email addresses…"
                        trailing={
                          <button onClick={() => { setShowBcc(false); setBcc([]); }} className="text-[#97999B] hover:text-[#262626] cursor-pointer">
                            <X size={14} />
                          </button>
                        }
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 flex-wrap px-6 py-2 bg-[#F7F7F7] border-b border-[#F1F2F4]">
                    <ToolbarButton icon={Bold} label="Bold" active={format.bold} onClick={() => setFormat((f) => ({ ...f, bold: !f.bold }))} />
                    <ToolbarButton icon={Italic} label="Italic" active={format.italic} onClick={() => setFormat((f) => ({ ...f, italic: !f.italic }))} />
                    <ToolbarButton icon={Underline} label="Underline" active={format.underline} onClick={() => setFormat((f) => ({ ...f, underline: !f.underline }))} />
                    <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
                    <ToolbarButton icon={AlignLeft} label="Align left" active={format.align === "left"} onClick={() => setFormat((f) => ({ ...f, align: "left" }))} />
                    <ToolbarButton icon={AlignCenter} label="Align center" active={format.align === "center"} onClick={() => setFormat((f) => ({ ...f, align: "center" }))} />
                    <ToolbarButton icon={AlignRight} label="Align right" active={format.align === "right"} onClick={() => setFormat((f) => ({ ...f, align: "right" }))} />
                    <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
                    <ToolbarButton icon={List} label="Bulleted list" />
                    <ToolbarButton icon={ListOrdered} label="Numbered list" />
                    <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
                    <ToolbarButton icon={LinkIcon} label="Insert link" />
                    <ToolbarButton icon={Quote} label="Quote" />
                    <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
                    <ToolbarButton icon={Heading1} label="Heading 1" />
                    <ToolbarButton icon={Heading2} label="Heading 2" />
                    <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
                    <ToolbarButton icon={Eraser} label="Clear formatting" onClick={() => setFormat({ bold: false, italic: false, underline: false, align: "left" })} />
                    <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
                    <ToolbarButton icon={Mail} label="Attach Email" onClick={handleAttachEmail} />
                    <ToolbarButton icon={Paperclip} label="Upload Attachment" onClick={handleUploadAttachment} />
                  </div>
                  <input ref={fileInputRef} type="file" multiple onChange={handleFilesSelected} className="hidden" />

                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your reply…"
                    className={`w-full min-h-[220px] px-6 py-4 text-[13px] text-[#4D4D4D] leading-[1.7] outline-none resize-y ${
                      format.align === "center" ? "text-center" : format.align === "right" ? "text-right" : "text-left"
                    } ${format.bold ? "font-bold" : ""} ${format.italic ? "italic" : ""} ${format.underline ? "underline" : ""}`}
                  />

                  <div className="px-6 py-4 border-t border-[#F1F2F4]">
                    {attachedFiles.length === 0 ? (
                      <p className="text-[12.5px] text-[#97999B]">No files attached yet.</p>
                    ) : (
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {attachedFiles.map((doc, i) => {
                          const meta = docMeta(doc.name);
                          return (
                            <div key={i} className="group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-[8px] border border-[#E2E6E9] hover:border-[#D9D9D6] transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="size-[26px] rounded-[6px] flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg }}>
                                  <meta.icon size={13} style={{ color: meta.fg }} />
                                </div>
                                <div className="text-left">
                                  <p className="text-[12px] font-medium text-[#262626] leading-tight">{doc.name}</p>
                                  <p className="text-[10.5px] text-[#97999B] leading-tight">{doc.size}</p>
                                </div>
                              </div>
                              <button onClick={() => toast.info(`Downloading ${doc.name}`)} title="Download attachment" className="text-[#97999B] hover:text-[#262626] cursor-pointer transition-colors shrink-0 ml-1">
                                <Download size={13} />
                              </button>
                              <button onClick={() => removeAttachment(i)} title="Remove attachment" className="text-[#97999B] hover:text-[#C83737] cursor-pointer transition-colors shrink-0">
                                <X size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#F1F2F4]">
                    <button
                      onClick={() => setReplyOpen(false)}
                      className="flex items-center gap-1.5 px-4 h-[34px] rounded-[8px] border border-[#E2E6E9] text-[#666666] text-[12.5px] font-semibold cursor-pointer hover:bg-[#F7F7F7] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendReply}
                      disabled={!body.trim()}
                      className="flex items-center gap-1.5 px-4 h-[34px] rounded-[8px] text-white text-[12.5px] font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                    >
                      Send Reply
                    </button>
                  </div>
                </div>

                {latestMessage && (
                  <div className="w-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-[#E2E6E9] flex flex-col">
                    <EmailTemplatesPanel
                      query={templateQuery}
                      onQueryChange={setTemplateQuery}
                      selectedTemplate={selectedTemplate}
                      onApply={applyTemplate}
                    />
                  </div>
                )}
                </div>
              )}

              <ThreadView tabLabel={activeTab === "followup" ? "Follow-ups" : "Escalations"} messages={threadMessages} />
            </>
          )}
        </div>

        {!replyOpen && latestMessage && (
          <div className="shrink-0 border-t border-[#E2E6E9] px-5 py-3 flex justify-end">
            <button
              onClick={openReply}
              className="flex items-center gap-1.5 px-4 h-[34px] rounded-[8px] text-white text-[12.5px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: EMAIL_TABLE_NAVY }}
            >
              <ReplyIcon size={14} />
              Reply
            </button>
          </div>
        )}
    </div>
  );
}

// The actual latest message in an email's thread — same aggregation EmailThreadCard uses internally
// (a root row's own `.replies` is always empty; the real correspondence lives one level down, on its
// linked CCCs) — used here only to seed the reply composer's default To/Subject, since EmailThreadCard
// itself owns rendering the read pane.
function latestMessageOf(email: Email): Email {
  const earlier = [...(email.replies ?? []), ...(email.linkedCccs ?? []).flatMap(c => c.replies ?? [])];
  return earlier.length > 0 ? earlier[earlier.length - 1] : email;
}

// Cmd Center counterpart to ThreadAndReply — same reply composer, but the reading pane reuses
// EmailThreadCard as-is (external-sender banner, attachments, "Earlier in this thread" history) so a
// thread reads identically to how Command Center itself shows it, instead of a second hand-rolled version.
function CmdCenterThreadAndReply({ email }: { email: Email }) {
  const latestMessage = latestMessageOf(email);

  const [replyOpen, setReplyOpen] = useState(false);
  const [from, setFrom] = useState(REPLY_FROM_OPTIONS[0]);
  const [subject, setSubject] = useState("");
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [body, setBody] = useState("");
  const [format, setFormat] = useState({ bold: false, italic: false, underline: false, align: "left" as "left" | "center" | "right" });
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateQuery, setTemplateQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openReply = () => {
    setFrom(REPLY_FROM_OPTIONS[0]);
    setSubject(`Re: ${latestMessage.subject}`);
    setCc([]);
    setBcc([]);
    setShowCc(false);
    setShowBcc(false);
    setBody("");
    setFormat({ bold: false, italic: false, underline: false, align: "left" });
    setAttachedFiles([]);
    setSelectedTemplate(null);
    setTemplateQuery("");
    setReplyOpen(true);
  };

  const applyTemplate = (label: string) => {
    setSelectedTemplate(label);
    setBody(buildTemplateBody(label, senderDisplayName(latestMessage.sender), subject));
    toast.success(`${label} applied`);
  };

  const handleAttachEmail = () => {
    const name = `${latestMessage.subject.slice(0, 30)}.eml`;
    setAttachedFiles((prev) => [...prev, { name, size: "24 KB" }]);
    toast.success("Reference email attached");
  };

  const handleUploadAttachment = () => fileInputRef.current?.click();
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setAttachedFiles((prev) => [...prev, ...files.map((f) => ({ name: f.name, size: formatFileSize(f.size) }))]);
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} attached`);
    }
    e.target.value = "";
  };
  const removeAttachment = (i: number) => {
    setAttachedFiles((prev) => {
      const removed = prev[i];
      if (removed) toast.info(`${removed.name} removed`);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const sendReply = () => {
    if (!body.trim()) return;
    toast.success("Reply sent");
    setReplyOpen(false);
  };

  return (
    <div className="flex-1 min-w-0 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-4">
        {replyOpen && (
          <div className="bg-white rounded-[8px] border border-[#E2E6E9] flex flex-col md:flex-row min-w-0">
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4 border-b border-[#F1F2F4]">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#262626]">Draft Reply</h2>
              {selectedTemplate && (
                <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-[8px] bg-[#EAF1FB] text-[11px] font-semibold text-[#30578D] whitespace-nowrap">
                  Applied: {selectedTemplate}
                  <button
                    onClick={() => { setSelectedTemplate(null); setBody(""); toast.info("Template removed"); }}
                    title="Remove applied template"
                    className="text-[#30578D]/70 hover:text-[#30578D] cursor-pointer transition-colors"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}
            </div>

            <div className="divide-y divide-[#F1F2F4] border-b border-[#F1F2F4]">
              <ComposerSelectRow label="From" value={from} options={REPLY_FROM_OPTIONS} onChange={setFrom} />
              <RecipientRow
                label="To"
                value={latestMessage.sender}
                onRemove={() => toast.info("Reply requires at least one recipient")}
                trailing={
                  <>
                    {!showCc && (
                      <button onClick={() => setShowCc(true)} className="text-[12px] font-semibold text-[#30578D] hover:underline cursor-pointer">
                        Cc
                      </button>
                    )}
                    {!showBcc && (
                      <button onClick={() => setShowBcc(true)} className="text-[12px] font-semibold text-[#30578D] hover:underline cursor-pointer">
                        Bcc
                      </button>
                    )}
                  </>
                }
              />
              <ComposerFieldRow label="Subject" value={subject} onChange={setSubject} />
              {showCc && (
                <RecipientPillField
                  label="Cc"
                  values={cc}
                  onChange={setCc}
                  placeholder="Enter Cc email addresses…"
                  trailing={
                    <button onClick={() => { setShowCc(false); setCc([]); }} className="text-[#97999B] hover:text-[#262626] cursor-pointer">
                      <X size={14} />
                    </button>
                  }
                />
              )}
              {showBcc && (
                <RecipientPillField
                  label="Bcc"
                  values={bcc}
                  onChange={setBcc}
                  placeholder="Enter Bcc email addresses…"
                  trailing={
                    <button onClick={() => { setShowBcc(false); setBcc([]); }} className="text-[#97999B] hover:text-[#262626] cursor-pointer">
                      <X size={14} />
                    </button>
                  }
                />
              )}
            </div>

            <div className="flex items-center gap-0.5 flex-wrap px-6 py-2 bg-[#F7F7F7] border-b border-[#F1F2F4]">
              <ToolbarButton icon={Bold} label="Bold" active={format.bold} onClick={() => setFormat((f) => ({ ...f, bold: !f.bold }))} />
              <ToolbarButton icon={Italic} label="Italic" active={format.italic} onClick={() => setFormat((f) => ({ ...f, italic: !f.italic }))} />
              <ToolbarButton icon={Underline} label="Underline" active={format.underline} onClick={() => setFormat((f) => ({ ...f, underline: !f.underline }))} />
              <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
              <ToolbarButton icon={AlignLeft} label="Align left" active={format.align === "left"} onClick={() => setFormat((f) => ({ ...f, align: "left" }))} />
              <ToolbarButton icon={AlignCenter} label="Align center" active={format.align === "center"} onClick={() => setFormat((f) => ({ ...f, align: "center" }))} />
              <ToolbarButton icon={AlignRight} label="Align right" active={format.align === "right"} onClick={() => setFormat((f) => ({ ...f, align: "right" }))} />
              <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
              <ToolbarButton icon={List} label="Bulleted list" />
              <ToolbarButton icon={ListOrdered} label="Numbered list" />
              <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
              <ToolbarButton icon={LinkIcon} label="Insert link" />
              <ToolbarButton icon={Quote} label="Quote" />
              <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
              <ToolbarButton icon={Heading1} label="Heading 1" />
              <ToolbarButton icon={Heading2} label="Heading 2" />
              <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
              <ToolbarButton icon={Eraser} label="Clear formatting" onClick={() => setFormat({ bold: false, italic: false, underline: false, align: "left" })} />
              <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
              <ToolbarButton icon={Mail} label="Attach Email" onClick={handleAttachEmail} />
              <ToolbarButton icon={Paperclip} label="Upload Attachment" onClick={handleUploadAttachment} />
            </div>
            <input ref={fileInputRef} type="file" multiple onChange={handleFilesSelected} className="hidden" />

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your reply…"
              className={`w-full min-h-[220px] px-6 py-4 text-[13px] text-[#4D4D4D] leading-[1.7] outline-none resize-y ${
                format.align === "center" ? "text-center" : format.align === "right" ? "text-right" : "text-left"
              } ${format.bold ? "font-bold" : ""} ${format.italic ? "italic" : ""} ${format.underline ? "underline" : ""}`}
            />

            <div className="px-6 py-4 border-t border-[#F1F2F4]">
              {attachedFiles.length === 0 ? (
                <p className="text-[12.5px] text-[#97999B]">No files attached yet.</p>
              ) : (
                <div className="flex items-center gap-2.5 flex-wrap">
                  {attachedFiles.map((doc, i) => {
                    const meta = docMeta(doc.name);
                    return (
                      <div key={i} className="group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-[8px] border border-[#E2E6E9] hover:border-[#D9D9D6] transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="size-[26px] rounded-[6px] flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg }}>
                            <meta.icon size={13} style={{ color: meta.fg }} />
                          </div>
                          <div className="text-left">
                            <p className="text-[12px] font-medium text-[#262626] leading-tight">{doc.name}</p>
                            <p className="text-[10.5px] text-[#97999B] leading-tight">{doc.size}</p>
                          </div>
                        </div>
                        <button onClick={() => toast.info(`Downloading ${doc.name}`)} title="Download attachment" className="text-[#97999B] hover:text-[#262626] cursor-pointer transition-colors shrink-0 ml-1">
                          <Download size={13} />
                        </button>
                        <button onClick={() => removeAttachment(i)} title="Remove attachment" className="text-[#97999B] hover:text-[#C83737] cursor-pointer transition-colors shrink-0">
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#F1F2F4]">
              <button
                onClick={() => setReplyOpen(false)}
                className="flex items-center gap-1.5 px-4 h-[34px] rounded-[8px] border border-[#E2E6E9] text-[#666666] text-[12.5px] font-semibold cursor-pointer hover:bg-[#F7F7F7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendReply}
                disabled={!body.trim()}
                className="flex items-center gap-1.5 px-4 h-[34px] rounded-[8px] text-white text-[12.5px] font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: EMAIL_TABLE_NAVY }}
              >
                Send Reply
              </button>
            </div>
          </div>

          <div className="w-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-[#E2E6E9] flex flex-col">
            <EmailTemplatesPanel
              query={templateQuery}
              onQueryChange={setTemplateQuery}
              selectedTemplate={selectedTemplate}
              onApply={applyTemplate}
            />
          </div>
          </div>
        )}

        <EmailThreadCard email={email} />
      </div>

      {!replyOpen && (
        <div className="shrink-0 border-t border-[#E2E6E9] px-5 py-3 flex justify-end">
          <button
            onClick={openReply}
            className="flex items-center gap-1.5 px-4 h-[34px] rounded-[8px] text-white text-[12.5px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: EMAIL_TABLE_NAVY }}
          >
            <ReplyIcon size={14} />
            Reply
          </button>
        </div>
      )}
    </div>
  );
}

export function CommunicationPage({ onLogout, onViewAllNotifications, onNavigateHome, onNavigateNewOverview, onNavigateOverview, onNavigateBack, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateCommunication, onNavigateEmailTemplate, onNavigateCmdCenterAdvFilter, onNavigateFeedbackCenter, onNavigateEmailWorkflow, fromOrderId, fromEmailId }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateOverview: () => void;
  onNavigateBack?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateCommunication?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateCmdCenterAdvFilter?: () => void;
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
  onNavigateEmailWorkflow?: () => void;
  /** Set when Communication was opened from a specific Order Details page — the breadcrumb then shows the
      full path back through Order Listing/that order instead of just "Hold Mgmt", and the view defaults to
      Hold Mgmt. */
  fromOrderId?: string;
  /** Set when Communication was opened from a Command Center listing row's Send Email action — the view
      defaults to Cmd Center with that email pre-selected. */
  fromEmailId?: string;
}) {
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(COMM_ORDERS[0]?.orderId ?? null);
  const [ordersScrolled, setOrdersScrolled] = useState(false);

  const filteredOrders = COMM_ORDERS.filter((o) => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return true;
    return o.orderId.includes(q) || o.customer.toLowerCase().includes(q) || o.to.toLowerCase().includes(q);
  });
  const selectedOrder = COMM_ORDERS.find((o) => o.orderId === selectedOrderId) ?? null;

  const selectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  // Cmd Center side — same shape as the order list/selection above, just sourced from the email worklist.
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(fromEmailId ?? ALL_EMAILS_WITH_CCC[0]?.id ?? null);
  const [emailsScrolled, setEmailsScrolled] = useState(false);

  const filteredEmails = ALL_EMAILS_WITH_CCC.filter((e) => {
    const q = emailSearch.trim().toLowerCase();
    if (!q) return true;
    return e.id.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q) || e.sender.toLowerCase().includes(q);
  });
  const selectedEmail = ALL_EMAILS_WITH_CCC.find((e) => e.id === selectedEmailId) ?? null;

  // Same dropdown pattern as Command Center Overview's FCNV/CSR toggle — local state, closes on outside
  // click. Defaults to whichever side Communication was opened from; Hold Mgmt when opened bare from the nav.
  const [viewMode, setViewMode] = useState<CommView>(fromEmailId ? "Cmd Center" : "Hold Mgmt");
  const [viewOpen, setViewOpen] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!viewOpen) return;
    const handler = (e: MouseEvent) => {
      if (!viewRef.current?.contains(e.target as Node)) setViewOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [viewOpen]);

  return (
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
          <AppHeader
            activeNav="Communication"
            onViewAllNotifications={onViewAllNotifications}
            onLogout={onLogout}
            onNavigateHome={onNavigateHome}
            onNavigateNewOverview={onNavigateNewOverview}
            onNavigateHoldManagementOverview={onNavigateOverview}
            onNavigateOrderListing={onNavigateOrderListing}
            onNavigateReleasedOrders={onNavigateReleasedOrders}
            onNavigateCommunication={onNavigateCommunication}
            onNavigateEmailTemplate={onNavigateEmailTemplate}
            onNavigateCmdCenterAdvFilter={onNavigateCmdCenterAdvFilter}
            onNavigateFeedbackCenter={onNavigateFeedbackCenter}
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
          />
        </div>

        <main className="flex-1 min-h-0 flex flex-col w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 gap-4 overflow-hidden">
          {/* Page header */}
          <div className="flex items-start justify-between gap-2.5">
            <div>
              <Breadcrumbs
                items={
                  viewMode === "Hold Mgmt"
                    ? fromOrderId
                      ? [
                          { label: "Hold Mgmt", onClick: onNavigateOverview },
                          { label: "Order Listing", onClick: onNavigateOrderListing },
                          { label: `Order #${fromOrderId}`, onClick: onNavigateBack },
                          { label: "Communication" },
                        ]
                      : [{ label: "Hold Mgmt", onClick: onNavigateOverview }, { label: "Communication" }]
                    : [{ label: "Command Center", onClick: onNavigateNewOverview }, { label: "Communication" }]
                }
              />
              <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Communication</h1>
              <p className="text-[12px] text-[#97999B] mt-0.5">
                {viewMode === "Hold Mgmt" ? "Follow-ups and escalations, by order" : "Email threads, by request"}
              </p>
            </div>

            {/* Cmd Center / Hold Mgmt view toggle — same dropdown pattern as Command Center Overview's
                FCNV/CSR switch, since Communication now serves both sources from one page. */}
            <div className="relative shrink-0" ref={viewRef}>
              <button
                onClick={() => setViewOpen((v) => !v)}
                className={`flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${
                  viewOpen ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7]"
                }`}
              >
                {viewMode}
                <ChevronDown size={13} className={`transition-transform duration-200 ${viewOpen ? "rotate-180" : ""}`} />
              </button>
              {viewOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 py-1 w-[140px]">
                  {COMM_VIEW_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setViewMode(opt); setViewOpen(false); }}
                      className="w-full text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                      style={opt === viewMode ? { color: EMAIL_TABLE_NAVY, fontWeight: 600 } : { color: "#4D4D4D" }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content: order/email list panel + thread panel — which source depends on the view toggle above. */}
          <div className="flex-1 min-h-0 flex gap-4">
            {viewMode === "Hold Mgmt" ? (
              <>
            {/* Left panel: order list */}
            <div className="w-[380px] shrink-0 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col min-h-0">
              <div className="px-5 pt-4 pb-3 shrink-0">
                <h3 className="text-[14px] font-bold text-[#262626]">Orders</h3>
                <p className="text-[12px] text-[#97999B] mt-0.5 mb-3">Select an order to view its communications.</p>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
                  <input
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search orders"
                    className="w-full pl-8 pr-8 py-2 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
                  />
                  {orderSearch && (
                    <button onClick={() => setOrderSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#97999B] hover:text-[#262626] cursor-pointer transition-colors">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className="relative flex-1 min-h-0">
                {ordersScrolled && (
                  <div className="absolute left-0 right-0 top-0 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
                )}
                <div
                  className="h-full overflow-y-auto"
                  onScroll={(e) => setOrdersScrolled(e.currentTarget.scrollTop > 0)}
                >
                {filteredOrders.length === 0 ? (
                  <p className="text-[12.5px] text-[#97999B] text-center py-8 px-4">No orders match "{orderSearch}"</p>
                ) : (
                  filteredOrders.map((order, i) => {
                    const active = order.orderId === selectedOrderId;
                    const followupCount = order.messages.filter((m) => m.type === "followup").length;
                    const escalationCount = order.messages.filter((m) => m.type === "escalation").length;
                    return (
                      <button
                        key={order.orderId}
                        onClick={() => selectOrder(order.orderId)}
                        className={`w-full flex items-center gap-2.5 px-5 py-3 min-h-[64px] text-left cursor-pointer transition-colors ${
                          i !== 0 ? "border-t border-[#F1F2F4]" : ""
                        } ${active ? "bg-[#EAF1FB]" : "hover:bg-[#F7F7F7]"}`}
                      >
                        <div className={`size-[26px] rounded-[6px] flex items-center justify-center shrink-0 ${active ? "bg-white" : "bg-[#F1F2F4]"}`}>
                          <Package size={13} className={active ? "text-[#30578D]" : "text-[#97999B]"} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[13px] leading-tight truncate ${active ? "font-semibold text-[#262626]" : "text-[#4D4D4D]"}`}>
                            Order #{order.orderId} - {order.customer}
                          </p>
                          <p className="text-[11px] text-[#97999B] truncate mt-0.5">To: {order.to}</p>
                          {(followupCount > 0 || escalationCount > 0) && (
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {followupCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[2px] text-[#30578D] bg-[#30578D]/10">
                                  <MessageSquare size={9} />
                                  {followupCount} Follow-up{followupCount > 1 ? "s" : ""}
                                </span>
                              )}
                              {escalationCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[2px] text-[#C83737] bg-[#C83737]/10">
                                  <AlertTriangle size={9} />
                                  {escalationCount} Escalation{escalationCount > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
                </div>
              </div>
            </div>

            {/* Right side: tabs + thread read in place, plus reply flow. The templates panel (rendered by
                ThreadAndReply) shows up as its own panel here too, only once Reply is clicked. */}
            {selectedOrder ? (
              <ThreadAndReply key={selectedOrder.orderId} order={selectedOrder} />
            ) : (
              <div className="flex-1 min-w-0 bg-white rounded-[8px] border border-[#E2E6E9] flex items-center justify-center">
                <p className="text-[12px] text-[#97999B]">Select an order to view its communications</p>
              </div>
            )}
              </>
            ) : (
              <>
            {/* Left panel: email list */}
            <div className="w-[380px] shrink-0 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col min-h-0">
              <div className="px-5 pt-4 pb-3 shrink-0">
                <h3 className="text-[14px] font-bold text-[#262626]">Emails</h3>
                <p className="text-[12px] text-[#97999B] mt-0.5 mb-3">Select an email to view its thread.</p>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
                  <input
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    placeholder="Search emails"
                    className="w-full pl-8 pr-8 py-2 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
                  />
                  {emailSearch && (
                    <button onClick={() => setEmailSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#97999B] hover:text-[#262626] cursor-pointer transition-colors">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className="relative flex-1 min-h-0">
                {emailsScrolled && (
                  <div className="absolute left-0 right-0 top-0 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
                )}
                <div
                  className="h-full overflow-y-auto"
                  onScroll={(e) => setEmailsScrolled(e.currentTarget.scrollTop > 0)}
                >
                {filteredEmails.length === 0 ? (
                  <p className="text-[12.5px] text-[#97999B] text-center py-8 px-4">No emails match "{emailSearch}"</p>
                ) : (
                  filteredEmails.map((emailRow, i) => {
                    const active = emailRow.id === selectedEmailId;
                    return (
                      <button
                        key={emailRow.id}
                        onClick={() => setSelectedEmailId(emailRow.id)}
                        className={`w-full flex items-center gap-2.5 px-5 py-3 min-h-[64px] text-left cursor-pointer transition-colors ${
                          i !== 0 ? "border-t border-[#F1F2F4]" : ""
                        } ${active ? "bg-[#EAF1FB]" : "hover:bg-[#F7F7F7]"}`}
                      >
                        <div className={`size-[26px] rounded-[6px] flex items-center justify-center shrink-0 ${active ? "bg-white" : "bg-[#F1F2F4]"}`}>
                          <Mail size={13} className={active ? "text-[#30578D]" : "text-[#97999B]"} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[13px] leading-tight truncate ${active ? "font-semibold text-[#262626]" : "text-[#4D4D4D]"}`}>
                            {emailRow.subject}
                          </p>
                          <p className="text-[11px] text-[#97999B] truncate mt-0.5">{emailRow.sender}</p>
                          {emailRow.category && (
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[2px] text-[#30578D] bg-[#30578D]/10">
                                {emailRow.category}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
                </div>
              </div>
            </div>

            {/* Right side: single-email thread read in place, plus reply flow — CmdCenterThreadAndReply
                mirrors ThreadAndReply's composer, just without the follow-up/escalation tabs. */}
            {selectedEmail ? (
              <CmdCenterThreadAndReply key={selectedEmail.id} email={selectedEmail} />
            ) : (
              <div className="flex-1 min-w-0 bg-white rounded-[8px] border border-[#E2E6E9] flex items-center justify-center">
                <p className="text-[12px] text-[#97999B]">Select an email to view its thread</p>
              </div>
            )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
