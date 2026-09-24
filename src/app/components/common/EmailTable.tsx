import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  CirclePause,
  Copy,
  CornerDownRight,
  FileText,
  Filter,
  History,
  MessageSquare,
  MessageSquareHeart,
  Paperclip,
  Plus,
  Send,
  ThumbsDown,
  ThumbsUp,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { type Email, BUSINESS_GROUPS } from "../../pages/command-center/emailData";
import { AuditTrailModal, getAllAuditEntriesForEmail } from "./AuditTrail";

// Shared table for Email-domain listings: sticky From/Subject + Action columns, per-column filters, row
// density, and the Like/Dislike/Comment "review" system with its own modals — currently used by Command
// Center's Overview page (which also reuses a couple of pieces, like the Avatar and Assign modal, in its
// own alternate "email view" mode). Page-level-only concerns (toolbar, mailboxes, interval, filter panel)
// stay with whichever page renders the table.

export const EMAIL_TABLE_NAVY = "#30578D";

export const EMAIL_TABLE_COLUMN_CATEGORIES: { label: string; columns: { key: string; label: string }[] }[] = [
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
      { key: "csrOwner", label: "CSR Owner" },
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
      { key: "poNumber", label: "PO Number" },
      { key: "quoteNumber", label: "Quote # + Version / Revision" },
      { key: "orderNumber", label: "Order #" },
      { key: "operatingUnit", label: "Operating Unit (OU)" },
      { key: "poAmount", label: "PO Amount" },
      { key: "poAmountWithCurrency", label: "PO Amount (including currency)" },
    ],
  },
  {
    label: "Current Workflow Status",
    columns: [
      { key: "stage", label: "Stage" },
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
  {
    label: "SOA",
    columns: [
      { key: "soaEmailDraftNotification", label: "SOA Email Draft Notification" },
    ],
  },
];

export const EMAIL_TABLE_ADDITIONAL_COLUMN_LABELS: Record<string, string> = Object.fromEntries(
  EMAIL_TABLE_COLUMN_CATEGORIES.flatMap((cat) => cat.columns.map((c) => [c.key, c.label]))
);

const EMAIL_TABLE_ADDITIONAL_ACCESSORS: Record<string, (r: Email) => string | undefined> = {
  // Not a toggleable "additional column" itself — added so sorting by the sticky column still works
  // generically (via getEmailTableColumnValue) when it's showing CCC Request # instead of From/Subject.
  cccId: (r) => r.cccId,
  opportunityNumber: (r) => r.opportunityNumber,
  accountManager: (r) => r.accountManager,
  accountName: (r) => r.accountName,
  csrOwner: (r) => r.csrOwner,
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
  poAmount: (r) => r.poAmount,
  poAmountWithCurrency: (r) => (r.poAmount ? `${r.poAmount} ${r.currency ?? ""}`.trim() : undefined),
  stage: (r) => r.stage,
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
  soaEmailDraftNotification: (r) => r.soaEmailDraftNotification,
};

export function EmailTableAvatar({ email }: { email: Email }) {
  const isAi = email.assignedTo === "AI";
  return (
    <div className={`size-[26px] rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white ${isAi ? "bg-[#666666]" : ""}`} style={isAi ? undefined : { backgroundColor: EMAIL_TABLE_NAVY }}>
      {email.assignedInitials ?? "?"}
    </div>
  );
}

// Color per known value for the status-like CSR columns (Stage, Status, SOA Email Draft Notification) —
// rendered as a pill instead of plain text, same visual language as EmailTableReviewPill. Unknown values
// (any future mock data addition) fall back to a neutral grey pill rather than being left unstyled.
const EMAIL_TABLE_STATUS_PILL_COLORS: Record<string, { fg: string; bg: string }> = {
  // AC5 — Portal Status Visualization: the 5 CCC request statuses, colored per the BPA-provided legend.
  "Action Required": { fg: "#C83737", bg: "#FAEBEB" },
  "Awaiting response": { fg: "#E67919", bg: "#FDF3E7" },
  "In Automation": { fg: "#30578D", bg: "#EAF1FB" },
  "Completed / Ready": { fg: "#468657", bg: "#EFF6F1" },
  "Read only": { fg: "#666666", bg: "#F1F2F4" },
  Intake: { fg: "#30578D", bg: "#EAF1FB" },
  Validation: { fg: "#E67919", bg: "#FDF3E7" },
  Fulfillment: { fg: "#387D85", bg: "#E7F3F3" },
  Closed: { fg: "#468657", bg: "#EFF6F1" },
  Sent: { fg: "#468657", bg: "#EFF6F1" },
  "Draft Ready": { fg: "#E67919", bg: "#FDF3E7" },
  "Not Sent": { fg: "#C83737", bg: "#FAEBEB" },
};

// AC5: "Users can understand the meaning of each color via a legend or tooltip" — surfaced here as a
// hover tooltip on the Status pill rather than a separate legend panel, using the BPA-provided wording.
export const CCC_STATUS_CSR_EXPECTATION: Record<string, string> = {
  "Action Required": "Immediate action",
  "Awaiting response": "Monitor only",
  "In Automation": "No action",
  "Completed / Ready": "No follow-up",
  "Read only": "No action",
};

export function EmailTableStatusValuePill({ value, tooltip }: { value?: string; tooltip?: string }) {
  if (!value || value === "—") return <span className="text-[12.5px] text-[#97999B]">—</span>;
  const c = EMAIL_TABLE_STATUS_PILL_COLORS[value] ?? { fg: "#4D4D4D", bg: "#F1F2F4" };
  const pill = (
    <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold whitespace-nowrap" style={{ color: c.fg, backgroundColor: c.bg }}>
      {value}
    </span>
  );
  return tooltip ? <EmailTableTooltip label={tooltip}>{pill}</EmailTableTooltip> : pill;
}

// AC8 — TAT Color Coding: bands the "Time Remaining / SLA" column by hours remaining rather than by the
// display string, per the BPA-provided thresholds — Green (On Track) ≥ 9h, Yellow (Monitor) 4h–<9h,
// Orange (At Risk) >0h–<4h, Red (Overdue) ≤ 0h.
export function tatBand(hours: number): { label: string; fg: string; bg: string } {
  if (hours <= 0) return { label: "Overdue", fg: "#C83737", bg: "#FAEBEB" };
  if (hours < 4) return { label: "At Risk", fg: "#E67919", bg: "#FDF3E7" };
  if (hours < 9) return { label: "Monitor", fg: "#92600B", bg: "#FDF3E7" };
  return { label: "On Track", fg: "#468657", bg: "#EFF6F1" };
}

export function EmailTableTatPill({ hours, label }: { hours?: number; label?: string }) {
  if (hours === undefined || !label) return <span className="text-[12.5px] text-[#97999B]">—</span>;
  const band = tatBand(hours);
  return (
    <EmailTableTooltip label={band.label}>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-semibold whitespace-nowrap" style={{ color: band.fg, backgroundColor: band.bg }}>
        <span className="size-[7px] rounded-full shrink-0" style={{ backgroundColor: band.fg }} />
        {label}
      </span>
    </EmailTableTooltip>
  );
}

function EmailTableReviewPill({ status }: { status?: string }) {
  const s = status ?? "Pending";
  const style = s === "Approved" ? "text-[#23432C] bg-[#EFF6F1]" : s === "Rejected" ? "text-[#280B0B] bg-[#FAEBEB]" : "text-[#613305] bg-[#FDF3E7]";
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold whitespace-nowrap ${style}`}>{s}</span>;
}

function EmailTableConfidenceBar({ pct }: { pct?: number }) {
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

const EMAIL_TABLE_AGE_POOL = ["22h 46m", "1d 2h 38m", "23h 0m", "23h 2m", "18h 12m", "2d 1h 5m"];
export const EMPTY_SET = new Set<string>();

// A "review" is any Like/Dislike/Comment left on a row — multiple team members can each leave one, so it's
// stored as a per-row list rather than a single value. The "Reviewed By" column surfaces just the latest
// entry; the full history (who, what, when) is available via its "view all" icon.
export type EmailTableReviewEntry = {
  user: string;
  initials: string;
  type: "like" | "dislike" | "comment";
  comment?: string;
  at: Date;
};

function formatReviewDateTime(d: Date): string {
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function latestReview(entries: EmailTableReviewEntry[] | undefined): EmailTableReviewEntry | undefined {
  if (!entries || entries.length === 0) return undefined;
  return entries.reduce((a, b) => (b.at > a.at ? b : a));
}

// Stable string hash so a derived-but-fake field (like Age, which has no real backing value) still resolves
// to the same pool entry for a given row id regardless of pagination/sort position — otherwise the same row
// could show a different "Age" depending on where it lands in the array, and column filtering would be wrong.
function emailTableHashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

// The single source of truth for "what does column X show for row R" — used for rendering AND for column
// filter option lists / matching, so they can never drift out of sync with each other. Exported since the
// page's column-filter option computation and row-filtering pipeline need it too.
export function getEmailTableColumnValue(key: string, row: Email, reviews: Record<string, EmailTableReviewEntry[]> = {}): string {
  switch (key) {
    case "sender": return row.sender;
    case "classification": return row.classification ?? "—";
    case "confidence": return `${row.confidencePct ?? 0}%`;
    case "age": return EMAIL_TABLE_AGE_POOL[emailTableHashSeed(row.id) % EMAIL_TABLE_AGE_POOL.length];
    case "assignedTo": return row.assignedTo ?? "Unassigned";
    case "businessGroup": return row.businessGroup ?? "—";
    case "reviewStatus": return row.reviewStatus ?? "Pending";
    case "reviewedBy": return latestReview(reviews[row.id])?.user ?? "—";
    default: return EMAIL_TABLE_ADDITIONAL_ACCESSORS[key]?.(row) ?? "—";
  }
}

const EMAIL_TABLE_TEAM = [
  { name: "Jagdish K.", initials: "JK" },
  { name: "Gaurish", initials: "G" },
  { name: "Maria Chen", initials: "MC" },
];

const EMAIL_TABLE_STATUSES = [
  { label: "In Progress", color: "#30578D" },
  { label: "Pending", color: "#E67919" },
  { label: "Closed", color: "#468657" },
];

// "Assign & Update Status" modal — opened from a row's Assign action (or from the email view's Assigned To
// pill); prefills business/assignee/status from whatever the email already has, and lets the user change any
// of it before saving. Exported since NewOverviewListView (the alternate "Email" view mode) reuses it too.
export function EmailTableAssignModal({ email, onClose }: { email: Email; onClose: () => void }) {
  const matchedUser = EMAIL_TABLE_TEAM.find((u) => u.name === email.assignedTo);
  const initialStatus = email.reviewStatus === "Approved" || email.reviewStatus === "Rejected"
    ? EMAIL_TABLE_STATUSES[2]
    : EMAIL_TABLE_STATUSES[1];

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
  const [selectedUser, setSelectedUser] = useState(matchedUser ?? EMAIL_TABLE_TEAM[0]);
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
                      style={{ color: EMAIL_TABLE_NAVY }}
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
                    {EMAIL_TABLE_TEAM.map((u) => (
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
                  {EMAIL_TABLE_STATUSES.map((s) => (
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
export function EmailTableSendEmailModal({ email, onClose }: { email: Email; onClose: () => void }) {
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
            style={{ backgroundColor: EMAIL_TABLE_NAVY }}
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
export function EmailTableCommentModal({ email, onClose, onSubmit }: { email: Email; onClose: () => void; onSubmit: (text: string, entity: Email) => void }) {
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
            style={{ backgroundColor: EMAIL_TABLE_NAVY }}
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
function EmailTableReviewsModal({ email, entries, onClose }: { email: Email; entries: EmailTableReviewEntry[]; onClose: () => void }) {
  const sorted = [...entries].sort((a, b) => b.at.getTime() - a.at.getTime());
  const meta: Record<EmailTableReviewEntry["type"], { label: string; color: string; Icon: typeof ThumbsUp }> = {
    like: { label: "Liked", color: "#468657", Icon: ThumbsUp },
    dislike: { label: "Disliked", color: "#dc2626", Icon: ThumbsDown },
    comment: { label: "Commented", color: EMAIL_TABLE_NAVY, Icon: MessageSquare },
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

// The 8 default columns (From/Subject, Classification, Confidence, Age, Assigned To, Business Group,
// Review Status, Action) are always shown; optional "Additional Columns" render dynamically off
// `additionalColumns`, whose membership + order comes from the Column Mgmt panel.
function renderEmailTableColumnCell(
  key: string,
  row: Email,
  reviews: Record<string, EmailTableReviewEntry[]>,
  onOpenReviews: () => void
) {
  switch (key) {
    case "classification":
      return <span className="text-[12.5px] text-[#4D4D4D] whitespace-nowrap">{row.classification ?? "—"}</span>;
    case "confidence":
      return <EmailTableConfidenceBar pct={row.confidencePct} />;
    case "age":
      return <span className="text-[12.5px] text-[#4D4D4D] whitespace-nowrap">{getEmailTableColumnValue("age", row)}</span>;
    case "assignedTo":
      return (
        <div className="flex items-center gap-2 min-w-0">
          <EmailTableAvatar email={row} />
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
      return <EmailTableReviewPill status={row.reviewStatus} />;
    case "stage":
      return <EmailTableStatusValuePill value={row.stage} />;
    case "cccRequestStatus":
      return <EmailTableStatusValuePill value={row.cccRequestStatus} tooltip={row.cccRequestStatus ? CCC_STATUS_CSR_EXPECTATION[row.cccRequestStatus] : undefined} />;
    case "soaEmailDraftNotification":
      return <EmailTableStatusValuePill value={row.soaEmailDraftNotification} />;
    case "slaTimeRemaining":
      return <EmailTableTatPill hours={row.hoursRemaining} label={row.slaTimeRemaining} />;
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
          <EmailTableTooltip label={`View all reviews (${entries.length})`}>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenReviews(); }}
              className="shrink-0 flex items-center justify-center size-[22px] rounded-[6px] text-[#97999B] hover:bg-[#F1F2F4] hover:text-[#4D4D4D] cursor-pointer transition-colors"
            >
              <History size={13} />
            </button>
          </EmailTableTooltip>
        </div>
      );
    }
    default:
      return <span className="text-[12.5px] text-[#4D4D4D] whitespace-nowrap">{getEmailTableColumnValue(key, row)}</span>;
  }
}

function EmailTableStatusIcon({ status }: { status?: string }) {
  const map: Record<string, { label: string; fg: string; bg: string; Icon: typeof CircleAlert }> = {
    Flagged: { label: "Incomplete", fg: "#C83737", bg: "#FAEBEB", Icon: CircleAlert },
    "Under Review": { label: "On Hold", fg: "#E67919", bg: "#FDF3E7", Icon: CirclePause },
    Cleared: { label: "Created", fg: "#468657", bg: "#EFF6F1", Icon: CircleCheck },
  };
  const entry = status ? map[status] : undefined;
  if (!entry) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10.5px] font-semibold whitespace-nowrap shrink-0"
      style={{ color: entry.fg, backgroundColor: entry.bg }}
    >
      <entry.Icon size={11} />
      {entry.label}
    </span>
  );
}

// AC6 — Attachments – View Without Download: a clickable badge that opens straight into the
// AttachmentPreviewModal for the whole row — no separate picker first. When there's more than one
// attachment, the modal itself shows the count and lets you switch between them.
function EmailTableAttachmentButton({
  attachments,
  onOpen,
}: {
  attachments: { name: string; size: string }[];
  onOpen: (all: { name: string; size: string }[]) => void;
}) {
  if (attachments.length === 0) return null;

  return (
    <EmailTableTooltip label={`View attachment${attachments.length > 1 ? "s" : ""} (${attachments.length})`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpen(attachments);
        }}
        className="shrink-0 inline-flex items-center gap-1 px-1.5 py-[1px] rounded-[6px] text-[10.5px] font-semibold cursor-pointer transition-colors hover:opacity-80"
        style={{ color: "#30578D", backgroundColor: "#EAF1FB" }}
      >
        <Paperclip size={10} />
        {attachments.length}
      </button>
    </EmailTableTooltip>
  );
}

// Shared by parent email rows and their nested CCC rows — bold id + copy-to-clipboard, sender line with
// attachment/status icons, and the subject/request-type text underneath.
function EmailTableSubjectCell({ entity, density, primaryField = "id", onOpenAttachment }: { entity: Email; density: "small" | "medium" | "large"; primaryField?: "id" | "cccId"; onOpenAttachment?: (all: { name: string; size: string }[]) => void }) {
  const primaryValue = primaryField === "cccId" ? (entity.cccId ?? entity.id) : entity.id;
  return (
    <>
      <div className="flex items-center gap-1.5 min-w-0 leading-tight">
        <p className="text-[13px] font-semibold truncate" style={{ color: EMAIL_TABLE_NAVY }}>{primaryValue}</p>
        <EmailTableTooltip label="Copy ID">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(primaryValue);
              toast.success(`Copied ${primaryValue}`);
            }}
            className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors"
          >
            <Copy size={11} />
          </button>
        </EmailTableTooltip>
        {(entity.attachments?.length ?? 0) > 0 && (
          onOpenAttachment ? (
            <EmailTableAttachmentButton attachments={entity.attachments!} onOpen={onOpenAttachment} />
          ) : (
            <EmailTableTooltip label="Has attachments">
              <Paperclip size={11} className="text-[#30578D] shrink-0" />
            </EmailTableTooltip>
          )
        )}
        <EmailTableStatusIcon status={entity.status} />
      </div>
      {/* CCC Request # mode (CSR view) shows just the id line above — sender/subject are email-specific
          details that don't apply once this column is about the CCC request itself. */}
      {primaryField !== "cccId" && density !== "small" && (
        <div className="flex items-center gap-1.5 min-w-0 leading-tight mt-0.5">
          <p className="text-[12.5px] text-[#4D4D4D] truncate">{entity.sender}</p>
        </div>
      )}
      {primaryField !== "cccId" && density === "large" && (
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
// A single read-only stat — grey uppercase label + compact bold value. Shared "our design" pattern for
// info/detail modals (Order Listing's Customer Information, Order Details' Show More Order Info): laid out
// by the caller with grid+gap rather than borders-between-items, so alignment stays correct once fields
// wrap onto multiple rows.
export function InfoTile({ label, value, labelColor = "#97999B", valueColor = "#262626" }: { label: string; value: ReactNode; labelColor?: string; valueColor?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide truncate" style={{ color: labelColor }}>{label}</p>
      <p className="text-[13.5px] font-semibold mt-1 truncate" style={{ color: valueColor }}>{value}</p>
    </div>
  );
}

export function EmailTableTooltip({ label, children }: { label: string; children: ReactNode }) {
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

// A single line of text that truncates with an ellipsis, and only shows the same dark tooltip as
// EmailTableTooltip when it's actually cut off (scrollWidth > clientWidth) — never on text that fits.
// Renders the truncating element itself (rather than wrapping arbitrary children) so the overflow check
// runs on the real rendered box, and so it can be dropped straight into a flex row as its own shrinkable
// item without an extra wrapper layer fighting the truncation.
export function TruncateTooltip({ label, className = "" }: { label: string; className?: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  const show = () => {
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const rect = el.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  };

  return (
    <span
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
      className={`block min-w-0 truncate ${className}`}
    >
      {label}
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

function EmailTableIconButton({
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
    <EmailTableTooltip label={label}>
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`flex items-center justify-center size-[28px] rounded-[8px] border transition-all cursor-pointer ${active ? "scale-110" : "scale-100 border-[#E2E6E9] text-[#666666] hover:bg-[#F7F7F7]"}`}
        style={active ? { borderColor: activeColor, backgroundColor: activeBg, color: activeColor } : undefined}
      >
        <Icon size={13} />
      </button>
    </EmailTableTooltip>
  );
}

// Plain "Send Email" trigger — its own icon button rather than tucked inside a dropdown, since once
// Feedback (Comment/React) moved out below it was the only item left in the old "More actions" menu, and a
// one-item ellipsis menu is just an extra click for no reason.
export function EmailTableSendEmailButton({
  onSendEmail,
  size = 28,
  colorClassName = "border-[#E2E6E9] text-[#666666] hover:bg-[#F7F7F7]",
}: {
  onSendEmail: () => void;
  /** Button size in px — defaults to the table row's 28px; pass a taller value to match a page-level
      button group (e.g. 38px next to the Email Details header's Assign button). */
  size?: number;
  /** Border/text/hover color classes — defaults to the table's own grey palette; override to match
      whatever button group this is sitting next to on a given page. */
  colorClassName?: string;
}) {
  return (
    <EmailTableTooltip label="Send Email">
      <button
        onClick={(e) => { e.stopPropagation(); onSendEmail(); }}
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-[8px] border cursor-pointer transition-colors ${colorClassName}`}
      >
        <Send size={13} />
      </button>
    </EmailTableTooltip>
  );
}

