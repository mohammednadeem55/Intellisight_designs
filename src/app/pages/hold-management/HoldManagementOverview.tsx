import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowDown, ArrowUp, Check, CheckCircle2, ChevronDown, ChevronsUpDown, Clock, DollarSign, Inbox, Maximize2, Minimize2, Package, Pencil, Plus, RefreshCw, Search, Star, Trash2, User, Users, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { EMAIL_TABLE_NAVY } from "../../components/common/EmailTable";
import { ALL_ORDERS } from "./holdManagementData";
import { loadFavoriteOrderIds, saveFavoriteOrderIds } from "./favoritesStorage";

const HOLD_CARD_WIDTH = 280;
const TIMELINE_OPTIONS = ["24h", "48h", "72h", "1 Week", "2 Weeks"];
const TIMELINE_HOURS: Record<string, number> = { "24h": 24, "48h": 48, "72h": 72, "1 Week": 168, "2 Weeks": 336 };
const SORT_OPTIONS = ["Aging", "SSD Proximity", "Value", "Order Volume"];
const VIEW_OPTIONS = ["CSR", "Credit"];
const FAVORITE_STATUS_COLOR: Record<string, string> = { "On Track": "#468657", "At Risk": "#E67919", Breached: "#C83737" };

// "My Holds" vs. a named group of teammates whose holds should be viewed together — saved per-browser so a
// group set up today is still there on the next login. Real per-user hold assignment isn't in the mock data
// model yet, so selecting a group is illustrative (toast) rather than actually re-filtering the panels.
const HOLD_GROUPS_STORAGE_KEY = "intellisight.holdManagement.holdGroups";
type HoldGroup = { id: string; name: string; memberIds: string[] };
const MOCK_USERS = [
  { id: "u1", name: "Priya Shah" },
  { id: "u2", name: "Wasim Shaikh" },
  { id: "u3", name: "Pranjal Bailung" },
  { id: "u4", name: "Khaja Mohideen" },
  { id: "u5", name: "Winstina D'Souza" },
  { id: "u6", name: "Brenden Kirby" },
  { id: "u7", name: "Jouni Lantto" },
  { id: "u8", name: "Sari Pellinen" },
];
function loadHoldGroups(): HoldGroup[] {
  try {
    const raw = localStorage.getItem(HOLD_GROUPS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveHoldGroups(groups: HoldGroup[]) {
  try {
    localStorage.setItem(HOLD_GROUPS_STORAGE_KEY, JSON.stringify(groups));
  } catch {
    // best-effort — a private window or blocked storage just means groups don't persist this session
  }
}

// Credit view — swaps the CSR KPI strip for a Priority Queue; the hold-panel carousel below reuses the
// exact same HoldCardCarousel/HoldPanelData shape, just fed a single Credit-only panel (see creditPanel).
const PRIORITY_QUEUE = [
  { label: "SSD Within 14 Days", caption: "SSD ≤ 14 Days", value: 42, color: "#E67919", icon: Clock },
  { label: "High Risk Profile", caption: "NOC / DEN / High Default", value: 15, color: "#C83737", icon: AlertTriangle },
  { label: "High Value Order", caption: "≥ $100K USD", value: 28, color: "#468657", icon: DollarSign },
];

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
  onCardClick: (card: HoldCardData) => void;
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
              onClick={() => onCardClick(card)}
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

// Create/edit modal for a saved hold group — name + a searchable checkbox list of teammates. Same
// component either way; `group` being non-null just pre-fills the form and adds a Delete option.
function HoldGroupModal({ group, onClose, onSave, onDelete }: {
  group: HoldGroup | null;
  onClose: () => void;
  onSave: (name: string, memberIds: string[]) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(group?.name ?? "");
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set(group?.memberIds ?? []));
  const [userSearch, setUserSearch] = useState("");

  const toggleMember = (id: string) => setMemberIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const filteredUsers = MOCK_USERS.filter((u) => u.name.toLowerCase().includes(userSearch.trim().toLowerCase()));

  const save = () => {
    if (!name.trim()) { toast.warning("Enter a group name"); return; }
    if (memberIds.size === 0) { toast.warning("Select at least one teammate"); return; }
    onSave(name.trim(), Array.from(memberIds));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
          <span className="text-[16px] font-bold text-[#262626]">{group ? "Edit Group" : "Create New Group"}</span>
          <button onClick={onClose} className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide mb-1.5 block">Group Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. West Region CSRs"
              className="w-full h-[38px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide">Members</label>
              {memberIds.size > 0 && <span className="text-[10.5px] text-[#97999B]">{memberIds.size} selected</span>}
            </div>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search teammates"
                className="w-full h-[34px] pl-8 pr-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
              />
            </div>
            <div className="rounded-[8px] border border-[#E2E6E9] max-h-[220px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-[12px] text-[#97999B] text-center py-6">No teammates match "{userSearch}"</p>
              ) : (
                filteredUsers.map((u, i) => {
                  const checked = memberIds.has(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleMember(u.id)}
                      className={`w-full flex items-center gap-2.5 text-left px-3 py-2.5 cursor-pointer transition-colors ${i !== 0 ? "border-t border-[#E2E6E9]" : ""} ${checked ? "bg-[#EAF1FB]" : "hover:bg-[#F7F7F7]"}`}
                    >
                      <span
                        className={`flex items-center justify-center size-[16px] rounded-[4px] border-[1.5px] shrink-0 transition-colors ${checked ? "border-transparent" : "border-[#B8BCC2] bg-white"}`}
                        style={checked ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                      >
                        {checked && <Check size={11} className="text-white" strokeWidth={3.5} />}
                      </span>
                      <span className={`text-[13px] ${checked ? "font-semibold text-[#262626]" : "text-[#4D4D4D]"}`}>{u.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
          {group ? (
            <button onClick={onDelete} className="flex items-center gap-1.5 text-[12.5px] font-semibold cursor-pointer hover:underline" style={{ color: "#C83737" }}>
              <Trash2 size={13} />
              Delete group
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2.5">
            <button onClick={onClose} className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
              Cancel
            </button>
            <button
              onClick={save}
              className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
              style={{ backgroundColor: EMAIL_TABLE_NAVY }}
            >
              {group ? "Save Changes" : "Create Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HoldManagementOverview({ onLogout, onViewAllNotifications, onNavigateHome, onNavigateNewOverview, onViewAllOrders, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateCommunication, onNavigateOrderDetails, onNavigateEmailTemplate, onNavigateCmdCenterAdvFilter, onNavigateFeedbackCenter, onNavigateEmailWorkflow }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateNewOverview?: () => void;
  onViewAllOrders?: (view?: string, cardName?: string) => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateCommunication?: () => void;
  onNavigateOrderDetails?: (orderId: string) => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateCmdCenterAdvFilter?: () => void;
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
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

  // "My Holds" (default) vs. a saved group of teammates — persisted in localStorage so groups created
  // today are still there next login.
  const [holdGroups, setHoldGroups] = useState<HoldGroup[]>(() => loadHoldGroups());
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const groupPickerRef = useRef<HTMLDivElement>(null);
  const [groupModal, setGroupModal] = useState<{ mode: "create" } | { mode: "edit"; group: HoldGroup } | null>(null);
  const selectedGroup = holdGroups.find((g) => g.id === selectedGroupId) ?? null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (groupPickerRef.current && !groupPickerRef.current.contains(e.target as Node)) setGroupPickerOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const saveGroup = (name: string, memberIds: string[]) => {
    if (groupModal?.mode === "edit") {
      const updated = holdGroups.map((g) => (g.id === groupModal.group.id ? { ...g, name, memberIds } : g));
      setHoldGroups(updated);
      saveHoldGroups(updated);
      toast.success(`"${name}" updated`);
    } else {
      const newGroup: HoldGroup = { id: `g${Date.now()}`, name, memberIds };
      const updated = [...holdGroups, newGroup];
      setHoldGroups(updated);
      saveHoldGroups(updated);
      setSelectedGroupId(newGroup.id);
      toast.success(`"${name}" created`);
    }
    setGroupModal(null);
  };
  const deleteGroup = (id: string) => {
    const updated = holdGroups.filter((g) => g.id !== id);
    setHoldGroups(updated);
    saveHoldGroups(updated);
    if (selectedGroupId === id) setSelectedGroupId(null);
    setGroupModal(null);
    toast.info("Group deleted");
  };

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
  // Global "go to order" search — quick-jump straight to Order Details rather than filtering anything on
  // this page, so it's kept separate from the KPI/carousel content below. Validated against ALL_ORDERS
  // before navigating since Order Details silently falls back to a default order on an unknown id.
  const [orderIdQuery, setOrderIdQuery] = useState("");
  const goToOrder = () => {
    const id = orderIdQuery.trim();
    if (!id) return;
    const match = ALL_ORDERS.find((o) => o.id === id);
    if (!match) { toast.warning(`No order found with ID "${id}"`); return; }
    onNavigateOrderDetails?.(match.id);
    setOrderIdQuery("");
  };

  // Favorites — replaces the old To-Do card in this sidebar slot. Loaded once on mount; this page is its
  // own route (see App.tsx), so it naturally re-reads favorites fresh whenever navigated back to, without
  // needing a live cross-page sync.
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadFavoriteOrderIds());
  const favoriteOrders = favoriteIds
    .map((id) => ALL_ORDERS.find((o) => o.id === id))
    .filter((o): o is (typeof ALL_ORDERS)[number] => Boolean(o));
  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveFavoriteOrderIds(next);
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
      title: "Shipment Impacting Holds", count: 3, critical: 3, total: "$285.2K", accentColor: EMAIL_TABLE_NAVY,
      cards: [
        { code: "Shipping Line Hold", badge: "SHP", badgeColor: EMAIL_TABLE_NAVY, orders: "2", breached: "2", value: "$71.3K", agingDays: 5, ssdProximityDays: 6, ageHours: 40, tags: [{ label: "Line", color: EMAIL_TABLE_NAVY, bg: "rgba(48,87,141,0.1)" }, { label: "2 Breached", color: "#C83737", bg: "rgba(200,55,55,0.1)" }] },
        { code: "Pick Release Line Hold", badge: "SHP", badgeColor: EMAIL_TABLE_NAVY, orders: "2", breached: "1", value: "$142.6K", agingDays: 8, ssdProximityDays: 4, ageHours: 60, tags: [{ label: "Line", color: EMAIL_TABLE_NAVY, bg: "rgba(48,87,141,0.1)" }, { label: "1 Breached", color: "#C83737", bg: "rgba(200,55,55,0.1)" }] },
        { code: "Ship To Confirmation Hold", badge: "SHP", badgeColor: EMAIL_TABLE_NAVY, orders: "1", breached: "1", value: "$71.3K", agingDays: 3, ssdProximityDays: 10, ageHours: 20, tags: [{ label: "Line", color: EMAIL_TABLE_NAVY, bg: "rgba(48,87,141,0.1)" }, { label: "1 Breached", color: "#C83737", bg: "rgba(200,55,55,0.1)" }] },
      ],
    },
    {
      title: "Invoicing Only Holds", count: 1, critical: 1, total: "$142.6K", accentColor: "#823E81",
      cards: [
        { code: "Bill Only Line Hold", badge: "INV", badgeColor: "#823E81", orders: "2", breached: "1", value: "$142.6K", agingDays: 15, ssdProximityDays: 3, ageHours: 60, dividers: true, tags: [{ label: "Line", color: "#823E81", bg: "rgba(130,62,129,0.1)" }, { label: "1 Breached", color: "#C83737", bg: "rgba(200,55,55,0.1)" }] },
      ],
    },
    {
      title: "Non CC Holds", count: 3, critical: 2, total: "$56.1K", accentColor: "#387D85",
      cards: [
        { code: "KSM Eligible Hold", badge: "NCC", badgeColor: "#387D85", orders: "1", breached: "1", value: "$67", agingDays: 9, ssdProximityDays: 4, ageHours: 70, dividers: true, tags: [{ label: "Line", color: EMAIL_TABLE_NAVY, bg: "rgba(48,87,141,0.1)" }, { label: "1 Breached", color: "#C83737", bg: "rgba(200,55,55,0.1)" }] },
        { code: "Manual Credit Hold", badge: "NCC", badgeColor: "#387D85", orders: "4", breached: "1", value: "$52.7K", agingDays: 14, ssdProximityDays: 3, ageHours: 130, dividers: true, tags: [{ label: "Header", color: "#637590", bg: "rgba(99,117,144,0.1)" }, { label: "1 Breached", color: "#C83737", bg: "rgba(200,55,55,0.1)" }] },
        { code: "Credit Hold at Pick", badge: "NCC", badgeColor: "#387D85", orders: "2", breached: "0", value: "$3.3K", agingDays: 2, ssdProximityDays: 11, ageHours: 15, dividers: true, tags: [{ label: "Header", color: "#637590", bg: "rgba(99,117,144,0.1)" }, { label: "On track", color: "#468657", bg: "rgba(70,134,87,0.1)" }] },
      ],
    },
  ];

  // Credit view — same panel/carousel shape as the CSR panels above, just one panel covering the three
  // credit-specific hold types instead of the full CSR breakdown.
  const creditPanel: HoldPanelData = {
    title: "Credit Holds", count: 25, critical: 3, total: "$3.3M", accentColor: "#7C3AED",
    cards: [
      {
        code: "Credit Check Failure", badge: "CREDIT", badgeColor: "#7C3AED", orders: "12", breached: "04", value: "$1.8M", critical: true,
        agingDays: 9, ssdProximityDays: 4, ageHours: 70,
        tags: [{ label: "Line", color: EMAIL_TABLE_NAVY, bg: "rgba(48,87,141,0.1)" }, { label: "At Risk", color: "#E67919", bg: "rgba(230,121,25,0.1)" }],
      },
      {
        code: "Credit Hold at Pick", badge: "CREDIT", badgeColor: "#7C3AED", orders: "08", breached: "01", value: "$0.9M",
        agingDays: 3, ssdProximityDays: 10, ageHours: 20,
        tags: [{ label: "Line", color: EMAIL_TABLE_NAVY, bg: "rgba(48,87,141,0.1)" }, { label: "On Track", color: "#468657", bg: "rgba(70,134,87,0.1)" }],
      },
      {
        code: "Manual Credit Hold", badge: "CREDIT", badgeColor: "#7C3AED", orders: "05", breached: "02", value: "$0.6M",
        agingDays: 18, ssdProximityDays: 2, ageHours: 200,
        tags: [{ label: "Header", color: "#637590", bg: "rgba(99,117,144,0.1)" }, { label: "Late", color: "#C83737", bg: "rgba(200,55,55,0.1)" }],
      },
    ],
  };
  const displayedPanels = activeView === "Credit" ? [creditPanel] : holdPanels;
  const totalHoldCount = displayedPanels.reduce((sum, p) => sum + p.count, 0);
  // No real per-user hold assignment in the mock data yet — a stable, illustrative count per group
  // (scales with member count) stands in until that data model exists.
  const groupHoldCount = (group: HoldGroup) => Math.max(5, group.memberIds.length * 9 + 3);

  const releasedOrders = [
    { id: "#7800011", value: "$340K", company: "Acme Industries Ltd", reason: "Credit Check Failure", time: "Released 2d ago" },
    { id: "#7800042", value: "$215K", company: "GlobalTech Solutions", reason: "Credit Check Failure", time: "Released 1d ago" },
    { id: "#7800056", value: "$128K", company: "Nexus Corp", reason: "Payment Overdue", time: "Released 4h ago" },
    { id: "#7800078", value: "$492K", company: "Sterling & Co", reason: "Credit Check Failure", time: "Released 6h ago" },
  ];

  return (
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
          <AppHeader
            activeNav="Hold Management"
            onViewAllNotifications={onViewAllNotifications}
            onLogout={onLogout}
            onNavigateHome={onNavigateHome}
            onNavigateNewOverview={onNavigateNewOverview}
            onNavigateHoldManagementOverview={() => {}}
            onNavigateOrderListing={onNavigateOrderListing}
            onNavigateReleasedOrders={onNavigateReleasedOrders}
            onNavigateCommunication={onNavigateCommunication}
            onNavigateEmailTemplate={onNavigateEmailTemplate}
            onNavigateCmdCenterAdvFilter={onNavigateCmdCenterAdvFilter}
            onNavigateFeedbackCenter={onNavigateFeedbackCenter}
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
          />
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 flex flex-col gap-4">

          {/* ── Page header ── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Holds Overview</h1>
              <p className="text-[12px] text-[#97999B] mt-0.5">Monday, 6 July 2026</p>
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
              <div className="w-px h-5 bg-[#E2E6E9]" />
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
                <input
                  value={orderIdQuery}
                  onChange={(e) => setOrderIdQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") goToOrder(); }}
                  placeholder="Go to Order #..."
                  className="w-[190px] h-[36px] pl-8 pr-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* ── KPI strip (CSR) / Priority Queue (Credit) ── */}
          {kpisExpanded && (
            activeView === "Credit" ? (
              <div className="flex flex-wrap gap-4">
                {PRIORITY_QUEUE.map((item) => (
                  <div
                    key={item.label}
                    className="relative overflow-hidden flex-1 min-w-[220px] rounded-[8px] border border-[#E2E6E9] p-4 flex items-center gap-3.5"
                    style={{ background: `linear-gradient(135deg, ${item.color}10, #ffffff 65%)` }}
                  >
                    <div className="size-[42px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}1A` }}>
                      <item.icon size={19} style={{ color: item.color }} />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide truncate">{item.label}</p>
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <p className="text-[22px] font-bold text-[#262626] leading-none shrink-0">{item.value}</p>
                        <p className="text-[10.5px] text-[#97999B] truncate">{item.caption}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
            )
          )}

          {/* ── Body: panels + sidebar — stacks to one column below the `lg` breakpoint (same responsive
              pattern as the workflow step bodies' [1fr_380px] grid) instead of a fixed-width sidebar that
              never adapts and crowds the panels on narrower viewports. ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">

            {/* ── Left column ── */}
            <div className="min-w-0">
            <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden">

              {/* Filter bar — no border-b here: each panel below already has its own border-t, which serves
                  as the single divider (both this boundary and every boundary between panels); adding one
                  here too would stack two 1px borders back-to-back and read as one thick, muddy line. */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                {/* My Holds / saved group picker — Credit-only; CSR keeps the plain "Holds (N)" title since
                    holds there aren't scoped by user/group. */}
                {activeView !== "Credit" ? (
                  <h3 className="text-[14px] font-bold text-[#111827]">
                    Holds <span className="text-[#9ca3af] font-medium">({totalHoldCount})</span>
                  </h3>
                ) : (
                <div className="relative" ref={groupPickerRef}>
                  <button
                    onClick={() => setGroupPickerOpen((v) => !v)}
                    className={`flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${
                      groupPickerOpen ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#111827] hover:bg-[#F7F7F7]"
                    }`}
                  >
                    {selectedGroup ? (
                      <Users size={13} className={groupPickerOpen ? "text-[#30578D]" : "text-[#97999B]"} />
                    ) : (
                      <User size={13} className={groupPickerOpen ? "text-[#30578D]" : "text-[#97999B]"} />
                    )}
                    {selectedGroup ? selectedGroup.name : "My Holds"}
                    <span className="text-[#9ca3af] font-medium">({selectedGroup ? groupHoldCount(selectedGroup) : totalHoldCount})</span>
                    <ChevronDown size={13} className={`transition-transform duration-200 ${groupPickerOpen ? "rotate-180" : ""}`} />
                  </button>
                  {groupPickerOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 py-1 w-[240px]">
                      <button
                        onClick={() => { setSelectedGroupId(null); setGroupPickerOpen(false); toast.success("Showing My Holds"); }}
                        className={`w-full flex items-center gap-2 text-left px-3.5 py-2 text-[12.5px] cursor-pointer transition-colors ${!selectedGroup ? "font-bold bg-[#EAF1FB]" : "font-normal hover:bg-[#F7F7F7]"}`}
                        style={{ color: !selectedGroup ? EMAIL_TABLE_NAVY : "#4D4D4D" }}
                      >
                        <User size={12} className={!selectedGroup ? "text-[#30578D]" : "text-[#97999B]"} />
                        My Holds <span className="text-[#97999B] font-normal">({totalHoldCount})</span>
                      </button>
                      {holdGroups.length > 0 && (
                        <>
                          <div className="h-px bg-[#E2E6E9] my-1" />
                          {holdGroups.map((g) => {
                            const selected = g.id === selectedGroupId;
                            return (
                            <div
                              key={g.id}
                              className={`group flex items-center gap-1 px-1.5 ${selected ? "bg-[#EAF1FB]" : "hover:bg-[#F7F7F7]"} transition-colors`}
                            >
                              <button
                                onClick={() => { setSelectedGroupId(g.id); setGroupPickerOpen(false); toast.success(`Showing holds for "${g.name}"`); }}
                                className={`flex-1 min-w-0 flex items-center gap-2 text-left pl-2 pr-1 py-2 text-[12.5px] truncate cursor-pointer ${selected ? "font-bold" : "font-normal"}`}
                                style={{ color: selected ? EMAIL_TABLE_NAVY : "#4D4D4D" }}
                              >
                                <Users size={12} className={selected ? "text-[#30578D]" : "text-[#97999B]"} />
                                {g.name}
                                <span className="text-[10.5px] text-[#97999B] font-normal ml-1">({groupHoldCount(g)})</span>
                              </button>
                              <button
                                onClick={() => { setGroupModal({ mode: "edit", group: g }); setGroupPickerOpen(false); }}
                                title="Edit group"
                                className="shrink-0 p-1.5 rounded-[6px] text-[#97999B] hover:text-[#30578D] hover:bg-white cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Pencil size={12} />
                              </button>
                            </div>
                            );
                          })}
                        </>
                      )}
                      <div className="h-px bg-[#E2E6E9] my-1" />
                      <button
                        onClick={() => { setGroupModal({ mode: "create" }); setGroupPickerOpen(false); }}
                        className="w-full flex items-center gap-1.5 text-left px-3.5 py-2 text-[12.5px] font-semibold hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                        style={{ color: EMAIL_TABLE_NAVY }}
                      >
                        <Plus size={13} />
                        Create New Group
                      </button>
                    </div>
                  )}
                </div>
                )}

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
              {displayedPanels.map((panel) => {
                const displayCards = sortCards(filterByTimeline(panel.cards));
                return (
                  <HoldCardCarousel
                    key={panel.title}
                    panel={panel}
                    cards={displayCards}
                    resetKey={`${activeView}-${activeSort}-${sortDirection}-${timelineTab}`}
                    onViewAll={() => onViewAllOrders ? onViewAllOrders(activeView === "Credit" ? "credit" : undefined) : toast.info(`Viewing all ${displayCards.length} holds for ${panel.title}`)}
                    onCardClick={(card) => onViewAllOrders ? onViewAllOrders(activeView === "Credit" ? "credit" : undefined, card.code) : toast.info(`Opening order listing for ${card.code}`)}
                  />
                );
              })}
            </div>
            </div>

            {/* ── Right sidebar (380px at lg+, full width below it — matching the workflow pages' right column) ── */}
            <div className="min-w-0 flex flex-col gap-4">

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

              {/* Favorites — orders starred from Order Listing or Order Details */}
              <div className="bg-white rounded-[8px] border border-[#ebebeb] py-4 overflow-hidden">
                <div className="flex items-center gap-2 px-5">
                  <h3 className="text-[14px] font-bold text-[#111827]">Favorites</h3>
                  <span className="bg-[#f3f4f6] px-2 py-[2px] rounded-full text-[#6b7280] text-[10px] font-bold">{favoriteOrders.length}</span>
                </div>
                <div className="mt-3 flex flex-col divide-y divide-[#f3f4f6]">
                  {favoriteOrders.length === 0 ? (
                    <p className="text-[11px] text-[#9ca3af] text-center py-6 px-5 leading-relaxed">No favorites yet — star an order from Order Listing or Order Details to pin it here.</p>
                  ) : (
                    favoriteOrders.map((order) => {
                      const statusColor = FAVORITE_STATUS_COLOR[order.status] ?? "#6b7280";
                      return (
                        <div key={order.id} className="group flex items-center gap-2.5 px-5 py-2.5 hover:bg-[#F7F7F7] transition-colors">
                          <button
                            onClick={() => (onNavigateOrderDetails ? onNavigateOrderDetails(order.id) : toast.info(`Viewing ${order.id}`))}
                            className="flex-1 min-w-0 flex items-center gap-2.5 text-left cursor-pointer"
                          >
                            <span className="flex items-center justify-center size-[28px] rounded-[8px] shrink-0" style={{ backgroundColor: `${statusColor}1A` }}>
                              <Star size={13} style={{ color: statusColor }} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[#111827] text-[12px] font-semibold truncate group-hover:text-[#30578D] transition-colors">{order.id}</p>
                              <p className="text-[#6b7280] text-[11px] font-medium truncate mt-px">{order.customer}</p>
                            </div>
                          </button>
                          <span
                            className="text-[10px] font-semibold px-[6px] py-[2px] rounded-[6px] shrink-0 whitespace-nowrap"
                            style={{ color: statusColor, backgroundColor: `${statusColor}1A` }}
                          >
                            {order.status}
                          </span>
                          <button
                            onClick={() => toggleFavorite(order.id)}
                            title="Remove from favorites"
                            className="shrink-0 text-[#d1d5db] hover:text-[#C83737] cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })
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

      {groupModal && (
        <HoldGroupModal
          group={groupModal.mode === "edit" ? groupModal.group : null}
          onClose={() => setGroupModal(null)}
          onSave={saveGroup}
          onDelete={groupModal.mode === "edit" ? () => deleteGroup(groupModal.group.id) : undefined}
        />
      )}
    </div>
  );
}
