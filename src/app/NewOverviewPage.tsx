import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Download,
  FileText,
  Filter,
  Inbox,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Paperclip,
  SlidersHorizontal,
  TrendingUp,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { NavDrawer } from "./components/NavDrawer";
import { AppHeader } from "./components/AppHeader";
import { type Email, ALL_EMAILS_WITH_CCC } from "./emailData";

// ─── New Overview (fresh build, matching the shared reference design) ──────────
// Deliberately does not reuse OrderListingTable, CccDetailCard, or EmailViewBody — its own table, toolbar,
// KPI strip, and email view, styled to the reference's navy/light-border look rather than the app's pink brand.

const NEW_OVERVIEW_NAVY = "#30578D";

const NEW_OVERVIEW_MAILBOXES = ["All Mailboxes", "support@intellisight.io", "sales@intellisight.io", "billing@intellisight.io"];

const NEW_OVERVIEW_INTERVALS = ["Day", "Week", "Month", "Quarter", "Year"];

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

  const [businessName, setBusinessName] = useState(email.accountName ?? "");
  const [assignMode, setAssignMode] = useState<"me" | "others">("others");
  const [selectedUser, setSelectedUser] = useState(matchedUser ?? NEW_OVERVIEW_TEAM[0]);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [statusOpen, setStatusOpen] = useState(false);

  const handleSave = () => {
    const assignee = assignMode === "me" ? "you" : selectedUser.name;
    toast.success(`${email.id} assigned to ${assignee} — status set to ${status.label}`);
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
          {/* Assign to Business */}
          <div>
            <p className="text-[11.5px] font-medium text-[#666666] mb-2">Assign to Business</p>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business name (optional)"
                className="w-full h-[40px] pl-9 pr-3 rounded-[8px] border border-[#E2E6E9] text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#D9D9D6] transition-colors"
              />
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

// Custom table — expand chevron reveals linked CCCs as simple one-level sub-rows (no tabs, no deep hierarchy).
function NewOverviewTable({ rows, expandedIds, onToggleExpand, onOpenRow }: {
  rows: Email[];
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onOpenRow: (id: string) => void;
}) {
  const [assignModalRow, setAssignModalRow] = useState<Email | null>(null);

  return (
    <>
    <div className="h-full overflow-auto">
      <table className="w-full min-w-[980px] border-collapse">
        <thead>
          <tr className="border-b border-[#DEDEDE] bg-[#F7F7F7] sticky top-0 z-10">
            <th className="w-[40px]" />
            {["From/Subject", "Classification", "Confidence", "Age", "Assigned To", "Business Group", "Review Status", "Action"].map((label) => (
              <th key={label} className="px-4 h-[42px] text-left whitespace-nowrap">
                <span className="text-[12px] font-semibold text-[#4D4D4D]">{label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={9} className="text-center py-16 text-[#97999B] text-[14px]">No emails match your filters</td></tr>
          ) : rows.flatMap((row, idx) => {
            const linked = row.linkedCccs ?? [];
            const hasChildren = linked.length > 0;
            const expanded = expandedIds.has(row.id);

            const parentRow = (
              <tr key={row.id} onClick={() => onOpenRow(row.rootEmailId ?? row.id)} className="border-b border-[#DEDEDE] hover:bg-[#F7F7F7] cursor-pointer transition-colors">
                <td className="px-2">
                  {hasChildren && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleExpand(row.id); }}
                      className="flex items-center justify-center size-[22px] rounded-[8px] hover:bg-[#f1f2f4] transition-colors cursor-pointer text-[#666666]"
                    >
                      <ChevronRight size={14} className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 max-w-[260px]">
                  <p className="text-[13px] font-semibold truncate" style={{ color: NEW_OVERVIEW_NAVY }}>{row.id}</p>
                  <p className="text-[12.5px] text-[#4D4D4D] truncate">{row.sender}</p>
                  <p className="text-[12px] text-[#97999B] truncate">{row.subject}</p>
                </td>
                <td className="px-4 py-3"><span className="text-[12.5px] text-[#4D4D4D] whitespace-nowrap">{row.classification ?? "—"}</span></td>
                <td className="px-4 py-3"><NewOverviewConfidenceBar pct={row.confidencePct} /></td>
                <td className="px-4 py-3"><span className="text-[12.5px] text-[#4D4D4D] whitespace-nowrap">{NEW_OVERVIEW_AGE_POOL[idx % NEW_OVERVIEW_AGE_POOL.length]}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <NewOverviewAvatar email={row} />
                    <span className="text-[12.5px] text-[#4D4D4D] truncate">{row.assignedTo ?? "Unassigned"}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Users size={12} className="text-[#97999B] shrink-0" />
                    <span className="text-[12.5px] text-[#4D4D4D] truncate">{row.businessGroup ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><NewOverviewReviewPill status={row.reviewStatus} /></td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setAssignModalRow(row); }}
                    className="px-4 py-1.5 rounded-full text-white text-[12px] font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                    style={{ backgroundColor: NEW_OVERVIEW_NAVY }}
                  >
                    Assign
                  </button>
                </td>
              </tr>
            );

            if (!hasChildren || !expanded) return [parentRow];

            const childRows = linked.map((ccc) => (
              <tr key={`${row.id}::${ccc.id}`} onClick={() => onOpenRow(row.id)} className="border-b border-[#DEDEDE] bg-[#F7F7F7] hover:bg-[#E2E6E9] cursor-pointer transition-colors">
                <td />
                <td className="px-4 py-2.5 pl-8" colSpan={8}>
                  <div className="flex items-center gap-2 min-w-0">
                    <CornerDownRight size={12} className="text-[#97999B] shrink-0" />
                    <span className="text-[12.5px] font-semibold text-[#4D4D4D] shrink-0">{ccc.cccId}</span>
                    <span className="text-[12px] text-[#97999B] truncate">{ccc.cccRequestType} — {ccc.cccRequestSubtype}</span>
                  </div>
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

export function NewOverviewPage({ onLogout, onViewAllNotifications, onNavigateDashboard, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateNewOverview, onNavigateWorkflow, onNavigateHoldManagementOverview, onNavigateOrderListing, onNavigateReleasedOrders }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateDashboard: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateWorkflow: (emailId: string) => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [selectedId, setSelectedId] = useState(ALL_EMAILS_WITH_CCC[0].id);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState(NEW_OVERVIEW_MAILBOXES[0]);
  const [intervalOpen, setIntervalOpen] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState(NEW_OVERVIEW_INTERVALS[2]);
  const [kpisExpanded, setKpisExpanded] = useState(true);
  const rowsPerPage = 10;

  const isInternal = (e: Email) => e.sender.endsWith("@intellisight.io");
  const allRows = ALL_EMAILS_WITH_CCC;
  const rows = searchQuery.trim()
    ? allRows.filter((r) => `${r.subject} ${r.sender} ${r.classification ?? ""}`.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : allRows;

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
    { label: "TOTAL MAILS", value: allRows.length },
    { label: "INTERNAL MAILS", value: allRows.filter(isInternal).length },
    { label: "EXTERNAL MAILS", value: allRows.filter((r) => !isInternal(r)).length },
    { label: "PENDING REVIEW", value: allRows.filter((r) => (r.reviewStatus ?? "Pending") === "Pending").length },
  ];

  return (
    <div className="bg-white flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <NavDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
        onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
        onNavigateNewOverview={onNavigateNewOverview}
        onNavigateHoldManagementOverview={onNavigateHoldManagementOverview}
        onNavigateOrderListing={onNavigateOrderListing}
        onNavigateReleasedOrders={onNavigateReleasedOrders}
      />

      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-20">
          <AppHeader
            onMenuClick={() => setSidebarOpen(true)}
            activeNav="Command Center"
            activeSub="New Overview"
            onViewAllNotifications={onViewAllNotifications}
            onNavigateDashboard={onNavigateDashboard}
          />
        </div>

        <main className="flex-1 min-h-0 flex flex-col px-6 py-5 gap-4 overflow-hidden">

          {/* Page header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <h1 className="text-[22px] font-bold text-[#262626] leading-tight">Overview</h1>
                <p className="text-[12.5px] text-[#97999B] mt-0.5">Monday, 6 July 2026</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setMailboxOpen((v) => !v)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                >
                  <Inbox size={14} className="text-[#666666]" />
                  {selectedMailbox}
                  <ChevronDown size={13} className={`transition-transform duration-200 ${mailboxOpen ? "rotate-180" : ""}`} />
                </button>
                {mailboxOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setMailboxOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-30 w-[220px] py-1">
                      {NEW_OVERVIEW_MAILBOXES.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setSelectedMailbox(opt); setMailboxOpen(false); }}
                          className="w-full text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                          style={opt === selectedMailbox ? { color: NEW_OVERVIEW_NAVY, fontWeight: 600 } : { color: "#4D4D4D" }}
                        >
                          {opt}
                        </button>
                      ))}
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
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
                <Download size={13} />
                Export
              </button>
              <div className="relative">
                <button
                  onClick={() => setIntervalOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                >
                  {selectedInterval}
                  <ChevronDown size={13} className={`transition-transform duration-200 ${intervalOpen ? "rotate-180" : ""}`} />
                </button>
                {intervalOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIntervalOpen(false)} />
                    <div className="absolute top-full right-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-30 w-[140px] py-1">
                      {NEW_OVERVIEW_INTERVALS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setSelectedInterval(opt); setIntervalOpen(false); }}
                          className="w-full text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                          style={opt === selectedInterval ? { color: NEW_OVERVIEW_NAVY, fontWeight: 600 } : { color: "#4D4D4D" }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-[8px] border border-[#E2E6E9] p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10.5px] font-semibold text-[#666666] uppercase tracking-wide">{kpi.label}</p>
                  <span className="flex items-center gap-1 text-[10.5px] font-semibold text-[#468657] bg-[#EFF6F1] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    <TrendingUp size={10} />
                    4.2%
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <p className="text-[26px] font-bold text-[#262626] leading-none">{kpi.value.toLocaleString()}</p>
                  <div className="flex items-end gap-[2px] h-[18px] shrink-0">
                    {[6, 10, 8, 13, 9, 15, 10, 12].map((h, i) => (
                      <div key={i} className="w-[3px] rounded-[1px] bg-[#D9D9D6]" style={{ height: h }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Content card: toolbar + table/list */}
          <div className="flex-1 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col min-h-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
              <div className="relative w-[220px] shrink-0">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="absolute left-[10px] top-1/2 -translate-y-1/2 pointer-events-none">
                  <circle cx="9" cy="9" r="6.5" stroke="#97999B" strokeWidth="1.6" />
                  <path d="M14 14L17.5 17.5" stroke="#97999B" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  placeholder="Search Email"
                  className="h-[36px] w-full pl-[32px] pr-3 rounded-[8px] border border-[#E2E6E9] text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#D9D9D6] transition-colors"
                />
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <button className="flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
                  Classification
                  <ChevronDown size={13} />
                </button>
                <button className="flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
                  Interval
                  <ChevronDown size={13} />
                </button>
                <div className="flex items-center border border-[#E2E6E9] rounded-[8px] overflow-hidden h-[36px]">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center justify-center w-[36px] h-full transition-colors cursor-pointer ${viewMode === "list" ? "text-white" : "bg-white text-[#666666] hover:bg-[#F7F7F7]"}`}
                    style={viewMode === "list" ? { backgroundColor: NEW_OVERVIEW_NAVY } : undefined}
                  >
                    <List size={15} />
                  </button>
                  <div className="w-px h-5 bg-[#E2E6E9]" />
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center justify-center w-[36px] h-full transition-colors cursor-pointer ${viewMode === "grid" ? "text-white" : "bg-white text-[#666666] hover:bg-[#F7F7F7]"}`}
                    style={viewMode === "grid" ? { backgroundColor: NEW_OVERVIEW_NAVY } : undefined}
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>
                <button className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
                  <Filter size={15} />
                </button>
                <button className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
                  <SlidersHorizontal size={15} />
                </button>
              </div>
            </div>

            {/* View body */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {viewMode === "grid" ? (
                <NewOverviewTable
                  rows={pageRows}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpanded}
                  onOpenRow={(id) => onNavigateWorkflow(id)}
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

            {/* Pagination — only meaningful for the table view */}
            {viewMode === "grid" && (
              <div className="flex items-center justify-end gap-[4px] px-5 py-3 border-t border-[#DEDEDE] shrink-0">
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
