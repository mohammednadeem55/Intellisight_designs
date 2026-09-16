import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  DollarSign,
  Download,
  Inbox,
  Maximize2,
  Minimize2,
  RefreshCw,
  Star,
} from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { EMAIL_TABLE_NAVY, EMPTY_SET, EmailTableColumnFilterButton, TruncateTooltip } from "../../components/common/EmailTable";
import { TableToolbarApplyReset, TableToolbarMultiSelect, TableToolbarSearch, useExclusiveOpen, useStagedMultiSelect } from "../../components/common/TableToolbar";
import { TableFilterPanel, TableFilterTrigger } from "../../components/common/TableFilterPanel";
import { TableColumnMgmtPanel, TableColumnMgmtTrigger } from "../../components/common/TableColumnMgmtPanel";
import { TablePagination, type RowDensity } from "../../components/common/TablePagination";
import { exportRowsToExcel } from "../../components/common/exportExcel";
import { ALL_ORDERS } from "./holdManagementData";
import { loadFavoriteOrderIds, saveFavoriteOrderIds } from "./favoritesStorage";

type Order = (typeof ALL_ORDERS)[number];
type ColumnKey = keyof Order;

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "id", label: "Order Id" },
  { key: "holdType", label: "Hold Type" },
  { key: "customer", label: "Customer Name" },
  { key: "poId", label: "Customer PO ID" },
  { key: "ocn", label: "OCN" },
  { key: "ou", label: "Operating Unit (OU)" },
  { key: "ssd", label: "SSD" },
  { key: "country", label: "Country" },
];

const HOLD_CATEGORIES = Array.from(new Set(ALL_ORDERS.map((o) => o.holdType)));
const HOLD_TYPES = ["On Track", "At Risk", "Breached"];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  "On Track": { color: "#468657", bg: "#EFF6F1" },
  "At Risk": { color: "#E67919", bg: "#FDF3E7" },
  Breached: { color: "#C83737", bg: "#FAEBEB" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE["On Track"];
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 rounded-[8px] text-[12px] font-medium whitespace-nowrap" style={{ color: s.color, backgroundColor: s.bg }}>
      {status}
    </span>
  );
}

