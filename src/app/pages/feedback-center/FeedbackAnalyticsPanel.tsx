import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ClipboardList, Flag, ListChecks, MessageSquare, Search, SlidersHorizontal, X } from "lucide-react";
import { EMAIL_TABLE_NAVY } from "../../components/common/EmailTable";
import { ANALYTICS_CHECKS_BY_DOC_TYPE, DOC_TYPE_LABELS, getAnalytics, type AnalyticsFailureRow, type AnalyticsFeedbackRow, type DocType } from "./feedbackCenterData";

const GREEN = "#468657";
const RED = "#BA1C1C";
const AMBER = "#92600B";
const PURPLE = "#823E81";
const YELLOW = "#F2A945";
const GREY = "#D9D9D6";

// Page-level single-select for the filter row — matches the look of the inputs elsewhere on this page
// (border, 34px height) rather than a native <select>. Keyboard: Enter/Space/↓ opens, ↑/↓/Home/End move,
// Enter selects, Esc/Tab closes. Focus stays on the trigger and the highlighted option is announced via
// aria-activedescendant, so screen readers follow along without focus jumping into the list.
function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const openList = () => {
    setActive(Math.max(0, options.indexOf(value)));
    setOpen(true);
  };
  const choose = (i: number) => {
    onChange(options[i]);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // close just this list, not the Filters popover around it
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    }
  };

  return (
    <div className="relative">
      {label && (
        <p id={`${id}-label`} className="text-[10px] font-bold uppercase tracking-wide text-[#97999B] mb-1.5">
          {label}
        </p>
      )}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        className="w-full min-w-[150px] flex items-center justify-between gap-2 h-[34px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] text-[#262626] cursor-pointer hover:bg-[#F7F7F7] transition-colors outline-none focus-visible:border-[#30578D] focus-visible:ring-2 focus-visible:ring-[#30578D]/20"
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={14} className={`shrink-0 text-[#9ca3af] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-20 py-1.5 max-h-[260px] overflow-y-auto"
          >
            {options.map((o, i) => (
              <div
                key={o}
                id={`${id}-opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={o === value}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()} // keep focus on the trigger
                onClick={() => choose(i)}
                className={`w-full flex items-center gap-2 text-left px-3.5 py-2 text-[12.5px] cursor-pointer transition-colors ${i === active ? "bg-[#F7F7F7]" : ""} ${
                  o === value ? "font-semibold" : "text-[#4D4D4D]"
                }`}
                style={o === value ? { color: EMAIL_TABLE_NAVY } : undefined}
              >
                <Check size={13} className="shrink-0" style={{ visibility: o === value ? "visible" : "hidden" }} />
                <span className="truncate">{o}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// 8-week reviewer-verified accuracy, so the page can answer "are we getting better?" — hover a point for
// that week's value. Plain SVG to match the rest of the hand-rolled charts here.
function AccuracyTrend({ points, color }: { points: { week: string; pct: number }[]; color: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 240;
  const H = 44;
  const pad = 4;
  const xs = points.map((_, i) => pad + (i * (W - pad * 2)) / Math.max(1, points.length - 1));
  const ys = points.map((p) => H - pad - (p.pct / 100) * (H - pad * 2));
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const area = `${line} L${xs[xs.length - 1]},${H} L${xs[0]},${H} Z`;
  const last = points[points.length - 1]?.pct ?? 0;
  const prev = points[points.length - 2]?.pct ?? last;
  const delta = Math.round((last - prev) * 10) / 10;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#97999B]">Last 8 weeks</p>
        <p className="text-[11px] font-semibold" style={{ color: delta >= 0 ? GREEN : RED }}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} pts vs last week
        </p>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[44px]" preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
          <path d={area} fill={`${color}14`} />
          <path d={line} fill="none" stroke={color} strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
          {xs.map((x, i) => (
            <rect key={i} x={x - (W / points.length) / 2} y={0} width={W / points.length} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
          ))}
          {hover !== null && <line x1={xs[hover]} x2={xs[hover]} y1={0} y2={H} stroke="#E2E6E9" vectorEffect="non-scaling-stroke" />}
        </svg>
        {hover !== null && (
          <div
            className="absolute -top-7 px-1.5 py-0.5 rounded-[4px] bg-[#111827] text-white text-[10px] font-semibold whitespace-nowrap pointer-events-none -translate-x-1/2"
            style={{ left: `${(xs[hover] / W) * 100}%` }}
          >
            {points[hover].week}: {points[hover].pct}%
          </div>
        )}
      </div>
    </div>
  );
}