// Feedback trigger + its dropdown (Comment, React) — split out from EmailTableActionCell so other pages
// (e.g. the Email Details workflow header) can drop the exact same menu in next to their own Assign button
// instead of pulling in the whole row-action cell. Comment and Like/Dislike are grouped here under one
// "Feedback" affordance, kept separate from Send Email since they're a different kind of action (opinions
// on the row itself, not a communication sent from it).
export function EmailTableFeedbackButton({
  reaction,
  onToggleReaction,
  onComment,
  size = 28,
  colorClassName = "border-[#E2E6E9] text-[#666666] hover:bg-[#F7F7F7]",
}: {
  reaction: "like" | "dislike" | undefined;
  onToggleReaction: (reaction: "like" | "dislike") => void;
  onComment: () => void;
  /** Trigger button's size in px — defaults to the table row's 28px; pass a taller value to match a
      page-level button group (e.g. 38px next to the Email Details header's Assign button). */
  size?: number;
  /** Border/text/hover color classes — defaults to the table's own grey palette; override to match
      whatever button group this is sitting next to on a given page. */
  colorClassName?: string;
}) {
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
    <>
      <EmailTableTooltip label="Feedback">
        <button
          ref={btnRef}
          onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
          style={{
            width: size,
            height: size,
            ...(reaction
              ? { borderColor: reaction === "like" ? "#468657" : "#dc2626", backgroundColor: reaction === "like" ? "#EFF6F1" : "#FAEBEB", color: reaction === "like" ? "#468657" : "#dc2626" }
              : undefined),
          }}
          className={`flex items-center justify-center rounded-[8px] border cursor-pointer transition-colors ${reaction ? "" : colorClassName}`}
        >
          {reaction === "like" ? (
            <ThumbsUp size={13} fill="currentColor" />
          ) : reaction === "dislike" ? (
            <ThumbsDown size={13} fill="currentColor" />
          ) : (
            <MessageSquareHeart size={13} />
          )}
        </button>
      </EmailTableTooltip>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg w-[190px] py-1.5"
          style={{ top: pos.top, left: pos.left }}
          onClick={(e) => e.stopPropagation()}
        >
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
    </>
  );
}

