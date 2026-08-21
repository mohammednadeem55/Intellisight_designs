import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CirclePause,
  Copy,
  CornerDownRight,
  EllipsisVertical,
  FileText,
  Filter,
  Globe,
  GripVertical,
  History,
  Inbox,
  LayoutGrid,
  List,
  Mail,
  Maximize2,
  MessageSquare,
  Minimize2,
  Paperclip,
  Plus,
  RotateCcw,
  Rows2,
  Rows3,
  Rows4,
  Search,
  Send,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AppHeader } from "./components/AppHeader";
import { type Email, ALL_EMAILS_WITH_CCC, BUSINESS_GROUPS, CLASSIFICATIONS } from "./emailData";

// ─── New Overview (fresh build, matching the shared reference design) ──────────
// Deliberately does not reuse OrderListingTable, CccDetailCard, or EmailViewBody — its own table, toolbar,
// KPI strip, and email view, styled to the reference's navy/light-border look rather than the app's pink brand.

const NEW_OVERVIEW_NAVY = "#30578D";

const NEW_OVERVIEW_MAILBOXES = [
  "usa_orders@keysight.com",
  "contactcenter_uk@keysight.com",
  "contact_japan@keysight.com",
  "service_japan@keysight.com",
  "system.support@keysight.com",
  "lar_orders@keysight.com",
];

const NEW_OVERVIEW_INTERVALS = ["24h", "48h", "72h", "1 Week", "2 Weeks", "Custom"];

// Column Mgmt — From/Subject, Classification, Confidence, Age, Assigned To, Business Group, Review
// Status, and Action are the default columns and always shown (not toggleable). "Additional Columns"
// are optional, grouped by category, and get appended to the table (before Action) when enabled —
// their order among themselves is controlled by the "Sort Columns" tab.
const NEW_OVERVIEW_DEFAULT_TOGGLEABLE_COLUMNS = ["classification", "confidence", "age", "assignedTo", "businessGroup", "reviewStatus", "reviewedBy"];

const NEW_OVERVIEW_COLUMN_CATEGORIES: { label: string; columns: { key: string; label: string }[] }[] = [
  {
    label: "Default Columns",
    columns: [
      { key: "classification", label: "Classification" },
      { key: "confidence", label: "Confidence" },
      { key: "age", label: "Age" },
      { key: "assignedTo", label: "Assigned To" },
      { key: "businessGroup", label: "Business Group" },
      { key: "reviewStatus", label: "Review Status" },
      { key: "reviewedBy", label: "Reviewed By" },
    ],
  },
  {
    label: "Ownership",
    columns: [
      { key: "opportunityNumber", label: "Opportunity Number" },
      { key: "accountManager", label: "Account Manager" },
      { key: "accountName", label: "Account Name" },
    ],
  },
  {
    label: "CCC Request Info",
    columns: [
      { key: "cccRequestType", label: "CCC Request Type" },
      { key: "cccRequestSubtype", label: "CCC Request Subtype" },
      { key: "cccRequestStatus", label: "CCC Request Status" },
      { key: "awaitingReason", label: "Awaiting Reason" },
      { key: "cccRequestReceivedDate", label: "CCC Request Received Date" },
      { key: "slaTimeRemaining", label: "Time Remaining / SLA" },
    ],
  },
  {
    label: "Order Info",
    columns: [
      { key: "poNumber", label: "PO #" },
      { key: "quoteNumber", label: "Quote # + Version / Revision" },
      { key: "orderNumber", label: "Order #" },
      { key: "operatingUnit", label: "Operating Unit" },
    ],
  },
  {
    label: "Current Workflow Status",
    columns: [
      { key: "status", label: "Current Status" },
      { key: "statusNotes", label: "Status Notes" },
      { key: "currentStatusDate", label: "Current Status Date" },
    ],
  },
  {
    label: "Automation Visibility (Read-only)",
    columns: [
      { key: "currentAutomationStatus", label: "Current Automation Status" },
      { key: "currentAutomationResult", label: "Current Automation Result" },
      { key: "automationDetailsLink", label: "Link to Automation Details" },
    ],
  },
  {
    label: "Previous State",
    columns: [
      { key: "previousStatus", label: "Previous Status" },
      { key: "previousStatusDate", label: "Previous Status Date" },
      { key: "previousStage", label: "Previous Stage" },
      { key: "previousAutomationStatus", label: "Previous Automation Status" },
    ],
  },
  {
    label: "OA",
    columns: [
      { key: "oaStatus", label: "OA Status" },
      { key: "oaSummary", label: "OA Summary" },
      { key: "oaValidationRecords", label: "OA Validation Records" },
    ],
  },
];

const NEW_OVERVIEW_ADDITIONAL_COLUMN_LABELS: Record<string, string> = Object.fromEntries(
  NEW_OVERVIEW_COLUMN_CATEGORIES.flatMap((cat) => cat.columns.map((c) => [c.key, c.label]))
);

const NEW_OVERVIEW_ADDITIONAL_ACCESSORS: Record<string, (r: Email) => string | undefined> = {
  opportunityNumber: (r) => r.opportunityNumber,
  accountManager: (r) => r.accountManager,
  accountName: (r) => r.accountName,
  cccRequestType: (r) => r.cccRequestType,
  cccRequestSubtype: (r) => r.cccRequestSubtype,
  cccRequestStatus: (r) => r.cccRequestStatus,
  awaitingReason: (r) => r.awaitingReason,
  cccRequestReceivedDate: (r) => r.cccRequestReceivedDate,
  slaTimeRemaining: (r) => r.slaTimeRemaining,
  poNumber: (r) => r.poNumber,
  quoteNumber: (r) => r.quoteNumber,
  orderNumber: (r) => r.orderNumber,
  operatingUnit: (r) => r.operatingUnit,
  status: (r) => r.status,
  statusNotes: (r) => r.statusNotes,
  currentStatusDate: (r) => r.currentStatusDate,
  currentAutomationStatus: (r) => r.currentAutomationStatus,
  currentAutomationResult: (r) => r.currentAutomationResult,
  automationDetailsLink: (r) => r.automationDetailsLink,
  previousStatus: (r) => r.previousStatus,
  previousStatusDate: (r) => r.previousStatusDate,
  previousStage: (r) => r.previousStage,
  previousAutomationStatus: (r) => r.previousAutomationStatus,
  oaStatus: (r) => r.oaStatus,
  oaSummary: (r) => r.oaSummary,
  oaValidationRecords: (r) => r.oaValidationRecords,
};

const NEW_OVERVIEW_FILTER_SECTIONS: { key: string; label: string; getValue: (r: Email) => string }[] = [
  { key: "sensitivity", label: "Sensitivity", getValue: (r) => r.sensitivity ?? "GENERAL" },
  { key: "languageDetected", label: "Language Detected", getValue: (r) => r.languageDetected ?? "en" },
  { key: "source", label: "Source", getValue: (r) => r.source ?? "INTERNAL" },
];

function NewOverviewAvatar({ email }: { email: Email }) {
  const isAi = email.assignedTo === "AI";
  return (
    <div className={`size-[26px] rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white ${isAi ? "bg-[#666666]" : ""}`} style={isAi ? undefined : { backgroundColor: NEW_OVERVIEW_NAVY }}>
      {email.assignedInitials ?? "?"}
    </div>
  );
}

