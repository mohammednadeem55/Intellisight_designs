import { useEffect, useRef, useState } from "react";
import { ChevronDown, RotateCcw, Search, X } from "lucide-react";
import { EMAIL_TABLE_NAVY } from "./EmailTable";

// Coordinates "only one staged multi-select dropdown open at a time" across a table's toolbar (e.g.
// Category + Language, or Classification + Interval) — opening one closes the other, and clicking outside
// whichever is open closes it. Shared so every table's toolbar gets this for free instead of each page
// re-implementing its own mutual-exclusion + outside-click listener (which is exactly how the "previous
// dropdown doesn't close" bug happened in the first place).
export function useExclusiveOpen() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const registerRef = (key: string) => (el: HTMLDivElement | null) => { refs.current[key] = el; };
  useEffect(() => {
    if (!openKey) return;
    const handler = (e: MouseEvent) => {
      const el = refs.current[openKey];
      if (el?.contains(e.target as Node)) return;
      setOpenKey(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openKey]);
  return { openKey, setOpenKey, registerRef };
}

// Collapsible toolbar search — icon until clicked, then an input. `debounceMs={0}` (default) commits every
// keystroke immediately, for client-side filtering with no real cost. `debounceMs > 0` treats `onCommit` as
// something expensive (a future server-side query): typing debounces before committing, but clearing the
// box back to empty always commits instantly since "show everything" should never feel laggy, and Enter
// force-commits immediately for anyone who doesn't want to wait out the debounce.
export function TableToolbarSearch({
  value,
  onCommit,
  placeholder = "Search...",
  debounceMs = 0,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  debounceMs?: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (debounceMs <= 0) return;
    if (draft.trim() === "") {
      if (value !== "") onCommit("");
      return;
    }
    const timer = setTimeout(() => onCommit(draft), debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, debounceMs]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      if (!draft.trim()) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, draft]);

  const clear = () => { setDraft(""); onCommit(""); };
  const pendingCommit = debounceMs > 0 && draft !== value;

  return (
    <div className="relative shrink-0" ref={ref}>
      {open ? (
        <div className="flex items-center gap-1.5 h-[36px] pl-[10px] pr-[8px] rounded-[8px] border border-[#30578D] bg-white w-[260px]">
          <Search size={14} className="shrink-0 text-[#666666]" />
          <input
            autoFocus
            value={draft}
            onChange={(e) => {
              const v = e.target.value;
              setDraft(v);
              if (debounceMs <= 0) onCommit(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCommit(draft);
              if (e.key === "Escape") { clear(); setOpen(false); }
            }}
            placeholder={placeholder}
            className="flex-1 min-w-0 h-full text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none bg-transparent"
          />
          {pendingCommit && <span className="shrink-0 size-[6px] rounded-full bg-[#E67919] animate-pulse" title="Searching…" />}
          {draft && (
            <button onClick={clear} aria-label="Clear search" className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Search"
          className="relative flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
        >
          <Search size={14} />
          {value && <span className="absolute -top-[3px] -right-[3px] size-[8px] rounded-full bg-[#E67919] ring-2 ring-white" />}
        </button>
      )}
    </div>
  );
}

// Staged multi-select toolbar dropdown — "Category", "Hold Type", "Classification", etc. Picks accumulate
// in `pending` until a shared TableToolbarApplyReset commits them; `open`/`onOpenChange` are controlled so a
// page can coordinate several of these via useExclusiveOpen.
export function TableToolbarMultiSelect({
  label,
  options,
  pending,
  onToggle,
  onToggleAll,
  onClear,
  open,
  onOpenChange,
  containerRef,
  appliedCount,
  dirty,
  width = 220,
  header,
  searchable = false,
  listMaxHeight,
}: {
  label: string;
  options: string[];
  pending: string[];
  onToggle: (opt: string) => void;
  onToggleAll: () => void;
  onClear: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containerRef?: React.Ref<HTMLDivElement>;
  appliedCount: number;
  dirty: boolean;
  width?: number;
  /** Optional row rendered above "Select all" — e.g. a Match any/all switch. */
  header?: React.ReactNode;
  /** Adds a filter box above the list for long option sets. */
  searchable?: boolean;
  /** Caps the option list's height (px) and makes it scroll — for long option sets. Select all / Clear stay put. */
  listMaxHeight?: number;
}) {
  const [q, setQ] = useState("");
  const visibleOptions = searchable && q.trim() ? options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase())) : options;
  const allSelected = pending.length === options.length && options.length > 0;
  const someSelected = pending.length > 0 && !allSelected;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => onOpenChange(!open)}
        className={`relative flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${
          open ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7]"
        }`}
      >
        {label}
        {appliedCount > 0 && (
          <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-[8px] text-white text-[10px] font-bold" style={{ backgroundColor: EMAIL_TABLE_NAVY }}>
            {appliedCount}
          </span>
        )}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        {dirty && <span className="absolute -top-[3px] -right-[3px] size-[8px] rounded-full bg-[#E67919] ring-2 ring-white" />}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 py-1.5" style={{ width }}>
          {header && <div className="px-3.5 pb-2 pt-0.5 mb-1 border-b border-[#E2E6E9]">{header}</div>}
          {searchable && (
            <div className="px-3 pb-1.5">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter..."
                className="w-full h-[32px] px-3 rounded-[8px] border border-[#E2E6E9] text-[12px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
              />
            </div>
          )}
          <button
            onClick={onToggleAll}
            className="w-full flex items-center gap-2.5 text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors border-b border-[#E2E6E9] mb-1"
          >
            <span
              className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${allSelected || someSelected ? "border-transparent" : "border-[#D9D9D6]"}`}
              style={allSelected || someSelected ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
            >
              {allSelected && <CheckGlyph />}
              {someSelected && <span className="w-[7px] h-[2px] bg-white rounded-full" />}
            </span>
            <span className="font-semibold text-[#262626]">Select all</span>
          </button>
          <div className={listMaxHeight ? "overflow-y-auto" : undefined} style={listMaxHeight ? { maxHeight: listMaxHeight } : undefined}>
          {searchable && visibleOptions.length === 0 && <p className="px-3.5 py-3 text-[12px] text-[#97999B]">No matches.</p>}
          {visibleOptions.map((opt) => {
            const checked = pending.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => onToggle(opt)}
                className="w-full flex items-center gap-2.5 text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
              >
                <span
                  className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${checked ? "border-transparent" : "border-[#D9D9D6]"}`}
                  style={checked ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                >
                  {checked && <CheckGlyph />}
                </span>
                <span className={`truncate ${checked ? "text-[#262626] font-medium" : "text-[#4D4D4D]"}`}>{opt}</span>
              </button>
            );
          })}
          </div>
          {pending.length > 0 && (
            <button onClick={onClear} className="w-full text-left px-3.5 pt-1.5 pb-0.5 text-[11.5px] font-medium text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CheckGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Shared Apply/Reset pair — surfaces only while at least one staged toolbar dropdown is dirty, and commits
// all of them together in one click (the whole point of staging picks behind Apply instead of applying
// each dropdown immediately).
export function TableToolbarApplyReset({ dirty, onApply, onReset }: { dirty: boolean; onApply: () => void; onReset: () => void }) {
  if (!dirty) return null;
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onReset}
        title="Discard changes"
        className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
      >
        <RotateCcw size={14} />
      </button>
      <button
        onClick={onApply}
        className="h-[36px] px-4 rounded-[8px] text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
        style={{ backgroundColor: EMAIL_TABLE_NAVY }}
      >
        Apply
      </button>
    </div>
  );
}

// A staged multi-select's applied/pending state — one dropdown's worth. Several of these can share one
// TableToolbarApplyReset by OR-ing their `dirty` flags and calling each `apply`/`reset` together.
export function useStagedMultiSelect(allOptions: string[]) {
  const [applied, setApplied] = useState<string[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const dirty = pending.slice().sort().join("|") !== applied.slice().sort().join("|");
  const toggle = (opt: string) => setPending((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]));
  const toggleAll = () => setPending((prev) => (prev.length === allOptions.length ? [] : [...allOptions]));
  const clear = () => setPending([]);
  const apply = () => setApplied(pending);
  const reset = () => setPending(applied);
  // Wipes both the staged picks and what's already applied — for a page-level "Clear filters" action, as
  // opposed to `clear` (staged only, still needs Apply).
  const clearAll = () => { setApplied([]); setPending([]); };
  // Sets both staged and applied to an exact selection at once — e.g. applying a saved filter.
  const setAll = (values: string[]) => { setApplied(values); setPending(values); };
  return { applied, pending, dirty, toggle, toggleAll, clear, apply, reset, clearAll, setAll };
}
