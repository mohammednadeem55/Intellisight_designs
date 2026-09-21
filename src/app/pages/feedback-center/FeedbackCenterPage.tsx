import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Copy, Flag, FilterX, Info, Maximize2, Minimize2, RefreshCw, Search, SlidersHorizontal, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { EMAIL_TABLE_NAVY } from "../../components/common/EmailTable";
import { DOC_TYPE_LABELS, QUEUE_BY_DOC_TYPE, checkCounts, type DocType, type ReviewItem, type ReviewCheck, type CheckStatus } from "./feedbackCenterData";

// Feedback Center uses the app's brand red (matches AppHeader's active-nav color) as its own accent instead
// of the navy used everywhere else — this section is deliberately visually distinct since it's an
// attention/urgency-driven review queue, not a regular data listing.
const ACCENT = "#CC0025";
const DATE_OPTIONS = ["All dates", "Today", "Yesterday", "This Week", "Last Week", "Date Range"];
const OUTCOME_OPTIONS = ["All Outcomes", "Passed it", "Failed it", "Flagged"];

type CheckVerdict = "pending" | "correct" | "incorrect";

function statusPill(status: CheckStatus): { label: string; fg: string; bg: string } {
  if (status === "flag") return { label: "AI Flag", fg: "#92600B", bg: "#FDF3E7" };
  if (status === "fail") return { label: "Fail", fg: "#BA1C1C", bg: "#FDECEA" };
  return { label: "Pass", fg: "#468657", bg: "#EFF6F1" };
}