export function OrderListingPage({ onLogout, onViewAllNotifications, onNavigateHome, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateNewOverview, onNavigateOverview, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateCommunication, onNavigateOrderDetails, onNavigateEmailTemplate, onNavigateDefaultMapping, onNavigateFeedbackCenter, onNavigateReview, onNavigateEmailWorkflow, sourceCardName }: {
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
  onNavigateDefaultMapping?: () => void;
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
  onNavigateReview?: () => void;
  onNavigateEmailWorkflow?: () => void;
  /** The specific hold card clicked on Overview to get here (if any) — shown in the breadcrumb as extra context. */
  sourceCardName?: string;
}) {
  const kpis = [
    { label: "OPEN HOLDS", value: "05", accent: EMAIL_TABLE_NAVY, icon: Inbox },
    { label: "SLA BREACHED", value: "05", accent: "#871518", icon: AlertTriangle },
    { label: "AT RISK", value: "05", accent: "#E67919", icon: Clock },
    { label: "TOTAL VALUE", value: "$ 10540.6M", accent: "#387D85", icon: DollarSign },
    { label: "ON TRACK", value: "05", accent: "#468657", icon: CheckCircle2 },
  ];

  // Starred orders — persisted so they survive navigating away (Order Details, Overview) and reloads.
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set(loadFavoriteOrderIds()));
  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveFavoriteOrderIds(Array.from(next));
      return next;
    });
  };
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Sync status + KPI collapse — same pattern as HoldManagementOverview's page header.
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

  // Per-column filters — same funnel-icon-in-header convention as EmailTable/EmailTemplatePage.
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const columnFilterOptions = (key: string): [string, number][] => {
    const counts: Record<string, number> = {};
    for (const o of ALL_ORDERS) {
      const v = String(o[key as ColumnKey]);
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
    let filtered = ALL_ORDERS.filter((o) => {
      if (q && !o.id.toLowerCase().includes(q) && !o.customer.toLowerCase().includes(q) && !o.poId.toLowerCase().includes(q)) return false;
      if (category.applied.length > 0 && !category.applied.includes(o.holdType)) return false;
      if (holdType.applied.length > 0 && !holdType.applied.includes(o.status)) return false;
      if (showFavoritesOnly && !favoriteIds.has(o.id)) return false;
      for (const col of COLUMNS) {
        const active = columnFilters[col.key];
        if (active && active.size > 0 && !active.has(String(o[col.key]))) return false;
      }
      return true;
    });
    filtered = filtered.slice().sort((a, b) => {
      const cmp = String(a[sortKey]).localeCompare(String(b[sortKey]), undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [searchQuery, category.applied, holdType.applied, showFavoritesOnly, favoriteIds, columnFilters, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const pageRows = sortedRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const rowPadY = rowDensity === "small" ? "py-1.5" : rowDensity === "medium" ? "py-2.5" : "py-3.5";

  // Exports every row currently matching search/filters (not just the current page), using whichever
  // columns — and order — are presently visible, since that's what the user is actually looking at.
  const exportOrders = () => {
    const headers = visibleColumnList.map((c) => c.label);
    const rows = sortedRows.map((row) => visibleColumnList.map((col) => (col.key === "ssd" ? `${row.ssd} ${row.ssdDelta}` : row[col.key])));
    exportRowsToExcel("order-listing", headers, rows, "Order Listing");
    toast.success(`Exported ${sortedRows.length} order${sortedRows.length === 1 ? "" : "s"}`);
  };

  const renderCell = (key: ColumnKey, row: Order) => {
    switch (key) {
      case "status":
        return <StatusBadge status={row.status} />;
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
      case "ssd":
        return (
          <span className="text-[12.5px] whitespace-nowrap">
            <span className="text-[#4D4D4D]">{row.ssd} </span>
            <span className="text-[#30578D] font-semibold">{row.ssdDelta}</span>
          </span>
        );
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
            onNavigateDefaultMapping={onNavigateDefaultMapping}
            onNavigateFeedbackCenter={onNavigateFeedbackCenter}
            onNavigateReview={onNavigateReview}
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
          />
        </div>

        <main className="flex-1 min-h-0 flex flex-col w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 gap-4 overflow-hidden">
          {/* Page header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-start gap-2.5">
              <div>
                <Breadcrumbs
                  items={[
                    { label: sourceCardName ? `Hold Mgmt (${sourceCardName})` : "Hold Mgmt", onClick: onNavigateOverview },
                    { label: "Order Listing" },
                  ]}
                />
                <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Order Listing</h1>
                <p className="text-[12px] text-[#97999B] mt-0.5">All orders currently on hold across every category</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
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
            </div>
          </div>

          {/* KPI strip */}
          {kpisExpanded && (
          <div className="flex flex-wrap gap-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="relative overflow-hidden flex-1 min-w-[220px] rounded-[8px] border border-[#E2E6E9] p-4 flex items-center gap-3.5"
                style={{ background: `linear-gradient(135deg, ${kpi.accent}10, #ffffff 65%)` }}
              >
                <div className="size-[42px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${kpi.accent}1A` }}>
                  <kpi.icon size={19} style={{ color: kpi.accent }} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide truncate">{kpi.label}</p>
                  <p className="text-[22px] font-bold text-[#262626] leading-none">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Content card: toolbar + table */}
          <div className="flex-1 min-h-0 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
              <TableToolbarSearch value={searchQuery} onCommit={updateSearch} placeholder="Search orders..." />

              {/* Quick view switch, not a field-value filter — matches the pill-toggle pattern used for
                  My Tasks/All Tasks elsewhere rather than living inside the column filter panel. */}
              <button
                onClick={() => { setShowFavoritesOnly((v) => !v); setPage(1); }}
                className={`shrink-0 flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-semibold cursor-pointer transition-colors ${
                  showFavoritesOnly ? "border-[#E67919] bg-[#FDF3E7] text-[#E67919]" : "border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7]"
                }`}
              >
                <Star size={13} fill={showFavoritesOnly ? "#E67919" : "none"} />
                Favorites only
              </button>

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
                  width={200}
                />

                <TableToolbarApplyReset dirty={toolbarFiltersDirty} onApply={applyToolbarFilters} onReset={resetToolbarFilters} />

                <div className="w-px h-5 bg-[#E2E6E9]" />

                <div className="flex items-center gap-2.5 shrink-0">
                  <TableFilterTrigger open={openPanel === "filter"} onOpenChange={(o) => setOpenPanel(o ? "filter" : null)} activeCount={activeFilterCount} />
                  <TableColumnMgmtTrigger open={openPanel === "columns"} onOpenChange={(o) => setOpenPanel(o ? "columns" : null)} />
                  <button
                    onClick={exportOrders}
                    title="Export to Excel"
                    className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                  >
                    <Download size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* View body — Filter and Column Mgmt slide-in panels overlay this area only */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
              <div className="h-full min-h-0 overflow-auto">
                <table className="w-full min-w-[1100px] border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-[#F7F7F7]">
                      <th className="sticky top-0 z-10 bg-[#F7F7F7] w-[40px] px-2 h-[42px] border-b border-[#DEDEDE]" />
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
                        <td colSpan={visibleColumnList.length + 1} className="px-4 py-16 text-center text-[13px] text-[#97999B]">No orders match your filters</td>
                      </tr>
                    ) : (
                      pageRows.map((row) => {
                        const isFavorite = favoriteIds.has(row.id);
                        return (
                          <tr
                            key={row.id}
                            onClick={() => onNavigateOrderDetails?.(row.id)}
                            className="hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                          >
                            <td className={`px-2 ${rowPadY} border-b border-[#DEDEDE]`}>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(row.id); }}
                                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                className="flex items-center justify-center size-[24px] rounded-[6px] hover:bg-[#EFEFEF] cursor-pointer transition-colors"
                              >
                                <Star size={15} className={isFavorite ? "text-[#E67919]" : "text-[#C9CBCD]"} fill={isFavorite ? "#E67919" : "none"} />
                              </button>
                            </td>
                            {visibleColumnList.map((col) => (
                              <td key={col.key} className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                                {renderCell(col.key, row)}
                              </td>
                            ))}
                          </tr>
                        );
                      })
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
