import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { CheckCircle2, ClipboardList, Download, FileSpreadsheet, Maximize2, Minimize2, RefreshCw, ShieldCheck, ThumbsUp, TriangleAlert, Upload, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { ColumnResizeHandle, useResizableColumns } from "../../components/common/ResizableColumns";
import { EMAIL_TABLE_NAVY, TruncateTooltip } from "../../components/common/EmailTable";
import { TablePagination, type RowDensity } from "../../components/common/TablePagination";
import { exportRowsToExcel } from "../../components/common/exportExcel";
import { TableToolbarMultiSelect, TableToolbarSearch, useExclusiveOpen } from "../../components/common/TableToolbar";
import { CASE_STATUSES, FACTORIES, PERSONA_LABELS, REQUEST_TYPES, type CaseKind, type CaseStatus, type SsdSoeCase } from "./ssdSoeData";
import { addCases, casesForPersona, resetDemoData, useSsdSoeCases, usePersona } from "./ssdSoeStore";
import { AMBER, GREEN, KIND_STYLE, KindPill, PersonaSwitcher, PURPLE, RED, SourcePill, StatTile, StatusPill, YesNoPill } from "./ssdSoeUi";

type NavProps = {
  onViewAllNotifications: () => void;
  onLogout?: () => void;
  onNavigateHome?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateCommunication?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateCmdCenterAdvFilter?: () => void;
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
  onNavigateEmailWorkflow?: () => void;
};

const TH = "relative sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE] text-[12px] font-semibold text-[#4D4D4D]";
const COLUMNS = ["Case No", "Type", "Source", "Order No", "Line", "Part Number", "Qty", "Customer", "Created", "Request Type", "Factory", "Follow-up", "Factory Best SSD", "Reschedule SSD", "Current SSD", "Status", "P1 RME", "Recent comment", "Oracle"];

type Row = { c: SsdSoeCase; lineIndex: number };

export function SsdSoePage(nav: NavProps) {
  const navigate = useNavigate();
  const persona = usePersona();
  const allCases = useSsdSoeCases();
  const visibleCases = useMemo(() => casesForPersona(allCases, persona), [allCases, persona]);
  const rc = useResizableColumns("ssdSoe.cases", COLUMNS.join("|"));

  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"All" | CaseKind>("All");
  const [factories, setFactories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [requestTypes, setRequestTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
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
  const [rowDensity, setRowDensity] = useState<RowDensity>("large");
  const rowPadY = rowDensity === "small" ? "py-1.5" : rowDensity === "medium" ? "py-2.5" : "py-3.5";
  const { openKey, setOpenKey, registerRef } = useExclusiveOpen();
  const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const rows: Row[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleCases
      .filter((c) => kind === "All" || c.kind === kind)
      .flatMap((c) => c.lines.map((_, lineIndex) => ({ c, lineIndex })))
      .filter(({ c, lineIndex }) => {
        const l = c.lines[lineIndex];
        if (factories.length > 0 && !factories.includes(l.factory)) return false;
        if (statuses.length > 0 && !statuses.includes(c.status)) return false;
        if (requestTypes.length > 0 && !requestTypes.includes(l.requestType)) return false;
        if (q && !`${c.caseNo} ${c.orderNo} ${c.customer} ${l.partNumber} ${c.customerPo}`.toLowerCase().includes(q)) return false;
        return true;
      });
  }, [visibleCases, kind, factories, statuses, requestTypes, search]);

  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const safePage = Math.min(page, pageCount);
  const pageRows = rows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);
  const filtersApplied = factories.length + statuses.length + requestTypes.length + (search ? 1 : 0) + (kind !== "All" ? 1 : 0);
  const clearFilters = () => {
    setSearch("");
    setKind("All");
    setFactories([]);
    setStatuses([]);
    setRequestTypes([]);
    setPage(1);
  };

  // Headline numbers, worded for what each persona cares about.
  const count = (s: CaseStatus) => visibleCases.filter((c) => c.status === s).length;
  const tiles =
    persona === "csr"
      ? [
          { label: "Open cases", value: visibleCases.filter((c) => !["Closed", "Cancelled", "Approved", "Rejected"].includes(c.status)).length, sub: "Needing a CSR action", accent: EMAIL_TABLE_NAVY, icon: <ClipboardList size={18} /> },
          { label: "Awaiting your approval", value: count("Awaiting Approval"), sub: "Factory-proposed SSD changes", accent: AMBER, icon: <ThumbsUp size={18} /> },
          { label: "Pending RME", value: count("Pending RME"), sub: "Waiting on SPOC / RME team", accent: PURPLE, icon: <ShieldCheck size={18} /> },
          { label: "Closed", value: count("Closed"), sub: "Resolved and updated in Oracle", accent: GREEN, icon: <CheckCircle2 size={18} /> },
        ]
      : persona === "factory"
      ? [
          { label: "Submitted", value: visibleCases.length, sub: "Cases from your uploads", accent: EMAIL_TABLE_NAVY, icon: <FileSpreadsheet size={18} /> },
          { label: "Awaiting approval", value: count("Awaiting Approval"), sub: "With the CSR", accent: AMBER, icon: <ClipboardList size={18} /> },
          { label: "Approved", value: count("Approved"), sub: "Oracle updated", accent: GREEN, icon: <CheckCircle2 size={18} /> },
          { label: "Rejected", value: count("Rejected"), sub: "Needs a new proposal", accent: RED, icon: <TriangleAlert size={18} /> },
        ]
      : [
          { label: "Open requests", value: visibleCases.filter((c) => c.rme?.status === "Open").length, sub: "Waiting for your feedback", accent: PURPLE, icon: <ShieldCheck size={18} /> },
          { label: "Accepted", value: visibleCases.filter((c) => c.rme?.status === "Accepted").length, sub: "Proposed date accepted", accent: GREEN, icon: <CheckCircle2 size={18} /> },
          { label: "Declined", value: visibleCases.filter((c) => c.rme?.status === "Declined").length, sub: "Expedite or alternative needed", accent: RED, icon: <TriangleAlert size={18} /> },
          { label: "All routed to you", value: visibleCases.length, sub: "P1 RME / SOE exceptions", accent: EMAIL_TABLE_NAVY, icon: <ClipboardList size={18} /> },
        ];

  const exportExcel = () => {
    const headers = ["Case No", "Type", "Order No", "Line", "Part Number", "Qty", "Customer", "Request Type", "Factory", "Current SSD", "Status"];
    const data = rows.map(({ c, lineIndex }) => {
      const l = c.lines[lineIndex];
      return [c.caseNo, c.kind, c.orderNo, l.line, l.partNumber, l.quantity, c.customer, l.requestType, l.factory, l.ssd, c.status];
    });
    exportRowsToExcel("ssd-soe-cases", headers, data, "My Cases");
    toast.success(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"}`);
  };

  return (
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
          <AppHeader activeNav="SSD / SOE" {...nav} />
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-[1600px] mx-auto px-5 pt-3 pb-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <Breadcrumbs items={[{ label: "SSD / SOE" }, { label: "My Cases" }]} />
                <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">My Cases</h1>
                <p className="text-[12px] text-[#97999B] mt-0.5">{PERSONA_LABELS[persona].blurb}.</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-[12px] text-[#4D4D4D]">
                  <span className="size-[7px] rounded-full bg-[#468657]" />
                  Last synced {lastSynced}
                </span>
                <button onClick={handleRefresh} disabled={syncing} title="Refresh" className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                  <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                </button>
                <button onClick={() => setKpisExpanded((v) => !v)} title={kpisExpanded ? "Collapse KPIs" : "Expand KPIs"} className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
                  {kpisExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <PersonaSwitcher persona={persona} />
              </div>
            </div>

            {kpisExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {tiles.map((t) => (
                  <StatTile key={t.label} {...t} />
                ))}
              </div>
            )}

            {persona === "factory" && <FactoryUploadCard />}

            <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
                <TableToolbarSearch value={search} onCommit={(v) => { setSearch(v); setPage(1); }} placeholder="Search case, order, customer, part" />
                <div className="inline-flex items-center p-0.5 rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F8]">
                  {(["All", "SOE", "SSD"] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => { setKind(k); setPage(1); }}
                      className="flex items-center gap-1.5 px-3 h-[28px] rounded-[6px] text-[12px] font-semibold cursor-pointer transition-colors"
                      style={kind === k ? { backgroundColor: "#fff", color: EMAIL_TABLE_NAVY, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#666666" }}
                    >
                      {k !== "All" && <span className="size-[8px] rounded-[2px]" style={{ backgroundColor: KIND_STYLE[k].fg }} />}
                      {k === "All" ? "All cases" : `${k} cases`}
                    </button>
                  ))}
                </div>
                {persona !== "factory" && (
                  <TableToolbarMultiSelect
                    label="Factory"
                    options={FACTORIES}
                    pending={factories}
                    onToggle={(o) => { setFactories((p) => toggleIn(p, o)); setPage(1); }}
                    onToggleAll={() => setFactories((p) => (p.length === FACTORIES.length ? [] : [...FACTORIES]))}
                    onClear={() => setFactories([])}
                    open={openKey === "factory"}
                    onOpenChange={(o) => setOpenKey(o ? "factory" : null)}
                    containerRef={registerRef("factory")}
                    appliedCount={factories.length}
                    dirty={false}
                    width={180}
                  />
                )}
                <TableToolbarMultiSelect
                  label="Status"
                  options={CASE_STATUSES}
                  pending={statuses}
                  onToggle={(o) => { setStatuses((p) => toggleIn(p, o)); setPage(1); }}
                  onToggleAll={() => setStatuses((p) => (p.length === CASE_STATUSES.length ? [] : [...CASE_STATUSES]))}
                  onClear={() => setStatuses([])}
                  open={openKey === "status"}
                  onOpenChange={(o) => setOpenKey(o ? "status" : null)}
                  containerRef={registerRef("status")}
                  appliedCount={statuses.length}
                  dirty={false}
                  width={200}
                />
                <TableToolbarMultiSelect
                  label="Exception type"
                  options={REQUEST_TYPES}
                  pending={requestTypes}
                  onToggle={(o) => { setRequestTypes((p) => toggleIn(p, o)); setPage(1); }}
                  onToggleAll={() => setRequestTypes((p) => (p.length === REQUEST_TYPES.length ? [] : [...REQUEST_TYPES]))}
                  onClear={() => setRequestTypes([])}
                  open={openKey === "type"}
                  onOpenChange={(o) => setOpenKey(o ? "type" : null)}
                  containerRef={registerRef("type")}
                  appliedCount={requestTypes.length}
                  dirty={false}
                  width={220}
                />
                {filtersApplied > 0 && (
                  <button onClick={clearFilters} className="text-[12.5px] font-semibold hover:underline cursor-pointer whitespace-nowrap" style={{ color: EMAIL_TABLE_NAVY }}>
                    Clear filters
                  </button>
                )}
                <button
                  onClick={exportExcel}
                  className="ml-auto flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] font-semibold text-[#4D4D4D] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                >
                  <Download size={14} /> Export to Excel
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className={`w-full min-w-[1900px] border-separate border-spacing-0 ${rc.tableClass}`} style={rc.tableStyle}>
                  {rc.colgroup}
                  <thead>
                    <tr className="bg-[#F7F7F7]">
                      {COLUMNS.map((label) => (
                        <th key={label} className={TH}>
                          {label}
                          <ColumnResizeHandle rc={rc} label={label} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length === 0 ? (
                      <tr>
                        <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-[13px] text-[#97999B]">
                          No cases match your filters
                        </td>
                      </tr>
                    ) : (
                      pageRows.map(({ c, lineIndex }) => {
                        const l = c.lines[lineIndex];
                        const lastComment = l.comments[0];
                        const cell = `px-4 ${rowPadY} text-[12.5px] text-[#4D4D4D] border-b border-[#DEDEDE] whitespace-nowrap`;
                        return (
                          <tr key={`${c.caseNo}-${l.line}`} onClick={() => navigate(`/ssd-soe/case/${c.caseNo}`)} className="group cursor-pointer hover:bg-[#EEF2F7] transition-colors">
                            <td className={`${cell} font-semibold`} style={{ color: "#CC0025" }}>
                              <span className="underline decoration-dotted underline-offset-4">{c.caseNo}</span>
                            </td>
                            <td className={cell}><KindPill kind={c.kind} /></td>
                            <td className={cell}><SourcePill source={c.source} /></td>
                            <td className={cell}>{c.orderNo}</td>
                            <td className={cell}>{l.line}</td>
                            <td className={cell}>{l.partNumber}</td>
                            <td className={cell}>{l.quantity}</td>
                            <td className={`${cell} max-w-[220px]`}><TruncateTooltip label={c.customer} /></td>
                            <td className={cell}>{c.dateSubmitted}</td>
                            <td className={cell}>{l.requestType}</td>
                            <td className={cell}>{l.factory}</td>
                            <td className={cell}>{l.followupDate || <span className="text-[#BFC1C4]">-</span>}</td>
                            <td className={cell}>{l.factoryBestSsd || <span className="text-[#BFC1C4]">-</span>}</td>
                            <td className={cell}>{l.rescheduleSsd}</td>
                            <td className={`${cell} font-semibold text-[#262626]`}>{l.ssd}</td>
                            <td className={cell}><StatusPill status={c.status} /></td>
                            <td className={cell}><YesNoPill yes={l.p1Rme || Boolean(c.rme)} /></td>
                            <td className={`${cell} max-w-[280px]`}>
                              {lastComment ? <TruncateTooltip label={`[${lastComment.at}] ${lastComment.by}: ${lastComment.text}`} /> : <span className="text-[#BFC1C4]">-</span>}
                            </td>
                            <td className={cell}>{l.updatedInOracle ? <CheckCircle2 size={15} style={{ color: GREEN }} /> : <span className="text-[#BFC1C4]">-</span>}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <TablePagination
                showing={pageRows.length}
                total={rows.length}
                density={rowDensity}
                onDensityChange={setRowDensity}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(1); }}
                page={safePage}
                totalPages={pageCount}
                onPageChange={setPage}
              />
            </div>

            <p className="text-[11px] text-[#97999B]">
              Demo data is kept in your browser.{" "}
              <button onClick={() => { resetDemoData(); toast.success("Demo data reset"); }} className="underline hover:text-[#4D4D4D] cursor-pointer">
                Reset demo data
              </button>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

// Factory persona: upload a file of proposed SSD changes. The system validates it, groups the impacted lines by
// unique order, and creates one native SSD case per order for the CSR to approve or reject.
function FactoryUploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ file: string; rows: number; orders: number; issues: string[] } | null>(null);

  const handleFile = (file: File) => {
    const rows = 8 + (file.name.length % 7);
    const orders = 2 + (file.name.length % 3);
    const issues = rows % 3 === 0 ? [`Row ${rows - 1}: line 9.1 is not on order 4690211 and was skipped`] : [];
    const stamp = String(Date.now()).slice(-4);
    const newCases: SsdSoeCase[] = Array.from({ length: orders }, (_, i) => ({
      caseNo: `D-SDD-${stamp}${i}`,
      kind: "SSD",
      source: "Factory",
      status: "Awaiting Approval",
      orderNo: String(4691000 + i * 137 + Number(stamp)),
      orderStatus: "BOOKED",
      customerPo: `PO-UP-${stamp}${i}`,
      customer: ["Acme Industries", "Nordlicht Messtechnik", "Sterling & Co", "Coral Global Solutions"][i % 4],
      ou: "USA-OU-1100",
      region: "NA",
      destination: "US",
      requester: "f01.planner@keysight.com",
      csr: "arman.singh@keysight.com",
      fieldEngineer: "-",
      crddType: "1 Single Date Per Order",
      crddDate: "",
      dateSubmitted: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-"),
      dateClosed: "",
      originalRequest: `Uploaded from ${file.name}`,
      totalPriceUsd: "0.00",
      headerHold: "",
      linkedCase: "",
      ssdCaseNo: `D-SDD-${stamp}${i}`,
      ssdCaseStatus: "Awaiting Approval",
      factory: "F01",
      lines: [
        {
          line: "1.1", partNumber: `N90${20 + i}B`, quantity: 1, factory: "F01", bookedDate: "22-Apr-26", ssd: "15-Sep-26", crd: "01-Oct-26", sad: "01-Oct-26", srt: 5,
          requestType: "SSD Push-out", status: "Awaiting Approval", caseOwner: "Arman Singh", ownerEmail: "arman.singh@keysight.com", planner: "f01.planner@keysight.com",
          plannerCode: "EPSG100", oracleLineStatus: "AWAITING_FULFILLMENT", planningPriority: 100, extSellingPrice: 0, pl: "1A", p1Rme: false, requireRme: false,
          factoryBestSsd: "29-Sep-26", rescheduleSsd: "NA", followupDate: "", updatedInOracle: false, shipDate: "", reopenDate: "", lineHoldInfo: "", taaCompliance: "",
          comments: [{ at: "today", by: "Factory F01", text: `Uploaded via ${file.name}` }],
        },
      ],
    }));
    addCases(newCases);
    setResult({ file: file.name, rows, orders, issues });
    toast.success(`${orders} case${orders === 1 ? "" : "s"} created from ${file.name}`);
  };

  return (
    <div className="bg-white rounded-[8px] border border-[#E2E6E9] px-5 py-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[14px] font-bold text-[#111827]">Upload proposed SSD changes</p>
          <p className="text-[12px] text-[#97999B] mt-0.5">Excel file with Order #, Line #, Proposed SSD, Pull-in / Push-out and Remarks. One case is created per unique order.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => toast.info("Template downloaded")} className="flex items-center gap-1.5 h-[34px] px-3 rounded-[8px] border border-[#E2E6E9] text-[12.5px] font-semibold text-[#4D4D4D] hover:bg-[#F7F7F7] cursor-pointer transition-colors">
            <Download size={14} /> Template
          </button>
          <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1.5 h-[34px] px-3.5 rounded-[8px] text-white text-[12.5px] font-semibold hover:opacity-90 cursor-pointer transition-opacity" style={{ backgroundColor: EMAIL_TABLE_NAVY }}>
            <Upload size={14} /> Upload file
          </button>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </div>
      </div>
      {result && (
        <div className="mt-3 rounded-[8px] border border-[#C9E2D1] bg-[#EFF6F1] px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: GREEN }}>
              <CheckCircle2 size={14} /> {result.file}: {result.rows} rows validated, {result.orders} unique order{result.orders === 1 ? "" : "s"}, {result.orders} case{result.orders === 1 ? "" : "s"} created
            </p>
            {result.issues.map((i) => (
              <p key={i} className="flex items-center gap-1.5 text-[12px] mt-1" style={{ color: AMBER }}>
                <TriangleAlert size={12} /> {i}
              </p>
            ))}
            <p className="text-[11.5px] text-[#4D4D4D] mt-1">They are now Awaiting Approval with the CSR. You will see Approved or Rejected here.</p>
          </div>
          <button onClick={() => setResult(null)} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer shrink-0" aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}
    </div>
  );
}

