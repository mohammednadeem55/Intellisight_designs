import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import holdSvg from "@/imports/HoldManagementDesktopV3/svg-5pa1ejxi9n";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, DollarSign, Inbox, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { EMAIL_TABLE_NAVY } from "../../components/common/EmailTable";

const CARDS_PER_PAGE = 4;
const TIMELINE_OPTIONS = ["24h", "48h", "72h", "1 Week", "2 Weeks"];
const TIMELINE_HOURS: Record<string, number> = { "24h": 24, "48h": 48, "72h": 72, "1 Week": 168, "2 Weeks": 336 };
const SORT_OPTIONS = ["Aging", "SSD Proximity", "Value", "Order Volume"];

// Parses "$3.8M" / "$0.9M" style card values into a plain number for sorting.
function parseValue(v: string): number {
  return parseFloat(v.replace(/[^0-9.]/g, "")) || 0;
}

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
  const [activeSort, setActiveSort] = useState("Aging");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineTab, setTimelineTab] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineLabel = timelineTab ?? "Timeline";
  // per-panel slider state
  const [panelPage, setPanelPage] = useState<Record<string, number>>({});
  const [slideDir, setSlideDir] = useState<Record<string, "next" | "prev">>({});

  const navigatePanel = (title: string, dir: "next" | "prev") => {
    setSlideDir(d => ({ ...d, [title]: dir }));
    setPanelPage(p => ({ ...p, [title]: (p[title] ?? 0) + (dir === "next" ? 1 : -1) }));
  };

  // Sort By / Timeline actually reorder and filter the cards below (not just decorative), so a page that
  // no longer exists after re-sorting/filtering would strand the user — reset pagination when either changes.
  useEffect(() => {
    setPanelPage({});
  }, [activeSort, timelineTab]);

  const sortCards = (cards: HoldCardData[]): HoldCardData[] => {
    const sorted = [...cards];
    switch (activeSort) {
      case "Aging": return sorted.sort((a, b) => b.agingDays - a.agingDays);
      case "SSD Proximity": return sorted.sort((a, b) => a.ssdProximityDays - b.ssdProximityDays);
      case "Value": return sorted.sort((a, b) => parseValue(b.value) - parseValue(a.value));
      case "Order Volume": return sorted.sort((a, b) => parseInt(b.orders, 10) - parseInt(a.orders, 10));
      default: return sorted;
    }
  };
  const filterByTimeline = (cards: HoldCardData[]): HoldCardData[] => {
    if (!timelineTab) return cards;
    const maxHours = TIMELINE_HOURS[timelineTab];
    return cards.filter((c) => c.ageHours <= maxHours);
  };

  // Sync status + KPI collapse — same pattern as NewOverviewPage's page header.
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
  const [todos, setTodos] = useState([
    { id: 1, label: "Review SLA Breached Holds", priority: "#C83737", done: false },
    { id: 2, label: "Process Orders Batch", priority: "#E67919", done: false },
    { id: 3, label: "Update Invoicing Rules", priority: "#D9D9D6", done: false },
    { id: 4, label: "Escalate At-Risk Holds", priority: "#C83737", done: false },
    { id: 5, label: "Weekly Hold Report", priority: "#D9D9D6", done: false },
  ]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (timelineRef.current && !timelineRef.current.contains(e.target as Node)) setTimelineOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const kpis = [
    { label: "OPEN HOLDS", value: "1,300", accent: EMAIL_TABLE_NAVY, icon: Inbox },
    { label: "SLA BREACHED", value: "345", accent: "#871518", icon: AlertTriangle },
    { label: "AT RISK", value: "120", accent: "#E67919", icon: Clock },
    { label: "TOTAL VALUE", value: "$ 5060M", accent: "#387D85", icon: DollarSign },
    { label: "ON TRACK", value: "234", accent: "#468657", icon: CheckCircle2 },
  ];

  type Tag = { label: string; color: string; bg: string };
  type HoldCardData = {
    code: string; badge: string; badgeColor: string; orders: string; breached: string; value: string; tags: Tag[]; critical?: boolean; dividers?: boolean;
    // Drives the Sort By / Timeline controls — not just for display.
    agingDays: number; ssdProximityDays: number; ageHours: number;
  };
  type HoldPanelData = { title: string; count: number; critical: number; total: string; accentColor: string; cards: HoldCardData[] };

  const holdPanels: HoldPanelData[] = [
    {
      title: "Shipment Impacting Holds", count: 18, critical: 5, total: "$24.5M", accentColor: EMAIL_TABLE_NAVY,
      cards: [
        { code: "MFG", badge: "SHP", badgeColor: EMAIL_TABLE_NAVY, orders: "06", breached: "01", value: "$3.8M", critical: true, agingDays: 12, ssdProximityDays: 2, ageHours: 18, tags: [{ label: "Header", color: EMAIL_TABLE_NAVY, bg: "rgba(48,87,141,0.1)" }, { label: "On track", color: "#468657", bg: "rgba(70,134,87,0.1)" }] },
        { code: "LOG", badge: "SHP", badgeColor: EMAIL_TABLE_NAVY, orders: "08", breached: "02", value: "$4.1M", agingDays: 5, ssdProximityDays: 6, ageHours: 40, tags: [{ label: "Line", color: EMAIL_TABLE_NAVY, bg: "rgba(48,87,141,0.1)" }, { label: "At Risk", color: "#E67919", bg: "rgba(230,121,25,0.1)" }] },
        { code: "WHS", badge: "SHP", badgeColor: EMAIL_TABLE_NAVY, orders: "05", breached: "00", value: "$2.9M", agingDays: 2, ssdProximityDays: 10, ageHours: 20, tags: [{ label: "Header", color: EMAIL_TABLE_NAVY, bg: "rgba(48,87,141,0.1)" }, { label: "On track", color: "#468657", bg: "rgba(70,134,87,0.1)" }] },
        { code: "DST", badge: "SHP", badgeColor: EMAIL_TABLE_NAVY, orders: "07", breached: "03", value: "$5.2M", agingDays: 20, ssdProximityDays: 1, ageHours: 96, tags: [{ label: "Line", color: EMAIL_TABLE_NAVY, bg: "rgba(48,87,141,0.1)" }, { label: "Late", color: "#C83737", bg: "rgba(200,55,55,0.1)" }] },
        { code: "FRT", badge: "SHP", badgeColor: EMAIL_TABLE_NAVY, orders: "04", breached: "01", value: "$2.1M", agingDays: 8, ssdProximityDays: 4, ageHours: 150, tags: [{ label: "Header", color: EMAIL_TABLE_NAVY, bg: "rgba(48,87,141,0.1)" }, { label: "On track", color: "#468657", bg: "rgba(70,134,87,0.1)" }] },
        { code: "EXP", badge: "SHP", badgeColor: EMAIL_TABLE_NAVY, orders: "03", breached: "00", value: "$1.7M", agingDays: 1, ssdProximityDays: 14, ageHours: 6, tags: [{ label: "Line", color: EMAIL_TABLE_NAVY, bg: "rgba(48,87,141,0.1)" }, { label: "On track", color: "#468657", bg: "rgba(70,134,87,0.1)" }] },
      ],
    },
    {
      title: "Invoicing Only Holds", count: 20, critical: 3, total: "$18.2M", accentColor: "#823E81",
      cards: [
        { code: "FIN", badge: "INV", badgeColor: "#823E81", orders: "05", breached: "02", value: "$2.8M", agingDays: 15, ssdProximityDays: 3, ageHours: 60, dividers: true, tags: [{ label: "INV", color: "#823E81", bg: "rgba(130,62,129,0.1)" }, { label: "Late", color: "#C83737", bg: "rgba(200,55,55,0.1)" }] },
        { code: "ACC", badge: "INV", badgeColor: "#823E81", orders: "03", breached: "03", value: "$1.6M", agingDays: 25, ssdProximityDays: 1, ageHours: 200, dividers: true, tags: [{ label: "INV", color: "#823E81", bg: "rgba(130,62,129,0.1)" }, { label: "Header", color: "#637590", bg: "rgba(99,117,144,0.1)" }] },
        { code: "PAY", badge: "INV", badgeColor: "#823E81", orders: "08", breached: "01", value: "$4.2M", agingDays: 3, ssdProximityDays: 9, ageHours: 30, dividers: true, tags: [{ label: "INV", color: "#823E81", bg: "rgba(130,62,129,0.1)" }, { label: "On Track", color: "#468657", bg: "rgba(70,134,87,0.1)" }] },
        { code: "BIL", badge: "INV", badgeColor: "#823E81", orders: "04", breached: "02", value: "$3.1M", agingDays: 10, ssdProximityDays: 5, ageHours: 90, dividers: true, tags: [{ label: "INV", color: "#823E81", bg: "rgba(130,62,129,0.1)" }, { label: "Late", color: "#C83737", bg: "rgba(200,55,55,0.1)" }] },
        { code: "TAX", badge: "INV", badgeColor: "#823E81", orders: "06", breached: "00", value: "$2.4M", agingDays: 6, ssdProximityDays: 7, ageHours: 45, dividers: true, tags: [{ label: "INV", color: "#823E81", bg: "rgba(130,62,129,0.1)" }, { label: "On Track", color: "#468657", bg: "rgba(70,134,87,0.1)" }] },
        { code: "CRD", badge: "INV", badgeColor: "#823E81", orders: "02", breached: "01", value: "$0.9M", agingDays: 18, ssdProximityDays: 2, ageHours: 300, dividers: true, tags: [{ label: "INV", color: "#823E81", bg: "rgba(130,62,129,0.1)" }, { label: "At Risk", color: "#E67919", bg: "rgba(230,121,25,0.1)" }] },
      ],
    },
    {
      title: "Non CC Holds", count: 30, critical: 4, total: "$31.0M", accentColor: "#387D85",
      cards: [
        { code: "GLB", badge: "NCC", badgeColor: "#387D85", orders: "06", breached: "02", value: "$5.2M", agingDays: 9, ssdProximityDays: 4, ageHours: 70, dividers: true, tags: [{ label: "GTL", color: "#387D85", bg: "rgba(56,125,133,0.1)" }, { label: "Header", color: "#637590", bg: "rgba(99,117,144,0.1)" }] },
        { code: "TRD", badge: "NCC", badgeColor: "#387D85", orders: "04", breached: "04", value: "$2.3M", agingDays: 30, ssdProximityDays: 1, ageHours: 400, dividers: true, tags: [{ label: "GTL", color: "#387D85", bg: "rgba(56,125,133,0.1)" }, { label: "Escalate", color: "#C83737", bg: "rgba(200,55,55,0.1)" }] },
        { code: "EXP", badge: "NCC", badgeColor: "#387D85", orders: "09", breached: "01", value: "$6.8M", agingDays: 4, ssdProximityDays: 8, ageHours: 50, dividers: true, tags: [{ label: "GTL", color: "#387D85", bg: "rgba(56,125,133,0.1)" }, { label: "On Fund", color: "#468657", bg: "rgba(70,134,87,0.1)" }] },
        { code: "WHL", badge: "NCC", badgeColor: "#387D85", orders: "05", breached: "03", value: "$3.7M", agingDays: 14, ssdProximityDays: 3, ageHours: 130, dividers: true, tags: [{ label: "GTL", color: "#387D85", bg: "rgba(56,125,133,0.1)" }, { label: "Header", color: "#637590", bg: "rgba(99,117,144,0.1)" }] },
        { code: "REG", badge: "NCC", badgeColor: "#387D85", orders: "07", breached: "02", value: "$4.5M", agingDays: 7, ssdProximityDays: 6, ageHours: 55, dividers: true, tags: [{ label: "GTL", color: "#387D85", bg: "rgba(56,125,133,0.1)" }, { label: "On Fund", color: "#468657", bg: "rgba(70,134,87,0.1)" }] },
        { code: "CMP", badge: "NCC", badgeColor: "#387D85", orders: "03", breached: "01", value: "$1.9M", agingDays: 2, ssdProximityDays: 11, ageHours: 15, dividers: true, tags: [{ label: "GTL", color: "#387D85", bg: "rgba(56,125,133,0.1)" }, { label: "At Risk", color: "#E67919", bg: "rgba(230,121,25,0.1)" }] },
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
    <div className="bg-[#f5f6fa] flex size-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
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
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
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
        </div>

        <main className="flex-1 w-full max-w-[1600px] mx-auto px-5 py-5 flex flex-col gap-4">

          {/* ── Page header ── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Holds Overview</h1>
              <p className="text-[12px] text-[#97999B] mt-0.5">Monday, 6 July 2026</p>
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

          {/* ── KPI strip ── */}
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

          {/* ── Body: panels + sidebar ── */}
          <div className="flex gap-5 items-start">

            {/* ── Left column ── */}
            <div className="flex-1 min-w-0 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden">

              {/* Filter bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 border-b border-[#DEDEDE]">
                {/* Sort By + Timeline, grouped together on the right edge of the toolbar — same single-select
                    dropdown pattern for both, so they read as one consistent filter language */}
                <div className="flex items-center gap-2.5 flex-wrap ml-auto">
                  <div className="relative" ref={sortRef}>
                    <button
                      onClick={() => setSortOpen((v) => !v)}
                      className={`flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${
                        sortOpen ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7]"
                      }`}
                    >
                      Sort by: {activeSort}
                      <ChevronDown size={13} className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
                    </button>
                    {sortOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 py-1 w-[160px]">
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => { setActiveSort(opt); setSortOpen(false); }}
                            className="w-full text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                            style={opt === activeSort ? { color: EMAIL_TABLE_NAVY, fontWeight: 600 } : { color: "#4D4D4D" }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                {/* Timeline — same single-select toolbar dropdown as NewOverviewPage's Interval filter */}
                  <div className="relative" ref={timelineRef}>
                    <button
                      onClick={() => setTimelineOpen((v) => !v)}
                      className={`relative flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${
                        timelineOpen ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7]"
                      }`}
                    >
                      {timelineLabel}
                      <ChevronDown size={13} className={`transition-transform duration-200 ${timelineOpen ? "rotate-180" : ""}`} />
                    </button>
                    {timelineOpen && (
                      <div className="absolute top-full right-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 py-1 w-[150px]">
                        {TIMELINE_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => { setTimelineTab(opt === timelineTab ? null : opt); setTimelineOpen(false); }}
                            className="w-full text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                            style={opt === timelineTab ? { color: EMAIL_TABLE_NAVY, fontWeight: 600 } : { color: "#4D4D4D" }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel sections */}
              {holdPanels.map((panel) => {
                const page = panelPage[panel.title] ?? 0;
                const displayCards = sortCards(filterByTimeline(panel.cards));
                const totalPages = Math.max(1, Math.ceil(displayCards.length / CARDS_PER_PAGE));
                const visibleCards = displayCards.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);
                const canPrev = page > 0;
                const canNext = page < totalPages - 1;
                return (
                  <div key={panel.title} className="border-t border-[#DEDEDE]">
                    {/* Panel header with accent left border */}
                    <div className="relative bg-white pt-[18px] pb-[14px] px-5">
                      <div className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: panel.accentColor }} />
                      <div className="flex flex-col gap-[6px]">
                        <p className="text-[#262626] text-[14px] font-semibold">{panel.title}</p>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <p className="text-[#666666] text-[12px] whitespace-nowrap">{displayCards.length} Holds</p>
                            <div className="bg-[#E2E6E9] h-[12px] w-px" />
                            <div className="flex items-center gap-[6px]">
                              <div className="size-[6px] rounded-full bg-[#C83737] shrink-0" />
                              <p className="text-[#C83737] text-[12px] whitespace-nowrap">{panel.critical} Critical</p>
                            </div>
                            <div className="bg-[#E2E6E9] h-[12px] w-px" />
                            <p className="text-[#666666] text-[12px] whitespace-nowrap">{panel.total} Total value</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => onViewAllOrders ? onViewAllOrders() : toast.info(`Viewing all ${displayCards.length} holds for ${panel.title}`)}
                              className="text-[#30578D] text-[12px] font-medium cursor-pointer hover:underline whitespace-nowrap"
                            >
                              View all {displayCards.length} holds →
                            </button>
                            <div className="flex items-center gap-2">
                              {/* Page indicator dots */}
                              <div className="flex items-center gap-1 mr-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setPanelPage(p => ({ ...p, [panel.title]: i }))}
                                    className={`rounded-full transition-all cursor-pointer ${i === page ? "w-[16px] h-[5px] bg-[#30578D]" : "size-[5px] bg-[#E2E6E9] hover:bg-[#D9D9D6]"}`}
                                  />
                                ))}
                              </div>
                              <button
                                disabled={!canPrev}
                                onClick={() => navigatePanel(panel.title, "prev")}
                                className={`size-[28px] rounded-[8px] border flex items-center justify-center transition-colors ${canPrev ? "border-[#E2E6E9] hover:bg-[#F7F7F7] cursor-pointer" : "border-[#F1F2F4] opacity-40 cursor-not-allowed"}`}
                              >
                                <svg fill="none" viewBox="0 0 16 16" className="size-[14px]"><path d="M10 12L6 8L10 4" stroke="#666666" strokeLinecap="round" strokeWidth="2" /></svg>
                              </button>
                              <button
                                disabled={!canNext}
                                onClick={() => navigatePanel(panel.title, "next")}
                                className={`size-[28px] rounded-[8px] border flex items-center justify-center transition-colors ${canNext ? "border-[#E2E6E9] hover:bg-[#F7F7F7] cursor-pointer" : "border-[#F1F2F4] opacity-40 cursor-not-allowed"}`}
                              >
                                <svg fill="none" viewBox="0 0 16 16" className="size-[14px]"><path d="M6 12L10 8L6 4" stroke="#666666" strokeLinecap="round" strokeWidth="2" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#F7F7F7] h-px" />

                    {/* Cards row — 4 equal columns, paginated */}
                    {displayCards.length === 0 ? (
                      <p className="text-[12.5px] text-[#97999B] text-center py-8">No holds match the current Timeline filter.</p>
                    ) : (
                    <div className="overflow-hidden">
                    <div
                      key={`${panel.title}-${page}`}
                      className={`grid grid-cols-4 gap-4 px-5 py-4 ${slideDir[panel.title] === "prev" ? "slide-prev" : "slide-next"}`}
                    >
                      {visibleCards.map((card, ci) => (
                        <div
                          key={ci}
                          onClick={() => toast.info(`${card.code} — ${card.orders} orders, ${card.breached} breached`)}
                          className="flex flex-col gap-2 p-3 rounded-[8px] cursor-pointer transition-all border border-[#E2E6E9] bg-[#F7F7F7]/60 hover:bg-white hover:border-[#30578D]"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[#262626] text-[13px] font-bold">{card.code}</p>
                            <div className="px-[7px] py-[3px] rounded-[8px]" style={{ backgroundColor: `${card.badgeColor}1f` }}>
                              <p className="text-[10px] font-semibold" style={{ color: card.badgeColor }}>{card.badge}</p>
                            </div>
                          </div>

                          <div className="h-px bg-[#E2E6E9]" />

                          <div className="flex items-center py-[2px]">
                            <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                              <p className="text-[#97999B] text-[10px] uppercase">ORDERS</p>
                              <p className="text-[#262626] text-[16px] font-bold leading-none">{card.orders}</p>
                            </div>
                            {card.dividers && <div className="bg-[#E2E6E9] h-[24px] w-px shrink-0 mx-1" />}
                            <div className="flex flex-col gap-[2px] flex-1 min-w-0 text-[#C83737]">
                              <p className="text-[10px] uppercase">BREACHED</p>
                              <p className="text-[16px] font-bold leading-none">{card.breached}</p>
                            </div>
                            {card.dividers && <div className="bg-[#E2E6E9] h-[24px] w-px shrink-0 mx-1" />}
                            <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                              <p className="text-[#97999B] text-[10px] uppercase">VALUE</p>
                              <p className="text-[#262626] text-[16px] font-bold leading-none">{card.value}</p>
                            </div>
                          </div>

                          <div className="h-px bg-[#E2E6E9]" />

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
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Right sidebar (296px) ── */}
            <div className="w-[296px] shrink-0 flex flex-col gap-4">

              {/* Attention Required */}
              <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-bold text-[#111827]">Attention Required</h3>
                  <span className="bg-[#FAEBEB] px-2 py-[2px] rounded-full text-[#C83737] text-[10px] font-bold">3</span>
                </div>
                <div className="mt-3 flex flex-col divide-y divide-[#f3f4f6]">
                  {[
                    { dot: "#C83737", text: "2 holds expiring today", action: "Act", actionColor: "#C83737", toastMsg: "Actioning 2 expiring holds…", type: "error" as const },
                    { dot: "#E67919", text: "4 SLA breaches in 2h", action: "Review", actionColor: "#E67919", toastMsg: "Opening SLA breach review", type: "warning" as const },
                    { dot: "#E67919", text: "$5.2M at risk value", action: "View", actionColor: "#E67919", toastMsg: "Viewing at-risk value breakdown", type: "warning" as const },
                  ].map((alert, i) => (
                    <div key={i} className="flex items-center justify-between py-[13px]">
                      <div className="flex items-center gap-2">
                        <div className="size-[6px] rounded-full shrink-0" style={{ backgroundColor: alert.dot }} />
                        <p className="text-[#111827] text-[11px]">{alert.text}</p>
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
              <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-bold text-[#111827]">To-Do</h3>
                    <span className="bg-[#f3f4f6] px-2 py-[2px] rounded-full text-[#6b7280] text-[10px] font-bold">{todos.filter(t => !t.done).length}</span>
                  </div>
                  <button className="bg-[#f3f4f6] size-[22px] rounded-[8px] flex items-center justify-center hover:bg-[#e5e7eb] cursor-pointer transition-colors">
                    <svg fill="none" viewBox="0 0 14 14" className="size-[12px]">
                      <path d={holdSvg.p133cc000} stroke="#6b7280" strokeLinecap="round" strokeWidth="2" />
                    </svg>
                  </button>
                </div>
                <div className="mt-3 flex flex-col divide-y divide-[#f3f4f6]">
                  {todos.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-[12px]">
                      <button
                        onClick={() => setTodos(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                        className={`size-[16px] rounded-[8px] border-[1.5px] shrink-0 flex items-center justify-center cursor-pointer transition-all ${
                          task.done ? "bg-[#30578D] border-[#30578D]" : "border-[#d1d5db] bg-white hover:border-[#30578D]"
                        }`}
                      >
                        {task.done && (
                          <svg fill="none" viewBox="0 0 10 8" className="size-[9px]">
                            <path d="M1 4L4 7L9 1" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </svg>
                        )}
                      </button>
                      <p className={`flex-1 min-w-0 text-[11px] font-semibold leading-tight ${task.done ? "line-through text-[#9ca3af]" : "text-[#111827]"}`}>{task.label}</p>
                      <div className="size-[6px] rounded-full shrink-0" style={{ backgroundColor: task.priority }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Released Orders */}
              <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
                <h3 className="text-[14px] font-bold text-[#111827]">Released Orders</h3>
                <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">{releasedOrders.length} recent releases</p>
                <div className="flex flex-col gap-3">
                  {releasedOrders.map((order, i) => (
                    <div key={i}>
                      <div className="flex flex-col gap-[2px]">
                        <div className="flex items-center justify-between">
                          <p className="text-[#111827] text-[12px] font-semibold">{order.id}</p>
                          <p className="text-[#111827] text-[11px] font-semibold">{order.value}</p>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[#6b7280] text-[11px]">{order.company}</p>
                            <p className="text-[#6b7280] text-[11px]">{order.reason}</p>
                          </div>
                          <p className="text-[#468657] text-[10px] font-semibold whitespace-nowrap mt-px">{order.time}</p>
                        </div>
                      </div>
                      {i < releasedOrders.length - 1 && <div className="bg-[#f3f4f6] h-px mt-3" />}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center pt-3">
                  <button
                    onClick={() => (onNavigateReleasedOrders ? onNavigateReleasedOrders() : toast.info("Opening full released orders list"))}
                    className="text-[#30578D] text-[12px] font-medium cursor-pointer hover:underline"
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
