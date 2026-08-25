import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronDown, CornerDownRight, Download, FileText, Mail, UserPlus } from "lucide-react";
import { AttachmentPreviewModal } from "../../components/common/AttachmentPreviewModal";
import { type Email, ALL_EMAILS_WITH_CCC } from "./emailData";

// Shared by CommandCenterOverviewPage ("Overview V1") and EmailViewPage, so the two never drift apart.

const EMAIL_STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  Flagged:      { label: "Flagged",      color: "#d12e2e", bg: "rgba(209,46,46,0.1)" },
  "Under Review": { label: "Under Review", color: "#e08c00", bg: "rgba(224,140,0,0.1)" },
  Cleared:      { label: "Cleared",      color: "#1fa161", bg: "rgba(31,161,97,0.1)" },
};

export function EmailStatusBadge({ status }: { status: string }) {
  const s = EMAIL_STATUS_STYLE[status] ?? EMAIL_STATUS_STYLE.Cleared;
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 rounded-[8px] text-[12px] font-medium whitespace-nowrap" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

// Three clearly distinct tiers: section heading (colored, larger) > field label (small, muted, this is a caption
// not a heading) > value (dark, bold — the actual data being read).
export function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-[110px] max-w-[240px]">
      <p className="text-[9.5px] font-normal text-[#9ca3af] uppercase tracking-wide mb-1 whitespace-nowrap">{label}</p>
      <div className="text-[13.5px] font-semibold text-[#1f2937] truncate">{value || "—"}</div>
    </div>
  );
}

export function DetailLink({ text, what }: { text?: string; what: string }) {
  if (!text || text === "—") return <>—</>;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toast.info(`Opening ${what}: ${text}`); }}
      className="text-[#c53e6c] hover:underline cursor-pointer text-left truncate"
    >
      {text}
    </button>
  );
}

