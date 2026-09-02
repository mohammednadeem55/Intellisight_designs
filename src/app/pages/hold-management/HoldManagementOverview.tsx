import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, ChevronDown, ChevronsUpDown, Clock, DollarSign, GripVertical, Inbox, Maximize2, Minimize2, Package, Plus, RefreshCw, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { EMAIL_TABLE_NAVY } from "../../components/common/EmailTable";

const HOLD_CARD_WIDTH = 280;
const TIMELINE_OPTIONS = ["24h", "48h", "72h", "1 Week", "2 Weeks"];
const TIMELINE_HOURS: Record<string, number> = { "24h": 24, "48h": 48, "72h": 72, "1 Week": 168, "2 Weeks": 336 };
const SORT_OPTIONS = ["Aging", "SSD Proximity", "Value", "Order Volume"];
const VIEW_OPTIONS = ["CSR", "Credit"];
// Grey → orange → red — clicking a to-do's priority dot cycles through these, low to high urgency.
const TODO_PRIORITIES = ["#D9D9D6", "#E67919", "#C83737"];

// Parses "$3.8M" / "$0.9M" style card values into a plain number for sorting.
function parseValue(v: string): number {
  return parseFloat(v.replace(/[^0-9.]/g, "")) || 0;
}

type Tag = { label: string; color: string; bg: string };
type HoldCardData = {
  code: string; badge: string; badgeColor: string; orders: string; breached: string; value: string; tags: Tag[]; critical?: boolean; dividers?: boolean;
  // Drives the Sort By / Timeline controls — not just for display.
  agingDays: number; ssdProximityDays: number; ageHours: number;
};
type HoldPanelData = { title: string; count: number; critical: number; total: string; accentColor: string; cards: HoldCardData[] };