function EmailTableActionCell({
  entity,
  reaction,
  onToggleReaction,
  onAssign,
  onAudit,
  onSendEmail,
  onComment,
}: {
  entity: Email;
  reaction: "like" | "dislike" | undefined;
  onToggleReaction: (reaction: "like" | "dislike") => void;
  onAssign: () => void;
  onAudit: () => void;
  onSendEmail: () => void;
  onComment: () => void;
}) {
  const isAssigned = !!entity.assignedTo && entity.assignedTo !== "Unassigned";
  const auditCount = getAllAuditEntriesForEmail(entity.id).length;
  return (
    <div className="flex items-center gap-1.5">
      <EmailTableIconButton
        icon={isAssigned ? UserCheck : UserPlus}
        label={isAssigned ? `Assigned to ${entity.assignedTo} — click to reassign` : "Assign"}
        onClick={onAssign}
        active={isAssigned}
        activeColor={EMAIL_TABLE_NAVY}
        activeBg="#E9EEF5"
      />
      <EmailTableIconButton icon={History} label={auditCount > 0 ? `Audit (${auditCount})` : "Audit"} onClick={onAudit} />
      <EmailTableSendEmailButton onSendEmail={onSendEmail} />
      <EmailTableFeedbackButton reaction={reaction} onToggleReaction={onToggleReaction} onComment={onComment} />
    </div>
  );
}