// A CCC's own correspondence message. Recurses into any further nested replies (unlike the grid, the detail page
// isn't capped at 2 tiers — deeper threads are reachable here via an in-place "Show N more" toggle).
export function ThreadMessage({ msg, depth = 0 }: { msg: Email; depth?: number }) {
  const [showMore, setShowMore] = useState(false);
  const subReplies = msg.replies ?? [];
  return (
    <div className={depth > 0 ? "mt-3 pl-4 border-l-2 border-[#f0d5dd]" : ""}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-[13px] font-semibold text-[#111827]">{msg.sender}</p>
        <p className="text-[11px] text-[#9ca3af] shrink-0">{msg.received}</p>
      </div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <p className="text-[12px] text-[#6b7280]">{msg.subject}</p>
        <EmailStatusBadge status={msg.status} />
      </div>
      <p className="text-[13px] text-[#374151] leading-[1.6]">{msg.body ?? "No content preview available."}</p>
      {subReplies.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowMore(s => !s)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#c53e6c] hover:underline cursor-pointer"
          >
            {showMore ? "Hide" : "Show"} {subReplies.length} more {subReplies.length === 1 ? "reply" : "replies"}
          </button>
          {showMore && (
            <div className="mt-3 space-y-3">
              {subReplies.map(sub => <ThreadMessage key={sub.id} msg={sub} depth={depth + 1} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type CccTab = "ownership" | "request" | "order" | "workflow" | "automation";
const CCC_TABS: { key: CccTab; label: string }[] = [
  { key: "ownership", label: "Ownership" },
  { key: "request", label: "Request Info" },
  { key: "order", label: "Order Info" },
  { key: "workflow", label: "Workflow" },
  { key: "automation", label: "Automation & History" },
];

// One linked CCC request. Collapsed by default to a single compact summary row (click to expand) — with several
// linked CCCs the old always-expanded layout turned into a wall of scrolling. Once expanded, the structured fields
// sit behind tabs (only one section visible at a time) instead of stacking every section at once; the correspondence
// thread — actual nested emails, not metadata — always shows below the tabs since it's a different kind of content.
export function CccDetailCard({ ccc, expanded, onToggleExpand }: { ccc: Email; expanded: boolean; onToggleExpand: () => void }) {
  const [activeSection, setActiveSection] = useState<CccTab>("ownership");
  const replies = ccc.replies ?? [];
  return (
    <div>
      {/* Header — a summary row; the explicit "View Details" button (not the row itself) reveals the tabbed data below */}
      <div className="w-full flex items-center justify-between gap-4 px-5 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-[30px] rounded-[8px] bg-[#fdf0f4] flex items-center justify-center shrink-0">
            <FileText size={13} className="text-[#90003b]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-bold text-[#111827] truncate">{ccc.cccId}</p>
              <span className="text-[11.5px] text-[#6b7280] truncate">{ccc.cccRequestType} — {ccc.cccRequestSubtype}</span>
            </div>
            <p className="text-[11px] text-[#9ca3af] truncate mt-0.5">{ccc.accountName} · {ccc.csrOwner}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {replies.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10.5px] font-medium text-[#6b7280] bg-[#f3f4f6] px-2 py-1 rounded-[8px] whitespace-nowrap" title={`${replies.length} nested ${replies.length === 1 ? "email" : "emails"} in this CCC's correspondence`}>
              <CornerDownRight size={10} />
              {replies.length}
            </span>
          )}
          {ccc.slaTimeRemaining && (
            <span className="hidden sm:inline-block text-[10.5px] font-medium text-[#6b7280] bg-[#f3f4f6] px-2 py-1 rounded-[8px] whitespace-nowrap">{ccc.slaTimeRemaining}</span>
          )}
          <EmailStatusBadge status={ccc.status} />
          <button
            onClick={onToggleExpand}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11.5px] font-semibold cursor-pointer transition-colors ${
              expanded ? "bg-[#c53e6c] text-white" : "border border-[#d1d1d1] text-[#374151] hover:bg-[#f8fafc]"
            }`}
          >
            View Details
            <ChevronDown size={13} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#f3f4f6]">
          {/* Tabs — one section visible at a time instead of stacking all of them */}
          <div className="flex items-center gap-1 px-5 pt-2.5 overflow-x-auto">
            {CCC_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`shrink-0 px-3 pb-2.5 text-[12px] font-semibold whitespace-nowrap border-b-2 cursor-pointer transition-colors ${
                  activeSection === tab.key ? "text-[#c53e6c] border-[#c53e6c]" : "text-[#9ca3af] border-transparent hover:text-[#6b7280]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-[#f3f4f6]">
            {activeSection === "ownership" && (
              <div className="flex flex-wrap gap-x-6 gap-y-3.5">
                <DetailField label="CSR Owner (SOO)" value={ccc.csrOwner} />
                <DetailField label="Business Group" value={ccc.businessGroup} />
                <DetailField label="Opportunity Number" value={<DetailLink text={ccc.opportunityNumber} what="Opportunity" />} />
                <DetailField label="Account Manager" value={ccc.accountManager} />
                <DetailField label="Account Name" value={ccc.accountName} />
              </div>
            )}

            {activeSection === "request" && (
              <div className="flex flex-wrap gap-x-6 gap-y-3.5">
                <DetailField label="CCC Request Type" value={ccc.cccRequestType} />
                <DetailField label="CCC Request Subtype" value={ccc.cccRequestSubtype} />
                <DetailField label="CCC Request Status" value={ccc.cccRequestStatus} />
                <DetailField label="Awaiting Reason" value={ccc.awaitingReason} />
                <DetailField label="CCC Request Received Date" value={ccc.cccRequestReceivedDate} />
                <DetailField label="Time Remaining / SLA" value={ccc.slaTimeRemaining} />
              </div>
            )}

            {activeSection === "order" && (
              <div className="flex flex-wrap gap-x-6 gap-y-3.5">
                <DetailField label="PO #" value={ccc.poNumber} />
                <DetailField label="Quote # + Version / Revision" value={<DetailLink text={ccc.quoteNumber} what="Sales Quote" />} />
                <DetailField label="Order #" value={ccc.orderNumber} />
                <DetailField label="Operating Unit" value={ccc.operatingUnit} />
                <DetailField label="PO Amount" value={ccc.poAmount} />
                <DetailField label="Current Month Bookable Amount" value={ccc.currentMonthBookableAmount} />
                <DetailField label="Currency" value={ccc.currency} />
              </div>
            )}

            {activeSection === "workflow" && (
              <div className="flex flex-wrap gap-x-6 gap-y-3.5">
                <DetailField label="Current Status" value={<EmailStatusBadge status={ccc.status} />} />
                <DetailField label="Status Notes" value={ccc.statusNotes} />
                <DetailField label="Current Status Date" value={ccc.currentStatusDate} />
              </div>
            )}

            {activeSection === "automation" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2.5">Automation Visibility (Read-only)</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-3.5">
                    <DetailField label="Current Automation Status" value={ccc.currentAutomationStatus} />
                    <DetailField label="Current Automation Result" value={ccc.currentAutomationResult} />
                    <DetailField label="Link to Automation Details" value={<DetailLink text={ccc.automationDetailsLink} what="Automation Details" />} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2.5">Previous State</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-3.5">
                    <DetailField label="Previous Status" value={ccc.previousStatus} />
                    <DetailField label="Previous Status Date" value={ccc.previousStatusDate} />
                    <DetailField label="Previous Stage" value={ccc.previousStage} />
                    <DetailField label="Previous Automation Status" value={ccc.previousAutomationStatus} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2.5">OA</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-3.5">
                    <DetailField label="OA Status" value={ccc.oaStatus} />
                    <DetailField label="OA Summary" value={ccc.oaSummary} />
                    <DetailField label="OA Validation Records" value={<DetailLink text={ccc.oaValidationRecords} what="OA Records" />} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* This CCC's own correspondence — actual nested emails, always shown below the tabbed metadata */}
          {replies.length > 0 && (
            <div className="border-t border-[#f3f4f6]">
              <div className="px-5 py-3 flex items-center gap-2">
                <h3 className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-widest">Correspondence</h3>
                <span className="bg-[#f3f4f6] text-[#6b7280] text-[10px] font-bold px-2 py-0.5 rounded-full">{replies.length}</span>
              </div>
              <div className="divide-y divide-[#f3f4f6]">
                {replies.map((msg, idx) => (
                  <div key={msg.id} className="px-5 py-3.5 flex gap-3">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center shrink-0 pt-1 w-[8px]">
                      <div className="size-[7px] rounded-full bg-[#c53e6c] shrink-0" />
                      {idx < replies.length - 1 && <div className="w-[1.5px] flex-1 bg-[#f0d5dd] mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <ThreadMessage msg={msg} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// The email sidebar + detail panel — shared by the standalone Email View page and the Table/Email toggle
// inside the Command Center Overview page, so the two never drift apart.
export function EmailViewBody({ initialEmailId, onOpenWorkflow }: { initialEmailId?: string; onOpenWorkflow?: (emailId: string) => void }) {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedId, setSelectedId] = useState(initialEmailId ?? ALL_EMAILS_WITH_CCC[0].id);
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; size: string } | null>(null);
  const [expandedCccIds, setExpandedCccIds] = useState<Set<string>>(new Set());

  const selected = ALL_EMAILS_WITH_CCC.find((e) => e.id === selectedId) ?? ALL_EMAILS_WITH_CCC[0];
  const linkedCccs = selected.linkedCccs ?? [];
  const earlierInThread = linkedCccs.flatMap((c) => c.replies ?? []).slice(0, 3);

  const tabs = ["All", "Flagged", "Under Review", "Cleared"];
  const tabCount = (tab: string) => tab === "All" ? ALL_EMAILS_WITH_CCC.length : ALL_EMAILS_WITH_CCC.filter(e => e.status === tab).length;
  const filtered = ALL_EMAILS_WITH_CCC.filter((e) => activeTab === "All" || e.status === activeTab);

  const toggleCccExpanded = (cccId: string) => {
    setExpandedCccIds(prev => {
      const next = new Set(prev);
      if (next.has(cccId)) next.delete(cccId); else next.add(cccId);
      return next;
    });
  };

  // Separate expand state for the sidebar list's own 2-level nesting (email → CCCs → replies) — independent of
  // expandedCccIds above, which controls whether each CCC card's full body is expanded in the right panel.
  const [expandedSidebarEmailIds, setExpandedSidebarEmailIds] = useState<Set<string>>(new Set());
  const [expandedSidebarCccIds, setExpandedSidebarCccIds] = useState<Set<string>>(new Set());
  const toggleSidebarEmailExpanded = (id: string) => {
    setExpandedSidebarEmailIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSidebarCccExpanded = (id: string) => {
    setExpandedSidebarCccIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const statusIconColors: Record<string, string> = {
    Flagged: "text-rose-600",
    "Under Review": "text-amber-600",
    Cleared: "text-emerald-600",
  };
  const statusIconBg: Record<string, string> = {
    Flagged: "bg-rose-50",
    "Under Review": "bg-amber-50",
    Cleared: "bg-emerald-50",
  };

  return (
    <>
    <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left sidebar ── */}
        <div className="bg-white border-r border-[#ebebeb] flex flex-col w-[420px] shrink-0 overflow-hidden">

          {/* Sidebar header */}
          <div className="px-5 pt-5 pb-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <h2 className="font-semibold text-[15px] text-[#111827]">Emails</h2>
              <span className="bg-[#c53e6c] text-white text-[10px] font-bold px-[7px] py-[2px] rounded-full leading-none">
                {tabCount("All")}
              </span>
            </div>

            {/* Status tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {tabs.map((tab) => {
                const count = tabCount(tab);
                const active = activeTab === tab;
                const activeColors: Record<string, string> = {
                  All: "bg-[#111827] text-white",
                  Flagged: "bg-rose-600 text-white",
                  "Under Review": "bg-amber-500 text-white",
                  Cleared: "bg-emerald-600 text-white",
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer ${
                      active ? activeColors[tab] : "bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e9eaec]"
                    }`}
                  >
                    {tab}
                    <span className={`text-[10px] font-bold leading-none ${active ? "opacity-80" : "opacity-60"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#f0f0f0]" />

          {/* Email list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-16 px-6">
                <div className="size-[48px] rounded-full bg-[#f3f4f6] flex items-center justify-center">
                  <Mail size={20} className="opacity-30" />
                </div>
                <p className="text-[13px] text-[#9ca3af] text-center">No emails in this category</p>
              </div>
            )}
            {filtered.map((e) => {
              const isActive = selectedId === e.id;
              const cccList = e.linkedCccs ?? [];
              const emailExpanded = expandedSidebarEmailIds.has(e.id);
              return (
                <div key={e.id} className="border-b border-b-[#f3f4f6]">
                  {/* Level 0 — the email itself */}
                  <div
                    onClick={() => setSelectedId(e.id)}
                    className={`group relative px-5 py-4 cursor-pointer transition-all ${isActive ? "bg-[#fff5f7]" : "hover:bg-[#fafafa]"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 size-[34px] rounded-[8px] flex items-center justify-center mt-0.5 ${statusIconBg[e.status] ?? "bg-emerald-50"}`}>
                        <Mail size={15} className={statusIconColors[e.status] ?? "text-emerald-600"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className={`text-[13px] leading-[1.3] truncate ${isActive ? "font-semibold text-[#111827]" : "font-medium text-[#1f2937]"}`}>
                            {e.subject}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(ev) => { ev.stopPropagation(); toast.success(`Assigned ${e.id} to you`); }}
                              className="p-1 rounded-[8px] text-[#9ca3af] hover:text-[#c53e6c] hover:bg-[#fdf0f4] transition-colors cursor-pointer"
                              title="Assign to me"
                            >
                              <UserPlus size={12} />
                            </button>
                            <p className="text-[10.5px] text-[#9ca3af] whitespace-nowrap">{e.received}</p>
                          </div>
                        </div>
                        <p className="text-[11.5px] text-[#6b7280] leading-[1.5] truncate mb-2">{e.sender}</p>
                        <div className="flex items-center justify-between gap-2">
                          <EmailStatusBadge status={e.status} />
                          {cccList.length > 0 && (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); toggleSidebarEmailExpanded(e.id); }}
                              className="inline-flex items-center gap-1 shrink-0 px-2 py-[3px] rounded-full bg-[#fdf0f4] text-[#c53e6c] hover:bg-[#fbe1e9] text-[10.5px] font-medium cursor-pointer transition-colors"
                              aria-label={emailExpanded ? "Hide linked CCCs" : "Show linked CCCs"}
                            >
                              <ChevronDown size={10} className={`transition-transform duration-200 ${emailExpanded ? "rotate-180" : ""}`} />
                              {emailExpanded ? "Hide" : "Show"} {cccList.length} {cccList.length === 1 ? "CCC" : "CCCs"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Level 1 — CCC requests linked to this email */}
                  {emailExpanded && cccList.map((ccc) => {
                    const cccExpanded = expandedSidebarCccIds.has(ccc.id);
                    const cccReplies = ccc.replies ?? [];
                    return (
                      <div key={ccc.id}>
                        <div
                          onClick={() => setSelectedId(e.id)}
                          className="pl-[52px] pr-5 py-2.5 cursor-pointer hover:bg-[#faf5f7] border-t border-t-[#f5eef1] bg-[#fbf8f9] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={11} className="text-[#90003b] shrink-0" />
                            <p className="text-[12px] font-semibold text-[#333] truncate flex-1">{ccc.cccId}</p>
                            <EmailStatusBadge status={ccc.status} />
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1 pl-[19px]">
                            <p className="text-[11px] text-[#6b7280] truncate">{ccc.cccRequestType} — {ccc.cccRequestSubtype}</p>
                            {cccReplies.length > 0 && (
                              <button
                                onClick={(ev) => { ev.stopPropagation(); toggleSidebarCccExpanded(ccc.id); }}
                                className="inline-flex items-center gap-1 shrink-0 text-[10px] font-medium text-[#c53e6c] hover:underline cursor-pointer"
                                aria-label={cccExpanded ? "Hide replies" : "Show replies"}
                              >
                                <ChevronDown size={9} className={`transition-transform duration-200 ${cccExpanded ? "rotate-180" : ""}`} />
                                {cccExpanded ? "Hide" : "Show"} {cccReplies.length} {cccReplies.length === 1 ? "reply" : "replies"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Level 2 — this CCC's own correspondence */}
                        {cccExpanded && cccReplies.map((reply) => (
                          <div
                            key={reply.id}
                            onClick={() => setSelectedId(e.id)}
                            className="pl-[76px] pr-5 py-2.5 cursor-pointer hover:bg-[#f5eef1] border-t border-t-[#f5eef1] bg-[#f8f2f4] transition-colors"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CornerDownRight size={10} className="text-[#9ca3af] shrink-0" />
                              <p className="text-[11px] text-[#374151] truncate flex-1">{reply.subject}</p>
                              <EmailStatusBadge status={reply.status} />
                            </div>
                            {(reply.replies?.length ?? 0) > 0 && (
                              <p className="text-[10px] text-[#9ca3af] pl-[16px] mt-0.5">+{reply.replies!.length} more in thread</p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right detail panel ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f5f7]">
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">

            {/* Primary email card — the main content on this page; everything below is supplementary, on-demand detail */}
            <div className="bg-white rounded-[8px] border border-[#e5e7eb] overflow-hidden mb-5 shadow-sm">
              <div className="px-7 py-6 border-b border-[#f3f4f6]">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-[38px] rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-[13px] font-bold shrink-0 uppercase">
                      {selected.sender.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-[#111827] truncate">{selected.sender}</p>
                      <p className="text-[11.5px] text-[#9ca3af]">{selected.received}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success(`Assigned ${selected.id} to you`)}
                    className="shrink-0 flex items-center gap-1.5 bg-[#1e3a5f] text-white text-[12.5px] font-semibold pl-3 pr-2.5 py-2 rounded-full hover:bg-[#16304f] transition-colors cursor-pointer"
                  >
                    <UserPlus size={13} />
                    {selected.assignedTo ?? "Unassigned"}
                    <ChevronDown size={12} />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-[19px] font-bold text-[#111827] leading-[1.35]">{selected.subject}</h1>
                  <span className="shrink-0 mt-0.5"><EmailStatusBadge status={selected.status} /></span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {selected.classification && (
                    <span className="bg-[#eef2ff] text-[#1e3a5f] text-[11px] font-semibold px-2.5 py-1 rounded-[8px]">{selected.classification}</span>
                  )}
                  <span className="text-[12px] text-[#9ca3af]">Received: <span className="text-[#374151] font-medium">{selected.received}</span></span>
                  <span className="w-px h-3 bg-[#e5e7eb]" />
                  <span className="bg-[#f3f4f6] text-[#374151] text-[11px] font-semibold px-2.5 py-1 rounded-[8px] tracking-wide uppercase">{selected.category}</span>
                </div>
              </div>

              {/* Body — the primary content the user came here to read */}
              <div className="px-7 py-6">
                <p className="text-[14px] text-[#374151] leading-[1.7]">{selected.body ?? "No content preview available."}</p>
              </div>

              {/* Attachments */}
              {(selected.attachments?.length ?? 0) > 0 && (
                <div className="px-7 pb-6 flex flex-wrap gap-3">
                  {selected.attachments!.map((a) => (
                    <button
                      key={a.name}
                      onClick={() => setPreviewAttachment(a)}
                      className="group flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] border border-[#e5e7eb] hover:bg-[#fafafa] transition-colors cursor-pointer text-left"
                    >
                      <div className="size-[30px] rounded-[8px] bg-[#f3f4f6] flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-[#6b7280]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-[#111827] truncate max-w-[160px]">{a.name}</p>
                        <p className="text-[11px] text-[#9ca3af]">{a.size}</p>
                      </div>
                      <Download
                        size={13}
                        className="text-[#9ca3af] group-hover:text-[#111827] cursor-pointer transition-colors shrink-0"
                        onClick={(e) => { e.stopPropagation(); toast.info(`Downloading ${a.name}`); }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Earlier in this thread — a preview of this email's own correspondence, pulled from its linked CCC(s) */}
              {earlierInThread.length > 0 && (
                <div className="px-7 pb-6 space-y-2">
                  <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Earlier in this thread</p>
                  {earlierInThread.map((msg) => (
                    <div key={msg.id} className="flex items-center justify-between gap-3 bg-[#f8f8f8] rounded-[8px] px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-[#374151] truncate">{msg.sender}</p>
                        <p className="text-[11.5px] text-[#9ca3af] truncate">{msg.subject}</p>
                      </div>
                      <p className="text-[11px] text-[#9ca3af] shrink-0">{msg.received}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Meta strip */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 px-7 py-4 border-t border-[#f3f4f6] bg-[#fafafa]">
                {[
                  { label: "Email ID", value: selected.id },
                  { label: "Category", value: selected.category },
                  { label: "Size", value: selected.size },
                  { label: "Linked CCCs", value: String(linkedCccs.length) },
                ].map(({ label, value }) => (
                  <div key={label} className="min-w-[90px]">
                    <p className="text-[9.5px] font-normal text-[#9ca3af] uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-[12.5px] font-semibold text-[#374151]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked CCC requests — supplementary, on-demand detail: one flat panel, not cards competing with the email above */}
            {linkedCccs.length > 0 && (
              <div className="bg-white rounded-[8px] border border-[#ebebeb] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-[#fafafa] border-b border-[#f3f4f6]">
                  <h3 className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-widest">Linked CCC Requests</h3>
                  <span className="bg-white border border-[#e5e7eb] text-[#6b7280] text-[10px] font-bold px-2 py-0.5 rounded-full">{linkedCccs.length}</span>
                </div>
                <div className="divide-y divide-[#f3f4f6]">
                  {linkedCccs.map((ccc) => (
                    <CccDetailCard
                      key={ccc.id}
                      ccc={ccc}
                      expanded={expandedCccIds.has(ccc.id)}
                      onToggleExpand={() => toggleCccExpanded(ccc.id)}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sticky footer */}
          <div className="bg-white border-t border-[#ebebeb] px-8 py-4 flex items-center justify-between gap-3 flex-wrap shrink-0">
            <p className="text-[12px] text-[#9ca3af]">
              Last updated: <span className="text-[#374151] font-medium">{selected.received}</span>
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => toast.info(`Escalated ${selected.id}`)} className="px-5 py-2.5 border border-[#e5e7eb] rounded-[8px] text-[13px] font-medium text-[#374151] hover:bg-[#f9f9fb] cursor-pointer transition-colors">
                Escalate
              </button>
              <button onClick={() => toast.success(`Marked ${selected.id} as reviewed`)} className="px-5 py-2.5 border border-[#e5e7eb] rounded-[8px] text-[13px] font-medium text-[#374151] hover:bg-[#f9f9fb] cursor-pointer transition-colors">
                Mark Reviewed
              </button>
              <button onClick={() => onOpenWorkflow?.(selected.id)} className="px-5 py-2.5 bg-[#1e3a5f] rounded-[8px] text-[13px] font-semibold text-white hover:bg-[#16304f] cursor-pointer transition-colors shadow-sm">
                Open Workflow →
              </button>
            </div>
          </div>
        </div>

      </div>
    <AttachmentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </>
  );
}
