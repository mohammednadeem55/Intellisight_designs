import { useState } from "react";
import { toast } from "sonner";
import { Archive, ArrowLeft, Check, ChevronDown, ChevronRight, CircleCheck, Copy, Download, FileImage, FileSpreadsheet, FileText, Lightbulb, Paperclip, Sparkles, User, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { EmailTableAssignModal } from "../../components/common/EmailTable";
import { type Email, ALL_EMAILS_WITH_CCC, CLASSIFICATIONS } from "./emailData";

const WORKFLOW_STAGES: { key: string; label: string }[] = [
  { key: "classify", label: "Email & Classify" },
  { key: "ccc", label: "CCC Creation" },
  { key: "validation", label: "AI Order Validation" },
  { key: "order", label: "Order & Booking" },
  { key: "soa", label: "SOA" },
];

// Sub-categories offered under each top-level classification in the Classify Intent panel — mock data,
// same deterministic-per-category approach as the rest of this page's AI copy.
const WORKFLOW_SUBCATEGORIES: Record<string, string[]> = {
  TRADE_ORDER: ["New Order", "Order Amendment", "Order Cancellation"],
  SERVICE_CONTRACT: ["New Contract", "Renewal", "Contract Amendment"],
  WORK_ORDER: ["Installation", "Maintenance", "Repair"],
  QUOTE_REQUEST: ["New Quote", "Quote Revision", "Quote Approval"],
  INFO_REQUIRED: ["Missing PO", "Missing Account Info", "Clarification Needed"],
  REVIEW_REQUIRED: ["Compliance Review", "Pricing Review", "Manual Review"],
  EXCLUDED: ["Spam", "Out of Scope", "Duplicate"],
};

// "priya.shah@acme.com" → "Priya Shah" — the data model only stores raw addresses, so the detail page's
// "from" display name is derived from the local-part rather than added as a separate (redundant) field.
function senderDisplayName(sender: string): string {
  const local = sender.split("@")[0] ?? sender;
  const words = local.split(/[._-]+/).filter(Boolean);
  if (words.length === 0) return sender;
  return words.map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function classificationLabel(v?: string): string {
  if (!v) return "Uncategorized";
  return v.toLowerCase().split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function confidenceBand(pct: number): { label: string; bg: string; text: string } {
  if (pct >= 80) return { label: "High confidence", bg: "#E8F5E9", text: "#2E7D32" };
  if (pct >= 50) return { label: "Medium confidence", bg: "#FDF3E7", text: "#92600B" };
  return { label: "Low confidence", bg: "#FDECEA", text: "#BA1C1C" };
}

function isExternalSender(sender: string): boolean {
  return !sender.endsWith("@intellisight.io");
}

// "Order_details.pdf" → "PDF", "lorem_ipsum.docx" → "DOCX", "notes.txt" → "PLAIN" (matches how mail clients
// label plain-text attachments) — used next to the file size in the attachment chip.
function attachmentTypeLabel(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "txt") return "PLAIN";
  return ext.toUpperCase();
}

// Clamps to 2 lines with a "View more" toggle — but only when the text is actually long enough to need it,
// so short summaries don't show a pointless toggle that has nothing to expand.
function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 140;
  return (
    <>
      <p className={`text-[12.5px] text-[#374151] leading-[1.6] ${!expanded && isLong ? "line-clamp-2" : ""}`}>{text}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-[11.5px] font-medium text-[#30578D] hover:underline cursor-pointer mt-1"
        >
          {expanded ? "View less" : "View more"}
        </button>
      )}
    </>
  );
}

// Icon + color per file type, so the attachment list reads at a glance instead of every file looking the same.
function attachmentMeta(name: string): { icon: typeof FileText; bg: string; fg: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: FileText, bg: "#FDECEA", fg: "#DC2626" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: FileSpreadsheet, bg: "#E8F5E9", fg: "#2E7D32" };
  if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) return { icon: FileImage, bg: "#EAF1FB", fg: "#30578D" };
  if (["zip", "rar", "7z"].includes(ext)) return { icon: Archive, bg: "#FDF3E7", fg: "#92600B" };
  return { icon: FileText, bg: "#f3f4f6", fg: "#6b7280" };
}

