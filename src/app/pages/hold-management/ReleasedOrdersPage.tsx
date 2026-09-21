import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { EMAIL_TABLE_NAVY, EMPTY_SET, EmailTableColumnFilterButton, TruncateTooltip } from "../../components/common/EmailTable";
import { TableToolbarApplyReset, TableToolbarMultiSelect, TableToolbarSearch, useExclusiveOpen, useStagedMultiSelect } from "../../components/common/TableToolbar";
import { TableFilterPanel, TableFilterTrigger } from "../../components/common/TableFilterPanel";
import { TableColumnMgmtPanel, TableColumnMgmtTrigger } from "../../components/common/TableColumnMgmtPanel";
import { TablePagination, type RowDensity } from "../../components/common/TablePagination";
import { ALL_RELEASED } from "./holdManagementData";

type ReleasedOrder = (typeof ALL_RELEASED)[number];
type ColumnKey = keyof ReleasedOrder | "status";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "id", label: "Order Id" },
  { key: "holdType", label: "Hold Type" },
  { key: "customer", label: "Customer Name" },
  { key: "poId", label: "Customer PO ID" },
  { key: "value", label: "Value" },
  { key: "title", label: "Title" },
];

// Every row is released, so "status" isn't a real field on the data — it's synthesized as a constant here
// (and from `releasedDays` for display) purely so the column behaves like every other column for
// filtering/sorting purposes.
function columnValue(o: ReleasedOrder, key: ColumnKey): string {
  return key === "status" ? "Released" : String(o[key]);
}

const HOLD_CATEGORIES = Array.from(new Set(ALL_RELEASED.map((o) => o.holdType)));
// Mirrors the original page's dropdown exactly: labeled "Hold Type" but filters on `title`.
const HOLD_TYPES = Array.from(new Set(ALL_RELEASED.map((o) => o.title)));

