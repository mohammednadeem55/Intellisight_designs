import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import listingSvg from "@/imports/HoldManagementListing/svg-u1kc727ptr";
import filterSvg from "@/imports/HoldManagementListingFilter/svg-o1nvoo6krn";

export interface OrderListingColumn {
  key: string;
  label: string;
}

export interface OrderListingFilterSection<T> {
  key: string;
  label: string;
  total?: number;
  /** Omit for a placeholder section that always shows zero options. */
  getValue?: (row: T) => string;
}

export interface OrderListingDropdownFilter<T> {
  placeholder: string;
  allLabel: string;
  options: string[];
  getValue: (row: T) => string;
}

export interface OrderListingTableProps<T> {
  rows: T[];
  columns: OrderListingColumn[];
  fixedColumns: string[];
  scrollableColumns: string[];
  maxFixedColumns?: number;
  /** Column labels visible by default; defaults to every fixed + scrollable column. Columns omitted here still appear in Column Mgmt, just unchecked until the user enables them. */
  defaultVisibleColumns?: string[];
  filterSections: OrderListingFilterSection<T>[];
  categoryDropdown: OrderListingDropdownFilter<T>;
  typeDropdown: OrderListingDropdownFilter<T>;
  renderCell: (columnLabel: string, row: T) => ReactNode;
  getRowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  rowsPerPage?: number;
  emptyMessage?: string;
  displayingSuffix?: string;
  /** Extra toolbar button(s) rendered between the type dropdown and the view toggle (e.g. a Download button). */
  toolbarExtra?: ReactNode;
  /** When provided, replaces the table rows + pagination with custom content — the toolbar (including toolbarExtra) still renders above it. Lets a caller swap in an entirely different view (e.g. an email view) without losing toolbar controls like a view-mode toggle. */
  bodyOverride?: ReactNode;
  /** Show the 88px empty spacer between the "Displaying" text and the right-hand controls (default true). */
  showSpacer?: boolean;
  /** Provide to enable a Grid/List view toggle; renders each row as a card in grid mode. */
  renderGridItem?: (row: T) => ReactNode;
  gridViewIcon?: (active: boolean) => ReactNode;
  listViewIcon?: (active: boolean) => ReactNode;
  defaultView?: "grid" | "list";
  gridClassName?: string;
  /** Provide to make rows expandable, revealing nested child rows (e.g. CCC requests linked to an email). */
  getChildren?: (row: T) => T[] | undefined;
  /** Cell renderer for nested child rows; defaults to `renderCell`. */
  renderChildCell?: (columnLabel: string, childRow: T, parentRow: T) => ReactNode;
  /** Column whose text gets indented for child rows, reinforcing the nesting visually (e.g. "Subject"). */
  childIndentColumnLabel?: string;
  /** Provide to make child rows themselves expandable, revealing a second nested tier (e.g. a CCC's own correspondence). Deeper data than this should be surfaced via a link/affordance inside a rendered cell rather than a 3rd tier. */
  getGrandchildren?: (childRow: T, parentRow: T) => T[] | undefined;
  /** Cell renderer for grandchild rows; defaults to `renderChildCell` (or `renderCell`). */
  renderGrandchildCell?: (columnLabel: string, grandchildRow: T, childRow: T, parentRow: T) => ReactNode;
  /** Column whose text gets indented for grandchild rows; defaults to `childIndentColumnLabel`. */
  grandchildIndentColumnLabel?: string;
}