function AttachmentChip({ attachment }: { attachment: { name: string; size: string } }) {
  const meta = attachmentMeta(attachment.name);
  return (
    <button
      onClick={() => toast.info(`Downloading ${attachment.name}`)}
      className="group flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] border border-[#ebebeb] w-[200px] hover:border-[#d1d5db] hover:bg-[#f8fafc] cursor-pointer transition-colors text-left"
    >
      <div className="size-[26px] rounded-[6px] flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg }}>
        <meta.icon size={13} style={{ color: meta.fg }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[#111827] truncate">{attachment.name}</p>
        <p className="text-[10.5px] text-[#9ca3af]">{attachment.size} · {attachmentTypeLabel(attachment.name)}</p>
      </div>
      <Download size={13} className="text-[#9ca3af] group-hover:text-[#111827] cursor-pointer transition-colors shrink-0" />
    </button>
  );
}

// Shared by the latest message and each (expanded) history item: external-sender warning, subject + body,
// attachments. Kept separate so the two message treatments below don't duplicate this rendering.
function MessageBody({ message }: { message: Email }) {
  const attachmentCount = message.attachments?.length ?? 0;
  return (
    <>
      {isExternalSender(message.sender) && (
        <div className="mb-3 flex items-center justify-between gap-3 flex-wrap px-3.5 py-2.5 rounded-[8px] bg-[#F5B8AC]">
          <p className="text-[12px] font-semibold text-[#111827] leading-[1.5]">
            This Message is From an External Sender: Use caution opening files, clicking links or responding to requests.
          </p>
          <button
            onClick={() => toast.success("Reported as suspicious")}
            className="shrink-0 px-3 py-1.5 rounded-[8px] border border-[#111827]/20 bg-white text-[12px] font-semibold text-[#111827] hover:bg-[#f8fafc] cursor-pointer transition-colors"
          >
            Report Suspicious
          </button>
        </div>
      )}

      <p className="text-[13.5px] font-bold text-[#111827] mb-1.5">{message.subject}</p>
      <p className="text-[13px] text-[#374151] leading-[1.65] whitespace-pre-wrap">{message.body ?? "No content preview available."}</p>

      {attachmentCount > 0 && (
        <div className="mt-3">
          <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide mb-1.5">Attachments ({attachmentCount})</p>
          <div className="flex flex-wrap gap-1.5">
            {message.attachments!.map((a, i) => (
              <AttachmentChip key={i} attachment={a} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// The message being triaged right now — always fully visible, never collapsed, so there's no ambiguity
// about what's the main content vs. reference history below it.
function LatestMessage({ message }: { message: Email }) {
  const name = senderDisplayName(message.sender);
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");

  return (
    <div className="px-4 py-4">
      <div className="flex items-start gap-3 pb-3.5 mb-3.5 border-b border-[#f3f4f6]">
        <div className="size-[36px] rounded-full bg-[#30578D] flex items-center justify-center shrink-0 text-[12px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13.5px] font-bold text-[#111827] truncate">{name}</p>
            <p className="text-[11px] text-[#9ca3af] shrink-0">{message.received}</p>
          </div>
          <p className="text-[12px] text-[#6b7280] truncate">{message.sender}</p>
        </div>
      </div>
      <MessageBody message={message} />
    </div>
  );
}

// One item in "Earlier in this thread" — collapsed to a single scannable row (sender, snippet, timestamp,
// attachment count) by default; expands in place on click to show the full message via MessageBody. Each
// item is its own white card against the section's grey backdrop, so adjacent messages are unmistakably
// separate rather than one continuous list broken only by hairline dividers.
function HistoryMessageItem({ message, expanded, onToggle }: { message: Email; expanded: boolean; onToggle: () => void }) {
  const name = senderDisplayName(message.sender);
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");
  const attachmentCount = message.attachments?.length ?? 0;

  return (
    <div className="bg-white rounded-[8px] border border-[#ebebeb] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer hover:bg-[#f8fafc] transition-colors"
      >
        <div className="size-[24px] rounded-full bg-[#9ca3af] flex items-center justify-center shrink-0 text-[9.5px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-[12.5px] font-medium text-[#4b5563] truncate">{name}</p>
            <span className="text-[11.5px] text-[#9ca3af] truncate">· {message.sender}</span>
          </div>
          {!expanded && (
            <p className="text-[11.5px] text-[#9ca3af] truncate mt-0.5">{message.subject}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {attachmentCount > 0 && (
            <span className="flex items-center gap-1 text-[10.5px] text-[#9ca3af]">
              <Paperclip size={10} /> {attachmentCount}
            </span>
          )}
          <p className="text-[10.5px] text-[#9ca3af] whitespace-nowrap">{message.received}</p>
          <ChevronRight size={12} className={`text-[#9ca3af] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-2.5 border-t border-[#f3f4f6]">
          <MessageBody message={message} />
        </div>
      )}
    </div>
  );
}

// Mock AI copy for the Classify Intent panel — assembled from the email's real fields (classification, CCC/PO
// ids, sender domain, attachments) rather than hand-authored per row, same approach as the rest of this page's
// deterministic mock data.
function buildContentSummary(email: Email): string {
  const domain = email.sender.split("@")[1] ?? "the sender's domain";
  const attachmentCount = email.attachments?.length ?? 0;
  return `${senderDisplayName(email.sender)} (${email.sender}) sent a message classified as ${classificationLabel(email.classification)}${email.cccId ? ` for CCC ${email.cccId}` : ""}${email.poNumber ? `, referencing PO ${email.poNumber}` : ""}. The message originates from ${domain}${attachmentCount > 0 ? ` and includes ${attachmentCount} attachment${attachmentCount > 1 ? "s" : ""}` : ""}, received ${email.received}.`;
}

function buildReasoning(email: Email): string {
  const domain = email.sender.split("@")[1] ?? "";
  const internal = domain.includes("intellisight");
  const label = classificationLabel(email.classification);
  return `Classified as ${label} because the sender is ${internal ? "an internal Intellisight address" : "an external customer address"} (${email.sender}) and the subject line "${email.subject}" matches known ${label.toLowerCase()} patterns${(email.attachments?.length ?? 0) > 0 ? ", supported by the attached document(s)" : ""}.`;
}

function buildFullAiSummary(email: Email): string {
  return `COMPREHENSIVE EMAIL SUMMARY

1. MAIN PURPOSE
This is a ${classificationLabel(email.classification).toLowerCase()} request${email.cccId ? ` (Case ID: ${email.cccId})` : ""} submitted by ${senderDisplayName(email.sender)}.

2. KEY DETAILS
• Requestor: ${senderDisplayName(email.sender)} (${email.sender})
• Received: ${email.received}
• Business Group: ${email.businessGroup ?? "Unassigned"}${email.poNumber ? `\n• PO Number: ${email.poNumber}` : ""}${email.accountName ? `\n• Account: ${email.accountName}` : ""}

3. RECOMMENDED NEXT STEP
Proceed to CCC Creation once the classification above is confirmed.`;
}

// The email's detail/drill-down destination — clicking a row (table) or opening an email (Email View) lands here.
export function WorkflowPage({
  emailId,
  onBack,
  onLogout,
  onViewAllNotifications,
  onNavigateHome,
  onNavigateCommandCenterOverview,
  onNavigateCommandCenterEmailView,
  onNavigateNewOverview,
  onNavigateHoldManagementOverview,
  onNavigateOrderListing,
  onNavigateReleasedOrders,
  onNavigateEmailTemplate,
  onNavigateReview,
  onNavigateEmailWorkflow,
}: {
  emailId: string;
  onBack: () => void;
  onLogout?: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateReview?: () => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  const email = ALL_EMAILS_WITH_CCC.find(e => e.id === emailId) ?? ALL_EMAILS_WITH_CCC[0];
  const senderName = senderDisplayName(email.sender);
  const assignedTo = email.assignedTo ?? "Unassigned";
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Category/Sub Category — committed (what's saved + drives the top pill) vs. draft (what's live in the
  // dropdowns). Picking a different value only stages it as a draft; it doesn't take effect, and the top
  // pill doesn't flip to "Human Classified", until a reason is given and Submit is clicked.
  const initialCategory = email.classification ?? CLASSIFICATIONS[0];
  const [category, setCategory] = useState(initialCategory);
  const [subCategory, setSubCategory] = useState(WORKFLOW_SUBCATEGORIES[initialCategory][0]);
  const [classifiedBy, setClassifiedBy] = useState<"ai" | "human">("ai");
  const [draftCategory, setDraftCategory] = useState(initialCategory);
  const [draftSubCategory, setDraftSubCategory] = useState(WORKFLOW_SUBCATEGORIES[initialCategory][0]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const isOverrideDirty = draftCategory !== category || draftSubCategory !== subCategory;
  const selectDraftCategory = (c: string) => {
    setDraftCategory(c);
    setDraftSubCategory(WORKFLOW_SUBCATEGORIES[c][0]);
    setCategoryOpen(false);
  };
  const submitOverride = () => {
    setCategory(draftCategory);
    setSubCategory(draftSubCategory);
    setClassifiedBy("human");
    setOverrideReason("");
    toast.success(`${email.id} reclassified to ${classificationLabel(draftCategory)} / ${draftSubCategory}`);
  };
  const cancelOverride = () => {
    setDraftCategory(category);
    setDraftSubCategory(subCategory);
    setOverrideReason("");
  };

  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const copyToClipboard = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };
  const contentSummary = buildContentSummary(email);
  const reasoning = buildReasoning(email);
  const fullSummary = buildFullAiSummary(email);
  const earlierMessages = [
    ...(email.replies ?? []),
    ...(email.linkedCccs ?? []).flatMap(c => c.replies ?? []),
  ];
  const threadCount = 1 + earlierMessages.length;
  const [expandedThreadIds, setExpandedThreadIds] = useState<Set<string>>(new Set());
  const toggleThreadMessage = (id: string) => {
    setExpandedThreadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
          <AppHeader
            activeNav="Command Center"
            onViewAllNotifications={onViewAllNotifications}
            onLogout={onLogout}
            onNavigateHome={onNavigateHome}
            onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
            onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
            onNavigateNewOverview={onNavigateNewOverview}
            onNavigateHoldManagementOverview={onNavigateHoldManagementOverview}
            onNavigateOrderListing={onNavigateOrderListing}
            onNavigateReleasedOrders={onNavigateReleasedOrders}
            onNavigateEmailTemplate={onNavigateEmailTemplate}
            onNavigateReview={onNavigateReview}
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
          />
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto px-5 py-5 flex flex-col gap-4">

        {/* Subject + classification/CCC/PO pills + assignee — plain, no card, scrolls away with the page */}
        <div className="shrink-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <p className="text-[16px] font-bold text-[#111827] leading-snug">{email.subject}</p>
                <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-[#FDECEA] text-[#BA1C1C] whitespace-nowrap">
                  {classificationLabel(email.classification)}
                </span>
                {email.cccId && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-[#EAF1FB] text-[#30578D] whitespace-nowrap">
                    CCC: {email.cccId}
                  </span>
                )}
                {email.poNumber && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-[#EAF1FB] text-[#30578D] whitespace-nowrap">
                    PO: {email.poNumber}
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-[#6b7280] mt-2.5 truncate">
                {senderName.includes(" ") && <>{senderName} <span className="text-[#d1d1d1]">•</span> </>}
                {email.sender} <span className="text-[#d1d1d1]">•</span> Received {email.received}
              </p>
            </div>

            <div className="relative shrink-0 text-right">
              <p className="text-[11px] font-medium text-[#9ca3af] mb-1.5">Assigned to</p>
              <button
                onClick={() => setAssignModalOpen(true)}
                className="flex items-center gap-2 pl-2 pr-2.5 h-[38px] rounded-[8px] border border-[#e5e7eb] bg-white hover:bg-[#f8fafc] cursor-pointer transition-colors"
              >
                <span
                  className="size-[24px] rounded-full flex items-center justify-center text-[10.5px] font-bold text-white shrink-0"
                  style={{ backgroundColor: assignedTo === "Unassigned" ? "#9ca3af" : "#30578D" }}
                >
                  {assignedTo === "Unassigned" ? "?" : assignedTo.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </span>
                <span className="text-[13px] font-semibold text-[#111827] whitespace-nowrap">{assignedTo}</span>
                <ChevronDown size={13} className="text-[#9ca3af]" />
              </button>
            </div>
          </div>
        </div>

        {assignModalOpen && (
          <EmailTableAssignModal email={email} onClose={() => setAssignModalOpen(false)} />
        )}

        {/* Workflow track — sticky: once the subject scrolls out of view, this pins right below the header */}
        <div className="sticky top-0 z-10 -mx-5 px-5 bg-[#f5f6fa] shrink-0">
          <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-3.5 flex items-center gap-4">
            <div className="flex items-center overflow-x-auto px-1.5 -mx-1.5 py-1 -my-1 flex-1 min-w-0">
              {WORKFLOW_STAGES.map((s, i) => {
                const completed = i < currentStageIndex;
                const active = i === currentStageIndex;
                return (
                  <div key={s.key} className={`flex items-center ${i < WORKFLOW_STAGES.length - 1 ? "flex-1" : "shrink-0"}`}>
                    <button
                      onClick={() => setCurrentStageIndex(i)}
                      title={`Jump to ${s.label}`}
                      className={`group flex items-center gap-2 cursor-pointer rounded-[8px] px-2 py-1.5 shrink-0 transition-colors duration-200 ${
                        active ? "bg-[#FDECEA]" : completed ? "hover:bg-[#EAF1FB]" : "hover:bg-[#f8fafc]"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center size-[20px] rounded-full shrink-0 transition-all duration-200 ${
                          completed
                            ? "bg-[#30578D]"
                            : active
                            ? "bg-[#E90029]"
                            : "border-2 border-[#d1d5db] bg-white group-hover:border-[#9ca3af]"
                        }`}
                      >
                        {completed ? (
                          <Check size={11} className="text-white" strokeWidth={3} />
                        ) : active ? (
                          <span className="size-[7px] rounded-full bg-white" />
                        ) : (
                          <span className="text-[10px] font-semibold text-[#9ca3af] group-hover:text-[#6b7280]">{i + 1}</span>
                        )}
                      </span>
                      <span
                        className={`text-[13px] font-semibold whitespace-nowrap transition-colors duration-200 ${
                          completed ? "text-[#30578D]" : active ? "text-[#BA1C1C]" : "text-[#9ca3af] group-hover:text-[#6b7280]"
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                    {i < WORKFLOW_STAGES.length - 1 && (
                      <div
                        className={`h-[2px] flex-1 min-w-6 mx-2.5 rounded-full shrink-0 transition-colors duration-300 ${
                          i < currentStageIndex ? "bg-[#30578D]" : "bg-[#e5e7eb]"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] font-semibold text-[#30578D] shrink-0 whitespace-nowrap">
              {Math.round((currentStageIndex / (WORKFLOW_STAGES.length - 1)) * 100)}% complete
            </p>
          </div>
        </div>

        {/* Body: email thread (left) + Classify Intent (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          {/* Email thread — the message being triaged, always open, plus a clearly separate history section */}
          <div className="bg-white rounded-[8px] border border-[#ebebeb] flex flex-col min-h-0 h-fit">
            {earlierMessages.length > 0 && (
              <div className="px-5 py-4 border-b border-[#f3f4f6]">
                <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide">
                  {threadCount} emails in this thread
                </p>
              </div>
            )}

            <LatestMessage message={email} />

            {earlierMessages.length > 0 && (
              <div className="border-t border-[#f3f4f6] bg-[#f7f8fa] rounded-b-[8px] px-3 py-3">
                <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide mb-2 px-1">
                  Earlier in this thread ({earlierMessages.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {earlierMessages.map((m) => (
                    <HistoryMessageItem
                      key={m.id}
                      message={m}
                      expanded={expandedThreadIds.has(m.id)}
                      onToggle={() => toggleThreadMessage(m.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Classify Intent */}
          <div className="bg-white rounded-[8px] border border-[#ebebeb] flex flex-col min-h-0 h-fit">
            <div className="px-5 py-4 flex items-center justify-between gap-2 border-b border-[#f3f4f6]">
              <p className="text-[14px] font-bold text-[#111827]">Classify Intent</p>
              {classifiedBy === "ai" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-[#E8F5E9] text-[#2E7D32] whitespace-nowrap">
                  <CircleCheck size={12} /> AI Classified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-[#EAF1FB] text-[#30578D] whitespace-nowrap">
                  <User size={12} /> Human Classified
                </span>
              )}
            </div>

            <div className="px-5 py-4 flex flex-col gap-4">
              {classifiedBy === "ai" ? (() => {
                const pct = email.confidencePct ?? 0;
                const band = confidenceBand(pct);
                return (
                  <div className="rounded-[8px] px-4 py-3.5 flex items-center justify-between gap-4" style={{ backgroundColor: band.bg }}>
                    <div>
                      <p className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: band.text }}>AI Confidence</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-[28px] font-bold leading-none" style={{ color: band.text }}>{pct}%</span>
                        <span className="text-[12px] font-semibold" style={{ color: band.text }}>{band.label}</span>
                      </div>
                    </div>
                    <div className="w-[84px] shrink-0">
                      <div className="h-[8px] rounded-full bg-white/70 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: band.text }} />
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="rounded-[8px] px-4 py-3.5 flex items-center gap-3" style={{ backgroundColor: "#EAF1FB" }}>
                  <span className="flex items-center justify-center size-[34px] rounded-full bg-[#30578D] shrink-0">
                    <User size={16} className="text-white" />
                  </span>
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#30578D]">Classification</p>
                    <p className="text-[14px] font-bold text-[#30578D] mt-0.5">Manually classified</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-medium text-[#6b7280] mb-1.5">Category</p>
                  <div className="relative">
                    <button
                      onClick={() => { setCategoryOpen(v => !v); setSubCategoryOpen(false); }}
                      className="w-full flex items-center justify-between gap-1.5 px-3 h-[36px] rounded-[8px] border border-[#e5e7eb] text-[12.5px] font-medium text-[#111827] hover:bg-[#f8fafc] cursor-pointer transition-colors"
                    >
                      <span className="truncate">{classificationLabel(draftCategory)}</span>
                      <ChevronDown size={13} className={`shrink-0 text-[#9ca3af] transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`} />
                    </button>
                    {categoryOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-20 py-1 max-h-[200px] overflow-y-auto">
                        {CLASSIFICATIONS.map(c => (
                          <button
                            key={c}
                            onClick={() => selectDraftCategory(c)}
                            className="w-full text-left px-3 py-2 text-[12.5px] text-[#374151] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
                          >
                            {classificationLabel(c)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#6b7280] mb-1.5">Sub Category</p>
                  <div className="relative">
                    <button
                      onClick={() => { setSubCategoryOpen(v => !v); setCategoryOpen(false); }}
                      className="w-full flex items-center justify-between gap-1.5 px-3 h-[36px] rounded-[8px] border border-[#e5e7eb] text-[12.5px] font-medium text-[#111827] hover:bg-[#f8fafc] cursor-pointer transition-colors"
                    >
                      <span className="truncate">{draftSubCategory}</span>
                      <ChevronDown size={13} className={`shrink-0 text-[#9ca3af] transition-transform duration-200 ${subCategoryOpen ? "rotate-180" : ""}`} />
                    </button>
                    {subCategoryOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-20 py-1 max-h-[200px] overflow-y-auto">
                        {WORKFLOW_SUBCATEGORIES[draftCategory].map(sc => (
                          <button
                            key={sc}
                            onClick={() => { setDraftSubCategory(sc); setSubCategoryOpen(false); }}
                            className="w-full text-left px-3 py-2 text-[12.5px] text-[#374151] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
                          >
                            {sc}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isOverrideDirty && (
                <div className="rounded-[8px] border border-[#F3D9AE] bg-[#FDF3E7] px-3.5 py-3 flex flex-col gap-2.5">
                  <div>
                    <p className="text-[12px] font-semibold text-[#613305]">
                      Reclassifying to {classificationLabel(draftCategory)} / {draftSubCategory}
                    </p>
                    <p className="text-[11px] text-[#613305]/80 mt-0.5">Add a reason for this change before saving.</p>
                  </div>
                  <textarea
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    rows={2}
                    placeholder="Why are you changing this classification?"
                    autoFocus
                    className="w-full px-3 py-2 rounded-[8px] border border-[#e5e7eb] text-[12.5px] text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#30578D] transition-colors resize-none bg-white"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={cancelOverride}
                      className="px-3 py-1.5 rounded-[8px] border border-[#d1d1d1] text-[12px] font-medium text-[#374151] bg-white hover:bg-[#f8fafc] cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitOverride}
                      disabled={!overrideReason.trim()}
                      className="px-3 py-1.5 rounded-[8px] text-white text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-100"
                      style={{ backgroundColor: "#E90029" }}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#f3f4f6]">
                <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide mb-3">How this was classified</p>

                <div className="flex flex-col gap-2.5">
                  <div className="bg-[#f7f8fa] rounded-[8px] p-3">
                    <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#111827] mb-1.5">
                      <FileText size={13} className="text-[#30578D]" />
                      Content summary
                    </p>
                    <ExpandableText text={contentSummary} />
                  </div>

                  <div className="bg-[#f7f8fa] rounded-[8px] p-3">
                    <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#111827] mb-1.5">
                      <Lightbulb size={13} className="text-[#30578D]" />
                      Reasoning
                    </p>
                    <ExpandableText text={reasoning} />
                  </div>

                  <div className="bg-[#EAF1FB] rounded-[8px] p-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#111827]">
                        <Sparkles size={13} className="text-[#30578D]" />
                        Full AI summary
                      </p>
                      <button
                        onClick={() => copyToClipboard("Summary", fullSummary)}
                        className="flex items-center gap-1 text-[11px] font-medium text-[#30578D] bg-white border border-[#30578D]/20 rounded-[8px] px-2 py-1 hover:bg-[#f8fafc] cursor-pointer transition-colors"
                      >
                        <Copy size={11} /> Copy
                      </button>
                    </div>
                    <p className="text-[12.5px] text-[#374151] leading-[1.6] whitespace-pre-line line-clamp-4">
                      {fullSummary}
                    </p>
                    <button
                      onClick={() => setSummaryModalOpen(true)}
                      className="flex items-center gap-1 text-[11.5px] font-semibold text-[#30578D] bg-white border border-[#30578D]/20 rounded-[8px] px-2.5 py-1 hover:bg-[#f8fafc] cursor-pointer transition-colors mt-2"
                    >
                      View full summary →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {summaryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSummaryModalOpen(false)} />
            <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[560px] max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#ebebeb] shrink-0">
                <h2 className="text-[16px] font-bold text-[#111827]">Full AI Summary</h2>
                <button onClick={() => setSummaryModalOpen(false)} className="text-[#9ca3af] hover:text-[#374151] cursor-pointer transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-4 overflow-y-auto">
                <p className="text-[13px] text-[#374151] leading-[1.7] whitespace-pre-line">{fullSummary}</p>
              </div>
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#ebebeb] shrink-0">
                <button
                  onClick={() => copyToClipboard("Summary", fullSummary)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#d1d1d1] text-[13px] font-medium text-[#374151] bg-white hover:bg-[#f8fafc] cursor-pointer transition-colors"
                >
                  <Copy size={13} /> Copy to clipboard
                </button>
                <button
                  onClick={() => setSummaryModalOpen(false)}
                  className="px-4 py-2 rounded-[8px] text-white text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#30578D" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        </div>
        </main>

        {/* Footer actions — full-bleed bar flush with the bottom edge, mirroring the header's treatment */}
        <div className="shrink-0 bg-white border-t border-[#ebebeb]">
          <div className="max-w-[1600px] mx-auto px-5 py-3.5 flex items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#d1d1d1] text-[13px] font-medium text-[#374151] bg-white hover:bg-[#f8fafc] cursor-pointer transition-colors"
            >
              <ArrowLeft size={13} /> Back
            </button>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => toast.success(`${email.id} saved`)}
                className="px-4 py-2 rounded-[8px] border border-[#d1d1d1] text-[13px] font-medium text-[#374151] bg-white hover:bg-[#f8fafc] cursor-pointer transition-colors"
              >
                Save & Update
              </button>
              <button
                onClick={() => {
                  if (currentStageIndex < WORKFLOW_STAGES.length - 1) {
                    const next = WORKFLOW_STAGES[currentStageIndex + 1];
                    setCurrentStageIndex(currentStageIndex + 1);
                    toast.success(`${email.id} moved to ${next.label}`);
                  } else {
                    toast.success(`${email.id} workflow complete`);
                  }
                }}
                className="px-4 py-2 rounded-[8px] text-white text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#E90029" }}
              >
                {currentStageIndex < WORKFLOW_STAGES.length - 1 ? "Proceed" : "Complete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
