import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ChevronsUpDown, Copy, Plus, SquarePen, Trash2, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { EMAIL_TABLE_NAVY, EMPTY_SET, EmailTableColumnFilterButton, EmailTableTooltip, TruncateTooltip } from "../../components/common/EmailTable";
import { TableToolbarApplyReset, TableToolbarMultiSelect, TableToolbarSearch, useExclusiveOpen } from "../../components/common/TableToolbar";
import { TablePagination, type RowDensity } from "../../components/common/TablePagination";

type EmailTemplate = {
  id: string;
  name: string;
  category: string;
  language: string;
  subject: string;
  createdBy: string;
  updatedAt: string; // ISO
};

type ColumnKey = "name" | "category" | "language" | "subject" | "createdBy" | "updatedAt";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "language", label: "Language" },
  { key: "subject", label: "Subject" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedAt", label: "Updated At" },
];

const CATEGORY_PILL: Record<string, { bg: string; fg: string }> = {
  "Work Order": { bg: "#3882F61F", fg: "#3882F6" },
  "Trade Order": { bg: "#7C3BF61A", fg: "#7C3BF6" },
  "Post Order Booking": { bg: "#0891B51A", fg: "#0891B5" },
  Uncategorized: { bg: "#6375901A", fg: "#637590" },
  FCNV: { bg: "#16B1511A", fg: "#0C883C" },
};

const CATEGORIES = ["Uncategorized", "Trade Order", "Work Order", "Post Order Booking", "FCNV"];
const LANGUAGES = ["No Language", "English", "French", "Italian", "Japanese"];

