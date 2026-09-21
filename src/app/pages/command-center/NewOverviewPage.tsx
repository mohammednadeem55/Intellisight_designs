import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Download,
  FileText,
  Globe,
  GripVertical,
  Inbox,
  LayoutGrid,
  List,
  Mail,
  Maximize2,
  Minimize2,
  Paperclip,
  RefreshCw,
  SlidersHorizontal,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { WaveLoader } from "../../components/common/Loader";
import { AttachmentPreviewModal } from "../../components/common/AttachmentPreviewModal";
import { type Email, CLASSIFICATIONS, BUSINESS_GROUPS } from "./emailData";
import { useWorklistEmails } from "./useWorklistEmails";
import {
  EMAIL_TABLE_NAVY,
  EMAIL_TABLE_COLUMN_CATEGORIES,
  EMAIL_TABLE_ADDITIONAL_COLUMN_LABELS,
  getEmailTableColumnValue,
  type EmailTableReviewEntry,
  EmailTableAvatar,
  EmailTableAssignModal,
  EmailTable,
  tatBand,
} from "../../components/common/EmailTable";
import { TableToolbarApplyReset, TableToolbarMultiSelect, TableToolbarSearch } from "../../components/common/TableToolbar";
import { TableFilterPanel, TableFilterTrigger } from "../../components/common/TableFilterPanel";
import { TablePagination, type RowDensity } from "../../components/common/TablePagination";

// ─── New Overview (fresh build, matching the shared reference design) ──────────
// Deliberately does not reuse OrderListingTable, CccDetailCard, or EmailViewBody — its own table, toolbar,
// KPI strip, and email view, styled to the reference's navy/light-border look rather than the app's pink brand.
// The table itself (EmailTable) lives in its own file — see EmailTable.tsx.

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

const NEW_OVERVIEW_CURRENT_USER = { name: "Jagdish K.", initials: "JK" };

// CSR "Summary View" (AC11) — the full 16-field catalog CSRs can choose from (CCC Request # is the 1st
// field but isn't part of this toggleable list since it's the always-on sticky column, swapped in
// separately below). The worklist supports at most 10 displayed columns at a time — 1 sticky + up to 9
// of these — so NEW_OVERVIEW_CSR_DEFAULT_COLUMNS below is capped to exactly the next 9 fields in the
// spec's list, and toggleAdditionalCol() enforces the cap when adding more.
const NEW_OVERVIEW_CSR_COLUMNS = [
  "accountName",
  "cccRequestType",
  "stage",
  "cccRequestStatus",
  "statusNotes",
  "slaTimeRemaining",
  "poAmount",
  "poNumber",
  "accountManager",
  "csrOwner",
  "orderNumber",
  "operatingUnit",
  "awaitingReason",
  "poAmountWithCurrency",
  "soaEmailDraftNotification",
];
const NEW_OVERVIEW_CSR_MAX_ADDITIONAL_COLUMNS = 9;
const NEW_OVERVIEW_CSR_DEFAULT_COLUMNS = NEW_OVERVIEW_CSR_COLUMNS.slice(0, NEW_OVERVIEW_CSR_MAX_ADDITIONAL_COLUMNS);
// One Column Mgmt category restricted to just the 16-field Summary View catalog, shown instead of the
// full generic EMAIL_TABLE_COLUMN_CATEGORIES list while in CSR view.
const NEW_OVERVIEW_CSR_COLUMN_CATEGORY: { label: string; columns: { key: string; label: string }[] } = {
  label: "Summary View Fields",
  columns: NEW_OVERVIEW_CSR_COLUMNS.map((key) => ({ key, label: EMAIL_TABLE_ADDITIONAL_COLUMN_LABELS[key] })),
};

