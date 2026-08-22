import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import holdSvg from "@/imports/HoldManagementDesktopV3/svg-5pa1ejxi9n";
import { TrendingUp } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";

const CARDS_PER_PAGE = 4;

export function HoldManagementOverview({ onLogout, onViewAllNotifications, onNavigateHome, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateNewOverview, onViewAllOrders, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateEmailTemplate, onNavigateReview, onNavigateEmailWorkflow }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onViewAllOrders?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateReview?: () => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  const [timelineTab, setTimelineTab] = useState("7d");
  const [activeSort, setActiveSort] = useState("Aging");
  const [monthOpen, setMonthOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("Month");
  const monthRef = useRef<HTMLDivElement>(null);
  // per-panel slider state
  const [panelPage, setPanelPage] = useState<Record<string, number>>({});
  const [slideDir, setSlideDir] = useState<Record<string, "next" | "prev">>({});

  const navigatePanel = (title: string, dir: "next" | "prev") => {
    setSlideDir(d => ({ ...d, [title]: dir }));
    setPanelPage(p => ({ ...p, [title]: (p[title] ?? 0) + (dir === "next" ? 1 : -1) }));
  };
  const [todos, setTodos] = useState([
    { id: 1, label: "Review SLA Breached Holds", priority: "#dc2626", done: false },
    { id: 2, label: "Process Orders Batch", priority: "#d97706", done: false },
    { id: 3, label: "Update Invoicing Rules", priority: "#cbd5e1", done: false },
    { id: 4, label: "Escalate At-Risk Holds", priority: "#dc2626", done: false },
    { id: 5, label: "Weekly Hold Report", priority: "#cbd5e1", done: false },
  ]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) setMonthOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const kpis = [
    { label: "OPEN HOLDS", value: "1,300", delta: "↑ 4.2%", up: true, sparkColor: "#cbd5e1" },
    { label: "SLA BREACHED", value: "345", delta: "↓ 1.1%", up: false, sparkColor: "#fecbcb" },
    { label: "AT RISK", value: "120", delta: "↑ 0.8%", up: true, sparkColor: "#fde7a0" },
    { label: "TOTAL VALUE", value: "$ 5060M", delta: "↑ 4.2%", up: true, sparkColor: "#bbf7d0" },
    { label: "ON TRACK", value: "234", delta: "↑ 1.6%", up: true, sparkColor: "#bfdafe" },
  ];
  const sparkHeights = [8, 14, 10, 18, 12, 20, 14, 16];

  type Tag = { label: string; color: string; bg: string };
  type HoldCardData = { code: string; badge: string; badgeColor: string; orders: string; breached: string; value: string; tags: Tag[]; critical?: boolean; dividers?: boolean };
  type HoldPanelData = { title: string; count: number; critical: number; total: string; accentColor: string; cards: HoldCardData[] };

  const holdPanels: HoldPanelData[] = [
    {
      title: "Shipment Impacting Holds", count: 18, critical: 5, total: "$24.5M", accentColor: "#3b82f6",
      cards: [
        { code: "MFG", badge: "SHP", badgeColor: "#3b82f6", orders: "06", breached: "01", value: "$3.8M", critical: true, tags: [{ label: "Header", color: "#2664dc", bg: "rgba(56,130,246,0.1)" }, { label: "On track", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "LOG", badge: "SHP", badgeColor: "#3b82f6", orders: "08", breached: "02", value: "$4.1M", tags: [{ label: "Line", color: "#2664dc", bg: "rgba(56,130,246,0.1)" }, { label: "At Risk", color: "#d97706", bg: "rgba(217,119,6,0.1)" }] },
        { code: "WHS", badge: "SHP", badgeColor: "#3b82f6", orders: "05", breached: "00", value: "$2.9M", tags: [{ label: "Header", color: "#2664dc", bg: "rgba(56,130,246,0.1)" }, { label: "On track", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "DST", badge: "SHP", badgeColor: "#3b82f6", orders: "07", breached: "03", value: "$5.2M", tags: [{ label: "Line", color: "#2664dc", bg: "rgba(56,130,246,0.1)" }, { label: "Late", color: "#dc2626", bg: "rgba(220,38,38,0.1)" }] },
        { code: "FRT", badge: "SHP", badgeColor: "#3b82f6", orders: "04", breached: "01", value: "$2.1M", tags: [{ label: "Header", color: "#2664dc", bg: "rgba(56,130,246,0.1)" }, { label: "On track", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "EXP", badge: "SHP", badgeColor: "#3b82f6", orders: "03", breached: "00", value: "$1.7M", tags: [{ label: "Line", color: "#2664dc", bg: "rgba(56,130,246,0.1)" }, { label: "On track", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
      ],
    },
    {
      title: "Invoicing Only Holds", count: 20, critical: 3, total: "$18.2M", accentColor: "#7c3bf6",
      cards: [
        { code: "FIN", badge: "INV", badgeColor: "#7c3bf6", orders: "05", breached: "02", value: "$2.8M", dividers: true, tags: [{ label: "INV", color: "#7c3bf6", bg: "rgba(124,59,246,0.1)" }, { label: "Late", color: "#dc2626", bg: "rgba(220,38,38,0.1)" }] },
        { code: "ACC", badge: "INV", badgeColor: "#7c3bf6", orders: "03", breached: "03", value: "$1.6M", dividers: true, tags: [{ label: "INV", color: "#7c3bf6", bg: "rgba(124,59,246,0.1)" }, { label: "Header", color: "#637590", bg: "rgba(99,117,144,0.1)" }] },
        { code: "PAY", badge: "INV", badgeColor: "#7c3bf6", orders: "08", breached: "01", value: "$4.2M", dividers: true, tags: [{ label: "INV", color: "#7c3bf6", bg: "rgba(124,59,246,0.1)" }, { label: "On Track", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "BIL", badge: "INV", badgeColor: "#7c3bf6", orders: "04", breached: "02", value: "$3.1M", dividers: true, tags: [{ label: "INV", color: "#7c3bf6", bg: "rgba(124,59,246,0.1)" }, { label: "Late", color: "#dc2626", bg: "rgba(220,38,38,0.1)" }] },
        { code: "TAX", badge: "INV", badgeColor: "#7c3bf6", orders: "06", breached: "00", value: "$2.4M", dividers: true, tags: [{ label: "INV", color: "#7c3bf6", bg: "rgba(124,59,246,0.1)" }, { label: "On Track", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "CRD", badge: "INV", badgeColor: "#7c3bf6", orders: "02", breached: "01", value: "$0.9M", dividers: true, tags: [{ label: "INV", color: "#7c3bf6", bg: "rgba(124,59,246,0.1)" }, { label: "At Risk", color: "#d97706", bg: "rgba(217,119,6,0.1)" }] },
      ],
    },
    {
      title: "Non CC Holds", count: 30, critical: 4, total: "$31.0M", accentColor: "#0891b5",
      cards: [
        { code: "GLB", badge: "NCC", badgeColor: "#0891b5", orders: "06", breached: "02", value: "$5.2M", dividers: true, tags: [{ label: "GTL", color: "#0891b5", bg: "rgba(8,145,181,0.1)" }, { label: "Header", color: "#637590", bg: "rgba(99,117,144,0.1)" }] },
        { code: "TRD", badge: "NCC", badgeColor: "#0891b5", orders: "04", breached: "04", value: "$2.3M", dividers: true, tags: [{ label: "GTL", color: "#0891b5", bg: "rgba(8,145,181,0.1)" }, { label: "Escalate", color: "#dc2626", bg: "rgba(220,38,38,0.1)" }] },
        { code: "EXP", badge: "NCC", badgeColor: "#0891b5", orders: "09", breached: "01", value: "$6.8M", dividers: true, tags: [{ label: "GTL", color: "#0891b5", bg: "rgba(8,145,181,0.1)" }, { label: "On Fund", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "WHL", badge: "NCC", badgeColor: "#0891b5", orders: "05", breached: "03", value: "$3.7M", dividers: true, tags: [{ label: "GTL", color: "#0891b5", bg: "rgba(8,145,181,0.1)" }, { label: "Header", color: "#637590", bg: "rgba(99,117,144,0.1)" }] },
        { code: "REG", badge: "NCC", badgeColor: "#0891b5", orders: "07", breached: "02", value: "$4.5M", dividers: true, tags: [{ label: "GTL", color: "#0891b5", bg: "rgba(8,145,181,0.1)" }, { label: "On Fund", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "CMP", badge: "NCC", badgeColor: "#0891b5", orders: "03", breached: "01", value: "$1.9M", dividers: true, tags: [{ label: "GTL", color: "#0891b5", bg: "rgba(8,145,181,0.1)" }, { label: "At Risk", color: "#d97706", bg: "rgba(217,119,6,0.1)" }] },
      ],
    },
  ];

  const releasedOrders = [
    { id: "#7800011", value: "$340K", company: "Acme Industries Ltd", reason: "Credit Check Failure", time: "Released 2d ago" },
    { id: "#7800042", value: "$215K", company: "GlobalTech Solutions", reason: "Credit Check Failure", time: "Released 1d ago" },
    { id: "#7800056", value: "$128K", company: "Nexus Corp", reason: "Payment Overdue", time: "Released 4h ago" },
    { id: "#7800078", value: "$492K", company: "Sterling & Co", reason: "Credit Check Failure", time: "Released 6h ago" },
  ];

  return (
    <div className="bg-[#f1f3f6] flex size-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .slide-next { animation: slideInFromRight 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        .slide-prev { animation: slideInFromLeft  0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
      `}</style>
      <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-auto">
        <AppHeader
          activeNav="Hold Management"
          onViewAllNotifications={onViewAllNotifications}
          onLogout={onLogout}
          onNavigateHome={onNavigateHome}
          onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
          onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
          onNavigateNewOverview={onNavigateNewOverview}
          onNavigateHoldManagementOverview={() => {}}
          onNavigateOrderListing={onNavigateOrderListing}
          onNavigateReleasedOrders={onNavigateReleasedOrders}
          onNavigateEmailTemplate={onNavigateEmailTemplate}
          onNavigateReview={onNavigateReview}
          onNavigateEmailWorkflow={onNavigateEmailWorkflow}
        />

        <main className="flex-1 w-full max-w-[1600px] mx-auto p-5 flex flex-col gap-5">

          {/* ── Page header ── */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-[2px]">
              <p className="font-semibold text-[#0f172a] text-[20px] leading-tight">Holds Overview</p>
              <p className="text-[#94a3b8] text-[12px]">Monday, 6 July 2026</p>
            </div>
            <div className="flex items-center gap-[12px]">
              <div className="flex items-center gap-[6px]">
                <div className="size-[8px] rounded-full bg-[#16a34a] shrink-0" />
                <p className="text-[#94a3b8] text-[11px] whitespace-nowrap">Last synced 10:45 AM</p>
              </div>

              {/* Month dropdown */}
              <div className="relative" ref={monthRef}>
                <button
                  onClick={() => setMonthOpen(o => !o)}
                  className="bg-white h-[32px] px-[12px] pr-[10px] rounded-[8px] border border-[#e0e5ed] flex items-center gap-[6px] text-[#64748b] text-[12px] font-medium cursor-pointer hover:bg-[#f8fafc] transition-colors"
                >
                  {selectedMonth}
                  <svg fill="none" viewBox="0 0 10.5 6" className={`size-[10px] shrink-0 transition-transform duration-150 ${monthOpen ? "rotate-180" : ""}`}>
                    <path clipRule="evenodd" d={holdSvg.p99cbd00} fill="#64748b" fillRule="evenodd" />
                  </svg>
                </button>
                {monthOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] bg-white rounded-[8px] border border-[#e2e8f0] shadow-lg z-30 py-1 min-w-[130px]">
                    {["This Month", "Last Month", "Last 3 Months", "Last 6 Months", "This Year"].map((m) => (
                      <button
                        key={m}
                        onClick={() => { setSelectedMonth(m); setMonthOpen(false); toast.success(`Period set to ${m}`); }}
                        className={`w-full text-left px-3 py-[7px] text-[12px] cursor-pointer transition-colors ${selectedMonth === m ? "bg-[#f8f0f4] text-[#90003b] font-semibold" : "text-[#374151] hover:bg-[#f8fafc]"}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => toast.success("Report exported successfully", { description: "holds-overview.csv is ready to download" })}
                className="bg-white h-[32px] px-[10px] rounded-[8px] border border-[#e0e5ed] flex items-center gap-[6px] text-[#64748b] text-[12px] font-medium cursor-pointer hover:bg-[#f8fafc] transition-colors"
              >
                <svg fill="none" viewBox="0 0 12.25 10.9375" className="size-[13px] shrink-0">
                  <path clipRule="evenodd" d={holdSvg.p3615000} fill="#64748b" fillRule="evenodd" />
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* ── KPI strip ── */}
          <div className="flex gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white flex-1 min-w-0 rounded-[8px] border border-black/[0.08] p-3 sm:p-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-[#6b7380]">{kpi.label}</p>
                  <div className="rounded-[8px] p-1 shrink-0">
                    <div className="flex items-end gap-[2px] h-[11px]">
                      {sparkHeights.map((h, i) => (
                        <div key={i} className="w-[3px] rounded-[1px]" style={{ height: h * 0.55, backgroundColor: kpi.sparkColor }} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[18px] sm:text-[22px] font-bold text-[#111827] leading-none">{kpi.value}</p>
                <div className={`flex items-center gap-1 text-[11px] font-medium ${kpi.up ? "text-emerald-600" : "text-rose-500"}`}>
                  <TrendingUp size={10} />
                  <span>{kpi.delta} vs last week</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Body: panels + sidebar ── */}
          <div className="flex gap-5 items-start">

            {/* ── Left column ── */}
            <div className="flex-1 min-w-0 bg-white rounded-[8px] border border-[#e8ecef] overflow-hidden">

              {/* Filter bar */}
              <div className="bg-[#f1f5f9] flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-[10px] border-b border-[#e8ecef] shadow-[inset_0px_-1px_0px_#e8ecef]">
                {/* Timeline */}
                <div className="flex items-center gap-2">
                  <p className="text-[#637590] text-[10px] font-medium tracking-[0.4px] whitespace-nowrap">TIMELINE</p>
                  <div className="bg-[#e5e8ec] h-[16px] w-px" />
                  <div className="flex items-center">
                    {["7d", "14d", "20d", "30d"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimelineTab(t)}
                        className="flex flex-col items-center gap-[8px] px-3 pt-[10px] pb-0 cursor-pointer"
                      >
                        <span className={`text-[12px] whitespace-nowrap ${timelineTab === t ? "font-semibold text-[#90003b]" : "font-normal text-[#637590]"}`}>{t}</span>
                        <div className={`h-[2px] rounded-[2px] ${timelineTab === t ? "bg-[#90003b] w-5" : "bg-transparent w-[27px]"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#e5e8ec] h-[32px] w-px" />
                {/* Sort by */}
                <div className="flex items-center gap-2">
                  <p className="text-[#637590] text-[10px] font-medium tracking-[0.4px] whitespace-nowrap">SORT BY</p>
                  <div className="bg-[#e5e8ec] h-[16px] w-px" />
                  <div className="flex items-center gap-[6px] flex-wrap">
                    {["Aging", "SSD Proximity", "Value", "Order Volume"].map((s) => {
                      const isActive = activeSort === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setActiveSort(s)}
                          className={`flex items-center gap-[5px] px-[10px] py-[6px] rounded-[8px] text-[12px] border cursor-pointer transition-colors whitespace-nowrap ${
                            isActive ? "bg-[#90003b] text-white border-[#90003b] font-semibold" : "text-[#c53e6c] border-[#c53e6c] bg-transparent font-normal hover:bg-[#fff0f5]"
                          }`}
                        >
                          {s}
                          {isActive ? (
                            <svg fill="none" viewBox="0 0 10.5 6" className="size-[10px]">
                              <path clipRule="evenodd" d={holdSvg.p276a1b80} fill="white" fillRule="evenodd" />
                            </svg>
                          ) : (
                            <svg fill="none" viewBox="0 0 10 14" className="size-[8px]">
                              <path d={holdSvg.p2dd962c0} fill="#C53E6C" fillOpacity="0.7" />
                              <path d={holdSvg.p2aef46f0} fill="#C53E6C" fillOpacity="0.7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Panel sections */}
              {holdPanels.map((panel) => {
                const page = panelPage[panel.title] ?? 0;
                const totalPages = Math.ceil(panel.cards.length / CARDS_PER_PAGE);
                const visibleCards = panel.cards.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);
                const canPrev = page > 0;
                const canNext = page < totalPages - 1;
                return (
                  <div key={panel.title} className="border-t border-[#e8ecef]">
                    {/* Panel header with accent left border */}
                    <div className="relative bg-white pt-[18px] pb-[14px] px-5">
                      <div className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: panel.accentColor }} />
                      <div className="flex flex-col gap-[6px]">
                        <p className="text-[#0f1729] text-[14px] font-semibold">{panel.title}</p>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <p className="text-[#64748b] text-[12px] whitespace-nowrap">{panel.count} Holds</p>
                            <div className="bg-[#e2e8f0] h-[12px] w-px" />
                            <div className="flex items-center gap-[6px]">
                              <div className="size-[6px] rounded-full bg-[#dc2626] shrink-0" />
                              <p className="text-[#dc2626] text-[12px] whitespace-nowrap">{panel.critical} Critical</p>
                            </div>
                            <div className="bg-[#e2e8f0] h-[12px] w-px" />
                            <p className="text-[#64748b] text-[12px] whitespace-nowrap">{panel.total} Total value</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => onViewAllOrders ? onViewAllOrders() : toast.info(`Viewing all ${panel.count} holds for ${panel.title}`)}
                              className="text-[#3b82f6] text-[12px] font-medium cursor-pointer hover:underline whitespace-nowrap"
                            >
                              View all {panel.count} holds →
                            </button>
                            <div className="flex items-center gap-2">
                              {/* Page indicator dots */}
                              <div className="flex items-center gap-1 mr-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setPanelPage(p => ({ ...p, [panel.title]: i }))}
                                    className={`rounded-full transition-all cursor-pointer ${i === page ? "w-[16px] h-[5px] bg-[#90003b]" : "size-[5px] bg-[#e2e8f0] hover:bg-[#cbd5e1]"}`}
                                  />
                                ))}
                              </div>
                              <button
                                disabled={!canPrev}
                                onClick={() => navigatePanel(panel.title, "prev")}
                                className={`size-[28px] rounded-[8px] border flex items-center justify-center transition-colors ${canPrev ? "border-[#e2e8f0] hover:bg-[#f8fafc] cursor-pointer" : "border-[#f1f5f9] opacity-40 cursor-not-allowed"}`}
                              >
                                <svg fill="none" viewBox="0 0 16 16" className="size-[14px]"><path d="M10 12L6 8L10 4" stroke="#64748B" strokeLinecap="round" strokeWidth="2" /></svg>
                              </button>
                              <button
                                disabled={!canNext}
                                onClick={() => navigatePanel(panel.title, "next")}
                                className={`size-[28px] rounded-[8px] border flex items-center justify-center transition-colors ${canNext ? "border-[#e2e8f0] hover:bg-[#f8fafc] cursor-pointer" : "border-[#f1f5f9] opacity-40 cursor-not-allowed"}`}
                              >
                                <svg fill="none" viewBox="0 0 16 16" className="size-[14px]"><path d="M6 12L10 8L6 4" stroke="#64748B" strokeLinecap="round" strokeWidth="2" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#f5f7fa] h-px" />

                    {/* Cards row — 4 equal columns, paginated */}
                    <div className="overflow-hidden">
                    <div
                      key={`${panel.title}-${page}`}
                      className={`grid grid-cols-4 gap-4 px-5 py-4 ${slideDir[panel.title] === "prev" ? "slide-prev" : "slide-next"}`}
                    >
                      {visibleCards.map((card, ci) => (
                        <div
                          key={ci}
                          onClick={() => toast.info(`${card.code} — ${card.orders} orders, ${card.breached} breached`)}
                          className="flex flex-col gap-2 p-3 rounded-[8px] cursor-pointer transition-all border border-[#e8ecef] bg-[rgba(241,245,249,0.46)] hover:bg-white hover:border-[#a53159]"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[#0f172a] text-[13px] font-bold">{card.code}</p>
                            <div className="px-[7px] py-[3px] rounded-[8px]" style={{ backgroundColor: `${card.badgeColor}1f` }}>
                              <p className="text-[10px] font-semibold" style={{ color: card.badgeColor }}>{card.badge}</p>
                            </div>
                          </div>

                          <div className="h-px bg-[#f1f3f6]" />

                          <div className="flex items-center py-[2px]">
                            <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                              <p className="text-[#94a3b8] text-[10px] uppercase">ORDERS</p>
                              <p className="text-[#0f172a] text-[16px] font-bold leading-none">{card.orders}</p>
                            </div>
                            {card.dividers && <div className="bg-[#f1f5f9] h-[24px] w-px shrink-0 mx-1" />}
                            <div className="flex flex-col gap-[2px] flex-1 min-w-0 text-[#dc2626]">
                              <p className="text-[10px] uppercase">BREACHED</p>
                              <p className="text-[16px] font-bold leading-none">{card.breached}</p>
                            </div>
                            {card.dividers && <div className="bg-[#f1f5f9] h-[24px] w-px shrink-0 mx-1" />}
                            <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                              <p className="text-[#94a3b8] text-[10px] uppercase">VALUE</p>
                              <p className="text-[#0f172a] text-[16px] font-bold leading-none">{card.value}</p>
                            </div>
                          </div>

                          <div className="h-px bg-[#f1f3f6]" />

                          <div className="flex items-center gap-[6px] flex-wrap">
                            {card.tags.map((tag, ti) => (
                              <div key={ti} className="px-[6px] py-[3px] rounded-[8px]" style={{ backgroundColor: tag.bg }}>
                                <p className="text-[10px] font-medium whitespace-nowrap" style={{ color: tag.color }}>{tag.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Right sidebar (296px) ── */}
            <div className="w-[296px] shrink-0 flex flex-col gap-4">

              {/* Attention Required */}
              <div className="bg-white rounded-[8px] border border-[#e2e8f0] shadow-[0px_1px_2px_rgba(15,23,42,0.08)]">
                <div className="px-[14px] py-[14px] flex items-center gap-[10px] border-b border-[#f1f3f6]">
                  <p className="text-[#0f172a] text-[13px] font-semibold">Attention Required</p>
                  <div className="bg-[#fff1f2] px-[8px] py-[2px] rounded-full">
                    <p className="text-[#dc2626] text-[10px] font-bold">3</p>
                  </div>
                </div>
                <div className="px-[14px] divide-y divide-[#f1f3f6]">
                  {[
                    { dot: "#dc2626", text: "2 holds expiring today", action: "Act", actionColor: "#dc2626", toastMsg: "Actioning 2 expiring holds…", type: "error" as const },
                    { dot: "#d97706", text: "4 SLA breaches in 2h", action: "Review", actionColor: "#d97706", toastMsg: "Opening SLA breach review", type: "warning" as const },
                    { dot: "#d97706", text: "$5.2M at risk value", action: "View", actionColor: "#d97706", toastMsg: "Viewing at-risk value breakdown", type: "warning" as const },
                  ].map((alert, i) => (
                    <div key={i} className="flex items-center justify-between py-[13px]">
                      <div className="flex items-center gap-2">
                        <div className="size-[6px] rounded-full shrink-0" style={{ backgroundColor: alert.dot }} />
                        <p className="text-[#0f172a] text-[11px]">{alert.text}</p>
                      </div>
                      <button
                        onClick={() => alert.type === "error" ? toast.error(alert.toastMsg) : toast.warning(alert.toastMsg)}
                        className="text-[11px] font-bold cursor-pointer hover:opacity-70 transition-opacity ml-3 shrink-0"
                        style={{ color: alert.actionColor }}
                      >
                        {alert.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* To-Do */}
              <div className="bg-white rounded-[8px] border border-[#e2e8f0] shadow-[0px_1px_2px_rgba(15,23,42,0.08)] p-[14px] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-[#0f172a] text-[13px] font-semibold">To-Do</p>
                    <div className="bg-[#f1f5f9] px-[8px] py-[2px] rounded-full">
                      <p className="text-[#64748b] text-[10px] font-bold">{todos.filter(t => !t.done).length}</p>
                    </div>
                  </div>
                  <button className="bg-[#f1f5f9] size-[22px] rounded-[8px] flex items-center justify-center hover:bg-[#e2e8f0] cursor-pointer transition-colors">
                    <svg fill="none" viewBox="0 0 14 14" className="size-[12px]">
                      <path d={holdSvg.p133cc000} stroke="#64748b" strokeLinecap="round" strokeWidth="2" />
                    </svg>
                  </button>
                </div>
                <div className="bg-[#f1f3f6] h-px" />
                <div className="flex flex-col divide-y divide-[#f1f3f6]">
                  {todos.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-[12px]">
                      <button
                        onClick={() => setTodos(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                        className={`size-[16px] rounded-[8px] border-[1.5px] shrink-0 flex items-center justify-center cursor-pointer transition-all ${
                          task.done ? "bg-[#90003b] border-[#90003b]" : "border-[#cbd5e1] bg-white hover:border-[#90003b]"
                        }`}
                      >
                        {task.done && (
                          <svg fill="none" viewBox="0 0 10 8" className="size-[9px]">
                            <path d="M1 4L4 7L9 1" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </svg>
                        )}
                      </button>
                      <p className={`flex-1 min-w-0 text-[11px] font-semibold leading-tight ${task.done ? "line-through text-[#94a3b8]" : "text-[#0f172a]"}`}>{task.label}</p>
                      <div className="size-[6px] rounded-full shrink-0" style={{ backgroundColor: task.priority }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Released Orders */}
              <div className="bg-white rounded-[8px] border border-[#e2e8f0] shadow-[0px_1px_2px_rgba(15,23,42,0.08)] p-[16px] flex flex-col gap-3">
                <p className="text-[#0f172a] text-[13px] font-semibold">Released Orders</p>
                <div className="bg-[#f1f3f6] h-px" />
                <div className="flex flex-col gap-3">
                  {releasedOrders.map((order, i) => (
                    <div key={i}>
                      <div className="flex flex-col gap-[2px]">
                        <div className="flex items-center justify-between">
                          <p className="text-[#0f172a] text-[12px] font-semibold">{order.id}</p>
                          <p className="text-[#0f172a] text-[11px] font-semibold">{order.value}</p>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[#4b5563] text-[11px]">{order.company}</p>
                            <p className="text-[#4b5563] text-[11px]">{order.reason}</p>
                          </div>
                          <p className="text-[#219659] text-[10px] font-semibold whitespace-nowrap mt-px">{order.time}</p>
                        </div>
                      </div>
                      {i < releasedOrders.length - 1 && <div className="bg-[#f1f3f6] h-px mt-3" />}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center pt-1">
                  <button
                    onClick={() => toast.info("Opening full released orders list")}
                    className="text-[#3b82f6] text-[12px] font-medium cursor-pointer hover:underline"
                  >
                    View all →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

