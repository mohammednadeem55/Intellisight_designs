import { useState } from "react";
import { toast } from "sonner";
import filterSvg from "@/imports/HoldManagementListingFilter/svg-o1nvoo6krn";
import detailsSvg from "@/imports/HoldManagementOrderDetailsV2/svg-wic8forngq";
import { AppHeader } from "../../components/common/AppHeader";
import { ALL_ORDERS, HOLD_ROWS, AUDIT_NOTES, HOLD_COLUMNS, HOLD_FILTER_SECTIONS } from "./holdManagementData";

export function OrderDetailsPage({ orderId, onLogout, onViewAllNotifications, onNavigateHome, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateNewOverview, onNavigateOverview, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateEmailTemplate, onNavigateReview, onNavigateEmailWorkflow }: {
  orderId: string;
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateOverview: () => void;
  onNavigateOrderListing: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateReview?: () => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  const [noteText, setNoteText] = useState("");
  const [activeTab, setActiveTab] = useState<"notes" | "audit" | "escalations">("notes");
  const [sortBy, setSortBy] = useState("Aging");
  const [erdValues, setErdValues] = useState<Record<number, string>>({});
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [colMgmtOpen, setColMgmtOpen] = useState(false);
  const [activeColTab, setActiveColTab] = useState<"fixed" | "scrollable" | "sort">("fixed");
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(HOLD_COLUMNS));
  const [tempVisibleCols, setTempVisibleCols] = useState<Set<string>>(new Set(HOLD_COLUMNS));
  const [colSortOrder, setColSortOrder] = useState<string[]>(HOLD_COLUMNS);
  const [tempColSortOrder, setTempColSortOrder] = useState<string[]>(HOLD_COLUMNS);
  const [dragColIdx, setDragColIdx] = useState<number | null>(null);
  const [dragOverColIdx, setDragOverColIdx] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("Category");
  const [checkedFilters, setCheckedFilters] = useState<Record<string, Set<string>>>({});
  const holdFixedCols = ["Hold Name", "Category", "Level/Line", "Workflow"];
  const holdScrollableCols = ["Owner", "Impact", "ERD", "Notes Preview", "Action"];

  const toggleHoldFilter = (section: string, value: string) => {
    setCheckedFilters(prev => {
      const next = { ...prev };
      const set = new Set(next[section] ?? []);
      if (set.has(value)) set.delete(value); else set.add(value);
      next[section] = set;
      return next;
    });
  };

  const resetHoldFilters = () => setCheckedFilters({});

  const filteredHoldRows = HOLD_ROWS.filter(r => {
    return HOLD_FILTER_SECTIONS.every(sec => {
      const sel = checkedFilters[sec.key];
      if (!sel || sel.size === 0) return true;
      const val = sec.key === "Category" ? r.category : sec.key === "Level" ? r.level : sec.key === "Workflow" ? r.workflow : sec.key === "Owner" ? r.owner : sec.key === "Impact" ? r.impact : null;
      return val ? sel.has(val) : true;
    });
  });

  const order = ALL_ORDERS.find(o => o.id === orderId) ?? ALL_ORDERS[0];

  return (
    <div className="bg-[#f5f6fa] flex size-full min-h-screen">
      <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-auto">
        {/* Header */}
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
          onNavigateEmailTemplate={onNavigateEmailTemplate}
          onNavigateReview={onNavigateReview}
          onNavigateEmailWorkflow={onNavigateEmailWorkflow}
        />

        <main className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto">

          {/* Order Banner */}
          <div className="bg-[#f1f5f9] px-5 py-[10px] border-b border-[#e2e8f0] shrink-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-[5px] mb-[6px]">
              <button onClick={onNavigateOrderListing} className="text-[#cd1453] text-[12px] cursor-pointer hover:underline bg-transparent border-0 p-0">
                Order Listing
              </button>
              <svg fill="none" viewBox="0 0 12 12" className="size-[10px] shrink-0">
                <path clipRule="evenodd" d={detailsSvg.p39b4900} fill="#cd1453" fillRule="evenodd" />
              </svg>
              <span className="text-[#cd1453] text-[12px]">#{orderId}</span>
            </div>

            {/* Title row */}
            <div className="flex items-center gap-[8px] mb-[4px]">
              <span className="font-bold text-[#333] text-[24px] leading-[28px]">Order #{orderId}</span>
              <span className="inline-flex items-center px-[6px] py-[3px] rounded-[8px] text-[9px] font-medium"
                style={{ color: "#dc2626", backgroundColor: "rgba(220,38,38,0.1)" }}>
                {order.status === "Breached" ? "Breached" : order.status === "At Risk" ? "At Risk" : "On Track"}
              </span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-[8px] flex-wrap">
              {["DataCorp APAC", "Shipment-impacting", "High Priority", "Waiting for Cash in Advance"].map((tag, i) => (
                <div key={i} className="flex items-center gap-[8px]">
                  <span className="text-[#637590] text-[12px] font-medium tracking-[0.48px]">{tag}</span>
                  {i < 3 && <div className="bg-[#e5e8ec] h-[16px] w-px" />}
                </div>
              ))}
            </div>
          </div>

          {/* Metrics bar */}
          <div className="bg-white border-b border-[#f2f2f2] shrink-0">
            <div className="flex items-center gap-0 px-5 py-[16px] flex-wrap">
              {[
                { label: "ACCOUNT",         value: "Test Solutions OOD" },
                { label: "OU",              value: "ROC EUROPE" },
                { label: "ORDER LINES",     value: "05" },
                { label: "EARLIEST SSD",    value: "Jan 16 (+1d)" },
                { label: "AGING",           value: "7 days" },
                { label: "ORDER VALUE (USD)", value: "$890K" },
              ].map((item, i) => (
                <div key={i} className="flex items-start pr-[20px] mr-[20px] border-r border-[#e5e8ec] last:border-r-0 last:mr-0">
                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[#94a3b8] text-[9px] font-normal uppercase">{item.label}</span>
                    <span className="text-[#0f172a] text-[18px] font-bold whitespace-nowrap">{item.value}</span>
                  </div>
                </div>
              ))}
              {/* Follow-Up Date dropdown */}
              <div className="ml-auto">
                <div className="h-[36px] relative w-[204px]">
                  <div className="absolute bg-white border border-[#d1d1d1] h-[36px] left-0 right-0 rounded-[8px] top-0" />
                  <div className="absolute flex items-center justify-between left-[9px] right-[8px] top-[8px] pointer-events-none">
                    <span className="text-[#333] text-[14px]">Follow-Up Date</span>
                    <div className="relative shrink-0 size-[16px]">
                      <div className="absolute bottom-1/4 flex items-center justify-center left-[18.75%] right-[18.75%] top-[12.5%]" style={{ containerType: "size" }}>
                        <div className="-rotate-180 -scale-x-100 flex-none h-[100cqh] w-[100cqw]">
                          <div className="relative size-full">
                            <div className="absolute bottom-1/4 left-[6.7%] right-[6.7%] top-0">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.66026 7.5">
                                <path d={detailsSvg.p2c884700} fill="#686868" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 px-5 py-5 flex flex-col gap-5">

            {/* Hold Listings card */}
            <div className="bg-white rounded-[8px] border border-[#ebebeb] overflow-hidden flex flex-col">

              {/* Page header */}
              <div className="flex items-center justify-between px-5 h-[56px] border-b border-[#f2f2f2] shrink-0">
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[#0f172a] text-[20px] font-semibold">Hold Listings</span>
                  <div className="flex items-center gap-[7px]">
                    <span className="text-[#64748b] text-[12px]">04 Holds</span>
                    <div className="bg-[#e2e8f0] h-[12px] w-px" />
                    <div className="flex items-center gap-[6px]">
                      <svg fill="none" viewBox="0 0 6 6" className="size-[6px] shrink-0">
                        <circle cx="3" cy="3" fill="#DC2626" r="3" />
                      </svg>
                      <span className="text-[#dc2626] text-[12px]">0 Escalations</span>
                    </div>
                    <div className="bg-[#e2e8f0] h-[12px] w-px" />
                    <span className="text-[#64748b] text-[12px]">0 Follow-ups</span>
                    <div className="bg-[#e2e8f0] h-[12px] w-px" />
                    <span className="text-[#64748b] text-[12px]">Lorem Epsum</span>
                  </div>
                </div>
                <div className="flex items-center gap-[12px]">
                  <div className="flex items-center gap-[6px]">
                    <div className="size-[8px] rounded-full bg-[#16a34a]" />
                    <span className="text-[#94a3b8] text-[11px]">Last synced 10:45 AM</span>
                  </div>
                  <button onClick={() => toast.success("Exporting...")}
                    className="flex items-center gap-[6px] h-[32px] px-[10px] bg-white border border-[#e0e5ed] rounded-[8px] text-[#64748b] text-[12px] font-medium hover:bg-[#f8fafc] cursor-pointer transition-colors">
                    <svg fill="none" viewBox="0 0 13 11" className="size-[14px] shrink-0">
                      <path clipRule="evenodd" d={detailsSvg.p3615000} fill="#64748B" fillRule="evenodd" />
                    </svg>
                    Export
                  </button>
                </div>
              </div>

              {/* Summary stat cards */}
              <div className="grid grid-cols-4 gap-4 px-5 py-4 border-b border-[#f2f2f2] shrink-0">
                {[
                  { value: "02", label: "Holds Summary",   bg: "white",    border: true },
                  { value: "02", label: "Actionability",   bg: "#FFCFDB",  border: false },
                  { value: "-",  label: "ERD / NEXT DATE", bg: "white",    border: true },
                  { value: "CSR Factory", label: "OWNERS INVOLVED", bg: "white", border: true },
                ].map((card, i) => (
                  <div key={i} className="rounded-[8px] h-[78px] relative"
                    style={{ background: card.bg, border: card.border ? "1px solid #F2F2F2" : "none" }}>
                    <div className="absolute left-[16px] top-[16px] flex flex-col gap-0">
                      <span className="text-[#333] text-[24px] font-bold leading-[28px]">{card.value}</span>
                      <span className="text-[#333] text-[14px]">{card.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table toolbar */}
              <div className="flex items-center justify-between px-5 py-[10px] border-b border-[#f2f2f2] shrink-0">
                <span className="text-[#686868] text-[14px]">
                  Displaying {filteredHoldRows.length} of {HOLD_ROWS.length} (Holds)
                </span>
                <div className="flex items-center gap-[16px]">
                  {/* Filter */}
                  <div className="content-stretch flex items-center relative shrink-0">
                    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                      <button onClick={() => { setFilterPanelOpen(o => !o); if (colMgmtOpen) setColMgmtOpen(false); }}
                        className={`border border-solid col-start-1 ml-0 mt-0 relative rounded-[8px] row-start-1 size-[36px] cursor-pointer transition-colors ${filterPanelOpen ? "bg-[#c53e6c] border-[#c53e6c] hover:bg-[#a0334f]" : "bg-white border-[#d1d1d1] hover:bg-[#f8fafc]"}`} />
                      <div className="col-start-1 ml-[8px] mt-[8px] relative row-start-1 size-[20px] pointer-events-none">
                        <div className="absolute inset-[9.38%_6.17%]">
                          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.5332 16.25">
                            <path d={detailsSvg.pa7c72c0} fill={filterPanelOpen ? "white" : "#686868"} />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Columns */}
                  <div className="content-stretch flex items-center relative shrink-0">
                    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                      <button onClick={() => { const opening = !colMgmtOpen; setColMgmtOpen(opening); if (opening) { setTempVisibleCols(new Set(visibleCols)); setTempColSortOrder([...colSortOrder]); if (filterPanelOpen) setFilterPanelOpen(false); } }}
                        className={`border border-solid col-start-1 ml-0 mt-0 relative rounded-[8px] row-start-1 size-[36px] cursor-pointer transition-colors ${colMgmtOpen ? "bg-[#c53e6c] border-[#c53e6c] hover:bg-[#a0334f]" : "bg-white border-[#d1d1d1] hover:bg-[#f8fafc]"}`} />
                      <div className="col-start-1 ml-[8px] mt-[8px] relative row-start-1 size-[20px] pointer-events-none">
                        <div className="absolute inset-[12.5%_9.38%_68.75%_9.38%]">
                          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.25 3.75">
                            <path clipRule="evenodd" d={detailsSvg.p3a37c600} fill={colMgmtOpen ? "white" : "#686868"} fillRule="evenodd" />
                          </svg>
                        </div>
                        <div className="absolute inset-[68.75%_9.38%_12.5%_9.38%]">
                          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.25 3.75">
                            <path clipRule="evenodd" d={detailsSvg.p1f91c200} fill={colMgmtOpen ? "white" : "#686868"} fillRule="evenodd" />
                          </svg>
                        </div>
                        <div className="absolute inset-[40.63%_9.38%]">
                          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.25 3.75">
                            <path clipRule="evenodd" d={detailsSvg.p1cea6fc0} fill={colMgmtOpen ? "white" : "#686868"} fillRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table + slide-in panels — same pattern as Order Listing */}
              <div className="flex-1 relative overflow-hidden" style={{ minHeight: 320 }}>
                <div className="absolute inset-0 overflow-x-auto overflow-y-auto">
                  <table className="w-full border-collapse" style={{ minWidth: 1000 }}>
                    <thead>
                      <tr className="bg-[#fafafa] border-b border-[#f2f2f2]">
                        <th className="w-[42px] px-4 py-3">
                          <button
                            onClick={() => {
                              const allIds = filteredHoldRows.map(r => r.id);
                              const allChecked = allIds.every(id => checkedRows.has(id));
                              setCheckedRows(allChecked ? new Set() : new Set(allIds));
                            }}
                            className="relative size-[18px] cursor-pointer bg-transparent border-0 p-0 block">
                            <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                              <path d={detailsSvg.p20ccab72}
                                fill={filteredHoldRows.length > 0 && filteredHoldRows.every(r => checkedRows.has(r.id)) ? "#90003B" : "white"}
                                stroke={filteredHoldRows.length > 0 && filteredHoldRows.every(r => checkedRows.has(r.id)) ? "#90003B" : "#686868"}
                                strokeWidth="2" />
                            </svg>
                            {filteredHoldRows.length > 0 && filteredHoldRows.every(r => checkedRows.has(r.id)) && (
                              <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                                <path d={filterSvg.p19f1000} fill="white" transform="translate(5.6, 6.8)" />
                              </svg>
                            )}
                          </button>
                        </th>
                        {HOLD_COLUMNS.filter(c => visibleCols.has(c)).map(col => (
                          <th key={col} className="text-left px-3 py-3 text-[14px] font-semibold text-[#333] whitespace-nowrap">
                            <div className="flex items-center gap-[6px]">
                              {col}
                              {(col === "Hold Name" || col === "Category") && (
                                <div className="flex items-center">
                                  <svg fill="none" viewBox="0 0 20 20" className="size-[20px]">
                                    <path d={detailsSvg.p2036a600} fill="#C53E6C" fillRule="evenodd" clipRule="evenodd" />
                                    <path d={detailsSvg.p3877f700} fill="#C53E6C" fillRule="evenodd" clipRule="evenodd" />
                                    <path d={detailsSvg.p16855600} fill="#C53E6C" fillRule="evenodd" clipRule="evenodd" />
                                    <path d={detailsSvg.p47c540} fill="#C53E6C" fillRule="evenodd" clipRule="evenodd" />
                                    <circle cx="10" cy="10" fill="#C53E6C" r="4.16667" />
                                  </svg>
                                  <svg fill="none" viewBox="0 0 20 20" className="size-[20px]">
                                    <path d={detailsSvg.p22cdbb20} fill="#EBEBEB" />
                                    <path d={detailsSvg.p12f4dc00} fill="#EBEBEB" />
                                  </svg>
                                </div>
                              )}
                              {col === "Action" && <div className="size-[6px] rounded-full bg-[#c53e6c]" />}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHoldRows.length === 0 ? (
                        <tr><td colSpan={visibleCols.size + 1} className="text-center py-12 text-[#9ca3af] text-[14px]">No holds match your filters</td></tr>
                      ) : filteredHoldRows.map((row, idx) => (
                        <tr key={row.id} className={`border-b border-[#f8f8f8] hover:bg-[#fdf5f8] transition-colors ${idx % 2 === 1 ? "bg-[#fafcff]" : "bg-white"}`}>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => setCheckedRows(prev => { const n = new Set(prev); n.has(row.id) ? n.delete(row.id) : n.add(row.id); return n; })}
                              className="relative size-[18px] cursor-pointer bg-transparent border-0 p-0 block">
                              <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                                <path d={detailsSvg.p20ccab72} fill={checkedRows.has(row.id) ? "#90003B" : "white"} stroke={checkedRows.has(row.id) ? "#90003B" : "#686868"} strokeWidth="2" />
                              </svg>
                              {checkedRows.has(row.id) && (
                                <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                                  <path d={filterSvg.p19f1000} fill="white" transform="translate(5.6, 6.8)" />
                                </svg>
                              )}
                            </button>
                          </td>
                          {visibleCols.has("Hold Name")     && <td className="px-3 py-2 text-[#686868] text-[14px] whitespace-nowrap">{row.name}</td>}
                          {visibleCols.has("Category")      && <td className="px-3 py-2 text-[#c53e6c] text-[14px] whitespace-nowrap cursor-pointer hover:underline">{row.category}</td>}
                          {visibleCols.has("Level/Line")    && <td className="px-3 py-2 text-[#686868] text-[14px] whitespace-nowrap">{row.level}</td>}
                          {visibleCols.has("Workflow")      && <td className="px-3 py-2 text-[#686868] text-[14px] whitespace-nowrap">{row.workflow}</td>}
                          {visibleCols.has("Owner")         && <td className="px-3 py-2 text-[#686868] text-[14px] whitespace-nowrap">{row.owner}</td>}
                          {visibleCols.has("Impact")        && <td className="px-3 py-2 text-[#686868] text-[14px] whitespace-nowrap">{row.impact}</td>}
                          {visibleCols.has("ERD")           && (
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1 h-[36px] w-[140px] bg-white border border-[#d1d1d1] rounded-[8px] px-2">
                                <input
                                  type="text"
                                  placeholder="dd-mm-yyyy"
                                  value={erdValues[row.id] ?? ""}
                                  onChange={e => setErdValues(prev => ({ ...prev, [row.id]: e.target.value }))}
                                  className="flex-1 text-[12px] text-[#686868] outline-none border-0 bg-transparent placeholder-[#b0b0b0]"
                                />
                                <svg fill="none" viewBox="0 0 13 13" className="size-[13px] shrink-0 opacity-50">
                                  <path d={detailsSvg.p5ec9770} fill="#686868" />
                                </svg>
                              </div>
                            </td>
                          )}
                          {visibleCols.has("Notes Preview") && <td className="px-3 py-2 text-[#686868] text-[14px] max-w-[180px] truncate">{row.notes}</td>}
                          {visibleCols.has("Action")        && (
                            <td className="px-3 py-2">
                              {row.hasRelease ? (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => toast.success(`Hold "${row.name}" released`)}
                                    className="flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 hover:opacity-80 transition-opacity">
                                    <svg fill="none" viewBox="0 0 14 11" className="size-[14px] shrink-0">
                                      <path d={detailsSvg.p3c34800} fill="#16a34a" />
                                    </svg>
                                    <span className="text-[#16a34a] text-[12px] font-medium">Release</span>
                                  </button>
                                  <button onClick={() => toast.info("Saving hold...")}
                                    className="size-[28px] flex items-center justify-center rounded border border-[#e0e5ed] bg-white hover:bg-[#f8fafc] cursor-pointer transition-colors">
                                    <svg fill="none" viewBox="0 0 13 11" className="size-[13px]">
                                      <path d={detailsSvg.p3371a100} fill="#64748b" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => toast.info("Saving hold...")}
                                  className="size-[28px] flex items-center justify-center rounded border border-[#e0e5ed] bg-white hover:bg-[#f8fafc] cursor-pointer transition-colors">
                                  <svg fill="none" viewBox="0 0 13 11" className="size-[13px]">
                                    <path d={detailsSvg.p3371a100} fill="#64748b" />
                                  </svg>
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Filter Panel */}
                <div className={`absolute top-0 right-0 bottom-0 w-[340px] bg-white border-l border-[#f2f2f2] z-20 flex flex-col transition-transform duration-300 ease-in-out ${filterPanelOpen ? "translate-x-0" : "translate-x-full"}`}>
                  <div className="h-[48px] relative shrink-0 border-b border-[#f2f2f2] flex items-center">
                    <p className="absolute font-bold leading-[21px] left-[16px] text-[#333] text-[16px]">Filters</p>
                    <div className="absolute flex gap-[12px] items-center right-[16px]">
                      <button onClick={resetHoldFilters} className="relative shrink-0 size-[20px] cursor-pointer hover:opacity-70 transition-opacity" title="Reset filters">
                        <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 16.25 16.25">
                          <path d={filterSvg.p27f29300} fill="#686868" />
                        </svg>
                      </button>
                      <div className="w-px h-[16px] bg-[#d1d1d1] shrink-0" />
                      <button onClick={() => setFilterPanelOpen(false)} className="relative shrink-0 size-[20px] cursor-pointer hover:opacity-70 transition-opacity">
                        <div className="absolute inset-[15.63%]">
                          <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 13.75 13.75">
                            <path d={filterSvg.p34eead00} fill="#686868" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {HOLD_FILTER_SECTIONS.map(sec => {
                      const isOpen = expandedSection === sec.key;
                      const selected = checkedFilters[sec.key];
                      const selCount = selected?.size ?? 0;
                      const opts = Object.entries(sec.options).sort((a, b) => b[1] - a[1]);
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
                                  <span className="text-[#686868]">/{opts.length})</span>
                                </p>
                              ) : (
                                <p className="text-[14px] leading-[20px] whitespace-nowrap overflow-hidden text-ellipsis">
                                  <span className={isOpen ? "text-[#90003b]" : "text-[#333]"}>{sec.label} </span>
                                  <span className="text-[#686868]">({opts.length})</span>
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 size-[16px] flex items-center justify-center">
                              <svg className={`transition-transform duration-200 ${isOpen ? "rotate-90" : "rotate-0"}`} width="7" height="13" viewBox="0 0 7.207 13" fill="none">
                                <path d={filterSvg.p374d42f0} fill={hasSelections || isOpen ? "#90003B" : "#686868"} />
                              </svg>
                            </div>
                          </div>
                          {isOpen && (
                            <div>
                              {selCount > 0 && (
                                <div className="flex items-center justify-between px-[16px] py-[7px] border-b border-[#f2f2f2] min-h-[32px]">
                                  <div className="bg-[#f2f2f2] flex gap-[4px] items-center px-[6px] py-[3px] rounded-[8px] shrink-0">
                                    <p className="font-normal leading-[16px] text-[#686868] text-[10px] whitespace-nowrap">{String(selCount).padStart(2, "0")} Selected</p>
                                    <button onClick={e => { e.stopPropagation(); setCheckedFilters(p => ({ ...p, [sec.key]: new Set() })); }}
                                      className="relative size-[12px] shrink-0 cursor-pointer flex items-center justify-center">
                                      <svg width="8.25" height="8.25" viewBox="0 0 8.25 8.25" fill="none">
                                        <path d={filterSvg.p1ac2d400} fill="#686868" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-[8px] px-[16px] py-[10px] border-b border-[#f2f2f2] cursor-pointer bg-white hover:bg-[#f8fafc]"
                                onClick={() => {
                                  const allKeys = opts.map(([k]) => k);
                                  const allSelected = allKeys.every(k => selected?.has(k));
                                  setCheckedFilters(p => ({ ...p, [sec.key]: allSelected ? new Set() : new Set(allKeys) }));
                                }}>
                                <div className="relative shrink-0 size-[20px]">
                                  <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                                    <path d={filterSvg.p20ccab72} fill="white" stroke="#686868" strokeWidth="2" />
                                  </svg>
                                </div>
                                <p className="font-normal leading-[20px] text-[#686868] text-[14px]">Select All</p>
                              </div>
                              {opts.map(([optVal, count]) => {
                                const checked = selected?.has(optVal) ?? false;
                                return (
                                  <div key={optVal}
                                    className={`flex items-center justify-between px-[16px] py-[10px] border-b border-[#f2f2f2] cursor-pointer ${checked ? "bg-[#ffe8e8]" : "bg-white hover:bg-[#f8fafc]"}`}
                                    onClick={() => toggleHoldFilter(sec.key, optVal)}>
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
                                      <p className="font-normal leading-[18px] text-[#686868] text-[12px]">{String(count).padStart(2, "0")}</p>
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

                {/* Column Management Panel */}
                <div className={`absolute top-0 right-0 bottom-0 w-[420px] bg-white border-l border-[#f2f2f2] z-30 flex flex-col transition-transform duration-300 ease-in-out ${colMgmtOpen ? "translate-x-0" : "translate-x-full"}`}>
                  <div className="h-[48px] shrink-0 border-b border-[#f2f2f2] flex items-center px-[16px]">
                    <p className="font-bold leading-[21px] text-[#333] text-[16px] flex-1">Column Mgmt</p>
                    <button onClick={() => setColMgmtOpen(false)} className="relative shrink-0 size-[20px] cursor-pointer hover:opacity-70 transition-opacity">
                      <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 13.75 13.75">
                        <path d={filterSvg.p34eead00} fill="#686868" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex shrink-0 border-b border-[#f2f2f2]">
                    {(["fixed", "scrollable", "sort"] as const).map(tab => {
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
                  <div className="flex-1 overflow-y-auto">
                    {activeColTab !== "sort" && (
                      <div className="w-full">
                        {activeColTab === "fixed" && (
                          <div className="px-[16px] py-[8px] border-b border-[#f2f2f2] bg-[#fdf5f8]">
                            <p className="text-[11px] text-[#90003b]">
                              {holdFixedCols.filter(c => tempVisibleCols.has(c)).length}/4 fixed columns selected (max 4)
                            </p>
                          </div>
                        )}
                        {(activeColTab === "fixed" ? holdFixedCols : holdScrollableCols).map(col => {
                          const checked = tempVisibleCols.has(col);
                          const fixedCheckedCount = holdFixedCols.filter(c => tempVisibleCols.has(c)).length;
                          const atMax = activeColTab === "fixed" && !checked && fixedCheckedCount >= 4;
                          return (
                            <button key={col} onClick={() => {
                              if (atMax) { toast.warning("Maximum 4 fixed columns allowed"); return; }
                              setTempVisibleCols(prev => { const next = new Set(prev); checked ? next.delete(col) : next.add(col); return next; });
                            }} className={`flex gap-[12px] items-center w-full px-[16px] py-[10px] transition-colors cursor-pointer text-left border-b border-[#f2f2f2] ${atMax ? "opacity-50" : "hover:bg-[#faf5f7]"}`}>
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
                            onDragOver={e => { e.preventDefault(); setDragOverColIdx(idx); }}
                            onDrop={() => {
                              if (dragColIdx === null || dragColIdx === idx) return;
                              const next = [...tempColSortOrder];
                              const [moved] = next.splice(dragColIdx, 1);
                              next.splice(idx, 0, moved);
                              setTempColSortOrder(next);
                              setDragColIdx(null); setDragOverColIdx(null);
                            }}
                            onDragEnd={() => { setDragColIdx(null); setDragOverColIdx(null); }}
                            className={`flex gap-[11px] items-center px-[16px] py-[10px] cursor-grab active:cursor-grabbing transition-colors border-b border-[#f2f2f2] ${dragOverColIdx === idx && dragColIdx !== idx ? "bg-[#faf5f7] border-t-2 border-t-[#c53e6c]" : "hover:bg-[#faf5f7]"}`}>
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
                  <div className="shrink-0 border-t border-[#f2f2f2] flex justify-end gap-[8px] px-[16px] py-[12px]">
                    <button onClick={() => { setTempVisibleCols(new Set(visibleCols)); setTempColSortOrder([...colSortOrder]); setColMgmtOpen(false); }}
                      className="px-[14px] py-[6px] rounded-[8px] border border-[#c53e6c] text-[#c53e6c] text-[13px] font-medium cursor-pointer hover:bg-[#fdf2f6] transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => { setVisibleCols(new Set(tempVisibleCols)); setColSortOrder([...tempColSortOrder]); setColMgmtOpen(false); toast.success("Column settings saved"); }}
                      className="px-[14px] py-[6px] rounded-[8px] bg-[#c53e6c] text-white text-[13px] font-medium cursor-pointer hover:bg-[#a0334f] transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Audit Logs card */}
            <div className="bg-white rounded-[8px] border border-[#ebebeb] overflow-hidden flex flex-col">
              <div className="px-5 pt-5 pb-0 border-b border-[#f2f2f2]">
                <h2 className="text-[#0f172a] text-[20px] font-semibold mb-4">Notes &amp; Audit Logs</h2>
                {/* Tabs */}
                <div className="flex items-center gap-0 border-b border-[#f2f2f2]">
                  {(["notes", "audit", "escalations"] as const).map(tab => {
                    const label = tab === "notes" ? "Notes" : tab === "audit" ? "Audit History" : "Escalations";
                    return (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-4 pb-3 text-[14px] font-medium cursor-pointer border-b-2 transition-colors ${activeTab === tab ? "text-[#c53e6c] border-[#c53e6c]" : "text-[#686868] border-transparent hover:text-[#333]"}`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeTab === "notes" && (
                <div className="px-5 py-4 flex flex-col gap-5">
                  {/* Sort row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[#686868] text-[12px] font-medium uppercase">SORT BY</span>
                    {["Aging", "SSD Proximity", "Value", "Order Volume"].map(s => (
                      <button key={s} onClick={() => setSortBy(s)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium border cursor-pointer transition-colors ${sortBy === s ? "bg-[#c53e6c] border-[#c53e6c] text-white" : "bg-white border-[#d1d1d1] text-[#686868] hover:bg-[#f8fafc]"}`}>
                        {s}
                        {sortBy === s ? (
                          <svg fill="none" viewBox="0 0 11 6" className="size-[10px]">
                            <path d={detailsSvg.p276a1b80} fill="white" />
                          </svg>
                        ) : (
                          <div className="flex flex-col gap-[1px]">
                            <svg fill="none" viewBox="0 0 6 4" className="size-[6px]">
                              <path d={detailsSvg.p2dd962c0} fill="#686868" />
                            </svg>
                            <svg fill="none" viewBox="0 0 6 4" className="size-[6px]">
                              <path d={detailsSvg.p2aef46f0} fill="#686868" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Timeline */}
                  <div className="flex flex-col gap-0">
                    {AUDIT_NOTES.map((note, i) => (
                      <div key={note.id} className="flex gap-4 pb-6 relative">
                        {/* Left timeline */}
                        <div className="flex flex-col items-center shrink-0 w-[80px]">
                          <span className="text-[#64748b] text-[11px] text-right w-full">{note.date}</span>
                          <span className="text-[#94a3b8] text-[10px] text-right w-full">{note.ago}</span>
                        </div>
                        {/* Dot + line */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className="size-[20px] rounded-full flex items-center justify-center shrink-0 mt-1"
                            style={{ backgroundColor: note.dotColor }}>
                            {note.dotColor === "#16a34a" ? (
                              <svg fill="none" viewBox="0 0 14 11" className="size-[10px]">
                                <path d={detailsSvg.p3c34800} fill="white" />
                              </svg>
                            ) : (
                              <svg fill="none" viewBox="0 0 20 20" className="size-[12px]">
                                <path clipRule="evenodd" d={detailsSvg.p1c834100} fill="white" fillRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          {i < AUDIT_NOTES.length - 1 && <div className="w-px flex-1 bg-[#e2e8f0] mt-1" />}
                        </div>
                        {/* Content */}
                        <div className="flex flex-col gap-1 flex-1 min-w-0 mt-1">
                          <div className="flex items-center gap-1 text-[13px]">
                            <span className="text-[#64748b]">{note.dotColor === "#16a34a" ? "Info by" : "Created by"}</span>
                            <span className="font-medium cursor-pointer hover:underline" style={{ color: note.agentColor }}>{note.agent}</span>
                          </div>
                          <p className="text-[#374151] text-[13px] leading-[1.5] whitespace-pre-wrap">{note.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Notes */}
                  <div className="border border-[#e2e8f0] rounded-[8px] overflow-hidden">
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Add Notes"
                      className="w-full px-4 py-3 text-[14px] text-[#333] placeholder-[#94a3b8] outline-none resize-none border-0 bg-transparent min-h-[80px]"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setNoteText("")}
                      className="h-[36px] px-5 rounded-[8px] border border-[#d1d1d1] bg-white text-[#686868] text-[14px] hover:bg-[#f8fafc] cursor-pointer transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => { if (noteText.trim()) { toast.success("Note saved"); setNoteText(""); } }}
                      className="h-[36px] px-5 rounded-[8px] bg-[#90003b] border border-[#90003b] text-white text-[14px] hover:bg-[#750030] cursor-pointer transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "audit" && (
                <div className="px-5 py-8 text-center text-[#94a3b8] text-[14px]">No audit history available.</div>
              )}
              {activeTab === "escalations" && (
                <div className="px-5 py-8 text-center text-[#94a3b8] text-[14px]">No escalations found.</div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

