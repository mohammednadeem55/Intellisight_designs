import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, ChevronDown, CircleAlert, CircleCheck, Copy, FileText, Lightbulb, Send, Sparkles, User, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Button, IconButton } from "../../components/common/Button";
import { PageLoaderOverlay } from "../../components/common/Loader";
import { EmailTableAssignModal, EmailTableSendEmailModal } from "../../components/common/EmailTable";
import { AiOrderValidationBody } from "./AiOrderValidationBody";
import { CccCreationBody, type CccExtractionStatus } from "./CccCreationBody";
import { OrderCreationBody } from "./OrderCreationBody";
import { SoaBody } from "./SoaBody";
import { EmailThreadCard, senderDisplayName } from "./emailThread";
import { type Email, ALL_EMAILS_WITH_CCC, CLASSIFICATIONS } from "./emailData";

const WORKFLOW_STAGES: { key: string; label: string }[] = [
  { key: "classify", label: "Email & Classify" },
  { key: "ccc", label: "CCC Creation" },
  { key: "validation", label: "AI Order Validation" },
  { key: "order", label: "Order Creation" },
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

function classificationLabel(v?: string): string {
  if (!v) return "Uncategorized";
  return v.toLowerCase().split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function confidenceBand(pct: number): { label: string; bg: string; text: string } {
  if (pct >= 80) return { label: "High confidence", bg: "#E8F5E9", text: "#2E7D32" };
  if (pct >= 50) return { label: "Medium confidence", bg: "#FDF3E7", text: "#92600B" };
  return { label: "Low confidence", bg: "#FDECEA", text: "#BA1C1C" };
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
        <Button variant="ghost" className="text-[11.5px] mt-1" onClick={() => setExpanded(v => !v)}>
          {expanded ? "View less" : "View more"}
        </Button>
      )}
    </>
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
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // CCC Creation — "Create CCC Req." only succeeds once the extraction review has nothing left missing;
  // otherwise it goes on hold and the same button stays available to retry after the data is fixed.
  const [cccExtractionStatus, setCccExtractionStatus] = useState<CccExtractionStatus | null>(null);
  const [cccOutcome, setCccOutcome] = useState<"idle" | "success" | "hold">("idle");
  const [cccNumber, setCccNumber] = useState("");
  const handleCreateCcc = () => {
    if (cccExtractionStatus && cccExtractionStatus.totalMissing > 0) {
      setCccOutcome("hold");
      toast.error(`CCC creation on hold — ${cccExtractionStatus.totalMissing} required field${cccExtractionStatus.totalMissing > 1 ? "s" : ""} still missing`);
      return;
    }
    const number = `CCC-${20000 + Math.floor(Math.random() * 9000)}`;
    setCccNumber(number);
    setCccOutcome("success");
    toast.success(`${number} created successfully`);
  };
  const handleProceed = () => {
    if (currentStageIndex < WORKFLOW_STAGES.length - 1) {
      const next = WORKFLOW_STAGES[currentStageIndex + 1];
      setCurrentStageIndex(currentStageIndex + 1);
      toast.success(`${email.id} moved to ${next.label}`);
    } else {
      toast.success(`${email.id} workflow complete`);
    }
  };
  const handleRevalidate = () => toast.success(`${email.id} re-validated`);
  const handleQuoteUpdate = () => toast.success(`${email.id} quote updated`);
  const handleSendEmail = () => toast.success(`${email.id} email sent`);

  // Every footer action briefly shows a full-page loading overlay before actually running — there's no
  // real network call behind any of these yet, but the delay keeps the interaction pattern honest for
  // when one is wired in later, and gives the user a clear "this is doing something" signal.
  const [pageLoadingLabel, setPageLoadingLabel] = useState<string | null>(null);
  const withPageLoader = (label: string, action: () => void) => {
    setPageLoadingLabel(label);
    setTimeout(() => {
      action();
      setPageLoadingLabel(null);
    }, 1300);
  };
  // The fade under the stepper should only show once there's actually content sliding underneath it —
  // in the default (unscrolled) position it would otherwise overlap the top of the cards below for no reason.
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      {pageLoadingLabel && <PageLoaderOverlay label={pageLoadingLabel} />}
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

        <main className="flex-1 min-h-0 overflow-y-auto" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}>
        <div className="max-w-[1600px] mx-auto px-5 py-5 flex flex-col gap-4">

        {/* Subject + classification/CCC/PO pills + assignee — plain, no card, scrolls away with the page */}
        <div className="shrink-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={onBack}
                  title="Back to Overview"
                  className="text-[#6b7280] hover:text-[#111827] cursor-pointer transition-colors shrink-0"
                >
                  <ArrowLeft size={20} />
                </button>
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
              <p className="text-[12.5px] text-[#6b7280] mt-2.5 truncate ml-[30px]">
                {senderName.includes(" ") && <>{senderName} <span className="text-[#d1d1d1]">•</span> </>}
                {email.sender} <span className="text-[#d1d1d1]">•</span> Received {email.received}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <IconButton onClick={() => setSendEmailModalOpen(true)} title="Send Email">
                <Send size={15} />
              </IconButton>
              <div className="relative">
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
                </button>
              </div>
            </div>
          </div>
        </div>

        {assignModalOpen && (
          <EmailTableAssignModal email={email} onClose={() => setAssignModalOpen(false)} />
        )}

        {sendEmailModalOpen && (
          <EmailTableSendEmailModal email={email} onClose={() => setSendEmailModalOpen(false)} />
        )}

        {/* Workflow track — sticky: once the subject scrolls out of view, this pins right below the header */}
        <div className={`sticky top-0 z-10 -mx-5 px-5 bg-[#f5f6fa] shrink-0 transition-[padding-top] duration-150 ${scrolled ? "pt-5" : "pt-0"}`}>
          <div className="bg-white rounded-[8px] border border-[#ebebeb] shadow-[0_2px_6px_rgba(15,23,42,0.05)] px-5 py-4 flex items-center gap-4">
            <div className="flex items-center max-w-full overflow-x-auto px-2 -mx-2 py-2 -my-2">
              {WORKFLOW_STAGES.map((s, i) => {
                const completed = i < currentStageIndex;
                const active = i === currentStageIndex;
                const inProgress = s.key === "ccc"; // preview only, hardcoded for now
                return (
                  <div key={s.key} className={`flex items-center ${i < WORKFLOW_STAGES.length - 1 ? "flex-1" : "shrink-0"}`}>
                    <button
                      onClick={() => setCurrentStageIndex(i)}
                      title={`Jump to ${s.label}`}
                      className="group flex items-center gap-2.5 cursor-pointer shrink-0"
                    >
                      <span
                        className={`flex items-center justify-center size-[28px] rounded-full shrink-0 transition-all duration-200 ${
                          completed
                            ? "bg-[#2E7D32]"
                            : active
                            ? "bg-[#E90029] ring-[5px] ring-[#E90029]/[0.14]"
                            : inProgress
                            ? "bg-[#E67919]"
                            : "border-2 border-[#e0e2e6] bg-white group-hover:border-[#b8bcc4]"
                        }`}
                      >
                        {completed ? (
                          <Check size={14} className="text-white" strokeWidth={3} />
                        ) : active ? (
                          <span className="size-[9px] rounded-full bg-white" />
                        ) : inProgress ? (
                          <span className="size-[9px] rounded-full bg-white" />
                        ) : (
                          <span className="text-[11px] font-semibold text-[#9ca3af]">{i + 1}</span>
                        )}
                      </span>
                      <span
                        className={`text-[13.5px] whitespace-nowrap ${
                          active
                            ? "font-bold text-[#111827]"
                            : completed
                            ? "font-medium text-[#4b5563]"
                            : inProgress
                            ? "font-medium text-[#111827]"
                            : "font-medium text-[#9ca3af] group-hover:text-[#6b7280]"
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                    {i < WORKFLOW_STAGES.length - 1 && (
                      <div
                        className={`h-[2px] flex-1 min-w-8 mx-3 rounded-full shrink-0 transition-colors duration-300 ${
                          i < currentStageIndex ? "bg-[#2E7D32]" : "bg-[#e5e7eb]"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="ml-auto text-[11px] font-medium text-[#9ca3af] shrink-0 whitespace-nowrap pl-3 border-l border-[#e5e7eb]">
              {Math.round((currentStageIndex / (WORKFLOW_STAGES.length - 1)) * 100)}% complete
            </p>
          </div>
          {scrolled && (
            <div className="absolute left-5 right-5 top-full h-16 bg-gradient-to-b from-[#f5f6fa] to-transparent pointer-events-none" />
          )}
        </div>

        {/* Body — swaps per stage; header/stepper/subject/footer stay identical across all of them */}
        {currentStageIndex === 1 && (
          <>
            {cccOutcome !== "idle" && (
              <div
                className={`rounded-[8px] border px-4 py-3 flex items-center gap-3 ${
                  cccOutcome === "success" ? "border-[#468657] bg-[#EFF6F1]" : "border-[#E67919] bg-[#FDF3E7]"
                }`}
              >
                {cccOutcome === "success" ? (
                  <>
                    <CircleCheck size={18} className="text-[#468657] shrink-0" />
                    <div>
                      <p className="text-[13px] font-bold text-[#111827]">CCC Created Successfully</p>
                      <p className="text-[12px] text-[#374151] mt-0.5">CCC Number: <span className="font-semibold">{cccNumber}</span></p>
                    </div>
                  </>
                ) : (
                  <>
                    <CircleAlert size={18} className="text-[#E67919] shrink-0" />
                    <div>
                      <p className="text-[13px] font-bold text-[#111827]">CCC Creation On Hold</p>
                      <p className="text-[12px] text-[#374151] mt-0.5">
                        {cccExtractionStatus && cccExtractionStatus.totalMissing > 0
                          ? `${cccExtractionStatus.totalMissing} required field${cccExtractionStatus.totalMissing > 1 ? "s are" : " is"} still missing. Resolve the extraction review below, then try again.`
                          : "The data couldn't be validated. Review the extracted fields below, then try again."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            <CccCreationBody onStatusChange={setCccExtractionStatus} />
          </>
        )}

        {currentStageIndex === 2 && <AiOrderValidationBody />}

        {currentStageIndex === 3 && <OrderCreationBody />}

        {currentStageIndex === 4 && <SoaBody email={email} />}

        {currentStageIndex === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          {/* Email thread — the message being triaged, always open, plus a clearly separate history section */}
          <EmailThreadCard email={email} />

          {/* Classify Intent */}
          <div className="bg-white rounded-[8px] border border-[#ebebeb] flex flex-col min-h-0 h-fit">
            <div className="px-5 pt-4 flex items-start justify-between gap-2">
              <div>
                <p className="text-[14px] font-bold text-[#111827]">Classify Intent</p>
                <p className="text-[12px] text-[#9ca3af] mt-0.5">AI classification for this email.</p>
              </div>
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

            <div className="px-5 pt-3 pb-4 flex flex-col gap-4">
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
                    <Button variant="secondary" size="sm" onClick={cancelOverride}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={submitOverride} disabled={!overrideReason.trim()}>Submit</Button>
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
                      <Button variant="outline" size="sm" accent="#30578D" icon={Copy} onClick={() => copyToClipboard("Summary", fullSummary)}>
                        Copy
                      </Button>
                    </div>
                    <p className="text-[12.5px] text-[#374151] leading-[1.6] whitespace-pre-line line-clamp-4">
                      {fullSummary}
                    </p>
                    <Button variant="outline" size="sm" accent="#30578D" className="mt-2" onClick={() => setSummaryModalOpen(true)}>
                      View full summary →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {summaryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSummaryModalOpen(false)} />
            <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[560px] max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#ebebeb] shrink-0">
                <h2 className="text-[16px] font-bold text-[#111827]">Full AI Summary</h2>
                <IconButton variant="ghost" onClick={() => setSummaryModalOpen(false)}>
                  <X size={18} />
                </IconButton>
              </div>
              <div className="px-6 py-4 overflow-y-auto">
                <p className="text-[13px] text-[#374151] leading-[1.7] whitespace-pre-line">{fullSummary}</p>
              </div>
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#ebebeb] shrink-0">
                <Button variant="secondary" icon={Copy} onClick={() => copyToClipboard("Summary", fullSummary)}>
                  Copy to clipboard
                </Button>
                <Button variant="primary" accent="#30578D" onClick={() => setSummaryModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        </div>
        </main>

        {/* Footer actions — full-bleed bar flush with the bottom edge, mirroring the header's treatment */}
        <div className="shrink-0 bg-white border-t border-[#ebebeb]">
          <div className="max-w-[1600px] mx-auto px-5 py-3.5 flex items-center justify-between gap-3">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => withPageLoader("Going back...", onBack)}>Back</Button>
            <div className="flex items-center gap-2.5">
              <Button variant="secondary" onClick={() => withPageLoader("Saving...", () => toast.success(`${email.id} saved`))}>Save & Update</Button>
              {currentStageIndex === 1 && cccOutcome !== "success" ? (
                <Button variant="primary" onClick={() => withPageLoader("Creating CCC request...", handleCreateCcc)}>Create CCC Req.</Button>
              ) : (
                <>
                  {currentStageIndex === 2 && (
                    <Button variant="outline" accent="#E90029" onClick={() => withPageLoader("Re-validating...", handleRevalidate)}>Re-Validate</Button>
                  )}
                  {currentStageIndex === 3 && (
                    <Button variant="outline" accent="#E90029" onClick={() => withPageLoader("Updating quote...", handleQuoteUpdate)}>Quote Update</Button>
                  )}
                  {currentStageIndex === 4 && (
                    <Button variant="outline" accent="#E90029" onClick={() => withPageLoader("Sending email...", handleSendEmail)}>Send Email</Button>
                  )}
                  <Button variant="primary" onClick={() => withPageLoader("Proceeding...", handleProceed)}>
                    {currentStageIndex < WORKFLOW_STAGES.length - 1 ? "Proceed" : "Complete"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