function NewOverviewReviewPill({ status }: { status?: string }) {
  const s = status ?? "Pending";
  const style = s === "Approved" ? "text-[#23432C] bg-[#EFF6F1]" : s === "Rejected" ? "text-[#280B0B] bg-[#FAEBEB]" : "text-[#613305] bg-[#FDF3E7]";
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${style}`}>{s}</span>;
}

function NewOverviewConfidenceBar({ pct }: { pct?: number }) {
  const value = pct ?? 0;
  return (
    <div className="flex items-center gap-2 w-[92px]">
      <div className="flex-1 h-[6px] rounded-full bg-[#f1f2f4] overflow-hidden">
        <div className="h-full rounded-full bg-[#468657]" style={{ width: `${value}%` }} />
      </div>
      <span className="text-[12px] font-medium text-[#4D4D4D] shrink-0">{value}%</span>
    </div>
  );
}

const NEW_OVERVIEW_AGE_POOL = ["22h 46m", "1d 2h 38m", "23h 0m", "23h 2m", "18h 12m", "2d 1h 5m"];
const EMPTY_SET = new Set<string>();

// A "review" is any Like/Dislike/Comment left on a row — multiple team members can each leave one, so it's
// stored as a per-row list rather than a single value. The "Reviewed By" column surfaces just the latest
// entry; the full history (who, what, when) is available via its "view all" icon.
type NewOverviewReviewEntry = {
  user: string;
  initials: string;
  type: "like" | "dislike" | "comment";
  comment?: string;
  at: Date;
};
const NEW_OVERVIEW_CURRENT_USER = { name: "Jagdish K.", initials: "JK" };
function formatReviewDateTime(d: Date): string {
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function latestReview(entries: NewOverviewReviewEntry[] | undefined): NewOverviewReviewEntry | undefined {
  if (!entries || entries.length === 0) return undefined;
  return entries.reduce((a, b) => (b.at > a.at ? b : a));
}

// Stable string hash so a derived-but-fake field (like Age, which has no real backing value) still resolves
// to the same pool entry for a given row id regardless of pagination/sort position — otherwise the same row
// could show a different "Age" depending on where it lands in the array, and column filtering would be wrong.
function newOverviewHashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

// The single source of truth for "what does column X show for row R" — used for rendering AND for column
// filter option lists / matching, so they can never drift out of sync with each other.
function getNewOverviewColumnValue(key: string, row: Email, reviews: Record<string, NewOverviewReviewEntry[]> = {}): string {
  switch (key) {
    case "classification": return row.classification ?? "—";
    case "confidence": return `${row.confidencePct ?? 0}%`;
    case "age": return NEW_OVERVIEW_AGE_POOL[newOverviewHashSeed(row.id) % NEW_OVERVIEW_AGE_POOL.length];
    case "assignedTo": return row.assignedTo ?? "Unassigned";
    case "businessGroup": return row.businessGroup ?? "—";
    case "reviewStatus": return row.reviewStatus ?? "Pending";
    case "reviewedBy": return latestReview(reviews[row.id])?.user ?? "—";
    default: return NEW_OVERVIEW_ADDITIONAL_ACCESSORS[key]?.(row) ?? "—";
  }
}

const NEW_OVERVIEW_TEAM = [
  { name: "Jagdish K.", initials: "JK" },
  { name: "Gaurish", initials: "G" },
  { name: "Maria Chen", initials: "MC" },
];

const NEW_OVERVIEW_STATUSES = [
  { label: "In Progress", color: "#30578D" },
  { label: "Pending", color: "#E67919" },
  { label: "Closed", color: "#468657" },
];

// "Assign & Update Status" modal — opened from a row's Assign action (or from the email view's Assigned To
// pill); prefills business/assignee/status from whatever the email already has, and lets the user change any
// of it before saving.
function NewOverviewAssignModal({ email, onClose }: { email: Email; onClose: () => void }) {
  const matchedUser = NEW_OVERVIEW_TEAM.find((u) => u.name === email.assignedTo);
  const initialStatus = email.reviewStatus === "Approved" || email.reviewStatus === "Rejected"
    ? NEW_OVERVIEW_STATUSES[2]
    : NEW_OVERVIEW_STATUSES[1];

  const [groups, setGroups] = useState<string[]>(BUSINESS_GROUPS);
  const [businessGroup, setBusinessGroup] = useState(email.businessGroup ?? BUSINESS_GROUPS[0]);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const filteredGroups = groups.filter((g) => g.toLowerCase().includes(groupSearch.trim().toLowerCase()));
  const canAddGroup = groupSearch.trim().length > 0 && !groups.some((g) => g.toLowerCase() === groupSearch.trim().toLowerCase());
  const handleAddGroup = () => {
    const name = groupSearch.trim();
    if (!name) return;
    setGroups((prev) => [...prev, name]);
    setBusinessGroup(name);
    setGroupSearch("");
    setGroupOpen(false);
  };
  const [assignMode, setAssignMode] = useState<"me" | "others">("others");
  const [selectedUser, setSelectedUser] = useState(matchedUser ?? NEW_OVERVIEW_TEAM[0]);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [statusOpen, setStatusOpen] = useState(false);

  const handleSave = () => {
    const assignee = assignMode === "me" ? "you" : selectedUser.name;
    toast.success(`${email.id} assigned to ${assignee} (${businessGroup}) — status set to ${status.label}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px] overflow-visible">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
          <h2 className="text-[16px] font-bold text-[#262626]">Assign & Update Status</h2>
          <button onClick={onClose} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Assign to Business Group */}
          <div>
            <p className="text-[11.5px] font-medium text-[#666666] mb-2">Assign to Business Group</p>
            <div className="relative">
              <button
                onClick={() => setGroupOpen((v) => !v)}
                className="w-full flex items-center gap-2 px-3 h-[40px] rounded-[8px] border border-[#E2E6E9] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
              >
                <Building2 size={14} className="text-[#97999B] shrink-0" />
                <span className="text-[13px] text-[#262626] flex-1 text-left truncate">{businessGroup || "Select a business group"}</span>
                <ChevronDown size={14} className={`text-[#97999B] transition-transform duration-200 ${groupOpen ? "rotate-180" : ""}`} />
              </button>
              {groupOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-10 overflow-hidden">
                  <div className="p-2 border-b border-[#E2E6E9]">
                    <input
                      autoFocus
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      placeholder="Search or add new group..."
                      className="w-full h-[32px] px-2.5 rounded-[6px] border border-[#E2E6E9] text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
                    />
                  </div>
                  <div className="max-h-[160px] overflow-auto py-1">
                    {filteredGroups.length === 0 && !canAddGroup && (
                      <p className="px-3 py-2 text-[12px] text-[#97999B]">No matches</p>
                    )}
                    {filteredGroups.map((g) => (
                      <button
                        key={g}
                        onClick={() => { setBusinessGroup(g); setGroupSearch(""); setGroupOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F7F7F7] cursor-pointer text-left transition-colors"
                      >
                        <Building2 size={12} className="text-[#97999B] shrink-0" />
                        <span className="text-[12.5px] text-[#4D4D4D]">{g}</span>
                      </button>
                    ))}
                  </div>
                  {canAddGroup && (
                    <button
                      onClick={handleAddGroup}
                      className="w-full flex items-center gap-2 px-3 py-2.5 border-t border-[#E2E6E9] hover:bg-[#F7F7F7] cursor-pointer text-left transition-colors"
                      style={{ color: NEW_OVERVIEW_NAVY }}
                    >
                      <Plus size={13} />
                      <span className="text-[12.5px] font-medium">Add "{groupSearch.trim()}" as new group</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Assign to User */}
          <div>
            <p className="text-[11.5px] font-medium text-[#666666] mb-2">Assign to User</p>
            <div className="flex items-center gap-2.5 mb-2.5">
              <button
                onClick={() => setAssignMode("me")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${assignMode === "me" ? "border-[#30578D] text-[#30578D] bg-[#30578D]/10" : "border-[#E2E6E9] text-[#4D4D4D] hover:bg-[#F7F7F7]"}`}
              >
                <User size={13} />
                Assign to me
              </button>
              <button
                onClick={() => setAssignMode("others")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${assignMode === "others" ? "border-[#30578D] text-[#30578D] bg-[#30578D]/10" : "border-[#E2E6E9] text-[#4D4D4D] hover:bg-[#F7F7F7]"}`}
              >
                <Users size={13} />
                Assign to others
              </button>
            </div>

            {assignMode === "others" && (
              <div className="relative">
                <div className="w-full flex items-center gap-2.5 pl-2.5 pr-2 py-2 rounded-[8px] border border-[#E2E6E9]">
                  <button
                    onClick={() => setUserPickerOpen((v) => !v)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="size-[24px] rounded-full bg-[#E2E6E9] flex items-center justify-center text-[10px] font-bold text-[#4D4D4D] shrink-0">
                      {selectedUser.initials}
                    </span>
                    <span className="text-[13px] text-[#262626] truncate">{selectedUser.name}</span>
                  </button>
                  <button onClick={() => setUserPickerOpen(false)} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors shrink-0">
                    <X size={14} />
                  </button>
                </div>
                {userPickerOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-10 py-1 max-h-[180px] overflow-auto">
                    {NEW_OVERVIEW_TEAM.map((u) => (
                      <button
                        key={u.name}
                        onClick={() => { setSelectedUser(u); setUserPickerOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F7F7F7] cursor-pointer text-left transition-colors"
                      >
                        <span className="size-[22px] rounded-full bg-[#E2E6E9] flex items-center justify-center text-[10px] font-bold text-[#4D4D4D] shrink-0">{u.initials}</span>
                        <span className="text-[12.5px] text-[#4D4D4D]">{u.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <p className="text-[11.5px] font-medium text-[#666666] mb-2">Status</p>
            <div className="relative">
              <button
                onClick={() => setStatusOpen((v) => !v)}
                className="w-full flex items-center gap-2 px-3 h-[40px] rounded-[8px] border border-[#E2E6E9] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
              >
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                <span className="text-[13px] text-[#262626] flex-1 text-left">{status.label}</span>
                <ChevronDown size={14} className={`text-[#97999B] transition-transform duration-200 ${statusOpen ? "rotate-180" : ""}`} />
              </button>
              {statusOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-10 py-1">
                  {NEW_OVERVIEW_STATUSES.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => { setStatus(s); setStatusOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F7F7F7] cursor-pointer text-left transition-colors"
                    >
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-[12.5px] text-[#4D4D4D]">{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: "#E90029" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Send Email modal — placeholder for now, opens empty so the action is wired up ahead of the real compose UI.
function NewOverviewSendEmailModal({ email, onClose }: { email: Email; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[480px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
          <h2 className="text-[16px] font-bold text-[#262626]">Send Email</h2>
          <button onClick={onClose} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3.5">
          <div>
            <p className="text-[11.5px] font-medium text-[#666666] mb-1.5">To</p>
            <input
              defaultValue={email.sender}
              className="w-full h-[38px] px-3 rounded-[8px] border border-[#E2E6E9] text-[13px] text-[#262626] outline-none focus:border-[#30578D] transition-colors"
            />
          </div>
          <div>
            <p className="text-[11.5px] font-medium text-[#666666] mb-1.5">Subject</p>
            <input
              placeholder="Subject"
              className="w-full h-[38px] px-3 rounded-[8px] border border-[#E2E6E9] text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
            />
          </div>
          <div>
            <p className="text-[11.5px] font-medium text-[#666666] mb-1.5">Message</p>
            <textarea
              rows={5}
              placeholder="Write your message..."
              className="w-full px-3 py-2.5 rounded-[8px] border border-[#E2E6E9] text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => { toast.success(`Email sent for ${email.id}`); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: NEW_OVERVIEW_NAVY }}
          >
            <Send size={13} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Comment modal — 200 character limit with a live counter; Submit is disabled until there's text.
function NewOverviewCommentModal({ email, onClose, onSubmit }: { email: Email; onClose: () => void; onSubmit: (text: string, entity: Email) => void }) {
  const [text, setText] = useState("");
  const remaining = 200 - text.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
          <h2 className="text-[16px] font-bold text-[#262626]">Add Comment</h2>
          <button onClick={onClose} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-2">
          <p className="text-[11.5px] font-medium text-[#666666]">Comment on {email.id}</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
            rows={4}
            placeholder="Add a comment..."
            autoFocus
            className="w-full px-3 py-2.5 rounded-[8px] border border-[#E2E6E9] text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors resize-none"
          />
          <p className={`text-[11px] text-right ${remaining <= 20 ? "text-[#dc2626]" : "text-[#97999B]"}`}>{remaining} characters left</p>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (text.trim()) onSubmit(text.trim(), email); }}
            disabled={!text.trim()}
            className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
            style={{ backgroundColor: NEW_OVERVIEW_NAVY }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// Reviews modal — full history behind the "Reviewed By" column's icon: every Like/Dislike/Comment left on
// this row, newest first, with who left it and when.
function NewOverviewReviewsModal({ email, entries, onClose }: { email: Email; entries: NewOverviewReviewEntry[]; onClose: () => void }) {
  const sorted = [...entries].sort((a, b) => b.at.getTime() - a.at.getTime());
  const meta: Record<NewOverviewReviewEntry["type"], { label: string; color: string; Icon: typeof ThumbsUp }> = {
    like: { label: "Liked", color: "#468657", Icon: ThumbsUp },
    dislike: { label: "Disliked", color: "#dc2626", Icon: ThumbsDown },
    comment: { label: "Commented", color: NEW_OVERVIEW_NAVY, Icon: MessageSquare },
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE] shrink-0">
          <div>
            <h2 className="text-[16px] font-bold text-[#262626]">Review History</h2>
            <p className="text-[12px] text-[#97999B] mt-0.5">{email.id}</p>
          </div>
          <button onClick={onClose} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3 overflow-y-auto">
          {sorted.length === 0 ? (
            <p className="text-[13px] text-[#97999B] text-center py-6">No reviews yet</p>
          ) : (
            sorted.map((entry, i) => {
              const m = meta[entry.type];
              return (
                <div key={i} className="flex items-start gap-3">
                  <span className="size-[30px] rounded-full bg-[#E2E6E9] flex items-center justify-center text-[10.5px] font-bold text-[#4D4D4D] shrink-0">
                    {entry.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-semibold text-[#262626]">{entry.user}</span>
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-medium" style={{ color: m.color }}>
                        <m.Icon size={11} />
                        {m.label}
                      </span>
                    </div>
                    {entry.comment && (
                      <p className="text-[12.5px] text-[#4D4D4D] mt-1 bg-[#F7F7F7] rounded-[8px] px-3 py-2">{entry.comment}</p>
                    )}
                    <p className="text-[11px] text-[#97999B] mt-1">{formatReviewDateTime(entry.at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Custom table — expand chevron reveals linked CCCs as simple one-level sub-rows (no tabs, no deep hierarchy).
// The 8 default columns (From/Subject, Classification, Confidence, Age, Assigned To, Business Group,
// Review Status, Action) are always shown; optional "Additional Columns" render dynamically off
// `additionalColumns`, whose membership + order comes from the Column Mgmt panel.
function renderNewOverviewColumnCell(
  key: string,
  row: Email,
  reviews: Record<string, NewOverviewReviewEntry[]>,
  onOpenReviews: () => void
) {
  switch (key) {
    case "classification":
      return <span className="text-[12.5px] text-[#4D4D4D] whitespace-nowrap">{row.classification ?? "—"}</span>;
    case "confidence":
      return <NewOverviewConfidenceBar pct={row.confidencePct} />;
    case "age":
      return <span className="text-[12.5px] text-[#4D4D4D] whitespace-nowrap">{getNewOverviewColumnValue("age", row)}</span>;
    case "assignedTo":
      return (
        <div className="flex items-center gap-2 min-w-0">
          <NewOverviewAvatar email={row} />
          <span className="text-[12.5px] text-[#4D4D4D] truncate">{row.assignedTo ?? "Unassigned"}</span>
        </div>
      );
    case "businessGroup":
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <Users size={12} className="text-[#97999B] shrink-0" />
          <span className="text-[12.5px] text-[#4D4D4D] truncate">{row.businessGroup ?? "—"}</span>
        </div>
      );
    case "reviewStatus":
      return <NewOverviewReviewPill status={row.reviewStatus} />;
    case "reviewedBy": {
      const entries = reviews[row.id] ?? [];
      const latest = latestReview(entries);
      if (!latest) return <span className="text-[12.5px] text-[#97999B]">—</span>;
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="min-w-0 leading-tight">
            <p className="text-[12.5px] text-[#4D4D4D] truncate">{latest.user}</p>
            <p className="text-[11px] text-[#97999B] truncate">{formatReviewDateTime(latest.at)}</p>
          </div>
          <NewOverviewTooltipWrapper label={`View all reviews (${entries.length})`}>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenReviews(); }}
              className="shrink-0 flex items-center justify-center size-[22px] rounded-[6px] text-[#97999B] hover:bg-[#F1F2F4] hover:text-[#4D4D4D] cursor-pointer transition-colors"
            >
              <History size={13} />
            </button>
          </NewOverviewTooltipWrapper>
        </div>
      );
    }
    default:
      return <span className="text-[12.5px] text-[#4D4D4D] whitespace-nowrap">{getNewOverviewColumnValue(key, row)}</span>;
  }
}

function NewOverviewStatusIcon({ status }: { status?: string }) {
  const map: Record<string, { label: string; color: string; Icon: typeof CircleAlert }> = {
    Flagged: { label: "Incomplete", color: "#dc2626", Icon: CircleAlert },
    "Under Review": { label: "On Hold", color: "#E67919", Icon: CirclePause },
    Cleared: { label: "Created", color: "#468657", Icon: CircleCheck },
  };
  const entry = status ? map[status] : undefined;
  if (!entry) return null;
  return (
    <NewOverviewTooltipWrapper label={entry.label}>
      <entry.Icon size={13} style={{ color: entry.color }} className="shrink-0" />
    </NewOverviewTooltipWrapper>
  );
}

// Shared by parent email rows and their nested CCC rows — bold id + copy-to-clipboard, sender line with
// attachment/status icons, and the subject/request-type text underneath.
function NewOverviewSubjectCell({ entity, density }: { entity: Email; density: "small" | "medium" | "large" }) {
  return (
    <>
      <div className="flex items-center gap-1.5 min-w-0 leading-tight">
        <p className="text-[13px] font-semibold truncate" style={{ color: NEW_OVERVIEW_NAVY }}>{entity.id}</p>
        <NewOverviewTooltipWrapper label="Copy ID">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(entity.id);
              toast.success(`Copied ${entity.id}`);
            }}
            className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors"
          >
            <Copy size={11} />
          </button>
        </NewOverviewTooltipWrapper>
        {(entity.attachments?.length ?? 0) > 0 && (
          <NewOverviewTooltipWrapper label="Has attachments">
            <Paperclip size={11} className="text-[#30578D] shrink-0" />
          </NewOverviewTooltipWrapper>
        )}
        <NewOverviewStatusIcon status={entity.status} />
      </div>
      {density !== "small" && (
        <div className="flex items-center gap-1.5 min-w-0 leading-tight mt-0.5">
          <p className="text-[12.5px] text-[#4D4D4D] truncate">{entity.sender}</p>
        </div>
      )}
      {density === "large" && (
        <p className="text-[12px] text-[#97999B] truncate leading-tight mt-0.5">{entity.subject}</p>
      )}
    </>
  );
}

// Shared by parent email rows and their nested CCC rows — Assign (primary) plus Send Email / Like / Dislike /
// Comment as a compact icon toolbar. Like/Dislike are mutually exclusive and "pop" via a scale transition.
// Icon button with a small dark tooltip that fades in on hover, instead of relying on the native
// (slow, plain, browser-styled) title attribute.
// Custom tooltip — dark rounded card with a small arrow, positioned via JS (`position: fixed` off the
// trigger's real screen coordinates) rather than CSS anchored to an ancestor. The table scrolls inside an
// `overflow-auto` container, and a plain CSS/absolute tooltip gets clipped at whichever edge (top, bottom,
// or the sticky-right Action column) it happens to overflow — fixed positioning escapes that entirely.
function NewOverviewTooltipWrapper({ label, children }: { label: string; children: ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  const show = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  };

  return (
    <span ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)} className="inline-flex">
      {children}
      {pos && createPortal(
        <div
          className="fixed flex flex-col items-center pointer-events-none z-[100]"
          style={{ top: pos.top, left: pos.left, transform: "translateX(-50%)" }}
        >
          <span className="w-[7px] h-[7px] bg-[#262626] rotate-45 -mb-[3.5px]" />
          <span className="whitespace-nowrap px-2.5 py-1.5 rounded-[6px] bg-[#262626] text-white text-[10.5px] font-medium shadow-lg">
            {label}
          </span>
        </div>,
        document.body
      )}
    </span>
  );
}

function NewOverviewIconButton({
  icon: Icon,
  label,
  onClick,
  active,
  activeColor,
  activeBg,
}: {
  icon: typeof Send;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
  activeBg?: string;
}) {
  return (
    <NewOverviewTooltipWrapper label={label}>
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`flex items-center justify-center size-[28px] rounded-[8px] border transition-all cursor-pointer ${active ? "scale-110" : "scale-100 border-[#E2E6E9] text-[#666666] hover:bg-[#F7F7F7]"}`}
        style={active ? { borderColor: activeColor, backgroundColor: activeBg, color: activeColor } : undefined}
      >
        <Icon size={13} />
      </button>
    </NewOverviewTooltipWrapper>
  );
}

function NewOverviewActionCell({
  entity,
  reaction,
  onToggleReaction,
  onAssign,
  onSendEmail,
  onComment,
}: {
  entity: Email;
  reaction: "like" | "dislike" | undefined;
  onToggleReaction: (reaction: "like" | "dislike") => void;
  onAssign: () => void;
  onSendEmail: () => void;
  onComment: () => void;
}) {
  const isAssigned = !!entity.assignedTo && entity.assignedTo !== "Unassigned";
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleOpen = () => {
    if (!open) {
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) setPos({ top: rect.bottom + 6, left: rect.right - 190 });
    }
    setOpen((v) => !v);
  };

  const run = (fn: () => void) => { fn(); setOpen(false); };

  return (
    <div className="flex items-center gap-1.5">
      <NewOverviewIconButton
        icon={isAssigned ? UserCheck : UserPlus}
        label={isAssigned ? `Assigned to ${entity.assignedTo} — click to reassign` : "Assign"}
        onClick={onAssign}
        active={isAssigned}
        activeColor={NEW_OVERVIEW_NAVY}
        activeBg="#E9EEF5"
      />
      <NewOverviewTooltipWrapper label="More actions">
        <button
          ref={btnRef}
          onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
          className="relative flex items-center justify-center size-[28px] rounded-[8px] border border-[#E2E6E9] text-[#666666] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
        >
          <EllipsisVertical size={14} />
          {reaction && (
            <span
              className="absolute -top-[3px] -right-[3px] size-[7px] rounded-full border border-white"
              style={{ backgroundColor: reaction === "like" ? "#468657" : "#dc2626" }}
            />
          )}
        </button>
      </NewOverviewTooltipWrapper>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg w-[190px] py-1.5"
          style={{ top: pos.top, left: pos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => run(onSendEmail)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#4D4D4D] hover:bg-[#F7F7F7] cursor-pointer text-left transition-colors"
          >
            <Send size={13} className="text-[#97999B]" />
            Send Email
          </button>
          <button
            onClick={() => run(onComment)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#4D4D4D] hover:bg-[#F7F7F7] cursor-pointer text-left transition-colors"
          >
            <MessageSquare size={13} className="text-[#97999B]" />
            Comment
          </button>
          <div className="my-1 border-t border-[#E2E6E9]" />
          <div className="px-3 py-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#97999B]">React</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => run(() => onToggleReaction("like"))}
                className="flex items-center justify-center size-[26px] rounded-[6px] border transition-colors cursor-pointer"
                style={reaction === "like" ? { borderColor: "#468657", backgroundColor: "#EFF6F1", color: "#468657" } : { borderColor: "#E2E6E9", color: "#666666" }}
              >
                <ThumbsUp size={12} fill={reaction === "like" ? "#468657" : "none"} />
              </button>
              <button
                onClick={() => run(() => onToggleReaction("dislike"))}
                className="flex items-center justify-center size-[26px] rounded-[6px] border transition-colors cursor-pointer"
                style={reaction === "dislike" ? { borderColor: "#dc2626", backgroundColor: "#FAEBEB", color: "#dc2626" } : { borderColor: "#E2E6E9", color: "#666666" }}
              >
                <ThumbsDown size={12} fill={reaction === "dislike" ? "#dc2626" : "none"} />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Per-column header filter — a small funnel icon that opens a searchable checkbox list of that column's
// unique values. Options are only computed when opened (cheap for small tables, avoids doing it per column
// on every render). Uses the same fixed-position + portal pattern as the tooltip, for the same reason: a
// dropdown anchored inside a sticky header cell would get clipped/overlapped by the scroll container.
function NewOverviewColumnFilterButton({
  colKey,
  getOptions,
  selected,
  onToggle,
  onClear,
}: {
  colKey: string;
  getOptions: (key: string) => [string, number][];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [search, setSearch] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleOpen = () => {
    if (!open) {
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) setPos({ top: rect.bottom + 6, left: rect.left });
      setSearch("");
    }
    setOpen((v) => !v);
  };

  const options = open ? getOptions(colKey) : [];
  const q = search.toLowerCase();
  const visible = q ? options.filter(([v]) => v.toLowerCase().includes(q)) : options;

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
        className="flex items-center justify-center size-[20px] rounded-[4px] transition-colors cursor-pointer"
        style={selected.size > 0 ? { backgroundColor: NEW_OVERVIEW_NAVY, color: "white" } : { color: "#97999B" }}
      >
        <Filter size={11} />
      </button>
      {open && pos && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[100] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg w-[220px] py-1.5"
          style={{ top: pos.top, left: pos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 pb-1.5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="w-full h-[30px] px-2.5 rounded-[6px] border border-[#E2E6E9] text-[12px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {visible.length === 0 ? (
              <p className="px-3 py-3 text-[11.5px] text-[#97999B] text-center">No matches</p>
            ) : (
              visible.map(([value, count]) => {
                const checked = selected.has(value);
                return (
                  <button
                    key={value}
                    onClick={() => onToggle(value)}
                    className="w-full flex items-center justify-between gap-2 text-left px-3 py-1.5 text-[12px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={`flex items-center justify-center size-[13px] rounded-[4px] border shrink-0 ${checked ? "border-transparent" : "border-[#D9D9D6]"}`}
                        style={checked ? { backgroundColor: NEW_OVERVIEW_NAVY } : undefined}
                      >
                        {checked && <Check size={9} className="text-white" strokeWidth={3} />}
                      </span>
                      <span className="truncate text-[#4D4D4D]">{value}</span>
                    </span>
                    <span className="shrink-0 text-[10.5px] text-[#97999B]">{count}</span>
                  </button>
                );
              })
            )}
          </div>
          {selected.size > 0 && (
            <button
              onClick={onClear}
              className="w-full text-left px-3 pt-1.5 pb-1 text-[11px] font-medium text-[#97999B] hover:text-[#4D4D4D] cursor-pointer border-t border-[#E2E6E9] mt-1 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

function NewOverviewTable({
  rows,
  expandedIds,
  onToggleExpand,
  onOpenRow,
  additionalColumns,
  columnFilters,
  columnFilterOptions,
  onToggleColumnFilterValue,
  onClearColumnFilter,
  rowDensity,
  reactions,
  reviews,
  onToggleReaction,
  onAddComment,
}: {
  rows: Email[];
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onOpenRow: (id: string) => void;
  additionalColumns: string[];
  columnFilters: Record<string, Set<string>>;
  columnFilterOptions: (key: string) => [string, number][];
  onToggleColumnFilterValue: (key: string, value: string) => void;
  onClearColumnFilter: (key: string) => void;
  rowDensity: "small" | "medium" | "large";
  reactions: Record<string, "like" | "dislike" | undefined>;
  reviews: Record<string, NewOverviewReviewEntry[]>;
  onToggleReaction: (id: string, reaction: "like" | "dislike") => void;
  onAddComment: (id: string, text: string) => void;
}) {
  const subjectPadY = rowDensity === "small" ? "py-1" : rowDensity === "medium" ? "py-1.5" : "py-2";
  const childSubjectPadY = rowDensity === "small" ? "py-0.5" : rowDensity === "medium" ? "py-1" : "py-1.5";
  const [assignModalRow, setAssignModalRow] = useState<Email | null>(null);
  const [sendEmailModalRow, setSendEmailModalRow] = useState<Email | null>(null);
  const [commentModalRow, setCommentModalRow] = useState<Email | null>(null);
  const [reviewsModalRow, setReviewsModalRow] = useState<Email | null>(null);
  const colCount = additionalColumns.length + 3; // chevron + subject + action, minus the +1 below for the no-results colspan

  return (
    <>
    <div className="h-full overflow-auto">
      <table className="w-full min-w-[980px] border-separate border-spacing-0">
        <thead>
          <tr className="bg-[#F7F7F7]">
            <th className="sticky top-0 left-0 z-30 bg-[#F7F7F7] w-[40px] h-[42px] border-b border-[#DEDEDE]" />
            <th className="sticky top-0 left-[40px] z-30 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE] shadow-[4px_0_6px_-4px_rgba(0,0,0,0.15)]">
              <span className="text-[12px] font-semibold text-[#4D4D4D]">From/Subject</span>
            </th>
            {additionalColumns.map((key) => (
              <th key={key} className="sticky top-0 z-20 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-semibold text-[#4D4D4D]">{NEW_OVERVIEW_ADDITIONAL_COLUMN_LABELS[key]}</span>
                  <NewOverviewColumnFilterButton
                    colKey={key}
                    getOptions={columnFilterOptions}
                    selected={columnFilters[key] ?? EMPTY_SET}
                    onToggle={(v) => onToggleColumnFilterValue(key, v)}
                    onClear={() => onClearColumnFilter(key)}
                  />
                </div>
              </th>
            ))}
            <th className="sticky top-0 right-0 z-30 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE] shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)]">
              <span className="text-[12px] font-semibold text-[#4D4D4D]">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={colCount + 1} className="text-center py-16 text-[#97999B] text-[14px]">No emails match your filters</td></tr>
          ) : rows.flatMap((row, idx) => {
            const linked = row.linkedCccs ?? [];
            const hasChildren = linked.length > 0;
            const expanded = expandedIds.has(row.id);

            const parentRow = (
              <tr key={row.id} onClick={() => onOpenRow(row.rootEmailId ?? row.id)} className="group hover:bg-[#EEF2F7] cursor-pointer transition-colors">
                <td className="sticky left-0 z-10 bg-white group-hover:bg-[#EEF2F7] border-b border-[#DEDEDE] p-0 transition-colors">
                  {hasChildren && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleExpand(row.id); }}
                      title={expanded ? "Collapse" : "Expand"}
                      className="group/expand flex items-center justify-center w-[40px] h-full min-h-[44px] cursor-pointer text-[#4D4D4D]"
                    >
                      <span className="flex items-center justify-center size-[26px] rounded-[8px] group-hover/expand:bg-[#DCE4EE] transition-colors">
                        <ChevronRight size={16} strokeWidth={2.5} className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
                      </span>
                    </button>
                  )}
                </td>
                <td className={`sticky left-[40px] z-10 bg-white group-hover:bg-[#EEF2F7] px-4 ${subjectPadY} max-w-[260px] border-b border-[#DEDEDE] shadow-[4px_0_6px_-4px_rgba(0,0,0,0.15)] transition-colors`}>
                  <NewOverviewSubjectCell entity={row} density={rowDensity} />
                </td>
                {additionalColumns.map((key) => (
                  <td key={key} className={`px-4 ${subjectPadY} border-b border-[#DEDEDE]`}>{renderNewOverviewColumnCell(key, row, reviews, () => setReviewsModalRow(row))}</td>
                ))}
                <td className={`sticky right-0 z-10 bg-white group-hover:bg-[#EEF2F7] px-4 ${subjectPadY} border-b border-[#DEDEDE] shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)] transition-colors`}>
                  <NewOverviewActionCell
                    entity={row}
                    reaction={reactions[row.id]}
                    onToggleReaction={(r) => onToggleReaction(row.id, r)}
                    onAssign={() => setAssignModalRow(row)}
                    onSendEmail={() => setSendEmailModalRow(row)}
                    onComment={() => setCommentModalRow(row)}
                  />
                </td>
              </tr>
            );

            if (!hasChildren || !expanded) return [parentRow];

            const childRows = linked.map((ccc) => (
              <tr key={`${row.id}::${ccc.id}`} onClick={() => onOpenRow(row.id)} className="group bg-[#F7F7F7] hover:bg-[#E2E6E9] cursor-pointer transition-colors">
                <td className="sticky left-0 z-10 bg-[#F7F7F7] group-hover:bg-[#E2E6E9] px-2 border-b border-[#DEDEDE] transition-colors">
                  <div className="flex items-center justify-center size-[18px] text-[#97999B]">
                    <CornerDownRight size={12} />
                  </div>
                </td>
                <td className={`sticky left-[40px] z-10 bg-[#F7F7F7] group-hover:bg-[#E2E6E9] px-4 ${childSubjectPadY} pl-8 max-w-[260px] border-b border-[#DEDEDE] shadow-[4px_0_6px_-4px_rgba(0,0,0,0.15)] transition-colors`}>
                  <NewOverviewSubjectCell entity={ccc} density={rowDensity} />
                </td>
                {additionalColumns.map((key) => (
                  <td key={key} className={`px-4 ${childSubjectPadY} border-b border-[#DEDEDE]`}>{renderNewOverviewColumnCell(key, ccc, reviews, () => setReviewsModalRow(ccc))}</td>
                ))}
                <td className={`sticky right-0 z-10 bg-[#F7F7F7] group-hover:bg-[#E2E6E9] px-4 ${childSubjectPadY} border-b border-[#DEDEDE] shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)] transition-colors`}>
                  <NewOverviewActionCell
                    entity={ccc}
                    reaction={reactions[ccc.id]}
                    onToggleReaction={(r) => onToggleReaction(ccc.id, r)}
                    onAssign={() => setAssignModalRow(ccc)}
                    onSendEmail={() => setSendEmailModalRow(ccc)}
                    onComment={() => setCommentModalRow(ccc)}
                  />
                </td>
              </tr>
            ));

            return [parentRow, ...childRows];
          })}
        </tbody>
      </table>
    </div>
    {assignModalRow && (
      <NewOverviewAssignModal email={assignModalRow} onClose={() => setAssignModalRow(null)} />
    )}
    {sendEmailModalRow && (
      <NewOverviewSendEmailModal email={sendEmailModalRow} onClose={() => setSendEmailModalRow(null)} />
    )}
    {commentModalRow && (
      <NewOverviewCommentModal
        email={commentModalRow}
        onClose={() => setCommentModalRow(null)}
        onSubmit={(text, entity) => {
          onAddComment(entity.id, text);
          toast.success(`Comment added to ${entity.id}`);
          setCommentModalRow(null);
        }}
      />
    )}
    {reviewsModalRow && (
      <NewOverviewReviewsModal
        email={reviewsModalRow}
        entries={reviews[reviewsModalRow.id] ?? []}
        onClose={() => setReviewsModalRow(null)}
      />
    )}
    </>
  );
}

// Custom email view — sidebar list (with the same simple one-level CCC nesting) + a detail panel matching the
// reference: avatar, sender/timestamp, Assigned To pill, subject, body, attachments, and an "earlier in this
// thread" preview pulled from the selected email's linked CCC(s).
function NewOverviewListView({ rows, selectedId, selected, onSelect, expandedIds, onToggleExpand, onOpenWorkflow }: {
  rows: Email[];
  selectedId: string;
  selected: Email;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onOpenWorkflow: (id: string) => void;
}) {
  const earlier = (selected.linkedCccs ?? []).flatMap((c) => c.replies ?? []).slice(0, 3);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  return (
    <>
    <div className="h-full flex min-h-0">
      {/* Sidebar list */}
      <div className="w-[340px] shrink-0 border-r border-[#DEDEDE] overflow-y-auto">
        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16 px-6">
            <p className="text-[13px] text-[#97999B] text-center">No emails match your filters</p>
          </div>
        )}
        {rows.map((row) => {
          const linked = row.linkedCccs ?? [];
          const hasChildren = linked.length > 0;
          const expanded = expandedIds.has(row.id);
          const isActive = row.id === selectedId;
          return (
            <div key={row.id} className={`border-b border-[#DEDEDE] ${isActive ? "bg-[#30578D]/10" : ""}`}>
              <div onClick={() => onSelect(row.id)} className="px-4 py-3 cursor-pointer hover:bg-[#F7F7F7] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12.5px] font-semibold truncate" style={{ color: NEW_OVERVIEW_NAVY }}>{row.id}</p>
                  <p className="text-[10.5px] text-[#97999B] shrink-0">{row.received}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                  <p className="text-[12.5px] font-medium text-[#4D4D4D] truncate">{row.sender}</p>
                  {(row.attachments?.length ?? 0) > 0 && <Paperclip size={11} className="text-[#97999B] shrink-0" />}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-[12px] text-[#97999B] truncate">{row.subject}</p>
                  {hasChildren && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleExpand(row.id); }}
                      className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors"
                    >
                      <ChevronRight size={13} className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
                    </button>
                  )}
                </div>
              </div>
              {expanded && linked.map((ccc) => (
                <div
                  key={ccc.id}
                  onClick={() => onSelect(row.id)}
                  className="pl-8 pr-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-[#E2E6E9] border-t border-[#E2E6E9] bg-[#F7F7F7] transition-colors"
                >
                  <CornerDownRight size={11} className="text-[#97999B] shrink-0" />
                  <p className="text-[11.5px] font-medium text-[#4D4D4D] truncate shrink-0">{ccc.cccId}</p>
                  <p className="text-[11px] text-[#97999B] truncate">{ccc.cccRequestSubtype}</p>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Detail panel — fixed-height column: content scrolls, Open Workflow stays pinned to the bottom */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <NewOverviewAvatar email={selected} />
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#262626] truncate">{selected.sender}</p>
                <p className="text-[12px] text-[#97999B]">{selected.received}</p>
              </div>
            </div>
            <button
              onClick={() => setAssignModalOpen(true)}
              className="shrink-0 flex items-center gap-1.5 text-white text-[12.5px] font-semibold pl-3 pr-2.5 py-2 rounded-full hover:opacity-90 transition-opacity cursor-pointer"
              style={{ backgroundColor: NEW_OVERVIEW_NAVY }}
            >
              <UserPlus size={13} />
              {selected.assignedTo ?? "Unassigned"}
              <ChevronDown size={12} />
            </button>
          </div>

          <h1 className="text-[19px] font-bold text-[#262626] mb-4">{selected.subject}</h1>
          <p className="text-[14px] text-[#4D4D4D] leading-[1.7] mb-6">{selected.body ?? "No content preview available."}</p>

          {(selected.attachments?.length ?? 0) > 0 && (
            <div className="mb-6">
              <p className="text-[12px] font-semibold text-[#4D4D4D] mb-2">Attachments ({selected.attachments!.length})</p>
              <div className="flex flex-wrap gap-3">
                {selected.attachments!.map((a) => (
                  <button
                    key={a.name}
                    onClick={() => toast.info(`Opening ${a.name}`)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] border border-[#E2E6E9] hover:bg-[#F7F7F7] transition-colors cursor-pointer text-left"
                  >
                    <div className="size-[30px] rounded-[8px] bg-[#f1f2f4] flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-[#666666]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-[#262626] truncate max-w-[160px]">{a.name}</p>
                      <p className="text-[11px] text-[#97999B]">{a.size}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {earlier.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-[#4D4D4D] mb-2">Earlier in this thread</p>
              <div className="space-y-2">
                {earlier.map((msg) => (
                  <div key={msg.id} className="flex items-center justify-between gap-3 bg-[#F7F7F7] rounded-[8px] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-[#4D4D4D] truncate">{msg.sender}</p>
                      <p className="text-[11.5px] text-[#97999B] truncate">{msg.subject}</p>
                    </div>
                    <p className="text-[11px] text-[#97999B] shrink-0">{msg.received}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-[#DEDEDE] flex justify-end">
          <button
            onClick={() => onOpenWorkflow(selected.id)}
            className="px-5 py-2.5 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: NEW_OVERVIEW_NAVY }}
          >
            Open Workflow →
          </button>
        </div>
      </div>
    </div>
    {assignModalOpen && (
      <NewOverviewAssignModal email={selected} onClose={() => setAssignModalOpen(false)} />
    )}
    </>
  );
}

export function NewOverviewPage({ onLogout, onViewAllNotifications, onNavigateHome, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateNewOverview, onNavigateWorkflow, onNavigateHoldManagementOverview, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateEmailTemplate, onNavigateReview }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateWorkflow: (emailId: string) => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateReview?: () => void;
}) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [rowDensity, setRowDensity] = useState<"small" | "medium" | "large">("large");
  const [emailScope, setEmailScope] = useState<"mine" | "all">("mine");
  const [selectedId, setSelectedId] = useState(ALL_EMAILS_WITH_CCC[0].id);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingSearchQuery, setPendingSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const applySearch = () => { setSearchQuery(pendingSearchQuery); setPage(1); };
  const clearSearch = () => { setPendingSearchQuery(""); setSearchQuery(""); setPage(1); };
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current?.contains(target)) return;
      if (!searchQuery.trim()) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen, searchQuery]);
  const [kpisExpanded, setKpisExpanded] = useState(true);
  const rowsPerPage = 10;

  // Reactions/reviews live here (not in the table) because the "Reviewed By" column's value — used for
  // both rendering and column filtering — has to be computed at this level, same as every other column.
  const [reactions, setReactions] = useState<Record<string, "like" | "dislike" | undefined>>({});
  const [reviews, setReviews] = useState<Record<string, NewOverviewReviewEntry[]>>({});
  const toggleReaction = (id: string, reaction: "like" | "dislike") => {
    setReactions((prev) => {
      const isUndo = prev[id] === reaction;
      setReviews((prevReviews) => {
        const withoutMine = (prevReviews[id] ?? []).filter(
          (r) => !(r.user === NEW_OVERVIEW_CURRENT_USER.name && (r.type === "like" || r.type === "dislike"))
        );
        const nextEntries = isUndo
          ? withoutMine
          : [...withoutMine, { user: NEW_OVERVIEW_CURRENT_USER.name, initials: NEW_OVERVIEW_CURRENT_USER.initials, type: reaction, at: new Date() }];
        return { ...prevReviews, [id]: nextEntries };
      });
      return { ...prev, [id]: isUndo ? undefined : reaction };
    });
  };
  const addComment = (id: string, text: string) => {
    setReviews((prev) => ({
      ...prev,
      [id]: [
        ...(prev[id] ?? []),
        { user: NEW_OVERVIEW_CURRENT_USER.name, initials: NEW_OVERVIEW_CURRENT_USER.initials, type: "comment", comment: text, at: new Date() },
      ],
    }));
  };

  // Mailboxes — multi-select, staged behind its own Apply (mirrors Classification/Interval below).
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const [appliedMailboxes, setAppliedMailboxes] = useState<string[]>(NEW_OVERVIEW_MAILBOXES);
  const [pendingMailboxes, setPendingMailboxes] = useState<string[]>(NEW_OVERVIEW_MAILBOXES);
  const mailboxesDirty = pendingMailboxes.slice().sort().join("|") !== appliedMailboxes.slice().sort().join("|");
  const allMailboxesSelected = pendingMailboxes.length === NEW_OVERVIEW_MAILBOXES.length;
  const someMailboxesSelected = pendingMailboxes.length > 0 && !allMailboxesSelected;
  const toggleMailbox = (m: string) =>
    setPendingMailboxes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  const toggleAllMailboxes = () => setPendingMailboxes(allMailboxesSelected ? [] : [...NEW_OVERVIEW_MAILBOXES]);
  const applyMailboxes = () => {
    setAppliedMailboxes(pendingMailboxes);
    setMailboxOpen(false);
    setPage(1);
  };

  // Classification + Interval are "staged" — picks in their popovers don't take effect until Apply is
  // clicked, so multiple picks across both can be committed together in one go.
  const [classificationOpen, setClassificationOpen] = useState(false);
  const [appliedClassifications, setAppliedClassifications] = useState<string[]>([]);
  const [pendingClassifications, setPendingClassifications] = useState<string[]>([]);
  const [toolbarIntervalOpen, setToolbarIntervalOpen] = useState(false);
  const [appliedToolbarInterval, setAppliedToolbarInterval] = useState<string | null>(null);
  const [pendingToolbarInterval, setPendingToolbarInterval] = useState<string | null>(null);
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");
  const [pendingCustomStart, setPendingCustomStart] = useState("");
  const [pendingCustomEnd, setPendingCustomEnd] = useState("");

  const classificationDirty = pendingClassifications.slice().sort().join("|") !== appliedClassifications.slice().sort().join("|");
  const intervalDirty =
    pendingToolbarInterval !== appliedToolbarInterval ||
    (pendingToolbarInterval === "Custom" && (pendingCustomStart !== appliedCustomStart || pendingCustomEnd !== appliedCustomEnd));
  const filtersAreDirty = classificationDirty || intervalDirty;
  const allClassificationsSelected = pendingClassifications.length === CLASSIFICATIONS.length;
  const someClassificationsSelected = pendingClassifications.length > 0 && !allClassificationsSelected;
  const toggleAllClassifications = () => setPendingClassifications(allClassificationsSelected ? [] : [...CLASSIFICATIONS]);

  const formatShortDate = (d: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
  const intervalLabel =
    pendingToolbarInterval === "Custom" && pendingCustomStart && pendingCustomEnd
      ? `${formatShortDate(pendingCustomStart)} – ${formatShortDate(pendingCustomEnd)}`
      : pendingToolbarInterval ?? "Interval";

  const applyToolbarFilters = () => {
    setAppliedClassifications(pendingClassifications);
    setAppliedToolbarInterval(pendingToolbarInterval);
    setAppliedCustomStart(pendingCustomStart);
    setAppliedCustomEnd(pendingCustomEnd);
    setClassificationOpen(false);
    setToolbarIntervalOpen(false);
    setPage(1);
  };
  const resetToolbarFilters = () => {
    setPendingClassifications(appliedClassifications);
    setPendingToolbarInterval(appliedToolbarInterval);
    setPendingCustomStart(appliedCustomStart);
    setPendingCustomEnd(appliedCustomEnd);
  };

  // Close the toolbar dropdowns on outside click via a mousedown listener (rather than a full-screen
  // backdrop div) so the click itself still reaches whatever it landed on — e.g. the Apply button, which
  // sits outside the dropdown panel. A backdrop would swallow that first click to just close the dropdown,
  // requiring a second click to actually apply.
  const mailboxRef = useRef<HTMLDivElement>(null);
  const classificationRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mailboxOpen && !classificationOpen && !toolbarIntervalOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (mailboxOpen && !mailboxRef.current?.contains(target)) setMailboxOpen(false);
      if (classificationOpen && !classificationRef.current?.contains(target)) setClassificationOpen(false);
      if (toolbarIntervalOpen && !intervalRef.current?.contains(target)) setToolbarIntervalOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mailboxOpen, classificationOpen, toolbarIntervalOpen]);

  // Filter panel — a slide-in accordion (mirrors Overview V1's layout, plus Column Mgmt's Save/Cancel staging).
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedFilterSection, setExpandedFilterSection] = useState<string | null>(NEW_OVERVIEW_FILTER_SECTIONS[0].key);
  const [checkedFilters, setCheckedFilters] = useState<Record<string, Set<string>>>({});
  const [pendingCheckedFilters, setPendingCheckedFilters] = useState<Record<string, Set<string>>>({});
  const [filterSectionSearch, setFilterSectionSearch] = useState<Record<string, string>>({});
  const activeFilterCount = Object.values(checkedFilters).reduce((sum, set) => sum + set.size, 0);
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const toggleFilterItem = (sectionKey: string, value: string) => {
    setPendingCheckedFilters((prev) => {
      const next = { ...prev };
      const set = new Set(next[sectionKey] ?? []);
      if (set.has(value)) set.delete(value); else set.add(value);
      next[sectionKey] = set;
      return next;
    });
  };

  // Column Mgmt panel — slide-in with "Additional Columns" (categorized checklist) and "Sort Columns"
  // (drag-reorder, enabled columns only) tabs, plus Save/Cancel staging.
  const [colMgmtOpen, setColMgmtOpen] = useState(false);
  const [activeColTab, setActiveColTab] = useState<"additional" | "sort">("additional");
  const [expandedColCategory, setExpandedColCategory] = useState<string | null>(NEW_OVERVIEW_COLUMN_CATEGORIES[0].label);
  const [colOrder, setColOrder] = useState<string[]>(NEW_OVERVIEW_DEFAULT_TOGGLEABLE_COLUMNS);
  const [tempColOrder, setTempColOrder] = useState<string[]>(colOrder);
  const [dragColIdx, setDragColIdx] = useState<number | null>(null);
  const [dragOverColIdx, setDragOverColIdx] = useState<number | null>(null);
  const toggleAdditionalCol = (key: string) => {
    setTempColOrder((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const isInternal = (e: Email) => e.sender.endsWith("@intellisight.io");
  const allRows = ALL_EMAILS_WITH_CCC;

  const filterSectionOptions = NEW_OVERVIEW_FILTER_SECTIONS.map((sec) => ({
    ...sec,
    options: allRows.reduce((acc, r) => {
      const val = sec.getValue(r);
      acc[val] = (acc[val] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  }));

  // Column-level filters — a checkbox filter per column header, keyed by column key. Options + counts are
  // computed from allRows so the list stays stable regardless of what's currently filtered/paginated.
  const columnFilterOptions = (key: string): [string, number][] => {
    const counts: Record<string, number> = {};
    for (const r of allRows) {
      const v = getNewOverviewColumnValue(key, r, reviews);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };
  const toggleColumnFilterValue = (key: string, value: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      const set = new Set(next[key] ?? []);
      if (set.has(value)) set.delete(value); else set.add(value);
      next[key] = set;
      return next;
    });
    setPage(1);
  };
  const clearColumnFilter = (key: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPage(1);
  };

  const rows = allRows.filter((r) => {
    if (emailScope === "mine" && r.assignedTo !== NEW_OVERVIEW_CURRENT_USER.name) return false;
    if (searchQuery.trim() && !`${r.subject} ${r.sender} ${r.classification ?? ""}`.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    if (appliedClassifications.length > 0 && !appliedClassifications.includes(r.classification ?? "")) return false;
    const matchPanel = NEW_OVERVIEW_FILTER_SECTIONS.every((sec) => {
      const sel = checkedFilters[sec.key];
      if (!sel || sel.size === 0) return true;
      return sel.has(sec.getValue(r));
    });
    if (!matchPanel) return false;
    const matchColumns = Object.entries(columnFilters).every(([key, set]) => {
      if (!set || set.size === 0) return true;
      return set.has(getNewOverviewColumnValue(key, r, reviews));
    });
    if (!matchColumns) return false;
    return true;
  });

  const selected = allRows.find((r) => r.id === selectedId) ?? allRows[0];
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const pageRows = rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const paginationPages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const kpis = [
    { label: "Total Mails", value: allRows.length, icon: Mail, accent: "#30578D" },
    { label: "Internal Mails", value: allRows.filter(isInternal).length, icon: Building2, accent: "#387D85" },
    { label: "External Mails", value: allRows.filter((r) => !isInternal(r)).length, icon: Globe, accent: "#823E81" },
  ];

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
          />
        </div>

        <main className="flex-1 min-h-0 flex flex-col w-full max-w-[1600px] mx-auto px-5 py-5 gap-4 overflow-hidden">

          {/* Page header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-5 flex-wrap">
              <div>
                <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Overview</h1>
                <p className="text-[12px] text-[#97999B] mt-0.5">Monday, 6 July 2026</p>
              </div>

              <div className="relative" ref={mailboxRef}>
                <button
                  onClick={() => setMailboxOpen((v) => !v)}
                  className="relative flex items-center gap-2 px-3.5 py-2 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] font-semibold text-[#262626] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                >
                  <Inbox size={14} className="text-[#666666]" />
                  Mailboxes
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10.5px] font-bold" style={{ backgroundColor: NEW_OVERVIEW_NAVY }}>
                    {appliedMailboxes.length}
                  </span>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${mailboxOpen ? "rotate-180" : ""}`} />
                  {mailboxesDirty && <span className="absolute -top-[3px] -right-[3px] size-[8px] rounded-full bg-[#E67919] ring-2 ring-white" />}
                </button>
                {mailboxOpen && (
                  <>
                    <div className="absolute top-full left-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 w-[260px] flex flex-col">
                      <button
                        onClick={toggleAllMailboxes}
                        className="w-full flex items-center gap-2.5 text-left px-3.5 py-2.5 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors border-b border-[#E2E6E9]"
                      >
                        <span
                          className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${allMailboxesSelected || someMailboxesSelected ? "border-transparent" : "border-[#D9D9D6]"}`}
                          style={allMailboxesSelected || someMailboxesSelected ? { backgroundColor: NEW_OVERVIEW_NAVY } : undefined}
                        >
                          {allMailboxesSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                          {someMailboxesSelected && <span className="w-[7px] h-[2px] bg-white rounded-full" />}
                        </span>
                        <span className="font-semibold text-[#262626]">Select all</span>
                      </button>
                      <div className="max-h-[240px] overflow-y-auto py-1">
                        {NEW_OVERVIEW_MAILBOXES.map((m) => {
                          const checked = pendingMailboxes.includes(m);
                          return (
                            <button
                              key={m}
                              onClick={() => toggleMailbox(m)}
                              className="w-full flex items-center gap-2.5 text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                            >
                              <span
                                className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${checked ? "border-transparent" : "border-[#D9D9D6]"}`}
                                style={checked ? { backgroundColor: NEW_OVERVIEW_NAVY } : undefined}
                              >
                                {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                              </span>
                              <span className={`truncate ${checked ? "text-[#262626] font-medium" : "text-[#4D4D4D]"}`}>{m}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-t border-[#E2E6E9]">
                        <button
                          onClick={() => setPendingMailboxes([])}
                          className="text-[11.5px] font-medium text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors"
                        >
                          Clear selection
                        </button>
                        <button
                          onClick={applyMailboxes}
                          className="h-[32px] px-4 rounded-[8px] text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                          style={{ backgroundColor: NEW_OVERVIEW_NAVY }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-[12px] text-[#4D4D4D]">
                <span className="size-[7px] rounded-full bg-[#468657]" />
                Last synced 10:45 AM
              </span>
              <button
                onClick={() => setKpisExpanded((v) => !v)}
                title={kpisExpanded ? "Collapse KPIs" : "Expand KPIs"}
                className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
              >
                {kpisExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </div>

          {/* KPI strip */}
          {kpisExpanded && (
          <div className="flex flex-wrap gap-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="relative overflow-hidden flex-1 min-w-[240px] rounded-[8px] border border-[#E2E6E9] p-5 flex items-center gap-4"
                style={{ background: `linear-gradient(135deg, ${kpi.accent}10, #ffffff 65%)` }}
              >
                <div className="size-[46px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${kpi.accent}1A` }}>
                  <kpi.icon size={21} style={{ color: kpi.accent }} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide truncate">{kpi.label}</p>
                  <p className="text-[30px] font-bold text-[#262626] leading-none">{kpi.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Content card: toolbar + table/list */}
          <div className="flex-1 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col min-h-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
              {/* My Tasks / All Mails — scopes the table to the current user's assigned queue vs everyone's */}
              <div className="flex items-center gap-[3px] p-[3px] bg-[#F1F2F4] border border-[#E2E6E9] rounded-[8px] h-[36px] shrink-0">
                <button
                  onClick={() => { setEmailScope("mine"); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 h-full rounded-[6px] text-[12.5px] font-semibold transition-all cursor-pointer whitespace-nowrap ${emailScope === "mine" ? "bg-white shadow-sm" : "text-[#666666] hover:text-[#4D4D4D]"}`}
                  style={emailScope === "mine" ? { color: NEW_OVERVIEW_NAVY } : undefined}
                >
                  <User size={13} />
                  My Tasks
                </button>
                <button
                  onClick={() => { setEmailScope("all"); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 h-full rounded-[6px] text-[12.5px] font-semibold transition-all cursor-pointer whitespace-nowrap ${emailScope === "all" ? "bg-white shadow-sm" : "text-[#666666] hover:text-[#4D4D4D]"}`}
                  style={emailScope === "all" ? { color: NEW_OVERVIEW_NAVY } : undefined}
                >
                  <Users size={13} />
                  All Mails
                </button>
              </div>

              <div className="relative shrink-0" ref={searchRef}>
                {searchOpen ? (
                  <div className="flex items-center gap-1.5 h-[36px] pl-[10px] pr-[8px] rounded-[8px] border border-[#30578D] bg-white w-[240px]">
                    <button
                      onClick={applySearch}
                      aria-label="Run search"
                      className="shrink-0 text-[#666666] hover:text-[#30578D] cursor-pointer transition-colors"
                    >
                      <Search size={14} />
                    </button>
                    <input
                      autoFocus
                      value={pendingSearchQuery}
                      onChange={(e) => setPendingSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applySearch();
                        if (e.key === "Escape") { clearSearch(); setSearchOpen(false); }
                      }}
                      placeholder="Search Email"
                      className="flex-1 min-w-0 h-full text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none bg-transparent"
                    />
                    {pendingSearchQuery && (
                      <button
                        onClick={clearSearch}
                        aria-label="Clear search"
                        className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search"
                    className="relative flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                  >
                    <Search size={14} />
                    {searchQuery && <span className="absolute -top-[3px] -right-[3px] size-[8px] rounded-full bg-[#E67919] ring-2 ring-white" />}
                  </button>
                )}
              </div>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Classification — multi-select, staged behind Apply */}
                <div className="relative" ref={classificationRef}>
                  <button
                    onClick={() => setClassificationOpen((v) => !v)}
                    className={`relative flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${classificationOpen ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7]"}`}
                  >
                    Classification
                    {appliedClassifications.length > 0 && (
                      <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: NEW_OVERVIEW_NAVY }}>
                        {appliedClassifications.length}
                      </span>
                    )}
                    <ChevronDown size={13} className={`transition-transform duration-200 ${classificationOpen ? "rotate-180" : ""}`} />
                    {classificationDirty && <span className="absolute -top-[3px] -right-[3px] size-[8px] rounded-full bg-[#E67919] ring-2 ring-white" />}
                  </button>
                  {classificationOpen && (
                    <>
                      <div className="absolute top-full left-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 w-[220px] py-1.5">
                        <button
                          onClick={toggleAllClassifications}
                          className="w-full flex items-center gap-2.5 text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors border-b border-[#E2E6E9] mb-1"
                        >
                          <span
                            className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${allClassificationsSelected || someClassificationsSelected ? "border-transparent" : "border-[#D9D9D6]"}`}
                            style={allClassificationsSelected || someClassificationsSelected ? { backgroundColor: NEW_OVERVIEW_NAVY } : undefined}
                          >
                            {allClassificationsSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                            {someClassificationsSelected && <span className="w-[7px] h-[2px] bg-white rounded-full" />}
                          </span>
                          <span className="font-semibold text-[#262626]">Select all</span>
                        </button>
                        {CLASSIFICATIONS.map((c) => {
                          const checked = pendingClassifications.includes(c);
                          return (
                            <button
                              key={c}
                              onClick={() => setPendingClassifications((prev) => (checked ? prev.filter((x) => x !== c) : [...prev, c]))}
                              className="w-full flex items-center gap-2.5 text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                            >
                              <span
                                className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${checked ? "border-transparent" : "border-[#D9D9D6]"}`}
                                style={checked ? { backgroundColor: NEW_OVERVIEW_NAVY } : undefined}
                              >
                                {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                              </span>
                              <span className={checked ? "text-[#262626] font-medium" : "text-[#4D4D4D]"}>{c}</span>
                            </button>
                          );
                        })}
                        {pendingClassifications.length > 0 && (
                          <button
                            onClick={() => setPendingClassifications([])}
                            className="w-full text-left px-3.5 pt-1.5 pb-0.5 text-[11.5px] font-medium text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors"
                          >
                            Clear selection
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Interval — single-select, staged behind Apply */}
                <div className="relative" ref={intervalRef}>
                  <button
                    onClick={() => setToolbarIntervalOpen((v) => !v)}
                    className={`relative flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${toolbarIntervalOpen ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7]"}`}
                  >
                    {intervalLabel}
                    <ChevronDown size={13} className={`transition-transform duration-200 ${toolbarIntervalOpen ? "rotate-180" : ""}`} />
                    {intervalDirty && <span className="absolute -top-[3px] -right-[3px] size-[8px] rounded-full bg-[#E67919] ring-2 ring-white" />}
                  </button>
                  {toolbarIntervalOpen && (
                    <>
                      <div className={`absolute top-full left-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 py-1 ${pendingToolbarInterval === "Custom" ? "w-[260px]" : "w-[150px]"}`}>
                        {NEW_OVERVIEW_INTERVALS.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setPendingToolbarInterval(opt === pendingToolbarInterval ? null : opt)}
                            className="w-full text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                            style={opt === pendingToolbarInterval ? { color: NEW_OVERVIEW_NAVY, fontWeight: 600 } : { color: "#4D4D4D" }}
                          >
                            {opt}
                          </button>
                        ))}
                        {pendingToolbarInterval === "Custom" && (
                          <div className="px-3.5 pt-2.5 pb-1.5 border-t border-[#E2E6E9] mt-1 flex items-end gap-2">
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <label className="text-[10px] font-semibold text-[#97999B] uppercase tracking-wide">Start Date</label>
                              <input
                                type="date"
                                value={pendingCustomStart}
                                max={pendingCustomEnd || undefined}
                                onChange={(e) => setPendingCustomStart(e.target.value)}
                                className="w-full h-[32px] px-2 rounded-[8px] border border-[#E2E6E9] text-[12px] text-[#262626] outline-none focus:border-[#30578D] transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                              />
                            </div>
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <label className="text-[10px] font-semibold text-[#97999B] uppercase tracking-wide">End Date</label>
                              <input
                                type="date"
                                value={pendingCustomEnd}
                                min={pendingCustomStart || undefined}
                                onChange={(e) => setPendingCustomEnd(e.target.value)}
                                className="w-full h-[32px] px-2 rounded-[8px] border border-[#E2E6E9] text-[12px] text-[#262626] outline-none focus:border-[#30578D] transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Apply / Reset — surfaces only once Classification and/or Interval have unapplied changes */}
                {filtersAreDirty && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={resetToolbarFilters}
                      title="Discard changes"
                      className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={applyToolbarFilters}
                      className="h-[36px] px-4 rounded-[8px] text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                      style={{ backgroundColor: NEW_OVERVIEW_NAVY }}
                    >
                      Apply
                    </button>
                  </div>
                )}

                <div className="w-px h-5 bg-[#E2E6E9]" />

                <div className="flex items-center border border-[#E2E6E9] rounded-[8px] overflow-hidden h-[36px]">
                  <button
                    onClick={() => setViewMode("grid")}
                    title="Table view"
                    className={`flex items-center justify-center w-[36px] h-full transition-colors cursor-pointer ${viewMode === "grid" ? "text-white" : "bg-white text-[#666666] hover:bg-[#F7F7F7]"}`}
                    style={viewMode === "grid" ? { backgroundColor: NEW_OVERVIEW_NAVY } : undefined}
                  >
                    <List size={15} />
                  </button>
                  <div className="w-px h-5 bg-[#E2E6E9]" />
                  <button
                    onClick={() => setViewMode("list")}
                    title="Email view"
                    className={`flex items-center justify-center w-[36px] h-full transition-colors cursor-pointer ${viewMode === "list" ? "text-white" : "bg-white text-[#666666] hover:bg-[#F7F7F7]"}`}
                    style={viewMode === "list" ? { backgroundColor: NEW_OVERVIEW_NAVY } : undefined}
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>

                {/* Filter — opens the slide-in Filters panel below */}
                <button
                  onClick={() => {
                    const opening = !filterOpen;
                    setFilterOpen(opening);
                    if (opening) {
                      setPendingCheckedFilters(Object.fromEntries(Object.entries(checkedFilters).map(([k, v]) => [k, new Set(v)])));
                      setColMgmtOpen(false);
                    }
                  }}
                  title="More filters"
                  className={`relative flex items-center justify-center size-[36px] rounded-[8px] border transition-colors cursor-pointer ${filterOpen ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7]"}`}
                >
                  <Filter size={15} />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[15px] h-[15px] px-[3px] rounded-full text-white text-[9px] font-bold" style={{ backgroundColor: NEW_OVERVIEW_NAVY }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Manage columns — opens the slide-in Column Mgmt panel below */}
                <button
                  onClick={() => {
                    const opening = !colMgmtOpen;
                    setColMgmtOpen(opening);
                    if (opening) {
                      setTempColOrder([...colOrder]);
                      setActiveColTab("additional");
                      setFilterOpen(false);
                    }
                  }}
                  title="Manage columns"
                  className={`relative flex items-center justify-center size-[36px] rounded-[8px] border transition-colors cursor-pointer ${colMgmtOpen ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7]"}`}
                >
                  <SlidersHorizontal size={15} />
                  {colOrder.length > 0 && (
                    <span className="absolute -top-1 -right-1 size-[8px] rounded-full ring-2 ring-white" style={{ backgroundColor: NEW_OVERVIEW_NAVY }} />
                  )}
                </button>
              </div>
            </div>

            {/* View body — Filter and Column Mgmt slide-in panels overlay this area only */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className="h-full min-h-0 overflow-hidden">
              {viewMode === "grid" ? (
                <NewOverviewTable
                  rows={pageRows}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpanded}
                  onOpenRow={(id) => onNavigateWorkflow(id)}
                  additionalColumns={colOrder}
                  columnFilters={columnFilters}
                  columnFilterOptions={columnFilterOptions}
                  onToggleColumnFilterValue={toggleColumnFilterValue}
                  onClearColumnFilter={clearColumnFilter}
                  rowDensity={rowDensity}
                  reactions={reactions}
                  reviews={reviews}
                  onToggleReaction={toggleReaction}
                  onAddComment={addComment}
                />
              ) : (
                <NewOverviewListView
                  rows={rows}
                  selectedId={selected.id}
                  onSelect={setSelectedId}
                  selected={selected}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpanded}
                  onOpenWorkflow={onNavigateWorkflow}
                />
              )}
            </div>

            {/* Filter Panel — slide-in accordion, contained between toolbar and pagination */}
            <div className={`absolute top-0 right-0 bottom-0 w-[320px] bg-white border-l border-[#E2E6E9] z-40 flex flex-col transition-transform duration-300 ease-in-out ${filterOpen ? "translate-x-0" : "translate-x-full"}`}>
              <div className="h-[48px] shrink-0 border-b border-[#E2E6E9] flex items-center px-4">
                <p className="flex-1 text-[14px] font-bold text-[#262626]">Filters</p>
                <button onClick={() => { setPendingCheckedFilters(checkedFilters); setFilterOpen(false); }} className="text-[#666666] hover:text-[#262626] cursor-pointer transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filterSectionOptions.map((sec) => {
                  const isOpen = expandedFilterSection === sec.key;
                  const selected = pendingCheckedFilters[sec.key];
                  const selCount = selected?.size ?? 0;
                  const opts = Object.entries(sec.options).sort((a, b) => b[1] - a[1]);
                  const q = (filterSectionSearch[sec.key] ?? "").toLowerCase();
                  const visOpts = q ? opts.filter(([k]) => k.toLowerCase().includes(q)) : opts;
                  const hasSelections = selCount > 0;
                  const allKeys = opts.map(([k]) => k);
                  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected?.has(k));
                  return (
                    <div key={sec.key}>
                      <button
                        onClick={() => setExpandedFilterSection(isOpen ? null : sec.key)}
                        className={`w-full h-[44px] flex items-center px-4 border-b border-[#E2E6E9] cursor-pointer transition-colors ${hasSelections ? "bg-[#30578D]/[0.06]" : "bg-white hover:bg-[#F7F7F7]"}`}
                      >
                        <span className="flex-1 text-left text-[13px] truncate">
                          {hasSelections ? (
                            <>
                              <span style={{ color: NEW_OVERVIEW_NAVY, fontWeight: 600 }}>{sec.label} ({selCount}</span>
                              <span className="text-[#97999B]">/{opts.length})</span>
                            </>
                          ) : (
                            <>
                              <span style={isOpen ? { color: NEW_OVERVIEW_NAVY, fontWeight: 600 } : { color: "#262626" }}>{sec.label}</span>
                              <span className="text-[#97999B]"> ({opts.length})</span>
                            </>
                          )}
                        </span>
                        <ChevronDown size={14} className="shrink-0 transition-transform duration-200" style={{ color: hasSelections || isOpen ? NEW_OVERVIEW_NAVY : "#97999B", transform: isOpen ? "rotate(180deg)" : undefined }} />
                      </button>
                      {isOpen && (
                        <div className="border-b border-[#E2E6E9]">
                          {selCount > 0 && (
                            <div className="flex items-center justify-between px-4 py-2 border-b border-[#E2E6E9]">
                              <span className="flex items-center gap-1.5 bg-[#F1F2F4] px-2 py-1 rounded-full text-[10.5px] font-medium text-[#666666]">
                                {selCount} Selected
                                <button onClick={() => setPendingCheckedFilters((p) => ({ ...p, [sec.key]: new Set() }))} className="cursor-pointer hover:text-[#262626] transition-colors">
                                  <X size={11} />
                                </button>
                              </span>
                              {opts.length - selCount > 0 && <span className="text-[10.5px]" style={{ color: NEW_OVERVIEW_NAVY }}>{opts.length - selCount} More</span>}
                            </div>
                          )}
                          {opts.length > 3 && (
                            <div className="px-4 py-2.5 border-b border-[#E2E6E9]">
                              <input
                                value={filterSectionSearch[sec.key] ?? ""}
                                onChange={(e) => setFilterSectionSearch((p) => ({ ...p, [sec.key]: e.target.value }))}
                                placeholder={`Search ${sec.label.toLowerCase()}...`}
                                className="w-full h-[32px] px-3 rounded-[8px] border border-[#E2E6E9] text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
                              />
                            </div>
                          )}
                          <button
                            onClick={() => setPendingCheckedFilters((p) => ({ ...p, [sec.key]: allSelected ? new Set() : new Set(allKeys) }))}
                            className="w-full flex items-center gap-2.5 text-left px-4 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors border-b border-[#E2E6E9]"
                          >
                            <span
                              className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${allSelected ? "border-transparent" : "border-[#D9D9D6]"}`}
                              style={allSelected ? { backgroundColor: NEW_OVERVIEW_NAVY } : undefined}
                            >
                              {allSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                            </span>
                            <span className="font-semibold text-[#262626]">Select All</span>
                          </button>
                          {visOpts.map(([optVal, count]) => {
                            const checked = selected?.has(optVal) ?? false;
                            return (
                              <button
                                key={optVal}
                                onClick={() => toggleFilterItem(sec.key, optVal)}
                                className={`w-full flex items-center justify-between gap-2 text-left px-4 py-2 text-[12.5px] transition-colors ${checked ? "bg-[#30578D]/[0.06]" : "hover:bg-[#F7F7F7]"}`}
                              >
                                <span className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${checked ? "border-transparent" : "border-[#D9D9D6]"}`}
                                    style={checked ? { backgroundColor: NEW_OVERVIEW_NAVY } : undefined}
                                  >
                                    {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                                  </span>
                                  <span className={`truncate ${checked ? "text-[#262626] font-medium" : "text-[#4D4D4D]"}`}>{optVal}</span>
                                </span>
                                <span className="shrink-0 bg-[#F1F2F4] px-1.5 h-[18px] flex items-center rounded-full text-[10.5px] text-[#666666]">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="shrink-0 border-t border-[#E2E6E9] flex justify-end gap-2 px-4 py-3">
                <button
                  onClick={() => { setPendingCheckedFilters(checkedFilters); setFilterOpen(false); }}
                  className="px-3.5 py-1.5 rounded-[8px] border text-[12.5px] font-medium cursor-pointer transition-colors"
                  style={{ borderColor: NEW_OVERVIEW_NAVY, color: NEW_OVERVIEW_NAVY }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setCheckedFilters(pendingCheckedFilters);
                    setFilterOpen(false);
                    setPage(1);
                    toast.success("Filters applied");
                  }}
                  className="px-3.5 py-1.5 rounded-[8px] text-white text-[12.5px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: NEW_OVERVIEW_NAVY }}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Column Mgmt Panel — slide-in with Additional Columns / Sort Columns tabs, contained between toolbar and pagination */}
            <div className={`absolute top-0 right-0 bottom-0 w-[360px] bg-white border-l border-[#E2E6E9] z-40 flex flex-col transition-transform duration-300 ease-in-out ${colMgmtOpen ? "translate-x-0" : "translate-x-full"}`}>
              <div className="h-[48px] shrink-0 border-b border-[#E2E6E9] flex items-center px-4">
                <p className="flex-1 text-[14px] font-bold text-[#262626]">Column Mgmt</p>
                <button onClick={() => { setTempColOrder([...colOrder]); setColMgmtOpen(false); }} className="text-[#666666] hover:text-[#262626] cursor-pointer transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex shrink-0 border-b border-[#E2E6E9]">
                {(["additional", "sort"] as const).map((tab) => {
                  const labels = { additional: "Additional Columns", sort: "Sort Columns" };
                  const active = activeColTab === tab;
                  return (
                    <button key={tab} onClick={() => setActiveColTab(tab)} className="flex-1 flex flex-col items-center pt-2.5 cursor-pointer transition-colors">
                      <span className="text-[12px] font-medium pb-2 whitespace-nowrap" style={{ color: active ? NEW_OVERVIEW_NAVY : "#666666" }}>{labels[tab]}</span>
                      <div className="h-[2px] w-full" style={{ backgroundColor: active ? NEW_OVERVIEW_NAVY : "transparent" }} />
                    </button>
                  );
                })}
              </div>
              <div className="flex-1 overflow-y-auto">
                {activeColTab === "additional" && NEW_OVERVIEW_COLUMN_CATEGORIES.map((cat) => {
                  const isOpen = expandedColCategory === cat.label;
                  const checkedCount = cat.columns.filter((c) => tempColOrder.includes(c.key)).length;
                  const hasSelections = checkedCount > 0;
                  return (
                    <div key={cat.label}>
                      <button
                        onClick={() => setExpandedColCategory(isOpen ? null : cat.label)}
                        className={`w-full h-[44px] flex items-center px-4 border-b border-[#E2E6E9] cursor-pointer transition-colors ${hasSelections ? "bg-[#30578D]/[0.06]" : "bg-white hover:bg-[#F7F7F7]"}`}
                      >
                        <span className="flex-1 text-left text-[13px] truncate">
                          <span style={hasSelections || isOpen ? { color: NEW_OVERVIEW_NAVY, fontWeight: 600 } : { color: "#262626" }}>{cat.label}</span>
                          <span className="text-[#97999B]"> ({checkedCount}/{cat.columns.length})</span>
                        </span>
                        <ChevronDown size={14} className="shrink-0 transition-transform duration-200" style={{ color: hasSelections || isOpen ? NEW_OVERVIEW_NAVY : "#97999B", transform: isOpen ? "rotate(180deg)" : undefined }} />
                      </button>
                      {isOpen && (
                        <div className="border-b border-[#E2E6E9]">
                          {cat.columns.map((col) => {
                            const checked = tempColOrder.includes(col.key);
                            return (
                              <button
                                key={col.key}
                                onClick={() => toggleAdditionalCol(col.key)}
                                className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                              >
                                <span
                                  className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${checked ? "border-transparent" : "border-[#D9D9D6]"}`}
                                  style={checked ? { backgroundColor: NEW_OVERVIEW_NAVY } : undefined}
                                >
                                  {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                                </span>
                                <span className={checked ? "text-[#262626] font-medium text-[13px]" : "text-[#4D4D4D] text-[13px]"}>{col.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {activeColTab === "sort" && (
                  <div>
                    <div className="px-4 py-2 border-b border-[#E2E6E9] bg-[#30578D]/[0.05]">
                      <p className="text-[11px] text-[#666666]">Drag rows to reorder the enabled columns in the table</p>
                    </div>
                    {tempColOrder.length === 0 ? (
                      <p className="px-4 py-6 text-[12.5px] text-[#97999B] text-center">No additional columns enabled yet — turn some on in the Additional Columns tab.</p>
                    ) : (
                      tempColOrder.map((key, idx) => (
                        <div
                          key={key}
                          draggable
                          onDragStart={() => setDragColIdx(idx)}
                          onDragOver={(e) => { e.preventDefault(); setDragOverColIdx(idx); }}
                          onDrop={() => {
                            if (dragColIdx === null || dragColIdx === idx) return;
                            const next = [...tempColOrder];
                            const [moved] = next.splice(dragColIdx, 1);
                            next.splice(idx, 0, moved);
                            setTempColOrder(next);
                            setDragColIdx(null);
                            setDragOverColIdx(null);
                          }}
                          onDragEnd={() => { setDragColIdx(null); setDragOverColIdx(null); }}
                          className={`flex items-center gap-2.5 px-4 py-2.5 border-b border-[#E2E6E9] cursor-grab active:cursor-grabbing transition-colors ${dragOverColIdx === idx && dragColIdx !== idx ? "bg-[#30578D]/[0.06] border-t-2" : "hover:bg-[#F7F7F7]"}`}
                          style={dragOverColIdx === idx && dragColIdx !== idx ? { borderTopColor: NEW_OVERVIEW_NAVY } : undefined}
                        >
                          <GripVertical size={14} className="text-[#D9D9D6] shrink-0" />
                          <span className="flex-1 text-[13px] text-[#262626]">{NEW_OVERVIEW_ADDITIONAL_COLUMN_LABELS[key]}</span>
                          <span className="text-[11px] text-[#97999B]">{idx + 1}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="shrink-0 border-t border-[#E2E6E9] flex justify-end gap-2 px-4 py-3">
                <button
                  onClick={() => { setTempColOrder([...colOrder]); setColMgmtOpen(false); }}
                  className="px-3.5 py-1.5 rounded-[8px] border text-[12.5px] font-medium cursor-pointer transition-colors"
                  style={{ borderColor: NEW_OVERVIEW_NAVY, color: NEW_OVERVIEW_NAVY }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setColOrder([...tempColOrder]);
                    setColMgmtOpen(false);
                    toast.success("Column settings saved");
                  }}
                  className="px-3.5 py-1.5 rounded-[8px] text-white text-[12.5px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: NEW_OVERVIEW_NAVY }}
                >
                  Save
                </button>
              </div>
            </div>
            </div>

            {/* Pagination — only meaningful for the table view */}
            {viewMode === "grid" && (
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#DEDEDE] shrink-0 flex-wrap">
                <div className="flex items-center gap-3">
                  <p className="text-[12px] text-[#666666] whitespace-nowrap">
                    Displaying {pageRows.length} of {rows.length}
                  </p>
                  <div className="w-px h-5 bg-[#E2E6E9]" />
                  <div className="flex items-center gap-[3px] p-[3px] bg-[#F1F2F4] rounded-[8px] h-[30px]">
                    {(
                      [
                        { key: "small", Icon: Rows4, label: "Compact — ID only" },
                        { key: "medium", Icon: Rows3, label: "Medium — ID + email" },
                        { key: "large", Icon: Rows2, label: "Comfortable — full details" },
                      ] as const
                    ).map((opt) => (
                      <NewOverviewTooltipWrapper key={opt.key} label={opt.label}>
                        <button
                          onClick={() => setRowDensity(opt.key)}
                          className={`flex items-center justify-center w-[30px] h-full rounded-[6px] transition-all cursor-pointer ${
                            rowDensity === opt.key
                              ? "bg-white shadow-sm"
                              : "text-[#8A8D93] hover:bg-white/70 hover:text-[#4D4D4D]"
                          }`}
                          style={rowDensity === opt.key ? { color: NEW_OVERVIEW_NAVY } : undefined}
                        >
                          <opt.Icon size={17} strokeWidth={2.4} />
                        </button>
                      </NewOverviewTooltipWrapper>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-[4px]">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="h-[30px] px-2 rounded-[8px] border border-[#E2E6E9] text-[12px] text-[#666666] disabled:opacity-30 hover:enabled:bg-[#F7F7F7] cursor-pointer transition-colors">«</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="h-[30px] px-2 rounded-[8px] border border-[#E2E6E9] text-[12px] text-[#666666] disabled:opacity-30 hover:enabled:bg-[#F7F7F7] cursor-pointer transition-colors">‹</button>
                {paginationPages().map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="h-[30px] px-2 flex items-center text-[12px] text-[#97999B]">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p as number)}
                      className="h-[30px] min-w-[30px] px-2 rounded-[8px] border text-[12px] cursor-pointer transition-colors"
                      style={page === p ? { backgroundColor: NEW_OVERVIEW_NAVY, borderColor: NEW_OVERVIEW_NAVY, color: "white", fontWeight: 600 } : { borderColor: "#E2E6E9", color: "#666666" }}>
                      {p}
                    </button>
                  )
                )}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="h-[30px] px-2 rounded-[8px] border border-[#E2E6E9] text-[12px] text-[#666666] disabled:opacity-30 hover:enabled:bg-[#F7F7F7] cursor-pointer transition-colors">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  className="h-[30px] px-2 rounded-[8px] border border-[#E2E6E9] text-[12px] text-[#666666] disabled:opacity-30 hover:enabled:bg-[#F7F7F7] cursor-pointer transition-colors">»</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