const INITIAL_TEMPLATES: EmailTemplate[] = [
  { id: "1", name: "test_sourish", category: "Work Order", language: "No Language", subject: "text", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-24T22:48:00" },
  { id: "2", name: "test_ss", category: "Trade Order", language: "No Language", subject: "test", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-23T10:43:00" },
  { id: "3", name: "SOA_TEST101", category: "Uncategorized", language: "English", subject: "intellisight", createdBy: "gaurish.sharma@keysight.com", updatedAt: "2026-08-21T12:01:00" },
  { id: "4", name: "SOA_Ack_Template", category: "Trade Order", language: "English", subject: "Sales Order Acknowledgement example", createdBy: "amit_tuteja@keysight.com", updatedAt: "2026-08-19T21:25:00" },
  { id: "5", name: "SOA_Template", category: "Trade Order", language: "English", subject: "Sales Order Acknowledgement", createdBy: "amit_tuteja@keysight.com", updatedAt: "2026-08-19T18:55:00" },
  { id: "6", name: "SOA_ASO_QuoteTerms (Copy 2)", category: "Trade Order", language: "French", subject: "Sales Order Acknowledgement – Quote Terms", createdBy: "amit_tuteja@keysight.com", updatedAt: "2026-08-19T18:51:00" },
  { id: "7", name: "SOA_ASO_QuoteTerms (Copy)", category: "Trade Order", language: "Italian", subject: "Sales Order Acknowledgement – Quote Terms", createdBy: "amit_tuteja@keysight.com", updatedAt: "2026-08-19T17:51:00" },
  { id: "8", name: "SOA_ASO_PATerms", category: "Trade Order", language: "No Language", subject: "Sales Order Acknowledgement – Purchase Agreement Terms", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-19T14:15:00" },
  { id: "9", name: "SOA_EMEA_GB_GB_EN", category: "Trade Order", language: "Japanese", subject: "Your Keysight Sales Order Acknowledgement", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-19T02:16:00" },
  { id: "10", name: "Order Confirmation", category: "Trade Order", language: "English", subject: "Order Confirmation — {{CCC_Number}} | {{Account}}", createdBy: "pranay.gupta@keysight.com", updatedAt: "2026-08-18T21:03:00" },
  { id: "11", name: "Order Status Update", category: "Post Order Booking", language: "No Language", subject: "Order Update - {{PO}} ({{Owner}})", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-18T13:00:00" },
  { id: "12", name: "Order Hold Follow-Up", category: "Post Order Booking", language: "No Language", subject: "Order Hold Follow-Up", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-18T12:57:00" },
  { id: "13", name: "Shipment Delay Notice", category: "Post Order Booking", language: "English", subject: "Shipment Delay Notice — {{PO}}", createdBy: "pranay.gupta@keysight.com", updatedAt: "2026-08-17T16:20:00" },
  { id: "14", name: "Quote Expiry Reminder", category: "Trade Order", language: "English", subject: "Your Quote is Expiring Soon — {{Quote_Number}}", createdBy: "amit_tuteja@keysight.com", updatedAt: "2026-08-16T11:05:00" },
  { id: "15", name: "Credit Hold Notification", category: "Post Order Booking", language: "English", subject: "Account on Credit Hold — Action Required", createdBy: "gaurish.sharma@keysight.com", updatedAt: "2026-08-15T09:40:00" },
  { id: "16", name: "Welcome Email", category: "Uncategorized", language: "English", subject: "Welcome to Keysight", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-14T15:10:00" },
  { id: "17", name: "Invoice Reminder", category: "Trade Order", language: "No Language", subject: "Invoice Past Due — {{Invoice_Number}}", createdBy: "pranay.gupta@keysight.com", updatedAt: "2026-08-13T10:00:00" },
  { id: "18", name: "RMA Confirmation", category: "Post Order Booking", language: "English", subject: "Return Merchandise Authorization Confirmed", createdBy: "amit_tuteja@keysight.com", updatedAt: "2026-08-12T14:30:00" },
  { id: "19", name: "Order Escalation", category: "FCNV", language: "No Language", subject: "Escalation Required — {{CCC_Number}}", createdBy: "gaurish.sharma@keysight.com", updatedAt: "2026-08-11T08:45:00" },
  { id: "20", name: "Test_pranay", category: "FCNV", language: "No Language", subject: "draft test", createdBy: "pranay.gupta@keysight.com", updatedAt: "2026-08-10T19:12:00" },
];

function formatUpdatedAt(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// Display/filter value per column — Updated At filters by its formatted string (what the user actually
// sees in the filter dropdown) while sorting still uses the raw ISO value for correct chronological order.
function columnDisplayValue(key: ColumnKey, t: EmailTemplate): string {
  return key === "updatedAt" ? formatUpdatedAt(t.updatedAt) : t[key];
}

export function EmailTemplatePage({
  onViewAllNotifications,
  onLogout,
  onNavigateHome,
  onNavigateCommandCenterOverview,
  onNavigateCommandCenterEmailView,
  onNavigateNewOverview,
  onNavigateHoldManagementOverview,
  onNavigateOrderListing,
  onNavigateReleasedOrders,
  onNavigateCommunication,
  onNavigateEmailTemplate,
  onNavigateReview,
  onNavigateEmailWorkflow,
  onNavigateCreateEmailTemplate,
  onNavigateEditEmailTemplate,
}: {
  onViewAllNotifications: () => void;
  onLogout?: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateCommunication?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateReview?: () => void;
  onNavigateEmailWorkflow?: () => void;
  onNavigateCreateEmailTemplate?: () => void;
  onNavigateEditEmailTemplate?: (template: EmailTemplate) => void;
}) {
  // Search — shared toolbar search box, live filtering (no debounce) since this is local mock data.
  const [searchQuery, setSearchQuery] = useState("");
  const updateSearch = (v: string) => { setSearchQuery(v); setPage(1); };

  // Row data — stateful (not the static INITIAL_TEMPLATES) so Duplicate/Delete can actually add/remove rows.
  const [templates, setTemplates] = useState<EmailTemplate[]>(INITIAL_TEMPLATES);

  // Duplicate — inserts a real copy right after the original, named the same way the reference data does
  // it ("X (Copy)", "X (Copy 2)", ...) rather than just re-using "(Copy)" if one already exists.
  const duplicateTemplate = (t: EmailTemplate) => {
    const copyPattern = new RegExp(`^${t.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(Copy(?: (\\d+))?\\)$`);
    const existingCopyNumbers = templates
      .map((existing) => existing.name.match(copyPattern)?.[1])
      .filter((n): n is string => n !== undefined)
      .map(Number);
    const hasBareCopy = templates.some((existing) => existing.name === `${t.name} (Copy)`);
    const nextNumber = existingCopyNumbers.length > 0 ? Math.max(...existingCopyNumbers) + 1 : hasBareCopy ? 2 : null;
    const newName = nextNumber ? `${t.name} (Copy ${nextNumber})` : `${t.name} (Copy)`;
    const copy: EmailTemplate = { ...t, id: `${t.id}-copy-${Date.now()}`, name: newName, updatedAt: new Date().toISOString() };
    setTemplates((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
    toast.success(`Duplicated "${t.name}"`);
  };

  // Delete — gated behind a confirmation modal rather than firing immediately from the row icon.
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setTemplates((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    toast.error(`Deleted "${deleteTarget.name}"`);
    setDeleteTarget(null);
  };

  // Per-column filters — same funnel-icon-in-header convention as EmailTable.
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const columnFilterOptions = (key: string): [string, number][] => {
    const counts: Record<string, number> = {};
    for (const t of templates) {
      const v = columnDisplayValue(key as ColumnKey, t);
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
    setColumnFilters((prev) => ({ ...prev, [key]: new Set() }));
    setPage(1);
  };

  // Category + Language — staged multi-select toolbar filters, copied from NewOverviewPage's
  // Classification/Interval pattern: always visible, picks stage in `pending` until Apply commits them
  // into `columnFilters` (the same state the per-column funnel filters on the other columns write to).
  const appliedCategories = Array.from(columnFilters.category ?? []);
  const appliedLanguages = Array.from(columnFilters.language ?? []);
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const [pendingLanguages, setPendingLanguages] = useState<string[]>([]);
  const { openKey, setOpenKey, registerRef } = useExclusiveOpen();
  const categoryDirty = pendingCategories.slice().sort().join("|") !== appliedCategories.slice().sort().join("|");
  const languageDirty = pendingLanguages.slice().sort().join("|") !== appliedLanguages.slice().sort().join("|");
  const toolbarFiltersDirty = categoryDirty || languageDirty;
  const toggleCategory = (c: string) => setPendingCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleAllCategories = () => setPendingCategories((prev) => (prev.length === CATEGORIES.length ? [] : [...CATEGORIES]));
  const toggleLanguage = (l: string) => setPendingLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  const toggleAllLanguages = () => setPendingLanguages((prev) => (prev.length === LANGUAGES.length ? [] : [...LANGUAGES]));
  const applyToolbarFilters = () => {
    setColumnFilters((prev) => ({ ...prev, category: new Set(pendingCategories), language: new Set(pendingLanguages) }));
    setOpenKey(null);
    setPage(1);
  };
  const resetToolbarFilters = () => {
    setPendingCategories(appliedCategories);
    setPendingLanguages(appliedLanguages);
  };

  const [sortKey, setSortKey] = useState<ColumnKey>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const toggleSort = (key: ColumnKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const [rowDensity, setRowDensity] = useState<RowDensity>("large");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const changeRowsPerPage = (n: number) => { setRowsPerPage(n); setPage(1); };

  const sortedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = templates.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
      for (const col of COLUMNS) {
        const active = columnFilters[col.key];
        if (active && active.size > 0 && !active.has(columnDisplayValue(col.key, t))) return false;
      }
      return true;
    });
    filtered = filtered.slice().sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [templates, searchQuery, columnFilters, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const pageRows = sortedRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const rowPadY = rowDensity === "small" ? "py-1.5" : rowDensity === "medium" ? "py-2.5" : "py-3.5";

  return (
    <>
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
          <AppHeader
            activeNav="Email Template"
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
            onNavigateReview={onNavigateReview}
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
          />
        </div>

        <main className="flex-1 min-h-0 flex flex-col w-full max-w-[1600px] mx-auto px-5 py-5 gap-4 overflow-hidden">
          {/* Page header */}
          <div>
            <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Email Templates</h1>
            <p className="text-[12px] text-[#97999B] mt-0.5">Manage email templates for automated responses</p>
          </div>

          {/* Content card: toolbar + table */}
          <div className="flex-1 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
              <TableToolbarSearch value={searchQuery} onCommit={updateSearch} placeholder="Search templates..." />

              <div className="flex items-center gap-2.5 flex-wrap ml-auto">
                <TableToolbarMultiSelect
                  label="Category"
                  options={CATEGORIES}
                  pending={pendingCategories}
                  onToggle={toggleCategory}
                  onToggleAll={toggleAllCategories}
                  onClear={() => setPendingCategories([])}
                  open={openKey === "category"}
                  onOpenChange={(o) => setOpenKey(o ? "category" : null)}
                  containerRef={registerRef("category")}
                  appliedCount={appliedCategories.length}
                  dirty={categoryDirty}
                />
                <TableToolbarMultiSelect
                  label="Language"
                  options={LANGUAGES}
                  pending={pendingLanguages}
                  onToggle={toggleLanguage}
                  onToggleAll={toggleAllLanguages}
                  onClear={() => setPendingLanguages([])}
                  open={openKey === "language"}
                  onOpenChange={(o) => setOpenKey(o ? "language" : null)}
                  containerRef={registerRef("language")}
                  appliedCount={appliedLanguages.length}
                  dirty={languageDirty}
                />

                <TableToolbarApplyReset dirty={toolbarFiltersDirty} onApply={applyToolbarFilters} onReset={resetToolbarFilters} />

                <div className="w-px h-5 bg-[#E2E6E9]" />

                <button
                  onClick={() => (onNavigateCreateEmailTemplate ? onNavigateCreateEmailTemplate() : toast.info("Create Template — coming soon"))}
                  title="Create Template"
                  className="flex items-center justify-center size-[36px] rounded-[8px] text-white hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#F7F7F7]">
                    {COLUMNS.map((col) => {
                      const active = sortKey === col.key;
                      const SortIcon = sortDirection === "desc" ? ArrowDown : ArrowUp;
                      return (
                        <th key={col.key} className="group sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 cursor-pointer">
                              <span className={`text-[12px] font-semibold ${active ? "text-[#262626]" : "text-[#4D4D4D]"}`}>{col.label}</span>
                              {active ? (
                                <SortIcon size={12} style={{ color: EMAIL_TABLE_NAVY }} />
                              ) : (
                                <ChevronsUpDown size={12} className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" style={{ color: "#97999B" }} />
                              )}
                            </button>
                            {col.key !== "category" && col.key !== "language" && (
                              <EmailTableColumnFilterButton
                                colKey={col.key}
                                getOptions={columnFilterOptions}
                                selected={columnFilters[col.key] ?? EMPTY_SET}
                                onToggle={(v) => toggleColumnFilterValue(col.key, v)}
                                onClear={() => clearColumnFilter(col.key)}
                              />
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                      <span className="text-[12px] font-semibold text-[#4D4D4D]">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-[13px] text-[#97999B]">No templates match your filters</td>
                    </tr>
                  ) : (
                    pageRows.map((t) => {
                      const pill = CATEGORY_PILL[t.category] ?? CATEGORY_PILL.Uncategorized;
                      return (
                        <tr
                          key={t.id}
                          onClick={() => onNavigateEditEmailTemplate?.(t)}
                          className="group hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                        >
                          <td className={`px-4 ${rowPadY} max-w-[220px] border-b border-[#DEDEDE]`}>
                            <TruncateTooltip label={t.name} className="text-[12.5px] font-semibold text-[#262626]" />
                          </td>
                          <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: pill.bg, color: pill.fg }}>
                              {t.category}
                            </span>
                          </td>
                          <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                            <span className={`text-[12.5px] ${t.language === "No Language" ? "text-[#97999B]" : "text-[#4D4D4D]"}`}>
                              {t.language === "No Language" ? "-" : t.language}
                            </span>
                          </td>
                          <td className={`px-4 ${rowPadY} max-w-[280px] border-b border-[#DEDEDE]`}>
                            <TruncateTooltip label={t.subject} className="text-[12.5px] text-[#4D4D4D]" />
                          </td>
                          <td className={`px-4 ${rowPadY} max-w-[200px] border-b border-[#DEDEDE]`}>
                            <TruncateTooltip label={t.createdBy} className="text-[12.5px] text-[#4D4D4D]" />
                          </td>
                          <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                            <span className="text-[12px] text-[#97999B]">{formatUpdatedAt(t.updatedAt)}</span>
                          </td>
                          <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <EmailTableTooltip label="Edit">
                                <button
                                  onClick={() => onNavigateEditEmailTemplate?.(t)}
                                  className="flex items-center justify-center size-[28px] rounded-[6px] text-[#666666] hover:bg-[#F1F2F4] hover:text-[#262626] cursor-pointer transition-colors"
                                >
                                  <SquarePen size={14} />
                                </button>
                              </EmailTableTooltip>
                              <EmailTableTooltip label="Duplicate">
                                <button
                                  onClick={() => duplicateTemplate(t)}
                                  className="flex items-center justify-center size-[28px] rounded-[6px] text-[#666666] hover:bg-[#F1F2F4] hover:text-[#262626] cursor-pointer transition-colors"
                                >
                                  <Copy size={14} />
                                </button>
                              </EmailTableTooltip>
                              <EmailTableTooltip label="Delete">
                                <button
                                  onClick={() => setDeleteTarget(t)}
                                  className="flex items-center justify-center size-[28px] rounded-[6px] text-[#666666] hover:bg-[#FAEBEB] hover:text-[#C83737] cursor-pointer transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </EmailTableTooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              showing={pageRows.length}
              total={sortedRows.length}
              density={rowDensity}
              onDensityChange={setRowDensity}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={changeRowsPerPage}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              densityTooltips={{ small: "Compact", medium: "Medium", large: "Comfortable" }}
            />
          </div>
        </main>
      </div>
    </div>

    {deleteTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
        <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
            <span className="text-[16px] font-bold text-[#262626]">Delete template</span>
            <button onClick={() => setDeleteTarget(null)} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5">
            <p className="text-[13px] text-[#4D4D4D] leading-[1.6]">
              Are you sure you want to delete <span className="font-semibold text-[#262626]">"{deleteTarget.name}"</span>? This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
              style={{ backgroundColor: "#C83737" }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