export function OrderListingTable<T>({
  rows,
  columns,
  fixedColumns,
  scrollableColumns,
  maxFixedColumns = 4,
  defaultVisibleColumns,
  filterSections,
  categoryDropdown,
  typeDropdown,
  renderCell,
  getRowKey,
  onRowClick,
  rowsPerPage = 10,
  emptyMessage = "No records match your filters",
  displayingSuffix = "(Name)",
  toolbarExtra,
  bodyOverride,
  showSpacer = true,
  renderGridItem,
  gridViewIcon,
  listViewIcon,
  defaultView = "list",
  gridClassName = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
  getChildren,
  renderChildCell,
  childIndentColumnLabel,
  getGrandchildren,
  renderGrandchildCell,
  grandchildIndentColumnLabel,
}: OrderListingTableProps<T>) {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">(defaultView);
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState(categoryDropdown.allLabel);
  const [typeFilter, setTypeFilter] = useState(typeDropdown.allLabel);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [colMgmtOpen, setColMgmtOpen] = useState(false);
  const [activeColTab, setActiveColTab] = useState<"fixed" | "scrollable" | "sort">("fixed");
  const allSortCols = [...fixedColumns, ...scrollableColumns];
  const initialVisibleCols = defaultVisibleColumns ?? allSortCols;
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(initialVisibleCols));
  const [tempVisibleCols, setTempVisibleCols] = useState<Set<string>>(new Set(initialVisibleCols));
  const [colSortOrder, setColSortOrder] = useState<string[]>(allSortCols);
  const [tempColSortOrder, setTempColSortOrder] = useState<string[]>(allSortCols);
  const [dragColIdx, setDragColIdx] = useState<number | null>(null);
  const [dragOverColIdx, setDragOverColIdx] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(filterSections[0]?.key ?? null);
  const [checkedFilters, setCheckedFilters] = useState<Record<string, Set<string>>>({});
  const [sectionSearch, setSectionSearch] = useState<Record<string, string>>({});
  const categoryRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setCategoryOpen(false);
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleFilterItem = (section: string, value: string) => {
    setCheckedFilters(prev => {
      const next = { ...prev };
      const set = new Set(next[section] ?? []);
      if (set.has(value)) set.delete(value); else set.add(value);
      next[section] = set;
      return next;
    });
    setPage(1);
  };

  const resetFilters = () => { setCheckedFilters({}); setSectionSearch({}); setPage(1); };

  const filterSectionOptions = filterSections.map(sec => ({
    ...sec,
    options: sec.getValue
      ? rows.reduce((acc, r) => {
          const val = sec.getValue!(r);
          acc[val] = (acc[val] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      : ({} as Record<string, number>),
  }));

  const filtered = rows.filter(r => {
    const matchCat = categoryFilter === categoryDropdown.allLabel || categoryDropdown.getValue(r) === categoryFilter;
    const matchType = typeFilter === typeDropdown.allLabel || typeDropdown.getValue(r) === typeFilter;
    const matchPanel = filterSections.every(sec => {
      if (!sec.getValue) return true;
      const sel = checkedFilters[sec.key];
      if (!sel || sel.size === 0) return true;
      return sel.has(sec.getValue(r));
    });
    return matchCat && matchType && matchPanel;
  });

  const sorted = sortCol ? [...filtered].sort((a, b) => {
    const av = (a as Record<string, string>)[sortCol] ?? "";
    const bv = (b as Record<string, string>)[sortCol] ?? "";
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  }) : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const visibleRows = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const visibleColumns = colSortOrder
    .filter(label => visibleCols.has(label))
    .map(label => columns.find(c => c.label === label))
    .filter((c): c is OrderListingColumn => Boolean(c));

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

  return (
    <>
      {/* Toolbar — matches Frame8729 Figma import */}
      <div className="content-stretch flex items-center justify-between relative w-full px-5 py-[10px] border-b border-[#f2f2f2] shrink-0 bg-white">
        {/* Grid / Displaying text */}
        <div className="content-stretch flex h-[36px] items-center overflow-clip relative shrink-0">
          <div className="content-stretch flex items-center overflow-clip relative shrink-0">
            <div className="flex flex-col font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#686868] text-[14px] whitespace-nowrap">
              <p className="leading-[18px] text-[12px]">Displaying {visibleRows.length} of {sorted.length} {displayingSuffix}</p>
            </div>
          </div>
        </div>

        {/* Empty spacer — matches RcpActionsItems */}
        {showSpacer && (
          <div className="content-stretch flex gap-[16px] h-[36px] items-center relative shrink-0 w-[88px]" />
        )}

        {/* Right controls — matches Frame3 */}
        <div className="content-stretch flex gap-[16px] items-center relative shrink-0">

          {/* Category — matches Input */}
          <div className="relative" ref={categoryRef}>
            <div className="h-[36px] relative shrink-0 w-[187px]">
              <button
                onClick={() => setCategoryOpen(o => !o)}
                className="absolute bg-white border border-[#d1d1d1] border-solid h-[36px] left-0 right-0 rounded-[4px] top-0 w-full cursor-pointer hover:bg-[#f8fafc] transition-colors z-10"
              />
              <div className="absolute content-stretch flex items-center justify-between left-[9px] right-[8px] top-[8px] pointer-events-none z-20">
                <div className="flex flex-col font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#333] text-[14px] whitespace-nowrap">
                  <p className="leading-[20px]">{categoryFilter === categoryDropdown.allLabel ? categoryDropdown.placeholder : categoryFilter}</p>
                </div>
                <div className="relative shrink-0 size-[16px]">
                  <div className="absolute bottom-1/4 flex items-center justify-center left-[18.75%] right-[18.75%] top-[12.5%]" style={{ containerType: "size" }}>
                    <div className="-rotate-180 -scale-x-100 flex-none h-[100cqh] w-[100cqw]">
                      <div className="relative size-full">
                        <div className="absolute bottom-1/4 left-[6.7%] right-[6.7%] top-0">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.66026 7.5">
                            <path d={listingSvg.p2c884700} fill="#686868" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {categoryOpen && (
              <div className="absolute right-0 top-[calc(100%+4px)] bg-white rounded-lg border border-[#e2e8f0] shadow-lg z-30 py-1 min-w-full max-h-[220px] overflow-y-auto">
                {categoryDropdown.options.map(t => (
                  <button key={t} onClick={() => { setCategoryFilter(t); setCategoryOpen(false); setPage(1); }}
                    className={`w-full text-left px-3 py-[7px] text-[13px] cursor-pointer transition-colors truncate ${categoryFilter === t ? "bg-[#f8f0f4] text-[#90003b] font-semibold" : "text-[#374151] hover:bg-[#f8fafc]"}`}
                  >{t}</button>
                ))}
              </div>
            )}
          </div>

          {/* Type — matches Input1 */}
          <div className="relative" ref={typeRef}>
            <div className="h-[36px] relative shrink-0 w-[187px]">
              <button
                onClick={() => setTypeOpen(o => !o)}
                className="absolute bg-white border border-[#d1d1d1] border-solid h-[36px] left-0 right-0 rounded-[4px] top-0 w-full cursor-pointer hover:bg-[#f8fafc] transition-colors z-10"
              />
              <div className="absolute content-stretch flex items-center justify-between left-[9px] right-[8px] top-[8px] pointer-events-none z-20">
                <div className="flex flex-col font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#333] text-[14px] whitespace-nowrap">
                  <p className="leading-[20px]">{typeFilter === typeDropdown.allLabel ? typeDropdown.placeholder : typeFilter}</p>
                </div>
                <div className="relative shrink-0 size-[16px]">
                  <div className="absolute bottom-1/4 flex items-center justify-center left-[18.75%] right-[18.75%] top-[12.5%]" style={{ containerType: "size" }}>
                    <div className="-rotate-180 -scale-x-100 flex-none h-[100cqh] w-[100cqw]">
                      <div className="relative size-full">
                        <div className="absolute bottom-1/4 left-[6.7%] right-[6.7%] top-0">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.66026 7.5">
                            <path d={listingSvg.p2c884700} fill="#686868" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {typeOpen && (
              <div className="absolute right-0 top-[calc(100%+4px)] bg-white rounded-lg border border-[#e2e8f0] shadow-lg z-30 py-1 min-w-full">
                {typeDropdown.options.map(t => (
                  <button key={t} onClick={() => { setTypeFilter(t); setTypeOpen(false); setPage(1); }}
                    className={`w-full text-left px-3 py-[7px] text-[13px] cursor-pointer transition-colors ${typeFilter === t ? "bg-[#f8f0f4] text-[#90003b] font-semibold" : "text-[#374151] hover:bg-[#f8fafc]"}`}
                  >{t}</button>
                ))}
              </div>
            )}
          </div>

          {toolbarExtra}

          {/* View toggle: Grid / List — paired 36×36 buttons */}
          {renderGridItem && (
            <div className="flex items-center border border-[#d1d1d1] rounded-[4px] overflow-hidden h-[36px]">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center justify-center w-[36px] h-full transition-colors cursor-pointer relative ${viewMode === "grid" ? "bg-white" : "bg-[#f8f8f8] hover:bg-[#f0f0f0]"}`}
              >
                {gridViewIcon?.(viewMode === "grid")}
                {viewMode === "grid" && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[20px] h-[2px] bg-[#90003b] rounded-full" />
                )}
              </button>
              <div className="w-px h-5 bg-[#d1d1d1]" />
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center justify-center w-[36px] h-full transition-colors cursor-pointer relative ${viewMode === "list" ? "bg-white" : "bg-[#f8f8f8] hover:bg-[#f0f0f0]"}`}
              >
                {listViewIcon?.(viewMode === "list")}
                {viewMode === "list" && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[20px] h-[2px] bg-[#90003b] rounded-full" />
                )}
              </button>
            </div>
          )}

          {/* Filter icon — matches Group */}
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
              <button onClick={() => setFilterPanelOpen(o => !o)}
                className="bg-white border border-[#d1d1d1] border-solid col-start-1 ml-0 mt-0 relative rounded-[4px] row-start-1 size-[36px] cursor-pointer hover:bg-[#f8fafc] transition-colors" />
              <div className="col-start-1 ml-[8px] mt-[8px] relative row-start-1 size-[20px] pointer-events-none">
                <div className="absolute inset-[9.38%_6.17%]">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.5332 16.25">
                    <path d={listingSvg.pa7c72c0} fill="#686868" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Slider icon — matches Group1 */}
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
              <button onClick={() => { const opening = !colMgmtOpen; setColMgmtOpen(opening); if (opening) { setTempVisibleCols(new Set(visibleCols)); setTempColSortOrder([...colSortOrder]); if (filterPanelOpen) setFilterPanelOpen(false); } }}
                className={`border border-solid col-start-1 ml-0 mt-0 relative rounded-[4px] row-start-1 size-[36px] cursor-pointer transition-colors ${colMgmtOpen ? "bg-[#c53e6c] border-[#c53e6c] hover:bg-[#a0334f]" : "bg-white border-[#d1d1d1] hover:bg-[#f8fafc]"}`} />
              <div className="col-start-1 ml-[8px] mt-[8px] relative row-start-1 size-[20px] pointer-events-none">
                <div className="absolute inset-[12.5%_9.38%_68.75%_9.38%]">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.25 3.75">
                    <path clipRule="evenodd" d={listingSvg.p3a37c600} fill={colMgmtOpen ? "white" : "#686868"} fillRule="evenodd" />
                  </svg>
                </div>
                <div className="absolute inset-[68.75%_9.38%_12.5%_9.38%]">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.25 3.75">
                    <path clipRule="evenodd" d={listingSvg.p1f91c200} fill={colMgmtOpen ? "white" : "#686868"} fillRule="evenodd" />
                  </svg>
                </div>
                <div className="absolute inset-[40.63%_9.38%]">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.25 3.75">
                    <path clipRule="evenodd" d={listingSvg.p1cea6fc0} fill={colMgmtOpen ? "white" : "#686868"} fillRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {bodyOverride ?? (
      <>
      {/* Table + slide-in panels — contained between toolbar and pagination */}
      <div className="flex-1 relative overflow-hidden">
        {/* Grid view */}
        {renderGridItem && viewMode === "grid" && (
          <div className="absolute inset-0 overflow-y-auto p-4">
            <div className={gridClassName}>
              {visibleRows.map((row) => (
                <div key={getRowKey(row)} onClick={() => onRowClick?.(row)}>
                  {renderGridItem(row)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List / table view */}
        {(!renderGridItem || viewMode === "list") && (
          <div className="absolute inset-0 overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-[#f2f2f2]">
                  {getChildren && <th className="w-[52px] h-[44px] bg-white" />}
                  {visibleColumns.map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key)}
                      className="px-4 h-[44px] text-left cursor-pointer select-none whitespace-nowrap bg-white">
                      <div className="flex items-center gap-[5px]">
                        <span className="text-[14px] font-medium text-[#333]">{col.label}</span>
                        <svg width="7" height="7" viewBox="0 0 7 7" className="shrink-0">
                          <circle cx="3.5" cy="3.5" r="3.5" fill="#C53E6C" />
                        </svg>
                        <svg fill="none" viewBox="0 0 20 20" className="size-[13px] shrink-0">
                          <path d={listingSvg.p22cdbb20} fill={sortCol === col.key && sortDir === "asc" ? "#c53e6c" : "#d1d5db"} />
                          <path d={listingSvg.p12f4dc00} fill={sortCol === col.key && sortDir === "desc" ? "#c53e6c" : "#d1d5db"} />
                        </svg>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={(visibleColumns.length || 1) + (getChildren ? 1 : 0)} className="text-center py-16 text-[#9ca3af] text-[14px]">{emptyMessage}</td>
                  </tr>
                ) : visibleRows.flatMap((row) => {
                  const rowKey = getRowKey(row);
                  const children = getChildren?.(row) ?? [];
                  const hasChildren = children.length > 0;
                  const isExpanded = expandedRows.has(rowKey);

                  const parentRow = (
                    <tr key={rowKey}
                      className="border-b border-[#f2f2f2] hover:bg-[#fdf5f8] cursor-pointer transition-colors bg-white"
                      onClick={() => onRowClick?.(row)}>
                      {getChildren && (
                        <td className="w-[52px] h-[40px] px-2">
                          {hasChildren && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRows(prev => {
                                  const next = new Set(prev);
                                  if (isExpanded) next.delete(rowKey); else next.add(rowKey);
                                  return next;
                                });
                              }}
                              className="flex items-center gap-1 cursor-pointer text-[#686868] hover:text-[#c53e6c] transition-colors"
                              aria-label={isExpanded ? "Collapse thread" : "Expand thread"}
                            >
                              <svg fill="none" viewBox="0 0 8 8" className={`size-[8px] shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                                <path d="M1 0.5L6 4L1 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                              </svg>
                              <span className="text-[10px] font-semibold bg-[#f3f4f6] text-[#686868] rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center leading-none">
                                {children.length}
                              </span>
                            </button>
                          )}
                        </td>
                      )}
                      {visibleColumns.map(col => (
                        <td key={col.key} className="px-4 h-[40px]">
                          {renderCell(col.label, row)}
                        </td>
                      ))}
                    </tr>
                  );

                  if (!hasChildren || !isExpanded) return [parentRow];

                  const childRows = children.flatMap((child, idx) => {
                    const isLast = idx === children.length - 1;
                    const childKey = getRowKey(child);
                    const grandchildren = getGrandchildren?.(child, row) ?? [];
                    const hasGrandchildren = grandchildren.length > 0;
                    const childExpanded = expandedRows.has(childKey);

                    const childRow = (
                      <tr key={`${rowKey}::${childKey}`}
                        className="border-b border-[#f2f2f2] bg-[#fafbfc] hover:bg-[#f5eef1] cursor-pointer transition-colors"
                        onClick={() => onRowClick?.(child)}>
                        <td className="w-[52px] h-[38px] relative p-0">
                          {/* Tree connector — single coordinate space so the trunk and branch always meet exactly */}
                          <svg width="52" height="38" viewBox="0 0 52 38" className="absolute inset-0">
                            <line x1="26" y1="0" x2="26" y2="19" stroke="#c53e6c" strokeWidth="2" />
                            {!isLast && <line x1="26" y1="19" x2="26" y2="38" stroke="#c53e6c" strokeWidth="2" />}
                            <path d="M26 19 Q26 24 31 24 H37" stroke="#c53e6c" strokeWidth="2" fill="none" strokeLinecap="round" />
                            <path d="M34 20.5 L38 24 L34 27.5" stroke="#c53e6c" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </td>
                        {visibleColumns.map(col => (
                          <td
                            key={col.key}
                            className={`h-[38px] ${col.label === childIndentColumnLabel ? "pl-9 pr-4" : "px-4"}`}
                          >
                            {col.label === childIndentColumnLabel ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="min-w-0">{(renderChildCell ?? renderCell)(col.label, child, row)}</div>
                                {hasGrandchildren && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedRows(prev => {
                                        const next = new Set(prev);
                                        if (childExpanded) next.delete(childKey); else next.add(childKey);
                                        return next;
                                      });
                                    }}
                                    className="inline-flex items-center gap-[5px] shrink-0 px-[8px] py-[3px] rounded-full bg-[#fdf0f4] text-[#c53e6c] hover:bg-[#fbe1e9] text-[11px] font-medium cursor-pointer transition-colors"
                                    aria-label={childExpanded ? "Hide replies" : "Show replies"}
                                  >
                                    <svg fill="none" viewBox="0 0 8 8" className={`size-[7px] shrink-0 transition-transform duration-200 ${childExpanded ? "rotate-90" : ""}`}>
                                      <path d="M1 0.5L6 4L1 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                    </svg>
                                    {childExpanded ? "Hide" : "Show"} {grandchildren.length} {grandchildren.length === 1 ? "reply" : "replies"}
                                  </button>
                                )}
                              </div>
                            ) : (renderChildCell ?? renderCell)(col.label, child, row)}
                          </td>
                        ))}
                      </tr>
                    );

                    if (!hasGrandchildren || !childExpanded) return [childRow];

                    const grandchildIndentLabel = grandchildIndentColumnLabel ?? childIndentColumnLabel;
                    const grandchildRows = grandchildren.map((grandchild, gidx) => {
                      const isLastGrandchild = gidx === grandchildren.length - 1;
                      return (
                        <tr key={`${rowKey}::${childKey}::${getRowKey(grandchild)}`}
                          className="border-b border-[#f2f2f2] bg-[#f5f2f4] hover:bg-[#f0e5ea] cursor-pointer transition-colors"
                          onClick={() => onRowClick?.(grandchild)}>
                          <td className="w-[52px] h-[38px] relative p-0">
                            {/* Same tree-connector pattern, reused one tier deeper */}
                            <svg width="52" height="38" viewBox="0 0 52 38" className="absolute inset-0">
                              <line x1="26" y1="0" x2="26" y2="19" stroke="#c53e6c" strokeWidth="2" opacity="0.55" />
                              {!isLastGrandchild && <line x1="26" y1="19" x2="26" y2="38" stroke="#c53e6c" strokeWidth="2" opacity="0.55" />}
                              <path d="M26 19 Q26 24 31 24 H37" stroke="#c53e6c" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.55" />
                              <path d="M34 20.5 L38 24 L34 27.5" stroke="#c53e6c" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
                            </svg>
                          </td>
                          {visibleColumns.map(col => (
                            <td
                              key={col.key}
                              className={`h-[38px] ${col.label === grandchildIndentLabel ? "pl-16 pr-4" : "px-4"}`}
                            >
                              {(renderGrandchildCell
                                ? renderGrandchildCell(col.label, grandchild, child, row)
                                : (renderChildCell ?? renderCell)(col.label, grandchild, child))}
                            </td>
                          ))}
                        </tr>
                      );
                    });

                    return [childRow, ...grandchildRows];
                  });

                  return [parentRow, ...childRows];
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Filter Panel — contained between toolbar and pagination */}
        <div className={`absolute top-0 right-0 bottom-0 w-[340px] bg-white border-l border-[#f2f2f2] z-20 flex flex-col transition-transform duration-300 ease-in-out ${filterPanelOpen ? "translate-x-0" : "translate-x-full"}`}>
          {/* Header */}
          <div className="h-[48px] relative shrink-0 border-b border-[#f2f2f2] flex items-center">
            <p className="absolute font-bold leading-[21px] left-[16px] text-[#333] text-[16px]">Filters</p>
            <div className="absolute flex gap-[12px] items-center right-[16px]">
              <button className="relative shrink-0 size-[20px] cursor-pointer hover:opacity-70 transition-opacity">
                <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 16.667 16.667">
                  <path d={filterSvg.p694ec70} fill="#686868" />
                </svg>
              </button>
              <button onClick={resetFilters} className="relative shrink-0 size-[20px] cursor-pointer hover:opacity-70 transition-opacity" title="Reset filters">
                <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 16.25 16.25">
                  <path d={filterSvg.p27f29300} fill="#686868" />
                </svg>
              </button>
              <div className="w-px h-[16px] bg-[#d1d1d1] shrink-0" />
              <button onClick={() => setFilterPanelOpen(false)} className="relative shrink-0 size-[20px] cursor-pointer hover:opacity-70 transition-opacity">
                <div className="absolute inset-[15.63%_15.63%_15.62%_15.63%]">
                  <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 13.75 13.75">
                    <path d={filterSvg.p34eead00} fill="#686868" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
          {/* Accordion sections */}
          <div className="flex-1 overflow-y-auto">
            {filterSectionOptions.map(sec => {
              const isOpen = expandedSection === sec.key;
              const selected = checkedFilters[sec.key];
              const selCount = selected?.size ?? 0;
              const opts = Object.entries(sec.options).sort((a, b) => b[1] - a[1]);
              const q = (sectionSearch[sec.key] ?? "").toLowerCase();
              const visOpts = q ? opts.filter(([k]) => k.toLowerCase().includes(q)) : opts;
              const hasSelections = selCount > 0;
              return (
                <div key={sec.key}>
                  <div
                    className={`h-[48px] overflow-clip relative shrink-0 w-full border-b border-[#f2f2f2] cursor-pointer flex items-center px-[16px] ${hasSelections ? "bg-[#fff0f3]" : "bg-white"}`}
                    onClick={() => setExpandedSection(isOpen ? null : sec.key)}>
                    <div className="flex-1 overflow-hidden pr-[8px]">
                      {hasSelections ? (
                        <p className="text-[14px] leading-[20px] whitespace-nowrap overflow-hidden text-ellipsis">
                          <span className="text-[#90003b]">{sec.label} (</span>
                          <span className="text-[#90003b] font-bold">{selCount}</span>
                          <span className="text-[#686868]">/{sec.total || opts.length})</span>
                        </p>
                      ) : (
                        <p className="text-[14px] leading-[20px] whitespace-nowrap overflow-hidden text-ellipsis">
                          <span className={isOpen ? "text-[#90003b]" : "text-[#333]"}>{sec.label} </span>
                          <span className="text-[#686868]">({sec.total || opts.length})</span>
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 size-[16px] flex items-center justify-center">
                      <svg className={`transition-transform duration-200 ${isOpen ? "rotate-90" : "rotate-0"}`} width="7" height="13" viewBox="0 0 7.207 13" fill="none">
                        <path d={filterSvg.p374d42f0} fill={hasSelections || isOpen ? "#90003B" : "#686868"} />
                      </svg>
                    </div>
                  </div>
                  {isOpen && opts.length > 0 && (
                    <div>
                      {selCount > 0 && (
                        <div className="flex items-center justify-between px-[16px] py-[7px] border-b border-[#f2f2f2] min-h-[32px]">
                          <div className="bg-[#f2f2f2] flex gap-[4px] items-center px-[6px] py-[3px] rounded-[4px] shrink-0">
                            <p className="font-normal leading-[16px] text-[#686868] text-[10px] whitespace-nowrap">{String(selCount).padStart(2,"0")} Selected</p>
                            <button onClick={e => { e.stopPropagation(); setCheckedFilters(p => ({...p, [sec.key]: new Set()})); }}
                              className="relative size-[12px] shrink-0 cursor-pointer flex items-center justify-center">
                              <svg width="8.25" height="8.25" viewBox="0 0 8.25 8.25" fill="none">
                                <path d={filterSvg.p1ac2d400} fill="#686868" />
                              </svg>
                            </button>
                          </div>
                          {opts.length - selCount > 0 && (
                            <p className="font-normal leading-[13px] text-[#c53e6c] text-[10px] whitespace-nowrap">{opts.length - selCount} More</p>
                          )}
                        </div>
                      )}
                      {opts.length > 3 && (
                        <div className="px-[16px] py-[10px] border-b border-[#f2f2f2]">
                          <div className="relative flex h-[36px] rounded-[4px] border border-[#90003b] overflow-hidden">
                            <input
                              value={sectionSearch[sec.key] ?? ""}
                              onChange={e => setSectionSearch(p => ({...p, [sec.key]: e.target.value}))}
                              placeholder={`Search ${sec.label.toLowerCase()}...`}
                              className="flex-1 min-w-0 pl-[12px] pr-[8px] text-[13px] text-[#333] bg-transparent outline-none placeholder:text-[#aaa]"
                            />
                            {(sectionSearch[sec.key] ?? "") && (
                              <button onClick={() => setSectionSearch(p => ({...p, [sec.key]: ""}))}
                                className="absolute right-[40px] top-1/2 -translate-y-1/2 size-[16px] flex items-center justify-center cursor-pointer">
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                  <path d={filterSvg.p3d064140} fill="#686868" />
                                </svg>
                              </button>
                            )}
                            <div className="shrink-0 w-[40px] bg-[#90003b] flex items-center justify-center cursor-pointer">
                              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                <path clipRule="evenodd" d={filterSvg.pc14aa00} fill="white" fillRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-[8px] px-[16px] py-[10px] border-b border-[#f2f2f2] cursor-pointer bg-white hover:bg-[#f8fafc]"
                        onClick={() => {
                          const allKeys = opts.map(([k]) => k);
                          const allSelected = allKeys.every(k => selected?.has(k));
                          setCheckedFilters(p => ({...p, [sec.key]: allSelected ? new Set() : new Set(allKeys)}));
                        }}>
                        <div className="relative shrink-0 size-[20px]">
                          <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                            <path d={filterSvg.p20ccab72} fill="white" stroke="#686868" strokeWidth="2" />
                          </svg>
                        </div>
                        <p className="font-normal leading-[20px] text-[#686868] text-[14px]">Select All</p>
                      </div>
                      {visOpts.map(([optVal, count]) => {
                        const checked = selected?.has(optVal) ?? false;
                        return (
                          <div key={optVal}
                            className={`flex items-center justify-between px-[16px] py-[10px] border-b border-[#f2f2f2] cursor-pointer ${checked ? "bg-[#ffe8e8]" : "bg-white hover:bg-[#f8fafc]"}`}
                            onClick={() => toggleFilterItem(sec.key, optVal)}>
                            <div className="flex gap-[8px] items-center min-w-0">
                              <div className="inline-grid place-items-start relative shrink-0 size-[20px]">
                                <div className="col-start-1 row-start-1 relative size-[20px]">
                                  <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                                    <path d={filterSvg.p20ccab72} fill={checked ? "#90003B" : "white"} stroke={checked ? "#90003B" : "#686868"} strokeWidth="2" />
                                  </svg>
                                </div>
                                {checked && (
                                  <div className="col-start-1 row-start-1 ml-[5px] mt-[6px] relative size-[10px]">
                                    <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 8.75 6.37937">
                                      <path clipRule="evenodd" d={filterSvg.p19f1000} fill="white" fillRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <p className={`font-normal leading-[20px] text-[14px] truncate ${checked ? "text-[#333]" : "text-[#686868]"}`}>{optVal}</p>
                            </div>
                            <div className="bg-[#ebebeb] flex h-[18px] items-center px-[8px] rounded-[40px] shrink-0 ml-[8px]">
                              <p className="font-normal leading-[18px] text-[#686868] text-[12px]">{String(count).padStart(2,"0")}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column Management Panel — contained between toolbar and pagination */}
        <div className={`absolute top-0 right-0 bottom-0 w-[420px] bg-white border-l border-[#f2f2f2] z-30 flex flex-col transition-transform duration-300 ease-in-out ${colMgmtOpen ? "translate-x-0" : "translate-x-full"}`}>
          {/* Header */}
          <div className="h-[48px] shrink-0 border-b border-[#f2f2f2] flex items-center px-[16px]">
            <p className="font-bold leading-[21px] text-[#333] text-[16px] flex-1">Column Mgmt</p>
            <button onClick={() => setColMgmtOpen(false)} className="relative shrink-0 size-[20px] cursor-pointer hover:opacity-70 transition-opacity">
              <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 13.75 13.75">
                <path d={filterSvg.p34eead00} fill="#686868" />
              </svg>
            </button>
          </div>

          {/* Tab bar — flex-1 tabs fill the full width */}
          <div className="flex shrink-0 border-b border-[#f2f2f2]">
            {(["fixed", "scrollable", "sort"] as const).map((tab) => {
              const labels = { fixed: "Fixed Columns", scrollable: "Scrollable Columns", sort: "Sort Columns" };
              const active = activeColTab === tab;
              return (
                <button key={tab} onClick={() => setActiveColTab(tab)}
                  className="flex-1 flex flex-col items-center pt-[10px] pb-0 cursor-pointer transition-colors">
                  <span className={`text-[12px] font-medium pb-[8px] whitespace-nowrap ${active ? "text-[#90003b]" : "text-[#686868]"}`}>{labels[tab]}</span>
                  <div className={`h-[2px] w-full ${active ? "bg-[#90003b]" : "bg-transparent"}`} />
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeColTab !== "sort" && (
              <div className="w-full">
                {activeColTab === "fixed" && (
                  <div className="px-[16px] py-[8px] border-b border-[#f2f2f2] bg-[#fdf5f8]">
                    <p className="text-[11px] text-[#90003b]">
                      {fixedColumns.filter(c => tempVisibleCols.has(c)).length}/{maxFixedColumns} fixed columns selected (max {maxFixedColumns})
                    </p>
                  </div>
                )}
                {(activeColTab === "fixed" ? fixedColumns : scrollableColumns).map((col) => {
                  const checked = tempVisibleCols.has(col);
                  const fixedCheckedCount = fixedColumns.filter(c => tempVisibleCols.has(c)).length;
                  const atMax = activeColTab === "fixed" && !checked && fixedCheckedCount >= maxFixedColumns;
                  return (
                    <button key={col} onClick={() => {
                      if (atMax) { toast.warning(`Maximum ${maxFixedColumns} fixed columns allowed`); return; }
                      setTempVisibleCols(prev => {
                        const next = new Set(prev);
                        checked ? next.delete(col) : next.add(col);
                        return next;
                      });
                    }} className={`flex gap-[12px] items-center w-full px-[16px] py-[10px] transition-colors cursor-pointer text-left border-b border-[#f2f2f2] ${atMax ? "opacity-50" : "hover:bg-[#faf5f7]"}`}>
                      {/* Checkbox — uses correct viewBox=20×20 for border path, centered checkmark */}
                      <div className="relative shrink-0 size-[18px]">
                        <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                          <path d={filterSvg.p20ccab72} fill={checked ? "#90003B" : "white"} stroke={checked ? "#90003B" : "#686868"} strokeWidth="1.5" />
                        </svg>
                        {checked && (
                          <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                            <path d={filterSvg.p19f1000} fill="white" transform="translate(5.6, 6.8)" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-[14px] leading-[20px] ${checked ? "text-[#333] font-medium" : "text-[#686868]"}`}>{col}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeColTab === "sort" && (
              <div className="w-full">
                <div className="px-[16px] py-[8px] border-b border-[#f2f2f2] bg-[#fdf5f8]">
                  <p className="text-[11px] text-[#686868]">Drag rows to reorder columns in the table</p>
                </div>
                {tempColSortOrder.map((col, idx) => (
                  <div key={col}
                    draggable
                    onDragStart={() => setDragColIdx(idx)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverColIdx(idx); }}
                    onDrop={() => {
                      if (dragColIdx === null || dragColIdx === idx) return;
                      const next = [...tempColSortOrder];
                      const [moved] = next.splice(dragColIdx, 1);
                      next.splice(idx, 0, moved);
                      setTempColSortOrder(next);
                      setDragColIdx(null);
                      setDragOverColIdx(null);
                    }}
                    onDragEnd={() => { setDragColIdx(null); setDragOverColIdx(null); }}
                    className={`flex gap-[11px] items-center px-[16px] py-[10px] cursor-grab active:cursor-grabbing transition-colors border-b border-[#f2f2f2] ${dragOverColIdx === idx && dragColIdx !== idx ? "bg-[#faf5f7] border-t-2 border-t-[#c53e6c]" : "hover:bg-[#faf5f7]"}`}>
                    {/* Drag handle — exact 2×3 dot grid from Figma */}
                    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                      <div className="bg-[#d9d9d9] col-start-1 ml-0 mt-0 relative rounded-[2px] row-start-1 size-[3px]" />
                      <div className="bg-[#d9d9d9] col-start-1 ml-0 mt-[5px] relative rounded-[2px] row-start-1 size-[3px]" />
                      <div className="bg-[#d9d9d9] col-start-1 ml-0 mt-[10px] relative rounded-[2px] row-start-1 size-[3px]" />
                      <div className="bg-[#d9d9d9] col-start-1 ml-[5px] mt-[10px] relative rounded-[2px] row-start-1 size-[3px]" />
                      <div className="bg-[#d9d9d9] col-start-1 ml-[5px] mt-[5px] relative rounded-[2px] row-start-1 size-[3px]" />
                      <div className="bg-[#d9d9d9] col-start-1 ml-[5px] mt-0 relative rounded-[2px] row-start-1 size-[3px]" />
                    </div>
                    <span className="text-[14px] text-[#333] leading-[20px] flex-1">{col}</span>
                    <span className="text-[11px] text-[#aaa]">{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[#f2f2f2] flex justify-end gap-[8px] px-[16px] py-[12px]">
            <button onClick={() => {
              setTempVisibleCols(new Set(visibleCols));
              setTempColSortOrder([...colSortOrder]);
              setColMgmtOpen(false);
            }} className="px-[14px] py-[6px] rounded-[4px] border border-[#c53e6c] text-[#c53e6c] text-[13px] font-medium cursor-pointer hover:bg-[#fdf2f6] transition-colors">
              Cancel
            </button>
            <button onClick={() => {
              setVisibleCols(new Set(tempVisibleCols));
              setColSortOrder([...tempColSortOrder]);
              setColMgmtOpen(false);
              toast.success("Column settings saved");
            }} className="px-[14px] py-[6px] rounded-[4px] bg-[#c53e6c] text-white text-[13px] font-medium cursor-pointer hover:bg-[#a0334f] transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>{/* end flex-1 relative overflow-hidden */}

      {/* Pagination */}
      <div className="flex items-center justify-end gap-[4px] px-5 py-3 border-t border-[#f2f2f2] shrink-0">
        <button onClick={() => setPage(1)} disabled={page === 1}
          className="h-[30px] px-2 rounded-[4px] border border-[#d1d1d1] text-[12px] text-[#686868] disabled:opacity-30 hover:enabled:bg-[#f8fafc] cursor-pointer transition-colors">
          «
        </button>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="h-[30px] px-2 rounded-[4px] border border-[#d1d1d1] text-[12px] text-[#686868] disabled:opacity-30 hover:enabled:bg-[#f8fafc] cursor-pointer transition-colors">
          ‹
        </button>
        {paginationPages().map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="h-[30px] px-2 flex items-center text-[12px] text-[#686868]">…</span>
          ) : (
            <button key={p} onClick={() => setPage(p as number)}
              className={`h-[30px] min-w-[30px] px-2 rounded-[4px] border text-[12px] cursor-pointer transition-colors ${
                page === p ? "bg-[#90003b] border-[#90003b] text-white font-semibold" : "border-[#d1d1d1] text-[#686868] hover:bg-[#f8fafc]"
              }`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
          className="h-[30px] px-2 rounded-[4px] border border-[#d1d1d1] text-[12px] text-[#686868] disabled:opacity-30 hover:enabled:bg-[#f8fafc] cursor-pointer transition-colors">
          ›
        </button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
          className="h-[30px] px-2 rounded-[4px] border border-[#d1d1d1] text-[12px] text-[#686868] disabled:opacity-30 hover:enabled:bg-[#f8fafc] cursor-pointer transition-colors">
          »
        </button>
      </div>
      </>
      )}
    </>
  );
}