// A single hold-panel section: header (title, counts, View All, prev/next) + a smooth horizontally-scrolling,
// snap-aligned card carousel. Kept as its own component (rather than inline in the parent's .map) so the
// scroll-position state driving the progress bar/arrow-disabled state only re-renders this panel, not the
// whole page, on every scroll frame.
function HoldCardCarousel({
  panel,
  cards,
  resetKey,
  onViewAll,
  onCardClick,
}: {
  panel: HoldPanelData;
  cards: HoldCardData[];
  /** Changes whenever sort/timeline change — scrolls back to the start and re-measures on change. */
  resetKey: string;
  onViewAll: () => void;
  onCardClick: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ progress: 0, visibleFraction: 1 });

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const visibleFraction = el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1;
    setScrollState({
      progress: max > 4 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0,
      visibleFraction: max > 4 ? visibleFraction : 1,
    });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0 });
    updateScrollState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, cards.length]);

  const scrollByCard = (dir: "prev" | "next") => {
    const step = HOLD_CARD_WIDTH + 16; // card width + gap-4
    scrollRef.current?.scrollBy({ left: dir === "next" ? step : -step, behavior: "smooth" });
  };

  const canScroll = scrollState.visibleFraction < 0.999;
  const canPrev = scrollState.progress > 0.01;
  const canNext = canScroll && scrollState.progress < 0.99;

  return (
    <div className="border-t border-[#E2E6E9]">
      {/* Panel header with accent left border — the tint gradient is scoped to this element's own height
          (0%→100%), so it always fades out exactly by the header's bottom edge and never bleeds into the
          cards below, no matter how tall the header ends up being (e.g. pills wrapping on a narrow viewport). */}
      <div className="relative py-4 px-5" style={{ background: `linear-gradient(180deg, ${panel.accentColor}0A 0%, #ffffff 100%)` }}>
        <div className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: panel.accentColor }} />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-col gap-2 min-w-0">
            <p className="text-[#262626] text-[15px] font-bold truncate">{panel.title}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#F1F2F4] text-[#4D4D4D] text-[11.5px] font-semibold whitespace-nowrap">
                <Inbox size={11} className="shrink-0" style={{ color: panel.accentColor }} />
                {cards.length} Holds
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11.5px] font-semibold whitespace-nowrap"
                style={{ backgroundColor: "rgba(200,55,55,0.1)", color: "#C83737" }}
              >
                <AlertTriangle size={11} className="shrink-0" />
                {panel.critical} Critical
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11.5px] font-semibold whitespace-nowrap"
                style={{ backgroundColor: `${panel.accentColor}1A`, color: panel.accentColor }}
              >
                <DollarSign size={11} className="shrink-0" />
                {panel.total} Total
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {cards.length > 1 && (
              <button onClick={onViewAll} className="text-[#30578D] text-[12px] font-semibold cursor-pointer hover:underline whitespace-nowrap">
                View all {cards.length} holds →
              </button>
            )}
            {canScroll && (
            <>
            <div className="w-px h-5 bg-[#E2E6E9]" />
            <div className="flex items-center gap-1.5">
              <button
                disabled={!canPrev}
                onClick={() => scrollByCard("prev")}
                className={`size-[28px] rounded-[8px] border flex items-center justify-center transition-colors ${canPrev ? "border-[#E2E6E9] hover:bg-[#F7F7F7] cursor-pointer" : "border-[#F1F2F4] opacity-40 cursor-not-allowed"}`}
              >
                <svg fill="none" viewBox="0 0 16 16" className="size-[14px]"><path d="M10 12L6 8L10 4" stroke="#666666" strokeLinecap="round" strokeWidth="2" /></svg>
              </button>
              <button
                disabled={!canNext}
                onClick={() => scrollByCard("next")}
                className={`size-[28px] rounded-[8px] border flex items-center justify-center transition-colors ${canNext ? "border-[#E2E6E9] hover:bg-[#F7F7F7] cursor-pointer" : "border-[#F1F2F4] opacity-40 cursor-not-allowed"}`}
              >
                <svg fill="none" viewBox="0 0 16 16" className="size-[14px]"><path d="M6 12L10 8L6 4" stroke="#666666" strokeLinecap="round" strokeWidth="2" /></svg>
              </button>
            </div>
            </>
            )}
            </div>
          </div>
        </div>

      <div className="bg-[#F7F7F7] h-px" />

      {cards.length === 0 ? (
        <p className="text-[12.5px] text-[#97999B] text-center py-8">No holds match the current Timeline filter.</p>
      ) : (
        <div className="relative">
        {canPrev && <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent z-10" />}
        {canNext && <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent z-10" />}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-4 px-5 py-4 overflow-x-auto [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: "x mandatory",
            scrollPadding: "0 20px", // keeps the px-5 edge gap visible at the start/end snap positions
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {cards.map((card, ci) => (
            <div
              key={ci}
              onClick={onCardClick}
              className={`flex flex-col gap-2.5 p-3.5 rounded-[10px] cursor-pointer transition-all bg-white shrink-0 border hover:border-[#30578D] hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)] hover:-translate-y-px ${
                card.critical ? "border-[#C83737]/40" : "border-[#E2E6E9]"
              }`}
              style={{ width: HOLD_CARD_WIDTH, scrollSnapAlign: "start" }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="size-[7px] rounded-full shrink-0" style={{ backgroundColor: card.badgeColor }} />
                  <p className="text-[14px] font-bold text-[#262626] truncate">{card.code}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {card.critical && (
                    <span
                      className="px-[6px] py-[2px] rounded-[6px] text-[9px] font-bold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: "#C83737", backgroundColor: "rgba(200,55,55,0.1)" }}
                    >
                      Critical
                    </span>
                  )}
                  <div className="px-[7px] py-[3px] rounded-[6px]" style={{ backgroundColor: `${card.badgeColor}1f` }}>
                    <p className="text-[10px] font-semibold" style={{ color: card.badgeColor }}>{card.badge}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-0.5">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="flex items-center gap-1 text-[#97999B] text-[9px] font-semibold uppercase tracking-wide">
                    <Package size={10} className="shrink-0" /> Orders
                  </span>
                  <p className="text-[#262626] text-[17px] font-bold leading-none">{card.orders}</p>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="flex items-center gap-1 text-[#C83737] text-[9px] font-semibold uppercase tracking-wide">
                    <AlertTriangle size={10} className="shrink-0" /> Breached
                  </span>
                  <p className="text-[#C83737] text-[17px] font-bold leading-none">{card.breached}</p>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="flex items-center gap-1 text-[#97999B] text-[9px] font-semibold uppercase tracking-wide">
                    <DollarSign size={10} className="shrink-0" /> Value
                  </span>
                  <p className="text-[#262626] text-[17px] font-bold leading-none">{card.value}</p>
                </div>
              </div>

              <div className="h-px bg-[#F1F2F4]" />

              <div className="flex items-center gap-[6px] flex-wrap">
                {card.tags.map((tag, ti) => (
                  <div key={ti} className="px-[6px] py-[3px] rounded-[6px]" style={{ backgroundColor: tag.bg }}>
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
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const toggleSort = (opt: string) => {
    if (activeSort === opt) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setActiveSort(opt);
      setSortDirection("asc");
    }
  };
  const [activeView, setActiveView] = useState("CSR");
  const [viewOpen, setViewOpen] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineTab, setTimelineTab] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineLabel = timelineTab ?? "Timeline";

  const sortCards = (cards: HoldCardData[]): HoldCardData[] => {
    const sorted = [...cards];
    const dir = sortDirection === "asc" ? 1 : -1;
    switch (activeSort) {
      case "Aging": return sorted.sort((a, b) => (a.agingDays - b.agingDays) * dir);
      case "SSD Proximity": return sorted.sort((a, b) => (a.ssdProximityDays - b.ssdProximityDays) * dir);
      case "Value": return sorted.sort((a, b) => (parseValue(a.value) - parseValue(b.value)) * dir);
      case "Order Volume": return sorted.sort((a, b) => (parseInt(a.orders, 10) - parseInt(b.orders, 10)) * dir);
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

  // To-Do — add (inline input), remove (hover X), reorder (drag handle), and cycle priority (click the dot).
  const [addingTodo, setAddingTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const addTodo = () => {
    const text = newTodoText.trim();
    if (!text) { setAddingTodo(false); return; }
    setTodos((prev) => [...prev, { id: Date.now(), label: text, priority: TODO_PRIORITIES[0], done: false }]);
    setNewTodoText("");
    setAddingTodo(false);
  };
  const removeTodo = (id: number) => setTodos((prev) => prev.filter((t) => t.id !== id));
  const cycleTodoPriority = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = TODO_PRIORITIES[(TODO_PRIORITIES.indexOf(t.priority) + 1) % TODO_PRIORITIES.length];
        return { ...t, priority: next };
      })
    );
  };
  const [dragTodoIdx, setDragTodoIdx] = useState<number | null>(null);
  const [dragOverTodoIdx, setDragOverTodoIdx] = useState<number | null>(null);
  const reorderTodo = (from: number, to: number) => {
    setTodos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (timelineRef.current && !timelineRef.current.contains(e.target as Node)) setTimelineOpen(false);
      if (viewRef.current && !viewRef.current.contains(e.target as Node)) setViewOpen(false);
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

  const totalHoldCount = holdPanels.reduce((sum, p) => sum + p.count, 0);

  const releasedOrders = [
    { id: "#7800011", value: "$340K", company: "Acme Industries Ltd", reason: "Credit Check Failure", time: "Released 2d ago" },
    { id: "#7800042", value: "$215K", company: "GlobalTech Solutions", reason: "Credit Check Failure", time: "Released 1d ago" },
    { id: "#7800056", value: "$128K", company: "Nexus Corp", reason: "Payment Overdue", time: "Released 4h ago" },
    { id: "#7800078", value: "$492K", company: "Sterling & Co", reason: "Credit Check Failure", time: "Released 6h ago" },
  ];

  return (
    <div className="bg-[#f5f6fa] flex size-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
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
                    {VIEW_OPTIONS.map((opt) => (
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

              {/* Filter bar — no border-b here: each panel below already has its own border-t, which serves
                  as the single divider (both this boundary and every boundary between panels); adding one
                  here too would stack two 1px borders back-to-back and read as one thick, muddy line. */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                <h3 className="text-[14px] font-bold text-[#111827]">
                  Holds <span className="text-[#9ca3af] font-medium">({totalHoldCount})</span>
                </h3>

                {/* Sort By + Timeline, grouped together on the right edge of the toolbar */}
                <div className="flex items-center gap-2.5 flex-wrap ml-auto">
                  {/* Sort By — plain toggle buttons (not a dropdown): click a button to sort by it, click the
                      already-active one again to flip direction, same as a table header sort click. */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SORT_OPTIONS.map((opt) => {
                      const active = activeSort === opt;
                      const SortIcon = sortDirection === "desc" ? ArrowDown : ArrowUp;
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleSort(opt)}
                          className={`flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${
                            active ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7]"
                          }`}
                        >
                          {opt}
                          {active ? <SortIcon size={13} style={{ color: EMAIL_TABLE_NAVY }} /> : <ChevronsUpDown size={13} className="text-[#97999B]" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="w-px h-5 bg-[#E2E6E9]" />

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
                const displayCards = sortCards(filterByTimeline(panel.cards));
                return (
                  <HoldCardCarousel
                    key={panel.title}
                    panel={panel}
                    cards={displayCards}
                    resetKey={`${activeSort}-${sortDirection}-${timelineTab}`}
                    onViewAll={() => onViewAllOrders ? onViewAllOrders() : toast.info(`Viewing all ${displayCards.length} holds for ${panel.title}`)}
                    onCardClick={() => onNavigateOrderListing ? onNavigateOrderListing() : toast.info("Opening order listing")}
                  />
                );
              })}
            </div>

            {/* ── Right sidebar (380px, matching the workflow pages' right column) ── */}
            <div className="w-[380px] shrink-0 flex flex-col gap-4">

              {/* Attention Required */}
              <div className="bg-white rounded-[8px] border border-[#ebebeb] py-4 overflow-hidden">
                <div className="flex items-center gap-2 px-5">
                  <h3 className="text-[14px] font-bold text-[#111827]">Attention Required</h3>
                  <span className="bg-[#FAEBEB] px-2 py-[2px] rounded-full text-[#C83737] text-[10px] font-bold">3</span>
                </div>
                <div className="mt-3 flex flex-col divide-y divide-[#f3f4f6]">
                  {[
                    { dot: "#C83737", text: "2 holds expiring today", action: "Act", actionColor: "#C83737", toastMsg: "Actioning 2 expiring holds…", type: "error" as const },
                    { dot: "#E67919", text: "4 SLA breaches in 2h", action: "Review", actionColor: "#E67919", toastMsg: "Opening SLA breach review", type: "warning" as const },
                    { dot: "#E67919", text: "$5.2M at risk value", action: "View", actionColor: "#E67919", toastMsg: "Viewing at-risk value breakdown", type: "warning" as const },
                  ].map((alert, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-5 py-3 hover:bg-[#F7F7F7] transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex items-center justify-center size-[22px] rounded-[6px] shrink-0" style={{ backgroundColor: `${alert.dot}1A` }}>
                          <AlertTriangle size={11} style={{ color: alert.dot }} />
                        </span>
                        <p className="text-[#111827] text-[12px] font-semibold truncate">{alert.text}</p>
                      </div>
                      <button
                        onClick={() => alert.type === "error" ? toast.error(alert.toastMsg) : toast.warning(alert.toastMsg)}
                        className="shrink-0 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                        style={{ color: alert.actionColor, backgroundColor: `${alert.actionColor}14` }}
                      >
                        {alert.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* To-Do */}
              <div className="bg-white rounded-[8px] border border-[#ebebeb] py-4 overflow-hidden">
                <div className="flex items-center justify-between px-5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-bold text-[#111827]">To-Do</h3>
                    <span className="bg-[#f3f4f6] px-2 py-[2px] rounded-full text-[#6b7280] text-[10px] font-bold">{todos.filter(t => !t.done).length}</span>
                  </div>
                  <button
                    onClick={() => setAddingTodo(true)}
                    title="Add a task"
                    className="bg-[#f3f4f6] size-[22px] rounded-[8px] flex items-center justify-center hover:bg-[#e5e7eb] cursor-pointer transition-colors"
                  >
                    <Plus size={12} className="text-[#6b7280]" strokeWidth={2.5} />
                  </button>
                </div>
                <div className="mt-3 flex flex-col divide-y divide-[#f3f4f6]">
                  {addingTodo && (
                    <div className="px-5 py-3 bg-[#F7F7F7]">
                      <input
                        autoFocus
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addTodo();
                          if (e.key === "Escape") { setAddingTodo(false); setNewTodoText(""); }
                        }}
                        placeholder="Type a task…"
                        className="w-full h-[32px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[12px] font-medium text-[#111827] placeholder:text-[#9ca3af] placeholder:font-normal outline-none focus:border-[#30578D] transition-colors"
                      />
                      <div className="flex items-center justify-end gap-2 mt-2.5">
                        <button
                          onClick={() => { setAddingTodo(false); setNewTodoText(""); }}
                          className="px-3 h-[26px] rounded-[6px] text-[11px] font-semibold text-[#6b7280] hover:bg-[#e5e7eb] cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={addTodo}
                          disabled={!newTodoText.trim()}
                          className="px-3 h-[26px] rounded-[6px] text-[11px] font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                        >
                          Add Task
                        </button>
                      </div>
                    </div>
                  )}
                  {todos.map((task, idx) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragTodoIdx(idx)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverTodoIdx(idx); }}
                      onDrop={() => {
                        if (dragTodoIdx === null || dragTodoIdx === idx) return;
                        reorderTodo(dragTodoIdx, idx);
                        setDragTodoIdx(null);
                        setDragOverTodoIdx(null);
                      }}
                      onDragEnd={() => { setDragTodoIdx(null); setDragOverTodoIdx(null); }}
                      className={`group relative flex items-center gap-2 px-5 py-[12px] transition-colors hover:bg-[#F7F7F7] ${
                        dragOverTodoIdx === idx && dragTodoIdx !== idx ? "bg-[#30578D]/[0.05] border-t-2 border-t-[#30578D]" : ""
                      }`}
                    >
                      {/* Positioned in the card's own left padding gutter (not inline) so it never pushes the
                          checkbox out of alignment with the "To-Do" title above. */}
                      <GripVertical
                        size={12}
                        className="absolute left-[5px] top-1/2 -translate-y-1/2 text-[#d1d5db] cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                      />
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
                      <p className={`flex-1 min-w-0 text-[12px] font-semibold leading-tight truncate ${task.done ? "line-through text-[#9ca3af]" : "text-[#111827]"}`}>{task.label}</p>
                      <button onClick={() => cycleTodoPriority(task.id)} title="Click to change priority" className="size-[6px] rounded-full shrink-0 cursor-pointer" style={{ backgroundColor: task.priority }} />
                      <div className="w-[12px] h-[12px] shrink-0 flex items-center justify-center">
                        <button
                          onClick={() => removeTodo(task.id)}
                          title="Remove"
                          className="text-[#d1d5db] hover:text-[#C83737] cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {todos.length === 0 && !addingTodo && (
                    <p className="text-[11px] text-[#9ca3af] text-center py-4">No tasks yet</p>
                  )}
                </div>
              </div>

              {/* Released Orders */}
              <div className="bg-white rounded-[8px] border border-[#ebebeb] py-4 overflow-hidden">
                <div className="px-5">
                  <h3 className="text-[14px] font-bold text-[#111827]">Released Orders</h3>
                  <p className="text-[12px] text-[#9ca3af] mt-0.5">{releasedOrders.length} recent releases</p>
                </div>
                <div className="mt-3 flex flex-col">
                  {releasedOrders.map((order, i) => (
                    <div key={i}>
                      <button
                        onClick={() => (onNavigateReleasedOrders ? onNavigateReleasedOrders() : toast.info(`Viewing ${order.id}`))}
                        className="group w-full flex items-center gap-2.5 text-left px-5 py-2.5 hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                      >
                        <span className="flex items-center justify-center size-[28px] rounded-[8px] bg-[#EFF6F1] shrink-0">
                          <CheckCircle2 size={13} className="text-[#468657]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[#111827] text-[12px] font-semibold truncate group-hover:text-[#30578D] transition-colors">{order.id}</p>
                            <p className="text-[#111827] text-[12px] font-bold shrink-0">{order.value}</p>
                          </div>
                          <p className="text-[#6b7280] text-[11px] font-medium truncate mt-px">{order.company}</p>
                          <div className="flex items-center justify-between gap-2 mt-1.5">
                            <span className="text-[10px] font-medium text-[#6b7280] bg-[#f3f4f6] px-[6px] py-[2px] rounded-[6px] truncate">{order.reason}</span>
                            <span className="text-[#468657] text-[10.5px] font-semibold whitespace-nowrap shrink-0">{order.time}</span>
                          </div>
                        </div>
                      </button>
                      {i < releasedOrders.length - 1 && <div className="bg-[#f3f4f6] h-px" />}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center pt-3">
                  <button
                    onClick={() => (onNavigateReleasedOrders ? onNavigateReleasedOrders() : toast.info("Opening full released orders list"))}
                    className="text-[#30578D] text-[12px] font-semibold cursor-pointer hover:underline"
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