export function ReleasedOrdersPage({ onLogout, onViewAllNotifications, onNavigateHome, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateNewOverview, onNavigateOverview, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateCommunication, onNavigateOrderDetails, onNavigateEmailTemplate, onNavigateFeedbackCenter, onNavigateEmailWorkflow }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateOverview: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateCommunication?: () => void;
  onNavigateOrderDetails?: (orderId: string) => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  const [page, setPage] = useState(1);

  // Search — shared toolbar search box, live filtering (no debounce) since this is local mock data.
  const [searchQuery, setSearchQuery] = useState("");
  const updateSearch = (v: string) => { setSearchQuery(v); setPage(1); };

  // Hold Category / Hold Type — staged multi-select toolbar dropdowns sharing one Apply/Reset pair.
  const { openKey, setOpenKey, registerRef } = useExclusiveOpen();
  const category = useStagedMultiSelect(HOLD_CATEGORIES);
  const holdType = useStagedMultiSelect(HOLD_TYPES);
  const toolbarFiltersDirty = category.dirty || holdType.dirty;
  const applyToolbarFilters = () => { category.apply(); holdType.apply(); setOpenKey(null); setPage(1); };
  const resetToolbarFilters = () => { category.reset(); holdType.reset(); };

  // Per-column filters — same funnel-icon-in-header convention as EmailTable/OrderListingPage.
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const columnFilterOptions = (key: string): [string, number][] => {
    const counts: Record<string, number> = {};
    for (const o of ALL_RELEASED) {
      const v = columnValue(o, key as ColumnKey);
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
  const activeFilterCount = Object.values(columnFilters).reduce((sum, set) => sum + set.size, 0);

  // Filter panel / Column Mgmt panel — only one of these two slide-ins open at a time.
  const [openPanel, setOpenPanel] = useState<"filter" | "columns" | null>(null);

  const [sortKey, setSortKey] = useState<ColumnKey>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const toggleSort = (key: ColumnKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const [colOrder, setColOrder] = useState<ColumnKey[]>(COLUMNS.map((c) => c.key));
  const visibleColumnList = colOrder.map((key) => COLUMNS.find((c) => c.key === key)).filter((c): c is { key: ColumnKey; label: string } => Boolean(c));

  const [rowDensity, setRowDensity] = useState<RowDensity>("large");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const changeRowsPerPage = (n: number) => { setRowsPerPage(n); setPage(1); };

  const sortedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = ALL_RELEASED.filter((o) => {
      if (q && !o.id.toLowerCase().includes(q) && !o.customer.toLowerCase().includes(q) && !o.poId.toLowerCase().includes(q) && !o.title.toLowerCase().includes(q)) return false;
      if (category.applied.length > 0 && !category.applied.includes(o.holdType)) return false;
      if (holdType.applied.length > 0 && !holdType.applied.includes(o.title)) return false;
      for (const col of COLUMNS) {
        const active = columnFilters[col.key];
        if (active && active.size > 0 && !active.has(columnValue(o, col.key))) return false;
      }
      return true;
    });
    filtered = filtered.slice().sort((a, b) => {
      const cmp = columnValue(a, sortKey).localeCompare(columnValue(b, sortKey), undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [searchQuery, category.applied, holdType.applied, columnFilters, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const pageRows = sortedRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const rowPadY = rowDensity === "small" ? "py-1.5" : rowDensity === "medium" ? "py-2.5" : "py-3.5";

  const renderCell = (key: ColumnKey, row: ReleasedOrder) => {
    switch (key) {
      case "status":
        return (
          <span className="inline-flex items-center justify-center px-2 py-1 rounded-[8px] text-[12px] font-medium whitespace-nowrap" style={{ color: "#468657", backgroundColor: "#EFF6F1" }}>
            Released {row.releasedDays}
          </span>
        );
      case "id":
        return (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigateOrderDetails?.(row.id); }}
            className="text-[#30578D] text-[12.5px] font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
          >
            {row.id}
          </button>
        );
      case "poId":
        return <TruncateTooltip label={row.poId} className="text-[12.5px] text-[#4D4D4D] max-w-[160px]" />;
      case "value":
        return <span className="text-[12.5px] font-semibold text-[#262626]">{row.value}</span>;
      default:
        return <span className="text-[12.5px] text-[#4D4D4D]">{row[key]}</span>;
    }
  };

  return (
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
          <AppHeader
            activeNav="Hold Management"
            onViewAllNotifications={onViewAllNotifications}
            onLogout={onLogout}
            onNavigateHome={onNavigateHome}
            onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
            onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
            onNavigateNewOverview={onNavigateNewOverview}
            onNavigateHoldManagementOverview={onNavigateOverview}
            onNavigateOrderListing={onNavigateOrderListing}
            onNavigateReleasedOrders={onNavigateReleasedOrders}
            onNavigateCommunication={onNavigateCommunication}
            onNavigateEmailTemplate={onNavigateEmailTemplate}
            onNavigateFeedbackCenter={onNavigateFeedbackCenter}
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
          />
        </div>

        <main className="flex-1 min-h-0 flex flex-col w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 gap-4 overflow-hidden">
          {/* Page header */}
          <div className="flex items-start gap-2.5">
            <div>
              <Breadcrumbs items={[{ label: "Hold Mgmt", onClick: onNavigateOverview }, { label: "Released Orders" }]} />
              <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Released Orders</h1>
              <p className="text-[12px] text-[#97999B] mt-0.5">Orders that have been released from hold</p>
            </div>
          </div>

          {/* Content card: toolbar + table */}
          <div className="flex-1 min-h-0 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
              <TableToolbarSearch value={searchQuery} onCommit={updateSearch} placeholder="Search orders..." />

              <div className="flex items-center gap-2.5 ml-auto flex-wrap">
                <TableToolbarMultiSelect
                  label="Hold Category"
                  options={HOLD_CATEGORIES}
                  pending={category.pending}
                  onToggle={category.toggle}
                  onToggleAll={category.toggleAll}
                  onClear={category.clear}
                  open={openKey === "category"}
                  onOpenChange={(o) => setOpenKey(o ? "category" : null)}
                  containerRef={registerRef("category")}
                  appliedCount={category.applied.length}
                  dirty={category.dirty}
                  width={240}
                />

                <TableToolbarMultiSelect
                  label="Hold Type"
                  options={HOLD_TYPES}
                  pending={holdType.pending}
                  onToggle={holdType.toggle}
                  onToggleAll={holdType.toggleAll}
                  onClear={holdType.clear}
                  open={openKey === "holdType"}
                  onOpenChange={(o) => setOpenKey(o ? "holdType" : null)}
                  containerRef={registerRef("holdType")}
                  appliedCount={holdType.applied.length}
                  dirty={holdType.dirty}
                  width={220}
                />

                <TableToolbarApplyReset dirty={toolbarFiltersDirty} onApply={applyToolbarFilters} onReset={resetToolbarFilters} />

                <div className="w-px h-5 bg-[#E2E6E9]" />

                <div className="flex items-center gap-2.5 shrink-0">
                  <TableFilterTrigger open={openPanel === "filter"} onOpenChange={(o) => setOpenPanel(o ? "filter" : null)} activeCount={activeFilterCount} />
                  <TableColumnMgmtTrigger open={openPanel === "columns"} onOpenChange={(o) => setOpenPanel(o ? "columns" : null)} />
                </div>
              </div>
            </div>

            {/* View body — Filter and Column Mgmt slide-in panels overlay this area only */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
              <div className="h-full min-h-0 overflow-auto">
                <table className="w-full min-w-[1100px] border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-[#F7F7F7]">
                      {visibleColumnList.map((col) => {
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
                              <EmailTableColumnFilterButton
                                colKey={col.key}
                                getOptions={columnFilterOptions}
                                selected={columnFilters[col.key] ?? EMPTY_SET}
                                onToggle={(v) => toggleColumnFilterValue(col.key, v)}
                                onClear={() => clearColumnFilter(col.key)}
                              />
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length === 0 ? (
                      <tr>
                        <td colSpan={visibleColumnList.length} className="px-4 py-16 text-center text-[13px] text-[#97999B]">No released orders match your filters</td>
                      </tr>
                    ) : (
                      pageRows.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => onNavigateOrderDetails?.(row.id)}
                          className="hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                        >
                          {visibleColumnList.map((col) => (
                            <td key={col.key} className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                              {renderCell(col.key, row)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <TableFilterPanel
                open={openPanel === "filter"}
                onOpenChange={(o) => setOpenPanel(o ? "filter" : null)}
                columns={COLUMNS}
                columnFilters={columnFilters}
                getOptions={columnFilterOptions}
                onApply={(next) => { setColumnFilters(next); setPage(1); }}
              />

              <TableColumnMgmtPanel
                open={openPanel === "columns"}
                onOpenChange={(o) => setOpenPanel(o ? "columns" : null)}
                columns={COLUMNS}
                value={colOrder}
                onApply={(next) => setColOrder(next as ColumnKey[])}
              />
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
            />
          </div>
        </main>
      </div>
    </div>
  );
}