function SegToggle({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="inline-flex items-center p-0.5 rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F8]">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className="px-3.5 h-[30px] rounded-[6px] text-[12.5px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
          style={o === value ? { backgroundColor: "#FFFFFF", color: EMAIL_TABLE_NAVY, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#666666" }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#4D4D4D] whitespace-nowrap">
      <span className="size-[9px] rounded-[2px] shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

// Horizontal 100%-stacked bar, hand-rolled — nothing else in the app pulls in a chart library, and this
// gives full control over labelling only the dominant segment the way the rest of the page's pills work.
function StackedBarRow({
  label,
  segments,
  totalLabel,
  selected,
  onSelect,
}: {
  label: string;
  segments: { pct: number; color: string }[];
  totalLabel: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const total = segments.reduce((s, x) => s + x.pct, 0);
  const dominant = Math.max(...segments.map((s) => s.pct));
  return (
    <button
      type="button"
      onClick={onSelect}
      title={selected ? `Showing only ${label} — click to show all checks` : `Narrow the whole page to ${label}`}
      className={`w-full flex items-center gap-4 py-2 px-2 -mx-2 rounded-[6px] text-left group cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#30578D]/30 ${
        selected ? "bg-[#EAF1FB]" : "hover:bg-[#F7F7F8]"
      }`}
    >
      <p className="w-[260px] shrink-0 text-[12.5px] text-[#374151] truncate group-hover:text-[#111827] group-hover:underline underline-offset-2 transition-colors">
        {label}
      </p>
      <div className="flex-1 h-[22px] rounded-[5px] overflow-hidden flex bg-[#F1F2F4] ring-1 ring-transparent group-hover:ring-[#E2E6E9] transition-all">
        {total === 0 ? (
          <div className="w-full flex items-center justify-center text-[10.5px] text-[#97999B] font-medium">No feedback yet</div>
        ) : (
          segments
            .filter((s) => s.pct > 0)
            .map((s, i) => (
              <div key={i} className="h-full flex items-center justify-center transition-opacity hover:opacity-85" style={{ width: `${s.pct}%`, backgroundColor: s.color }} title={`${s.pct.toFixed(1)}%`}>
                {s.pct === dominant && s.pct >= 18 && <span className="text-[10px] font-semibold text-white whitespace-nowrap">{s.pct.toFixed(0)}%</span>}
              </div>
            ))
        )}
      </div>
      <p className="w-[34px] shrink-0 text-right text-[12.5px] font-semibold text-[#374151]">{totalLabel}</p>
    </button>
  );
}

const FEEDBACK_SORTS = ["Total feedback (high to low)", "Highest negative feedback", "Check name (A–Z)"];
const FAILURE_SORTS = ["Total reviewed (high to low)", "Highest incorrect %", "Check name (A–Z)"];

// A request from elsewhere on the page (a KPI number, a donut slice) to show the breakdown a particular way.
// `nonce` makes repeat clicks on the same link re-trigger the scroll + highlight.
type BreakdownFocus = { mode: "Feedback mix" | "Failure rate"; sort: string; nonce: number };

function CheckBreakdownSection({
  feedbackRows,
  failureRows,
  checkFilter,
  onSelectCheck,
  focus,
}: {
  feedbackRows: AnalyticsFeedbackRow[];
  failureRows: AnalyticsFailureRow[];
  checkFilter: string | null;
  onSelectCheck: (check: string | null) => void;
  focus: BreakdownFocus | null;
}) {
  const [mode, setMode] = useState("Feedback mix");
  const [query, setQuery] = useState("");
  const [feedbackSortBy, setFeedbackSortBy] = useState(FEEDBACK_SORTS[0]);
  const [failureSortBy, setFailureSortBy] = useState(FAILURE_SORTS[0]);
  const [flash, setFlash] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const q = query.trim().toLowerCase();

  useEffect(() => {
    if (!focus) return;
    setMode(focus.mode);
    if (focus.mode === "Feedback mix") setFeedbackSortBy(focus.sort);
    else setFailureSortBy(focus.sort);
    setQuery("");
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 1200);
    return () => window.clearTimeout(t);
  }, [focus?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCheck = (check: string) => onSelectCheck(checkFilter === check ? null : check);

  const feedbackSorted = useMemo(() => {
    const rows = feedbackRows.filter((r) => r.check.toLowerCase().includes(q) && (!checkFilter || r.check === checkFilter));
    return rows.sort((a, b) => {
      if (feedbackSortBy === "Highest negative feedback") return b.missingDocPct + b.outdatedPct - (a.missingDocPct + a.outdatedPct);
      if (feedbackSortBy === "Check name (A–Z)") return a.check.localeCompare(b.check);
      return b.totalFeedback - a.totalFeedback;
    });
  }, [feedbackRows, q, feedbackSortBy, checkFilter]);

  const failureSorted = useMemo(() => {
    const rows = failureRows.filter((r) => r.check.toLowerCase().includes(q) && (!checkFilter || r.check === checkFilter));
    return rows.sort((a, b) => {
      if (failureSortBy === "Highest incorrect %") return b.incorrectPct - a.incorrectPct;
      if (failureSortBy === "Check name (A–Z)") return a.check.localeCompare(b.check);
      return b.totalReviewed - a.totalReviewed;
    });
  }, [failureRows, q, failureSortBy, checkFilter]);

  return (
    <div
      ref={sectionRef}
      className="bg-white rounded-[8px] border px-5 py-5 scroll-mt-4 transition-[border-color,box-shadow] duration-500"
      style={flash ? { borderColor: EMAIL_TABLE_NAVY, boxShadow: "0 0 0 3px rgba(48,87,141,0.15)" } : { borderColor: "#E2E6E9" }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div>
          <p className="text-[14px] font-bold text-[#111827]">Check-by-check breakdown</p>
          <p className="text-[11.5px] text-[#97999B] mt-0.5">
            {mode === "Feedback mix" ? "Of the checks reviewers gave feedback on, what the AI got wrong" : "Correct vs. incorrect, among the checks that were reviewed"}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter checks…"
              className="h-[34px] w-[180px] pl-8 pr-3 rounded-[8px] border border-[#E2E6E9] text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
            />
          </div>
          <SegToggle value={mode} onChange={setMode} options={["Feedback mix", "Failure rate"]} />
        </div>
      </div>

      <div className="h-px bg-[#E2E6E9] my-4" />

      {mode === "Feedback mix" ? (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-4 flex-wrap">
              <LegendDot color={GREEN} label="Accurate / Rest correct" />
              <LegendDot color={PURPLE} label="Missing document" />
              <LegendDot color={YELLOW} label="Outdated data" />
              <LegendDot color={GREY} label="No feedback yet" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#97999B] whitespace-nowrap">Sort by</span>
              <FilterSelect label="" value={feedbackSortBy} options={FEEDBACK_SORTS} onChange={setFeedbackSortBy} />
            </div>
          </div>
          <div className="flex items-center gap-4 pb-2 border-b border-[#E2E6E9] mb-1">
            <p className="w-[260px] shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#97999B]">Validation check</p>
            <div className="flex-1" />
            <p className="w-[34px] shrink-0 text-right text-[10px] font-bold uppercase tracking-wide text-[#97999B]">Total</p>
          </div>
          {feedbackSorted.length === 0 ? (
            <p className="text-[12.5px] text-[#97999B] text-center py-6">No checks match the current search or filters.</p>
          ) : (
            feedbackSorted.map((r) => (
              <StackedBarRow
                key={r.check}
                label={r.check}
                totalLabel={String(r.totalFeedback)}
                selected={checkFilter === r.check}
                onSelect={() => toggleCheck(r.check)}
                segments={[
                  { pct: r.correctPct, color: GREEN },
                  { pct: r.missingDocPct, color: PURPLE },
                  { pct: r.outdatedPct, color: YELLOW },
                  { pct: r.noFeedbackPct, color: GREY },
                ]}
              />
            ))
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-4 flex-wrap">
              <LegendDot color={GREEN} label="Correct" />
              <LegendDot color={RED} label="Incorrect" />
              <LegendDot color={GREY} label="No feedback yet" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#97999B] whitespace-nowrap">Sort by</span>
              <FilterSelect label="" value={failureSortBy} options={FAILURE_SORTS} onChange={setFailureSortBy} />
            </div>
          </div>
          <div className="flex items-center gap-4 pb-2 border-b border-[#E2E6E9] mb-1">
            <p className="w-[260px] shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#97999B]">Validation check</p>
            <div className="flex-1" />
            <p className="w-[34px] shrink-0 text-right text-[10px] font-bold uppercase tracking-wide text-[#97999B]">Total</p>
          </div>
          {failureSorted.length === 0 ? (
            <p className="text-[12.5px] text-[#97999B] text-center py-6">No checks match the current search or filters.</p>
          ) : (
            failureSorted.map((r) => (
              <StackedBarRow
                key={r.check}
                label={r.check}
                totalLabel={String(r.totalReviewed)}
                selected={checkFilter === r.check}
                onSelect={() => toggleCheck(r.check)}
                segments={[
                  { pct: r.correctPct, color: GREEN },
                  { pct: r.incorrectPct, color: RED },
                  { pct: r.noFeedbackPct, color: GREY },
                ]}
              />
            ))
          )}
          <p className="text-[11px] text-[#97999B] mt-3">
            Percentage of reviewed transactions · sorted by{" "}
            {failureSortBy === "Highest incorrect %" ? "highest incorrect %" : failureSortBy === "Check name (A–Z)" ? "check name" : "total reviewed"}
          </p>
        </>
      )}
    </div>
  );
}

export function FeedbackAnalyticsPanel({ docType }: { docType: DocType }) {
  const docLabel = DOC_TYPE_LABELS[docType];
  const checkOptions = ANALYTICS_CHECKS_BY_DOC_TYPE[docType];
  const [dateRange, setDateRange] = useState("All dates");
  const [oaVersion, setOaVersion] = useState("All versions");
  const [checkName, setCheckName] = useState("All checks");
  const [feedbackStatus, setFeedbackStatus] = useState("All statuses");
  const [passFail, setPassFail] = useState("All results");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [breakdownFocus, setBreakdownFocus] = useState<BreakdownFocus | null>(null);
  const drill = (mode: BreakdownFocus["mode"], sort: string) => setBreakdownFocus({ mode, sort, nonce: Date.now() });

  // Esc closes the Filters popover (an open dropdown inside it swallows the first Esc to close itself).
  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  const activeFilters = [
    { key: "date", label: "Date range", value: dateRange, active: dateRange !== "All dates", clear: () => setDateRange("All dates") },
    { key: "version", label: "OA version", value: oaVersion, active: oaVersion !== "All versions", clear: () => setOaVersion("All versions") },
    { key: "check", label: "Check", value: checkName, active: checkName !== "All checks", clear: () => setCheckName("All checks") },
    { key: "status", label: "Feedback status", value: feedbackStatus, active: feedbackStatus !== "All statuses", clear: () => setFeedbackStatus("All statuses") },
    { key: "result", label: "Pass/Fail", value: passFail, active: passFail !== "All results", clear: () => setPassFail("All results") },
  ].filter((f) => f.active);
  const activeFilterCount = activeFilters.length;
  const filtersApplied = activeFilterCount > 0;
  // Fraction of the full history the active filters cover. Feedback status isn't here on purpose — it
  // highlights its slice of the status donut instead of shrinking the whole page.
  const DATE_SHARE: Record<string, number> = { "All dates": 1, Today: 0.04, "This week": 0.2, "This month": 0.55 };
  const VERSION_SHARE: Record<string, number> = { "All versions": 1, "Version 1": 0.6, "Version 2": 0.4 };
  const RESULT_SHARE: Record<string, number> = { "All results": 1, Passed: 0.78, Failed: 0.22 };
  const share = (DATE_SHARE[dateRange] ?? 1) * (VERSION_SHARE[oaVersion] ?? 1) * (RESULT_SHARE[passFail] ?? 1) * (checkName === "All checks" ? 1 : 0.3);
  const data = useMemo(() => getAnalytics(docType, share), [docType, share]);

  const clearFilters = () => {
    setDateRange("All dates");
    setOaVersion("All versions");
    setCheckName("All checks");
    setFeedbackStatus("All statuses");
    setPassFail("All results");
  };

  // Every validated transaction sits in exactly one status, so the donut always totals the same number as
  // "Transactions validated", and Correct + Flagged always equals "Transactions with feedback".
  const statusRows: { label: string; value: number; color: string; drill?: () => void }[] = [
    { label: "Confirmed correct", value: data.statusSplit.confirmedCorrect, color: GREEN, drill: () => drill("Failure rate", "Total reviewed (high to low)") },
    { label: "Has corrections", value: data.statusSplit.hasCorrections, color: RED, drill: () => drill("Failure rate", "Highest incorrect %") },
    { label: "Pending", value: data.statusSplit.pending, color: EMAIL_TABLE_NAVY },
  ];
  // Percentages on a handful of reviewed transactions swing wildly, so call that out instead of letting
  // "50%" on n=2 read like a settled rate.
  const LOW_SAMPLE = 10;
  const lowSample = data.transactionsWithFeedback < LOW_SAMPLE;
  const statusTotal = statusRows.reduce((sum, r) => sum + r.value, 0);
  const pct = (n: number) => (statusTotal === 0 ? 0 : Math.round((n / statusTotal) * 1000) / 10);
  const highlighted = feedbackStatus === "All statuses" ? null : feedbackStatus;
  let cursor = 0;
  const donutGradient = `conic-gradient(${statusRows
    .map((r) => {
      const from = cursor;
      cursor += statusTotal === 0 ? 0 : (r.value / statusTotal) * 100;
      const color = highlighted && highlighted !== r.label ? `${r.color}33` : r.color;
      return `${color} ${from}% ${cursor}%`;
    })
    .join(", ")})`;

  return (
    <div className="flex flex-col gap-4">
      {/* Header — plain, like the page's own title above the tabs, not another boxed card. Filters live in
          a popover off a button instead of a bar that pushes the whole header open. */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[16px] font-bold text-[#111827]">{docLabel} accuracy & feedback</p>
          <p className="text-[12px] text-[#97999B] mt-0.5">How reviewers are grading the AI's validation work on this track.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {activeFilters.slice(0, 2).map((f) => (
            <span
              key={f.key}
              title={`${f.label}: ${f.value}`}
              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 h-[30px] rounded-full text-[11.5px] font-semibold whitespace-nowrap max-w-[160px]"
              style={{ backgroundColor: "#EAF1FB", color: EMAIL_TABLE_NAVY }}
            >
              <span className="truncate">{f.value}</span>
              <button onClick={f.clear} className="flex items-center justify-center size-[17px] rounded-full shrink-0 hover:bg-[#30578D]/15 cursor-pointer transition-colors">
                <X size={11} />
              </button>
            </span>
          ))}
          {activeFilters.length > 2 && (
            <button
              onClick={() => setFiltersOpen(true)}
              title={activeFilters
                .slice(2)
                .map((f) => `${f.label}: ${f.value}`)
                .join(", ")}
              className="inline-flex items-center h-[30px] px-3 rounded-full text-[11.5px] font-semibold whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#EAF1FB", color: EMAIL_TABLE_NAVY }}
            >
              +{activeFilters.length - 2} more
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex items-center gap-1.5 h-[34px] px-3.5 rounded-[8px] border bg-white text-[12.5px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
              style={filtersOpen || filtersApplied ? { borderColor: EMAIL_TABLE_NAVY, color: EMAIL_TABLE_NAVY, backgroundColor: "#EAF1FB" } : { borderColor: "#E2E6E9", color: "#4D4D4D" }}
            >
              <SlidersHorizontal size={13} />
              Filters
              {filtersApplied && (
                <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-[8px] text-white text-[10px] font-bold" style={{ backgroundColor: EMAIL_TABLE_NAVY }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            {filtersOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setFiltersOpen(false)} />
                <div className="absolute top-full right-0 mt-1.5 w-[420px] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <FilterSelect label="Date range" value={dateRange} options={["All dates", "Today", "This week", "This month"]} onChange={setDateRange} />
                  <FilterSelect label="OA version" value={oaVersion} options={["All versions", "Version 1", "Version 2"]} onChange={setOaVersion} />
                  <FilterSelect label="Check name" value={checkName} options={["All checks", ...checkOptions]} onChange={setCheckName} />
                  <FilterSelect label="Feedback status" value={feedbackStatus} options={["All statuses", "Confirmed correct", "Has corrections", "Pending"]} onChange={setFeedbackStatus} />
                  <FilterSelect label="Pass/Fail" value={passFail} options={["All results", "Passed", "Failed"]} onChange={setPassFail} />
                </div>
                {filtersApplied && (
                  <button
                    onClick={clearFilters}
                    className="w-full h-[34px] rounded-[8px] border text-[12.5px] font-semibold transition-colors cursor-pointer hover:bg-[#F7F7F7] mt-3"
                    style={{ borderColor: EMAIL_TABLE_NAVY, color: EMAIL_TABLE_NAVY }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Scope line — how much data everything below rests on, read first so a percentage built on 2
          reviews isn't mistaken for one built on 2,000. The cards below then only carry rates/visuals. */}
      <div className="flex items-center flex-wrap gap-y-3">
        {[
          { icon: ClipboardList, accent: EMAIL_TABLE_NAVY, value: data.totalTransactionsValidated.toLocaleString(), label: "transactions validated" },
          {
            icon: MessageSquare,
            accent: EMAIL_TABLE_NAVY,
            value: data.transactionsWithFeedback.toLocaleString(),
            label: `with feedback (${data.detail.withFeedback.pctOfValidated}%)`,
          },
          { icon: ListChecks, accent: EMAIL_TABLE_NAVY, value: data.checksExecuted.toLocaleString(), label: "checks run" },
          {
            icon: AlertTriangle,
            accent: AMBER,
            value: data.checksMarkedIncorrect.toLocaleString(),
            label: `checks marked incorrect (${data.detail.incorrect.falseFlags} false flag${data.detail.incorrect.falseFlags === 1 ? "" : "s"} · ${data.detail.incorrect.missedIssues} missed issue${data.detail.incorrect.missedIssues === 1 ? "" : "s"})`,
            onClick: () => drill("Feedback mix", "Highest negative feedback"),
            hint: "See which checks reviewers marked incorrect most often",
          },
        ].map((item, i) => {
          const Icon = item.icon;
          const body = (
            <>
              <span className="size-[32px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.accent}14` }}>
                <Icon size={16} style={{ color: item.accent }} />
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-[20px] font-bold text-[#111827] leading-none">{item.value}</span>
                <span className="text-[13px] text-[#666666] group-hover:underline underline-offset-4">{item.label}</span>
              </span>
            </>
          );
          return (
            <div key={i} className="flex items-center">
              {i > 0 && <span className="w-px h-6 bg-[#D9D9D6] mx-5" />}
              {item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  title={item.hint}
                  className="flex items-center gap-2.5 cursor-pointer rounded-[8px] -m-1 p-1 group hover:bg-[#F7F7F8] outline-none focus-visible:ring-2 focus-visible:ring-[#30578D]/30"
                >
                  {body}
                </button>
              ) : (
                <div className="flex items-center gap-2.5">{body}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Three clearly-labeled cards instead of cramming two different populations (the AI's own self-grade,
          and what reviewers verified) into one card, or burying the donut inside a card whose header talks
          about a smaller slice of the data than the donut actually shows. Each card now says exactly what
          it covers and nothing in it needs to borrow context from a neighboring card to make sense. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-[8px] border border-[#E2E6E9] bg-white overflow-hidden">
          <div className="px-5 pt-4 flex items-center gap-2">
            <span className="size-[7px] rounded-full shrink-0" style={{ backgroundColor: EMAIL_TABLE_NAVY }} />
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#666666]">AI self-reported</p>
          </div>
          <div className="px-5 pb-5 pt-2">
            <p className="text-[38px] font-bold text-[#111827] leading-none">{data.accuracyBreakdown.passRatePct}%</p>
            <p className="text-[12px] text-[#97999B] mt-1.5">pass rate — the AI's own call, before any human looks at it</p>
            <div className="h-[8px] rounded-full bg-[#E2E6E9] overflow-hidden mt-3.5">
              <div className="h-full rounded-full" style={{ width: `${data.accuracyBreakdown.passRatePct}%`, backgroundColor: EMAIL_TABLE_NAVY }} />
            </div>
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#F1F2F4]">
              <div className="flex items-center gap-1.5 text-[12px] text-[#4D4D4D]">
                <CheckCircle2 size={13} style={{ color: GREEN }} className="shrink-0" />
                <span className="font-semibold text-[#111827]">{data.accuracyBreakdown.passedEveryCheck.toLocaleString()}</span> of {data.totalTransactionsValidated.toLocaleString()} transactions passed every check
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-[#4D4D4D]">
                <Flag size={12} style={{ color: AMBER }} className="shrink-0" />
                <span className="font-semibold text-[#111827]">{data.accuracyBreakdown.flaggedTransactions.toLocaleString()}</span> flagged at least once ({data.accuracyBreakdown.flaggedChecks.toLocaleString()} checks)
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[8px] border border-[#E2E6E9] bg-white overflow-hidden">
          <div className="px-5 pt-4 flex items-center gap-2">
            <span className="size-[7px] rounded-full shrink-0" style={{ backgroundColor: GREEN }} />
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#666666]">Reviewer-verified</p>
          </div>
          <div className="px-5 pb-5 pt-2">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => drill("Failure rate", "Total reviewed (high to low)")}
                title="See which checks reviewers confirmed"
                className="text-left rounded-[6px] -m-1 p-1 cursor-pointer group hover:bg-[#F7F9FC] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#30578D]/30"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} style={{ color: GREEN }} className="shrink-0" />
                  <p className="text-[38px] font-bold text-[#111827] leading-none">{data.overallOaAccuracyPct.toFixed(0)}%</p>
                </div>
                <p className="text-[11px] text-[#97999B] mt-1.5 max-w-[110px] group-hover:underline underline-offset-2">confirmed fully correct</p>
              </button>
              <div className="w-px h-[36px] bg-[#E2E6E9]" />
              <button
                type="button"
                onClick={() => drill("Failure rate", "Highest incorrect %")}
                title="See which checks reviewers marked incorrect"
                className="text-left rounded-[6px] -m-1 p-1 cursor-pointer group hover:bg-[#FDF5F5] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#30578D]/30"
              >
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={13} style={{ color: RED }} className="shrink-0" />
                  <p className="text-[22px] font-bold leading-none" style={{ color: RED }}>
                    {data.negativeFeedbackPct.toFixed(0)}%
                  </p>
                </div>
                <p className="text-[11px] text-[#97999B] mt-1.5 max-w-[95px] group-hover:underline underline-offset-2">had corrections</p>
              </button>
            </div>
            {/* Same shape as the AI card's progress bar, so the two numbers above visibly read as two parts
                of one whole (the reviewed transactions) instead of two unrelated percentages. */}
            <div className="h-[8px] rounded-full bg-[#E2E6E9] overflow-hidden mt-3.5 flex">
              <div className="h-full" style={{ width: `${data.overallOaAccuracyPct}%`, backgroundColor: GREEN }} />
              <div className="h-full" style={{ width: `${data.negativeFeedbackPct}%`, backgroundColor: RED }} />
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <p className="text-[10px] text-[#97999B]/80">{data.detail.accuracy.fraction}</p>
              {lowSample && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 h-[18px] rounded-[4px] text-[10px] font-semibold"
                  style={{ backgroundColor: "#FDF3E7", color: AMBER }}
                  title={`Fewer than ${LOW_SAMPLE} reviewed transactions — percentages will move a lot with each new review.`}
                >
                  Based on only {data.transactionsWithFeedback} review{data.transactionsWithFeedback === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <div className="mt-4">
              <AccuracyTrend points={data.accuracyTrend} color={GREEN} />
            </div>
          </div>
        </div>

        <div className="rounded-[8px] border border-[#E2E6E9] bg-white overflow-hidden flex flex-col">
          <div className="px-5 pt-4 flex items-center gap-2 shrink-0">
            <span className="size-[7px] rounded-full shrink-0" style={{ backgroundColor: EMAIL_TABLE_NAVY }} />
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#666666]">Feedback status split</p>
          </div>
          <div className="flex-1 px-5 pb-5 pt-3 flex items-center justify-center gap-6">
            <div
              className="relative shrink-0 rounded-full"
              style={{ background: donutGradient, width: "clamp(100px, 11vw, 160px)", height: "clamp(100px, 11vw, 160px)" }}
            >
              <div className="absolute inset-[13%] bg-white rounded-full flex flex-col items-center justify-center">
                <p className="text-[20px] font-bold text-[#111827] leading-none">{statusTotal.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 min-w-0">
              {statusRows.map((r) => {
                const isOn = highlighted === r.label;
                return (
                  <button
                    type="button"
                    key={r.label}
                    onClick={() => {
                      setFeedbackStatus(isOn ? "All statuses" : r.label);
                      if (!isOn) r.drill?.();
                    }}
                    title={
                      isOn
                        ? "Clear highlight"
                        : r.drill
                        ? `Highlight ${r.label} and jump to the check breakdown`
                        : `Highlight ${r.label} — nothing to break down until these are reviewed`
                    }
                    className={`flex items-center gap-1.5 text-[12.5px] whitespace-nowrap rounded-[6px] px-1.5 py-0.5 -mx-1.5 cursor-pointer transition-[opacity,background-color] outline-none focus-visible:ring-2 focus-visible:ring-[#30578D]/30 ${
                      isOn ? "bg-[#F1F2F4]" : "hover:bg-[#F7F7F8]"
                    }`}
                    style={{ opacity: highlighted && !isOn ? 0.4 : 1 }}
                  >
                    <span className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                    <span className="text-[#666666] w-[112px] text-left">{r.label}</span>
                    <span className="font-semibold text-[#111827]">{r.value.toLocaleString()}</span>
                    <span className="text-[#97999B]">({pct(r.value)}%)</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <CheckBreakdownSection
        feedbackRows={data.feedbackRows}
        failureRows={data.failureRows}
        checkFilter={checkName === "All checks" ? null : checkName}
        onSelectCheck={(c) => setCheckName(c ?? "All checks")}
        focus={breakdownFocus}
      />
    </div>
  );
}