// Compact single-select dropdown for the Checks/Outcome filters — plain button + absolute menu, matching
// the same simple picker convention used elsewhere (e.g. HoldManagementOverview's CSR/Credit view toggle).
function FilterDropdown({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide whitespace-nowrap">{label}</span>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
          style={value !== options[0] ? { borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}0D` } : { borderColor: "#E2E6E9", color: "#4D4D4D" }}
        >
          {value}
          <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full mt-1 min-w-[200px] max-h-[260px] overflow-y-auto bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 py-1">
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-[12.5px] cursor-pointer whitespace-nowrap transition-colors ${
                    opt === value ? "font-semibold bg-[#F1F2F4]" : "text-[#4D4D4D] hover:bg-[#F7F7F7]"
                  }`}
                  style={opt === value ? { color: ACCENT } : undefined}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CheckRow({
  check,
  verdict,
  expanded,
  onToggleExpand,
  onVerdict,
}: {
  check: ReviewCheck;
  verdict: CheckVerdict;
  expanded: boolean;
  onToggleExpand: () => void;
  onVerdict: (v: CheckVerdict) => void;
}) {
  const pill = statusPill(check.status);
  const verdictStyle = verdict === "correct" ? "#468657" : verdict === "incorrect" ? "#BA1C1C" : "#97999B";
  return (
    <div className="border border-[#E2E6E9] rounded-[8px] px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onToggleExpand} className="text-[#9ca3af] hover:text-[#4D4D4D] cursor-pointer shrink-0 transition-colors">
          <ChevronRight size={14} className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
        </button>
        <div className="min-w-[210px] shrink-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-semibold text-[#111827]">{check.name}</p>
            <Info size={12} className="text-[#9ca3af]" />
          </div>
          <p className="text-[11px] text-[#9ca3af] mt-0.5">{check.category}</p>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap" style={{ color: pill.fg, backgroundColor: pill.bg }}>
          {pill.label}
        </span>
        <p className={`flex-1 min-w-[200px] text-[12px] text-[#4D4D4D] ${expanded ? "" : "truncate"}`}>{check.description}</p>
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: verdictStyle }}>
            {verdict === "correct" ? "Correct" : verdict === "incorrect" ? "Incorrect" : "Pending"}
          </span>
          <button
            onClick={() => onVerdict(verdict === "correct" ? "pending" : "correct")}
            title="Mark correct"
            className="flex items-center justify-center size-[26px] rounded-[6px] border cursor-pointer transition-colors"
            style={verdict === "correct" ? { borderColor: "#468657", backgroundColor: "#EFF6F1", color: "#468657" } : { borderColor: "#E2E6E9", color: "#666666" }}
          >
            <ThumbsUp size={13} fill={verdict === "correct" ? "#468657" : "none"} />
          </button>
          <button
            onClick={() => onVerdict(verdict === "incorrect" ? "pending" : "incorrect")}
            title="Mark incorrect"
            className="flex items-center justify-center size-[26px] rounded-[6px] border cursor-pointer transition-colors"
            style={verdict === "incorrect" ? { borderColor: "#BA1C1C", backgroundColor: "#FDECEA", color: "#BA1C1C" } : { borderColor: "#E2E6E9", color: "#666666" }}
          >
            <ThumbsDown size={13} fill={verdict === "incorrect" ? "#BA1C1C" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedbackCenterPage({
  docType,
  onNavigateFeedbackCenter,
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
  onNavigateEmailWorkflow,
}: {
  docType: DocType;
  onNavigateFeedbackCenter?: (docType: DocType) => void;
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
  onNavigateEmailWorkflow?: () => void;
}) {
  const docLabel = DOC_TYPE_LABELS[docType];
  const [queue, setQueue] = useState<ReviewItem[]>(() => QUEUE_BY_DOC_TYPE[docType]);
  const [reviewed, setReviewed] = useState<ReviewItem[]>([]);

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
  const [activeTab, setActiveTab] = useState<"queue" | "reviewed" | "analytics">("queue");

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState(DATE_OPTIONS[0]);
  const [checksFilter, setChecksFilter] = useState("All Checks");
  const [outcomeFilter, setOutcomeFilter] = useState(OUTCOME_OPTIONS[0]);

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, Record<string, CheckVerdict>>>({});
  const [expandedCheckIds, setExpandedCheckIds] = useState<Set<string>>(new Set());

  const checkNameOptions = useMemo(() => {
    const names = new Set<string>();
    queue.forEach((item) => item.checks.forEach((c) => names.add(c.name)));
    return ["All Checks", ...Array.from(names)];
  }, [queue]);

  const setVerdict = (itemId: string, checkId: string, v: CheckVerdict) => {
    setVerdicts((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? {}), [checkId]: v } }));
  };
  const getVerdict = (itemId: string, checkId: string): CheckVerdict => verdicts[itemId]?.[checkId] ?? "pending";

  const markRemainingCorrect = (item: ReviewItem) => {
    setVerdicts((prev) => {
      const itemVerdicts = { ...(prev[item.id] ?? {}) };
      item.checks.forEach((c) => { if (!itemVerdicts[c.id] || itemVerdicts[c.id] === "pending") itemVerdicts[c.id] = "correct"; });
      return { ...prev, [item.id]: itemVerdicts };
    });
  };

  const toggleExpandAll = (item: ReviewItem) => {
    setExpandedCheckIds((prev) => {
      const allOpen = item.checks.every((c) => prev.has(c.id));
      const next = new Set(prev);
      item.checks.forEach((c) => (allOpen ? next.delete(c.id) : next.add(c.id)));
      return next;
    });
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success(`${id} copied`);
  };

  const quickApprove = (item: ReviewItem) => {
    setQueue((prev) => prev.filter((x) => x.id !== item.id));
    setReviewed((prev) => [item, ...prev]);
    if (expandedItemId === item.id) setExpandedItemId(null);
    toast.success(`${item.id} marked correct and moved to Reviewed`);
  };

  const submitReview = (item: ReviewItem) => {
    const itemVerdicts = verdicts[item.id] ?? {};
    const flaggedCount = item.checks.filter((c) => itemVerdicts[c.id] === "incorrect").length;
    setQueue((prev) => prev.filter((x) => x.id !== item.id));
    setReviewed((prev) => [item, ...prev]);
    setExpandedItemId(null);
    toast.success(flaggedCount > 0 ? `${item.id} submitted — ${flaggedCount} check${flaggedCount > 1 ? "s" : ""} flagged as incorrect` : `${item.id} submitted — all checks confirmed correct`);
  };

  const filteredQueue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return queue.filter((item) => {
      if (q && !item.id.toLowerCase().includes(q) && !item.poNumber.toLowerCase().includes(q) && !item.company.toLowerCase().includes(q)) return false;
      if (checksFilter !== "All Checks" && !item.checks.some((c) => c.name === checksFilter)) return false;
      if (outcomeFilter !== "All Outcomes") {
        const want: CheckStatus = outcomeFilter === "Passed it" ? "pass" : outcomeFilter === "Failed it" ? "fail" : "flag";
        if (!item.checks.some((c) => c.status === want)) return false;
      }
      return true;
    });
  }, [queue, searchQuery, checksFilter, outcomeFilter]);

  const activeFilterCount = [checksFilter !== "All Checks", outcomeFilter !== "All Outcomes", dateFilter !== DATE_OPTIONS[0]].filter(Boolean).length;
  const clearFilters = () => { setChecksFilter("All Checks"); setOutcomeFilter(OUTCOME_OPTIONS[0]); setDateFilter(DATE_OPTIONS[0]); };

  const checksFilterStats = useMemo(() => {
    if (checksFilter === "All Checks") return null;
    const matching = queue.flatMap((item) => item.checks.filter((c) => c.name === checksFilter));
    const total = matching.length;
    const pass = matching.filter((c) => c.status === "pass").length;
    const fail = total - pass;
    return { total, pass, fail, passPct: total ? Math.round((pass / total) * 100) : 0, failPct: total ? Math.round((fail / total) * 100) : 0 };
  }, [queue, checksFilter]);

  const totalFlagged = queue.reduce((sum, item) => sum + checkCounts(item).aiFlags, 0);
  const expandedItem = expandedItemId ? queue.find((i) => i.id === expandedItemId) ?? null : null;

  return (
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
          <AppHeader
            activeNav="Feedback Center"
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
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
            onNavigateFeedbackCenter={onNavigateFeedbackCenter}
          />
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 flex flex-col gap-4">
            <div>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">{docLabel}</h1>
                  <p className="text-[12px] text-[#97999B] mt-0.5">AI execution validation · human-in-the-loop</p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => toast.info("Check guide — coming soon")}
                    className="flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border border-[#30578D]/40 text-[#30578D] text-[12.5px] font-semibold hover:bg-[#EAF1FB] cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <Info size={13} /> Check guide
                  </button>
                  <div className="w-px h-5 bg-[#E2E6E9]" />
                  <span className="flex items-center gap-1.5 text-[12px] text-[#4D4D4D] whitespace-nowrap">
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
            </div>

            {/* KPI strip — same flat gradient-card style as NewOverviewPage's kpis.map() */}
            {kpisExpanded && (
              <div className="flex flex-wrap gap-4">
                {[
                  { label: "Pending Review", value: queue.length, icon: ClipboardList, accent: EMAIL_TABLE_NAVY },
                  { label: "Flagged", value: totalFlagged, icon: Flag, accent: "#C83737" },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="relative overflow-hidden flex-1 min-w-[240px] rounded-[8px] border border-[#E2E6E9] p-5 flex items-center gap-4"
                    style={{ background: `linear-gradient(135deg, ${kpi.accent}10, #ffffff 65%)` }}
                  >
                    <div className="size-[46px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${kpi.accent}1A` }}>
                      <kpi.icon size={21} style={{ color: kpi.accent }} />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide truncate">{kpi.label}</p>
                      <p className="text-[30px] font-bold text-[#262626] leading-none">{kpi.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-[#DEDEDE] -mt-1">
              {(["queue", "reviewed", "analytics"] as const).map((tab) => {
                const active = activeTab === tab;
                const label = tab === "queue" ? `Queue (${queue.length})` : tab === "reviewed" ? `Reviewed (${reviewed.length})` : "Analytics";
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-4 py-3 text-[13px] font-semibold border-b-2 -mb-px cursor-pointer transition-colors"
                    style={active ? { borderColor: EMAIL_TABLE_NAVY, color: EMAIL_TABLE_NAVY } : { borderColor: "transparent", color: "#666666" }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {activeTab === "queue" && (
              <>
                {/* Info banner */}
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-[8px] bg-[#EAF1FB] border border-[#30578D]/15">
                  <Info size={15} className="shrink-0 mt-0.5" style={{ color: EMAIL_TABLE_NAVY }} />
                  <p className="text-[12.5px] text-[#262626] leading-[1.6]">
                    <span className="font-semibold" style={{ color: EMAIL_TABLE_NAVY }}>Reviewer</span> — Every AI-executed {docLabel} lands here before it
                    is considered closed. Expand a transaction to read the check-by-check breakdown, thumbs down only the checks the AI got wrong, then
                    submit — every check you leave unmarked is recorded as correct.
                  </p>
                </div>

                <h2 className="text-[14px] font-bold text-[#262626]">Awaiting your review</h2>

                {/* Filter row 1: check stat pills (if a check is selected) + search + date */}
                <div className="flex items-center gap-3 flex-wrap">
                  {checksFilterStats && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide whitespace-nowrap max-w-[160px] truncate" title={checksFilter}>
                        {checksFilter}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[#EFF6F1] text-[#468657] whitespace-nowrap">
                        <Check size={11} /> {checksFilterStats.passPct}% PASS · {checksFilterStats.pass}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[#FDECEA] text-[#BA1C1C] whitespace-nowrap">
                        <X size={11} /> {checksFilterStats.failPct}% FAIL · {checksFilterStats.fail}
                      </span>
                    </div>
                  )}
                  <div className="relative flex-1 min-w-[220px] max-w-[320px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search CCC #, PO #, customer"
                      className="w-full h-[36px] pl-8 pr-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide">Date</span>
                    {DATE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setDateFilter(opt)}
                        className="h-[32px] px-3 rounded-full border text-[12px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
                        style={dateFilter === opt ? { borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}0D` } : { borderColor: "#E2E6E9", color: "#4D4D4D" }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter row 2: Checks / Outcome dropdowns + Advanced Filter + Clear filters */}
                <div className="flex items-center gap-3 flex-wrap">
                  <FilterDropdown label="Checks" value={checksFilter} options={checkNameOptions} onChange={setChecksFilter} />
                  <FilterDropdown label="Outcome" value={outcomeFilter} options={OUTCOME_OPTIONS} onChange={setOutcomeFilter} />
                  <button
                    onClick={() => toast.info("Advanced Filter — coming soon")}
                    className="flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
                    style={{ borderColor: "#30578D66", color: EMAIL_TABLE_NAVY }}
                  >
                    <SlidersHorizontal size={13} /> Advanced Filter
                  </button>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 text-[12.5px] font-semibold hover:underline cursor-pointer whitespace-nowrap"
                      style={{ color: EMAIL_TABLE_NAVY }}
                    >
                      <FilterX size={13} /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                    </button>
                  )}
                </div>

                {/* Transaction list */}
                <div className="flex flex-col gap-3 pb-4">
                  {filteredQueue.length === 0 ? (
                    <div className="bg-white rounded-[8px] border border-[#E2E6E9] py-16 text-center">
                      <p className="text-[13px] text-[#97999B]">No transactions match your filters</p>
                    </div>
                  ) : (
                    filteredQueue.map((item) => {
                      const { total, passed, aiFlags } = checkCounts(item);
                      const itemVerdicts = verdicts[item.id] ?? {};
                      const markedCount = item.checks.filter((c) => itemVerdicts[c.id] && itemVerdicts[c.id] !== "pending").length;
                      const isExpanded = expandedItemId === item.id;
                      return (
                        <div key={item.id} className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden">
                          <div className="flex items-center justify-between gap-3 px-5 py-4 flex-wrap">
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                className="shrink-0 text-[#6b7280] hover:text-[#111827] cursor-pointer transition-colors"
                              >
                                <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`} />
                              </button>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                    className="text-[14px] font-bold hover:underline cursor-pointer whitespace-nowrap"
                                    style={{ color: ACCENT }}
                                  >
                                    {item.id}
                                  </button>
                                  <button onClick={() => copyId(item.id)} title="Copy ID" className="text-[#9ca3af] hover:text-[#374151] cursor-pointer transition-colors">
                                    <Copy size={13} />
                                  </button>
                                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#F1F2F4] text-[#4D4D4D] whitespace-nowrap">
                                    VERSION {item.version}
                                  </span>
                                  <span className="text-[13px] font-medium text-[#374151] truncate">{item.company}</span>
                                </div>
                                <p className="text-[11.5px] text-[#9ca3af] mt-1">
                                  Run by {item.runBy} · PO {item.poNumber}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[#F1F2F4] text-[#4D4D4D] whitespace-nowrap">
                                <Check size={11} /> {passed}/{total} PASSED
                              </span>
                              {aiFlags > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[#FDF3E7] text-[#92600B] whitespace-nowrap">
                                  <Flag size={11} /> {aiFlags} AI FLAGS
                                </span>
                              )}
                              <div className="w-px h-5 bg-[#E2E6E9]" />
                              <span className="text-[11.5px] text-[#9ca3af] whitespace-nowrap">{item.timestamp}</span>
                              <button
                                onClick={() => quickApprove(item)}
                                className="flex items-center gap-1.5 px-3 h-[30px] rounded-[8px] border text-[12px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
                                style={{ borderColor: "#468657", color: "#468657" }}
                              >
                                <ThumbsUp size={12} /> Correct
                              </button>
                              <button
                                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                className="text-[12px] font-semibold hover:underline cursor-pointer whitespace-nowrap"
                                style={{ color: EMAIL_TABLE_NAVY }}
                              >
                                {isExpanded ? "Hide checks" : "Show checks"}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-[#E2E6E9] px-5 py-4">
                              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                <p className="text-[13.5px] font-bold text-[#111827]">
                                  Validate each check <span className="font-normal text-[#9ca3af]">{markedCount} / {item.checks.length}</span>
                                </p>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => markRemainingCorrect(item)}
                                    className="text-[12px] font-semibold hover:underline cursor-pointer"
                                    style={{ color: EMAIL_TABLE_NAVY }}
                                  >
                                    Mark remaining as correct
                                  </button>
                                  <button
                                    onClick={() => toggleExpandAll(item)}
                                    className="text-[12px] font-semibold hover:underline cursor-pointer"
                                    style={{ color: EMAIL_TABLE_NAVY }}
                                  >
                                    Expand all
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2.5">
                                {item.checks.map((check) => (
                                  <CheckRow
                                    key={check.id}
                                    check={check}
                                    verdict={getVerdict(item.id, check.id)}
                                    expanded={expandedCheckIds.has(check.id)}
                                    onToggleExpand={() =>
                                      setExpandedCheckIds((prev) => {
                                        const next = new Set(prev);
                                        next.has(check.id) ? next.delete(check.id) : next.add(check.id);
                                        return next;
                                      })
                                    }
                                    onVerdict={(v) => setVerdict(item.id, check.id, v)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {activeTab === "reviewed" && (
              <div className="bg-white rounded-[8px] border border-[#E2E6E9] py-16 text-center">
                {reviewed.length === 0 ? (
                  <>
                    <CheckCircle2 size={28} className="mx-auto text-[#D9D9D6]" />
                    <p className="text-[13px] text-[#97999B] mt-3">No transactions reviewed yet</p>
                  </>
                ) : (
                  <div className="text-left px-5 flex flex-col gap-2.5">
                    {reviewed.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-[8px] border border-[#E2E6E9]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckCircle2 size={15} className="text-[#468657] shrink-0" />
                          <span className="text-[13px] font-semibold text-[#262626] whitespace-nowrap">{item.id}</span>
                          <span className="text-[12.5px] text-[#666666] truncate">{item.company}</span>
                        </div>
                        <span className="text-[11.5px] text-[#9ca3af] whitespace-nowrap">PO {item.poNumber}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="bg-white rounded-[8px] border border-[#E2E6E9] py-16 text-center">
                <p className="text-[14px] font-semibold text-[#374151]">Analytics</p>
                <p className="text-[12.5px] text-[#97999B] mt-1.5">Review-quality trends and AI accuracy metrics — coming soon.</p>
              </div>
            )}
          </div>
        </main>

        {activeTab === "queue" && expandedItem && (
          <div className="shrink-0 bg-white border-t border-[#E2E6E9]">
            <div className="max-w-[1600px] mx-auto px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[12px] text-[#9ca3af]">Thumbs down only the checks the AI got wrong — everything you leave unmarked is submitted as correct.</p>
              <button
                onClick={() => submitReview(expandedItem)}
                className="px-5 py-2.5 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                style={{ backgroundColor: EMAIL_TABLE_NAVY }}
              >
                Submit review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