// AC11 — each CSR's column selection is personal and must persist across sessions.
const NEW_OVERVIEW_CSR_COLUMNS_STORAGE_KEY = `intellisight.csrSummaryViewColumns.${NEW_OVERVIEW_CURRENT_USER.name}`;
function loadSavedCsrColumns(): string[] | null {
  try {
    const raw = localStorage.getItem(NEW_OVERVIEW_CSR_COLUMNS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((k) => typeof k === "string") ? parsed : null;
  } catch {
    return null;
  }
}
function saveCsrColumns(columns: string[]) {
  try {
    localStorage.setItem(NEW_OVERVIEW_CSR_COLUMNS_STORAGE_KEY, JSON.stringify(columns));
  } catch {
    // localStorage unavailable — selection just won't persist across sessions
  }
}

const NEW_OVERVIEW_FILTER_SECTIONS: { key: string; label: string; getValue: (r: Email) => string }[] = [
  { key: "sensitivity", label: "Sensitivity", getValue: (r) => r.sensitivity ?? "GENERAL" },
  { key: "languageDetected", label: "Language Detected", getValue: (r) => r.languageDetected ?? "en" },
  { key: "source", label: "Source", getValue: (r) => r.source ?? "INTERNAL" },
];

// AC7 — Manager View & Filters: CSR / Request Type / past-due-ish urgency, so a manager (or a CSR) can
// filter the CSR Summary View down the way the spec calls out. Only surfaced in CSR view — these fields
// aren't part of the FCNV column set. Business Group is filtered via its own toolbar dropdown instead
// (next to Classification), not through this panel.
const NEW_OVERVIEW_CSR_FILTER_SECTIONS: { key: string; label: string; getValue: (r: Email) => string }[] = [
  { key: "csrOwner", label: "CSR Owner", getValue: (r) => r.csrOwner ?? "—" },
  { key: "cccRequestType", label: "Request Type", getValue: (r) => r.cccRequestType ?? "—" },
  { key: "tatStatus", label: "Time Status", getValue: (r) => (r.hoursRemaining !== undefined ? tatBand(r.hoursRemaining).label : "—") },
];

const NEW_OVERVIEW_VIEW_OPTIONS = ["FCNV", "CSR"];

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
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; size: string } | null>(null);

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
                  <p className="text-[12.5px] font-semibold truncate" style={{ color: EMAIL_TABLE_NAVY }}>{row.id}</p>
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
              <EmailTableAvatar email={selected} />
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#262626] truncate">{selected.sender}</p>
                <p className="text-[12px] text-[#97999B]">{selected.received}</p>
              </div>
            </div>
            <button
              onClick={() => setAssignModalOpen(true)}
              className="shrink-0 flex items-center gap-1.5 text-white text-[12.5px] font-semibold pl-3 pr-2.5 py-2 rounded-[8px] hover:opacity-90 transition-opacity cursor-pointer"
              style={{ backgroundColor: EMAIL_TABLE_NAVY }}
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
                    onClick={() => setPreviewAttachment(a)}
                    className="group flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] border border-[#E2E6E9] hover:bg-[#F7F7F7] transition-colors cursor-pointer text-left"
                  >
                    <div className="size-[30px] rounded-[8px] bg-[#f1f2f4] flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-[#666666]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-[#262626] truncate max-w-[160px]">{a.name}</p>
                      <p className="text-[11px] text-[#97999B]">{a.size}</p>
                    </div>
                    <Download
                      size={13}
                      className="text-[#97999B] group-hover:text-[#4D4D4D] cursor-pointer transition-colors shrink-0"
                      onClick={(e) => { e.stopPropagation(); toast.info(`Downloading ${a.name}`); }}
                    />
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
            style={{ backgroundColor: EMAIL_TABLE_NAVY }}
          >
            Open Workflow →
          </button>
        </div>
      </div>
    </div>
    {assignModalOpen && (
      <EmailTableAssignModal email={selected} onClose={() => setAssignModalOpen(false)} />
    )}
    <AttachmentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </>
  );
}