// Per-column header filter — a small funnel icon that opens a searchable checkbox list of that column's
// unique values. Options are only computed when opened (cheap for small tables, avoids doing it per column
// on every render). Uses the same fixed-position + portal pattern as the tooltip, for the same reason: a
// dropdown anchored inside a sticky header cell would get clipped/overlapped by the scroll container.
export function EmailTableColumnFilterButton({
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
        className={`flex items-center justify-center size-[20px] rounded-[4px] transition-colors cursor-pointer ${
          selected.size > 0 || open ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        }`}
        style={selected.size > 0 ? { backgroundColor: EMAIL_TABLE_NAVY, color: "white" } : { color: "#97999B" }}
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
                        style={checked ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
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

export function EmailTable({
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
  sortKey,
  sortDirection,
  onSort,
  subjectColumnLabel = "From/Subject",
  subjectPrimaryField = "id",
  subjectSortKey = "sender",
  onOpenAttachment,
  onSendEmail,
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
  reviews: Record<string, EmailTableReviewEntry[]>;
  onToggleReaction: (id: string, reaction: "like" | "dislike") => void;
  /** Column currently sorted by, if any — null means unsorted (rows render in their given order). */
  sortKey?: string | null;
  sortDirection?: "asc" | "desc";
  /** Header label for the sticky first column — defaults to "From/Subject"; a CSR-style view can relabel it (e.g. "CCC Request #"). */
  subjectColumnLabel?: string;
  /** Which field the sticky first column's bold primary line shows — the email id (default) or the CCC request id. */
  subjectPrimaryField?: "id" | "cccId";
  /** Sort key used when the sticky first column's header is clicked — defaults to "sender" to match the default label. */
  subjectSortKey?: string;
  /** AC6 — opens an attachment in the shared preview modal; omit to fall back to the old passive icon. */
  onOpenAttachment?: (all: { name: string; size: string }[]) => void;
  /** Clicking a sortable column header calls this with its key; the caller owns the actual sort logic
      since it needs to run before pagination slices the rows. */
  onSort?: (key: string) => void;
  onAddComment: (id: string, text: string) => void;
  /** Overrides the row action's Send Email behavior — pass this to navigate somewhere (e.g. the
      Communication page) instead of opening the built-in placeholder modal. Omit to keep the modal. */
  onSendEmail?: (email: Email) => void;
}) {
  const subjectPadY = rowDensity === "small" ? "py-1" : rowDensity === "medium" ? "py-1.5" : "py-2";
  const childSubjectPadY = rowDensity === "small" ? "py-0.5" : rowDensity === "medium" ? "py-1" : "py-1.5";
  const [assignModalRow, setAssignModalRow] = useState<Email | null>(null);
  const [sendEmailModalRow, setSendEmailModalRow] = useState<Email | null>(null);
  const [commentModalRow, setCommentModalRow] = useState<Email | null>(null);
  const [reviewsModalRow, setReviewsModalRow] = useState<Email | null>(null);
  const [auditModalRow, setAuditModalRow] = useState<Email | null>(null);
  const colCount = additionalColumns.length + 3; // chevron + subject + action, minus the +1 below for the no-results colspan

  return (
    <>
    <div className="h-full overflow-auto">
      <table className="w-full min-w-[980px] border-separate border-spacing-0">
        <thead>
          <tr className="bg-[#F7F7F7]">
            <th className="sticky top-0 left-0 z-30 bg-[#F7F7F7] w-[40px] h-[42px] border-b border-[#DEDEDE]" />
            <th className="group sticky top-0 left-[40px] z-30 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE] shadow-[4px_0_6px_-4px_rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-1.5">
                {onSort ? (
                  <button onClick={() => onSort(subjectSortKey)} className="flex items-center gap-1 cursor-pointer">
                    <span className={`text-[12px] font-semibold ${sortKey === subjectSortKey ? "text-[#262626]" : "text-[#4D4D4D]"}`}>
                      {subjectColumnLabel}
                    </span>
                    {sortKey === subjectSortKey ? (
                      (() => {
                        const SortIcon = sortDirection === "desc" ? ArrowDown : ArrowUp;
                        return <SortIcon size={12} style={{ color: EMAIL_TABLE_NAVY }} />;
                      })()
                    ) : (
                      <ChevronsUpDown size={12} className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" style={{ color: "#97999B" }} />
                    )}
                  </button>
                ) : (
                  <span className="text-[12px] font-semibold text-[#4D4D4D]">{subjectColumnLabel}</span>
                )}
                <EmailTableColumnFilterButton
                  colKey="sender"
                  getOptions={columnFilterOptions}
                  selected={columnFilters.sender ?? EMPTY_SET}
                  onToggle={(v) => onToggleColumnFilterValue("sender", v)}
                  onClear={() => onClearColumnFilter("sender")}
                />
              </div>
            </th>
            {additionalColumns.map((key) => {
              const active = sortKey === key;
              const SortIcon = sortDirection === "desc" ? ArrowDown : ArrowUp;
              return (
                <th key={key} className="group sticky top-0 z-20 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                  <div className="flex items-center gap-1.5">
                    {onSort ? (
                      <button onClick={() => onSort(key)} className="flex items-center gap-1 cursor-pointer">
                        <span className={`text-[12px] font-semibold ${active ? "text-[#262626]" : "text-[#4D4D4D]"}`}>
                          {EMAIL_TABLE_ADDITIONAL_COLUMN_LABELS[key]}
                        </span>
                        {active ? (
                          <SortIcon size={12} style={{ color: EMAIL_TABLE_NAVY }} />
                        ) : (
                          <ChevronsUpDown size={12} className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" style={{ color: "#97999B" }} />
                        )}
                      </button>
                    ) : (
                      <span className="text-[12px] font-semibold text-[#4D4D4D]">{EMAIL_TABLE_ADDITIONAL_COLUMN_LABELS[key]}</span>
                    )}
                    <EmailTableColumnFilterButton
                      colKey={key}
                      getOptions={columnFilterOptions}
                      selected={columnFilters[key] ?? EMPTY_SET}
                      onToggle={(v) => onToggleColumnFilterValue(key, v)}
                      onClear={() => onClearColumnFilter(key)}
                    />
                  </div>
                </th>
              );
            })}
            <th className="sticky top-0 right-0 z-30 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE] shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)]">
              <span className="text-[12px] font-semibold text-[#4D4D4D]">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={colCount + 1} className="text-center py-16 text-[#97999B] text-[14px]">No emails match your filters</td></tr>
          ) : rows.flatMap((row) => {
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
                  <EmailTableSubjectCell entity={row} density={rowDensity} primaryField={subjectPrimaryField} onOpenAttachment={onOpenAttachment} />
                </td>
                {additionalColumns.map((key) => (
                  <td key={key} className={`px-4 ${subjectPadY} border-b border-[#DEDEDE]`}>{renderEmailTableColumnCell(key, row, reviews, () => setReviewsModalRow(row))}</td>
                ))}
                <td className={`sticky right-0 z-10 bg-white group-hover:bg-[#EEF2F7] px-4 ${subjectPadY} border-b border-[#DEDEDE] shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)] transition-colors`}>
                  <EmailTableActionCell
                    entity={row}
                    reaction={reactions[row.id]}
                    onToggleReaction={(r) => onToggleReaction(row.id, r)}
                    onAssign={() => setAssignModalRow(row)}
                    onAudit={() => setAuditModalRow(row)}
                    onSendEmail={() => (onSendEmail ? onSendEmail(row) : setSendEmailModalRow(row))}
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
                  <EmailTableSubjectCell entity={ccc} density={rowDensity} primaryField={subjectPrimaryField} onOpenAttachment={onOpenAttachment} />
                </td>
                {additionalColumns.map((key) => (
                  <td key={key} className={`px-4 ${childSubjectPadY} border-b border-[#DEDEDE]`}>{renderEmailTableColumnCell(key, ccc, reviews, () => setReviewsModalRow(ccc))}</td>
                ))}
                <td className={`sticky right-0 z-10 bg-[#F7F7F7] group-hover:bg-[#E2E6E9] px-4 ${childSubjectPadY} border-b border-[#DEDEDE] shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)] transition-colors`}>
                  <EmailTableActionCell
                    entity={ccc}
                    reaction={reactions[ccc.id]}
                    onToggleReaction={(r) => onToggleReaction(ccc.id, r)}
                    onAssign={() => setAssignModalRow(ccc)}
                    onAudit={() => setAuditModalRow(ccc)}
                    onSendEmail={() => (onSendEmail ? onSendEmail(ccc) : setSendEmailModalRow(ccc))}
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
      <EmailTableAssignModal email={assignModalRow} onClose={() => setAssignModalRow(null)} />
    )}
    {sendEmailModalRow && (
      <EmailTableSendEmailModal email={sendEmailModalRow} onClose={() => setSendEmailModalRow(null)} />
    )}
    {commentModalRow && (
      <EmailTableCommentModal
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
      <EmailTableReviewsModal
        email={reviewsModalRow}
        entries={reviews[reviewsModalRow.id] ?? []}
        onClose={() => setReviewsModalRow(null)}
      />
    )}
    {auditModalRow && (
      <AuditTrailModal
        title="Overall Audit"
        subtitle={`Every change made across ${auditModalRow.id}'s workflow`}
        entries={getAllAuditEntriesForEmail(auditModalRow.id)}
        onClose={() => setAuditModalRow(null)}
      />
    )}
    </>
  );
}