export function NewOverviewPage({ onLogout, onViewAllNotifications, onNavigateHome, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateNewOverview, onNavigateWorkflow, onNavigateHoldManagementOverview, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateCommunication, onNavigateEmailTemplate, onNavigateFeedbackCenter, onNavigateEmailWorkflow }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateWorkflow: (emailId: string, scope?: "mine" | "all") => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateCommunication?: (source?: { emailId?: string }) => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  const { data: worklistData, loading: worklistLoading, error: worklistError, reload: reloadWorklist } = useWorklistEmails();
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [rowDensity, setRowDensity] = useState<RowDensity>("large");
  const [emailScope, setEmailScope] = useState<"mine" | "all">("mine");
  const [selectedId, setSelectedId] = useState("");
  useEffect(() => {
    if (!selectedId && worklistData && worklistData.length > 0) setSelectedId(worklistData[0].id);
  }, [worklistData, selectedId]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // AC6 — Attachments – View Without Download: opened from the grid's clickable badge, in either view.
  // Holds the whole row's attachment list — the modal itself shows the count and switches between them.
  const [previewAttachments, setPreviewAttachments] = useState<{ name: string; size: string }[] | null>(null);
  const [page, setPage] = useState(1);
  // `searchQuery` is the committed value that actually drives filtering (stands in for what would be a
  // server-side query in the real app) — TableToolbarSearch owns the draft/open/debounce state and only
  // calls back here once a value is ready to commit.
  const [searchQuery, setSearchQuery] = useState("");
  const [kpisExpanded, setKpisExpanded] = useState(true);
  const [lastSynced, setLastSynced] = useState("10:45 AM");
  const [syncing, setSyncing] = useState(false);
  const handleRefresh = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => {
      setLastSynced(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      setSyncing(false);
      toast.success("Synced");
    }, 900);
  };
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const changeRowsPerPage = (n: number) => {
    setRowsPerPage(n);
    setPage(1);
  };

  // Sorting runs on the full filtered set before pagination slices it — otherwise clicking a header would
  // just reorder whatever happens to be on the current page instead of the whole result set.
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Reactions/reviews live here (not in the table) because the "Reviewed By" column's value — used for
  // both rendering and column filtering — has to be computed at this level, same as every other column.
  const [reactions, setReactions] = useState<Record<string, "like" | "dislike" | undefined>>({});
  const [reviews, setReviews] = useState<Record<string, EmailTableReviewEntry[]>>({});
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
  // Business Group — promoted out of the generic filter panel into its own toolbar dropdown, right next
  // to Classification, following the exact same staged multi-select + Apply/Reset pattern.
  const [businessGroupOpen, setBusinessGroupOpen] = useState(false);
  const [appliedBusinessGroups, setAppliedBusinessGroups] = useState<string[]>([]);
  const [pendingBusinessGroups, setPendingBusinessGroups] = useState<string[]>([]);
  const [toolbarIntervalOpen, setToolbarIntervalOpen] = useState(false);
  const [appliedToolbarInterval, setAppliedToolbarInterval] = useState<string | null>(null);
  const [pendingToolbarInterval, setPendingToolbarInterval] = useState<string | null>(null);
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");
  const [pendingCustomStart, setPendingCustomStart] = useState("");
  const [pendingCustomEnd, setPendingCustomEnd] = useState("");

  const classificationDirty = pendingClassifications.slice().sort().join("|") !== appliedClassifications.slice().sort().join("|");
  const businessGroupDirty = pendingBusinessGroups.slice().sort().join("|") !== appliedBusinessGroups.slice().sort().join("|");
  const intervalDirty =
    pendingToolbarInterval !== appliedToolbarInterval ||
    (pendingToolbarInterval === "Custom" && (pendingCustomStart !== appliedCustomStart || pendingCustomEnd !== appliedCustomEnd));
  const filtersAreDirty = classificationDirty || businessGroupDirty || intervalDirty;
  const allClassificationsSelected = pendingClassifications.length === CLASSIFICATIONS.length;
  const toggleAllClassifications = () => setPendingClassifications(allClassificationsSelected ? [] : [...CLASSIFICATIONS]);
  const allBusinessGroupsSelected = pendingBusinessGroups.length === BUSINESS_GROUPS.length;
  const toggleAllBusinessGroups = () => setPendingBusinessGroups(allBusinessGroupsSelected ? [] : [...BUSINESS_GROUPS]);

  const formatShortDate = (d: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
  const intervalLabel =
    pendingToolbarInterval === "Custom" && pendingCustomStart && pendingCustomEnd
      ? `${formatShortDate(pendingCustomStart)} – ${formatShortDate(pendingCustomEnd)}`
      : pendingToolbarInterval ?? "Interval";

  const applyToolbarFilters = () => {
    setAppliedClassifications(pendingClassifications);
    setAppliedBusinessGroups(pendingBusinessGroups);
    setAppliedToolbarInterval(pendingToolbarInterval);
    setAppliedCustomStart(pendingCustomStart);
    setAppliedCustomEnd(pendingCustomEnd);
    setClassificationOpen(false);
    setBusinessGroupOpen(false);
    setToolbarIntervalOpen(false);
    setPage(1);
  };
  const resetToolbarFilters = () => {
    setPendingClassifications(appliedClassifications);
    setPendingBusinessGroups(appliedBusinessGroups);
    setPendingToolbarInterval(appliedToolbarInterval);
    setPendingCustomStart(appliedCustomStart);
    setPendingCustomEnd(appliedCustomEnd);
  };

  // Close the toolbar dropdowns on outside click via a mousedown listener (rather than a full-screen
  // backdrop div) so the click itself still reaches whatever it landed on — e.g. the Apply button, which
  // sits outside the dropdown panel. A backdrop would swallow that first click to just close the dropdown,
  // requiring a second click to actually apply.
  // FCNV/CSR view toggle — same dropdown pattern as HoldManagementOverview's CSR/Credit switch, placed next
  // to the Expand/Collapse KPIs button. Not wired to filter anything yet, just the toggle itself.
  const [activeView, setActiveView] = useState(NEW_OVERVIEW_VIEW_OPTIONS[0]);
  const [viewOpen, setViewOpen] = useState(false);

  const mailboxRef = useRef<HTMLDivElement>(null);
  const classificationRef = useRef<HTMLDivElement>(null);
  const businessGroupRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mailboxOpen && !classificationOpen && !businessGroupOpen && !toolbarIntervalOpen && !viewOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (mailboxOpen && !mailboxRef.current?.contains(target)) setMailboxOpen(false);
      if (classificationOpen && !classificationRef.current?.contains(target)) setClassificationOpen(false);
      if (businessGroupOpen && !businessGroupRef.current?.contains(target)) setBusinessGroupOpen(false);
      if (toolbarIntervalOpen && !intervalRef.current?.contains(target)) setToolbarIntervalOpen(false);
      if (viewOpen && !viewRef.current?.contains(target)) setViewOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mailboxOpen, classificationOpen, businessGroupOpen, toolbarIntervalOpen, viewOpen]);

  // Filter panel — a slide-in accordion, now the shared TableFilterPanel component (owns its own
  // pending/expanded/search state; this page just holds the committed `checkedFilters`).
  const [filterOpen, setFilterOpen] = useState(false);
  const [checkedFilters, setCheckedFilters] = useState<Record<string, Set<string>>>({});
  const activeFilterCount = Object.values(checkedFilters).reduce((sum, set) => sum + set.size, 0);
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});

  // Column Mgmt panel — slide-in with "Additional Columns" (categorized checklist) and "Sort Columns"
  // (drag-reorder, enabled columns only) tabs, plus Save/Cancel staging.
  const [colMgmtOpen, setColMgmtOpen] = useState(false);
  const [activeColTab, setActiveColTab] = useState<"additional" | "sort">("additional");
  const [expandedColCategory, setExpandedColCategory] = useState<string | null>(EMAIL_TABLE_COLUMN_CATEGORIES[0].label);
  const [colOrder, setColOrder] = useState<string[]>(NEW_OVERVIEW_DEFAULT_TOGGLEABLE_COLUMNS);
  const [tempColOrder, setTempColOrder] = useState<string[]>(colOrder);

  // Switching the FCNV/CSR view swaps in that view's own column preset — still just a starting point, since
  // the Column Mgmt panel can further customize/reorder it same as always. CSR view restores the CSR's own
  // saved Summary View selection (AC11) if one exists, falling back to the first-9-fields default.
  useEffect(() => {
    const preset = activeView === "CSR" ? (loadSavedCsrColumns() ?? NEW_OVERVIEW_CSR_DEFAULT_COLUMNS) : NEW_OVERVIEW_DEFAULT_TOGGLEABLE_COLUMNS;
    setColOrder(preset);
    setTempColOrder(preset);
    setExpandedColCategory(activeView === "CSR" ? NEW_OVERVIEW_CSR_COLUMN_CATEGORY.label : EMAIL_TABLE_COLUMN_CATEGORIES[0].label);
    // AC8 — TAT Color Coding: CSR view defaults to most-urgent-first (Red/Overdue, then Orange, Yellow, Green last).
    if (activeView === "CSR") {
      setSortKey("slaTimeRemaining");
      setSortDirection("asc");
    }
  }, [activeView]);
  const [dragColIdx, setDragColIdx] = useState<number | null>(null);
  const [dragOverColIdx, setDragOverColIdx] = useState<number | null>(null);
  const toggleAdditionalCol = (key: string) => {
    setTempColOrder((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      // AC11 — Summary View caps out at 10 displayed columns (1 sticky + up to 9 toggleable).
      if (activeView === "CSR" && prev.length >= NEW_OVERVIEW_CSR_MAX_ADDITIONAL_COLUMNS) {
        toast.error(`Summary View supports up to ${NEW_OVERVIEW_CSR_MAX_ADDITIONAL_COLUMNS + 1} columns — remove one before adding another.`);
        return prev;
      }
      return [...prev, key];
    });
  };

  const isInternal = (e: Email) => e.sender.endsWith("@intellisight.io");
  const allRows = worklistData ?? [];

  // AC7 — CSR view adds Business Group / CSR Owner / Request Type / Time Status to the filter panel
  // alongside the FCNV sections, since those fields only exist in the CSR Summary View column set.
  const activeFilterSections = activeView === "CSR" ? [...NEW_OVERVIEW_FILTER_SECTIONS, ...NEW_OVERVIEW_CSR_FILTER_SECTIONS] : NEW_OVERVIEW_FILTER_SECTIONS;

  const filterSectionOptions = activeFilterSections.map((sec) => ({
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
      const v = getEmailTableColumnValue(key, r, reviews);
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
    if (appliedBusinessGroups.length > 0 && !appliedBusinessGroups.includes(r.businessGroup ?? "")) return false;
    const matchPanel = activeFilterSections.every((sec) => {
      const sel = checkedFilters[sec.key];
      if (!sel || sel.size === 0) return true;
      return sel.has(sec.getValue(r));
    });
    if (!matchPanel) return false;
    const matchColumns = Object.entries(columnFilters).every(([key, set]) => {
      if (!set || set.size === 0) return true;
      return set.has(getEmailTableColumnValue(key, r, reviews));
    });
    if (!matchColumns) return false;
    return true;
  });

  const sortedRows = !sortKey ? rows : [...rows].sort((a, b) => {
    // Confidence has a real numeric field behind its "NN%" display string — sort on that directly instead
    // of comparing the strings, which would put "9%" after "85%".
    const cmp = sortKey === "confidence"
      ? (a.confidencePct ?? 0) - (b.confidencePct ?? 0)
      : sortKey === "slaTimeRemaining"
        ? (a.hoursRemaining ?? Infinity) - (b.hoursRemaining ?? Infinity)
        : getEmailTableColumnValue(sortKey, a, reviews).localeCompare(getEmailTableColumnValue(sortKey, b, reviews));
    return sortDirection === "asc" ? cmp : -cmp;
  });

  const selected = allRows.find((r) => r.id === selectedId) ?? allRows[0];
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const pageRows = sortedRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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

  // Real data-fetching means real loading/error states — the rest of this component assumes `selected`
  // and `allRows` are populated, so neither branch below falls through to it.
  if (worklistLoading || worklistError) {
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
              onNavigateCommunication={onNavigateCommunication}
              onNavigateEmailTemplate={onNavigateEmailTemplate}
              onNavigateFeedbackCenter={onNavigateFeedbackCenter}
              onNavigateEmailWorkflow={onNavigateEmailWorkflow}
            />
          </div>
          <main className="flex-1 flex items-center justify-center">
            {worklistError ? (
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <p className="text-[14px] font-semibold text-[#262626]">Couldn't load the worklist</p>
                <p className="text-[12.5px] text-[#97999B] max-w-[360px]">{worklistError}</p>
                <button
                  onClick={reloadWorklist}
                  className="mt-1 px-4 py-2 rounded-[8px] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <WaveLoader size={44} />
            )}
          </main>
        </div>
      </div>
    );
  }

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
            onNavigateCommunication={onNavigateCommunication}
            onNavigateEmailTemplate={onNavigateEmailTemplate}
            onNavigateFeedbackCenter={onNavigateFeedbackCenter}
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
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
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-[8px] text-white text-[10.5px] font-bold" style={{ backgroundColor: EMAIL_TABLE_NAVY }}>
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
                          style={allMailboxesSelected || someMailboxesSelected ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
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
                                style={checked ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
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
                          style={{ backgroundColor: EMAIL_TABLE_NAVY }}
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
                Last synced {lastSynced}
              </span>
              <button
                onClick={handleRefresh}
                disabled={syncing}
                title="Refresh"
                className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => setKpisExpanded((v) => !v)}
                title={kpisExpanded ? "Collapse KPIs" : "Expand KPIs"}
                className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
              >
                {kpisExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <div className="relative" ref={viewRef}>
                <button
                  onClick={() => setViewOpen((v) => !v)}
                  className={`flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${
                    viewOpen ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7]"
                  }`}
                >
                  {activeView}
                  <ChevronDown size={13} className={`transition-transform duration-200 ${viewOpen ? "rotate-180" : ""}`} />
                </button>
                {viewOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 py-1 w-[120px]">
                    {NEW_OVERVIEW_VIEW_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setActiveView(opt); setViewOpen(false); }}
                        className="w-full text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                        style={opt === activeView ? { color: EMAIL_TABLE_NAVY, fontWeight: 600 } : { color: "#4D4D4D" }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              {/* My Tasks / All Tasks — scopes the table to the current user's assigned queue vs everyone's */}
              <div className="flex items-center gap-[3px] p-[3px] bg-[#F1F2F4] border border-[#E2E6E9] rounded-[8px] h-[36px] shrink-0">
                <button
                  onClick={() => { setEmailScope("mine"); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 h-full rounded-[6px] text-[12.5px] font-semibold transition-all cursor-pointer whitespace-nowrap ${emailScope === "mine" ? "bg-white shadow-sm" : "text-[#666666] hover:text-[#4D4D4D]"}`}
                  style={emailScope === "mine" ? { color: EMAIL_TABLE_NAVY } : undefined}
                >
                  <User size={13} />
                  My Tasks
                </button>
                <button
                  onClick={() => { setEmailScope("all"); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 h-full rounded-[6px] text-[12.5px] font-semibold transition-all cursor-pointer whitespace-nowrap ${emailScope === "all" ? "bg-white shadow-sm" : "text-[#666666] hover:text-[#4D4D4D]"}`}
                  style={emailScope === "all" ? { color: EMAIL_TABLE_NAVY } : undefined}
                >
                  <Users size={13} />
                  All Tasks
                </button>
              </div>

              <TableToolbarSearch value={searchQuery} onCommit={(v) => { setSearchQuery(v); setPage(1); }} placeholder="Search Email" debounceMs={400} />
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Classification — multi-select, staged behind Apply */}
                <TableToolbarMultiSelect
                  label="Classification"
                  options={CLASSIFICATIONS}
                  pending={pendingClassifications}
                  onToggle={(c) => setPendingClassifications((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))}
                  onToggleAll={toggleAllClassifications}
                  onClear={() => setPendingClassifications([])}
                  open={classificationOpen}
                  onOpenChange={setClassificationOpen}
                  containerRef={classificationRef}
                  appliedCount={appliedClassifications.length}
                  dirty={classificationDirty}
                  width={220}
                />

                {/* Business Group — multi-select, staged behind Apply, same pattern as Classification */}
                <TableToolbarMultiSelect
                  label="Business Group"
                  options={BUSINESS_GROUPS}
                  pending={pendingBusinessGroups}
                  onToggle={(g) => setPendingBusinessGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))}
                  onToggleAll={toggleAllBusinessGroups}
                  onClear={() => setPendingBusinessGroups([])}
                  open={businessGroupOpen}
                  onOpenChange={setBusinessGroupOpen}
                  containerRef={businessGroupRef}
                  appliedCount={appliedBusinessGroups.length}
                  dirty={businessGroupDirty}
                  width={220}
                />

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
                            style={opt === pendingToolbarInterval ? { color: EMAIL_TABLE_NAVY, fontWeight: 600 } : { color: "#4D4D4D" }}
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
                <TableToolbarApplyReset dirty={filtersAreDirty} onApply={applyToolbarFilters} onReset={resetToolbarFilters} />

                {/* Table view / Email view toggle — hidden for now, viewMode stays locked to "grid" (table).
                <div className="w-px h-5 bg-[#E2E6E9]" />

                <div className="flex items-center border border-[#E2E6E9] rounded-[8px] overflow-hidden h-[36px]">
                  <button
                    onClick={() => setViewMode("grid")}
                    title="Table view"
                    className={`flex items-center justify-center w-[36px] h-full transition-colors cursor-pointer ${viewMode === "grid" ? "text-white" : "bg-white text-[#666666] hover:bg-[#F7F7F7]"}`}
                    style={viewMode === "grid" ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                  >
                    <List size={15} />
                  </button>
                  <div className="w-px h-5 bg-[#E2E6E9]" />
                  <button
                    onClick={() => setViewMode("list")}
                    title="Email view"
                    className={`flex items-center justify-center w-[36px] h-full transition-colors cursor-pointer ${viewMode === "list" ? "text-white" : "bg-white text-[#666666] hover:bg-[#F7F7F7]"}`}
                    style={viewMode === "list" ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>
                */}

                <div className="w-px h-5 bg-[#E2E6E9]" />

                {/* Filter — opens the slide-in Filters panel below */}
                <TableFilterTrigger
                  open={filterOpen}
                  onOpenChange={(o) => { setFilterOpen(o); if (o) setColMgmtOpen(false); }}
                  activeCount={activeFilterCount}
                />

                {/* Manage columns — opens the slide-in Column Mgmt panel below (bespoke: categorized "Additional
                    Columns" checklist, doesn't fit the shared flat-column-list Column Mgmt panel) */}
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
                    <span className="absolute -top-1 -right-1 size-[8px] rounded-full ring-2 ring-white" style={{ backgroundColor: EMAIL_TABLE_NAVY }} />
                  )}
                </button>
              </div>
            </div>

            {/* View body — Filter and Column Mgmt slide-in panels overlay this area only */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className="h-full min-h-0 overflow-hidden">
              {viewMode === "grid" ? (
                <EmailTable
                  rows={pageRows}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpanded}
                  onOpenRow={(id) => onNavigateWorkflow(id, emailScope)}
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
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                  subjectColumnLabel={activeView === "CSR" ? "CCC Request #" : "From/Subject"}
                  subjectPrimaryField={activeView === "CSR" ? "cccId" : "id"}
                  subjectSortKey={activeView === "CSR" ? "cccId" : "sender"}
                  onOpenAttachment={setPreviewAttachments}
                  onSendEmail={(email) => onNavigateCommunication?.({ emailId: email.id })}
                />
              ) : (
                <NewOverviewListView
                  rows={rows}
                  selectedId={selected.id}
                  onSelect={setSelectedId}
                  selected={selected}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpanded}
                  onOpenWorkflow={(id) => onNavigateWorkflow(id, emailScope)}
                />
              )}
            </div>

            <TableFilterPanel
              open={filterOpen}
              onOpenChange={setFilterOpen}
              columns={activeFilterSections.map((sec) => ({ key: sec.key, label: sec.label }))}
              columnFilters={checkedFilters}
              getOptions={(key) => Object.entries(filterSectionOptions.find((sec) => sec.key === key)?.options ?? {}).sort((a, b) => b[1] - a[1])}
              onApply={(next) => { setCheckedFilters(next); setPage(1); }}
            />

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
                      <span className="text-[12px] font-medium pb-2 whitespace-nowrap" style={{ color: active ? EMAIL_TABLE_NAVY : "#666666" }}>{labels[tab]}</span>
                      <div className="h-[2px] w-full" style={{ backgroundColor: active ? EMAIL_TABLE_NAVY : "transparent" }} />
                    </button>
                  );
                })}
              </div>
              <div className="flex-1 overflow-y-auto">
                {activeColTab === "additional" && (activeView === "CSR" ? [NEW_OVERVIEW_CSR_COLUMN_CATEGORY] : EMAIL_TABLE_COLUMN_CATEGORIES).map((cat) => {
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
                          <span style={hasSelections || isOpen ? { color: EMAIL_TABLE_NAVY, fontWeight: 600 } : { color: "#262626" }}>{cat.label}</span>
                          <span className="text-[#97999B]"> ({checkedCount}/{cat.columns.length})</span>
                        </span>
                        <ChevronDown size={14} className="shrink-0 transition-transform duration-200" style={{ color: hasSelections || isOpen ? EMAIL_TABLE_NAVY : "#97999B", transform: isOpen ? "rotate(180deg)" : undefined }} />
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
                                  style={checked ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
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
                          style={dragOverColIdx === idx && dragColIdx !== idx ? { borderTopColor: EMAIL_TABLE_NAVY } : undefined}
                        >
                          <GripVertical size={14} className="text-[#D9D9D6] shrink-0" />
                          <span className="flex-1 text-[13px] text-[#262626]">{EMAIL_TABLE_ADDITIONAL_COLUMN_LABELS[key]}</span>
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
                  style={{ borderColor: EMAIL_TABLE_NAVY, color: EMAIL_TABLE_NAVY }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setColOrder([...tempColOrder]);
                    setColMgmtOpen(false);
                    // AC11 — persist the CSR's personalized Summary View selection across sessions.
                    if (activeView === "CSR") saveCsrColumns(tempColOrder);
                    toast.success("Column settings saved");
                  }}
                  className="px-3.5 py-1.5 rounded-[8px] text-white text-[12.5px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                >
                  Save
                </button>
              </div>
            </div>
            </div>

            {/* Pagination — only meaningful for the table view */}
            {viewMode === "grid" && (
              <TablePagination
                showing={pageRows.length}
                total={rows.length}
                density={rowDensity}
                onDensityChange={setRowDensity}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={changeRowsPerPage}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                densityTooltips={{ small: "Compact — ID only", medium: "Medium — ID + email", large: "Comfortable — full details" }}
              />
            )}
          </div>
        </main>
      </div>
      <AttachmentPreviewModal
        attachment={previewAttachments?.[0] ?? null}
        attachments={previewAttachments ?? undefined}
        onClose={() => setPreviewAttachments(null)}
      />
    </div>
  );
}
