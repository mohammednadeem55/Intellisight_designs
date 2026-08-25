import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, Filter, X } from "lucide-react";
import { EMAIL_TABLE_NAVY } from "./EmailTable";

export type TableColumnDef = { key: string; label: string };

// Icon button that lives in the toolbar row and opens the slide-in panel below. Kept separate from
// TableFilterPanel itself because the trigger sits in the toolbar row while the panel is positioned
// absolutely inside the table's body wrapper — same controlled `open`/`onOpenChange` drives both.
export function TableFilterTrigger({
  open,
  onOpenChange,
  activeCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
}) {
  return (
    <button
      onClick={() => onOpenChange(!open)}
      title="More filters"
      className={`relative flex items-center justify-center size-[36px] rounded-[8px] border transition-colors cursor-pointer ${open ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7]"}`}
    >
      <Filter size={15} />
      {activeCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[15px] h-[15px] px-[3px] rounded-[8px] text-white text-[9px] font-bold" style={{ backgroundColor: EMAIL_TABLE_NAVY }}>
          {activeCount}
        </span>
      )}
    </button>
  );
}

// Slide-in Filters panel — one accordion section per column, each with search/select-all/counts, staged
// behind Cancel/Save. Must be rendered inside a `relative overflow-hidden` wrapper so it can position itself
// absolutely over just the table body (not the whole page). Shares the page's committed `columnFilters` —
// this is the same data the per-column header funnel buttons read/write, so both stay in sync.
export function TableFilterPanel({
  open,
  onOpenChange,
  columns,
  columnFilters,
  getOptions,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: TableColumnDef[];
  columnFilters: Record<string, Set<string>>;
  getOptions: (key: string) => [string, number][];
  onApply: (next: Record<string, Set<string>>) => void;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(columns[0]?.key ?? null);
  const [pending, setPending] = useState<Record<string, Set<string>>>({});
  const [sectionSearch, setSectionSearch] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setPending(Object.fromEntries(Object.entries(columnFilters).map(([k, v]) => [k, new Set(v)])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => { setPending(columnFilters); onOpenChange(false); };
  const togglePending = (key: string, value: string) => {
    setPending((prev) => {
      const next = { ...prev };
      const set = new Set(next[key] ?? []);
      if (set.has(value)) set.delete(value); else set.add(value);
      next[key] = set;
      return next;
    });
  };
  const save = () => { onApply(pending); onOpenChange(false); toast.success("Filters applied"); };

  return (
    <div className={`absolute top-0 right-0 bottom-0 w-[320px] bg-white border-l border-[#E2E6E9] z-40 flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}>
      <div className="h-[48px] shrink-0 border-b border-[#E2E6E9] flex items-center px-4">
        <p className="flex-1 text-[14px] font-bold text-[#262626]">Filters</p>
        <button onClick={close} className="text-[#666666] hover:text-[#262626] cursor-pointer transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {columns.map((col) => {
          const isOpen = expandedSection === col.key;
          const selected = pending[col.key];
          const selCount = selected?.size ?? 0;
          const opts = getOptions(col.key);
          const q = (sectionSearch[col.key] ?? "").toLowerCase();
          const visOpts = q ? opts.filter(([k]) => k.toLowerCase().includes(q)) : opts;
          const hasSelections = selCount > 0;
          const allKeys = opts.map(([k]) => k);
          const allSelected = allKeys.length > 0 && allKeys.every((k) => selected?.has(k));
          return (
            <div key={col.key}>
              <button
                onClick={() => setExpandedSection(isOpen ? null : col.key)}
                className={`w-full h-[44px] flex items-center px-4 border-b border-[#E2E6E9] cursor-pointer transition-colors ${hasSelections ? "bg-[#30578D]/[0.06]" : "bg-white hover:bg-[#F7F7F7]"}`}
              >
                <span className="flex-1 text-left text-[13px] truncate">
                  {hasSelections ? (
                    <>
                      <span style={{ color: EMAIL_TABLE_NAVY, fontWeight: 600 }}>{col.label} ({selCount}</span>
                      <span className="text-[#97999B]">/{opts.length})</span>
                    </>
                  ) : (
                    <>
                      <span style={isOpen ? { color: EMAIL_TABLE_NAVY, fontWeight: 600 } : { color: "#262626" }}>{col.label}</span>
                      <span className="text-[#97999B]"> ({opts.length})</span>
                    </>
                  )}
                </span>
                <ChevronDown size={14} className="shrink-0 transition-transform duration-200" style={{ color: hasSelections || isOpen ? EMAIL_TABLE_NAVY : "#97999B", transform: isOpen ? "rotate(180deg)" : undefined }} />
              </button>
              {isOpen && (
                <div className="border-b border-[#E2E6E9]">
                  {selCount > 0 && (
                    <div className="flex items-center justify-between px-4 py-2 border-b border-[#E2E6E9]">
                      <span className="flex items-center gap-1.5 bg-[#F1F2F4] px-2 py-1 rounded-[8px] text-[10.5px] font-medium text-[#666666]">
                        {selCount} Selected
                        <button onClick={() => setPending((p) => ({ ...p, [col.key]: new Set() }))} className="cursor-pointer hover:text-[#262626] transition-colors">
                          <X size={11} />
                        </button>
                      </span>
                      {opts.length - selCount > 0 && <span className="text-[10.5px]" style={{ color: EMAIL_TABLE_NAVY }}>{opts.length - selCount} More</span>}
                    </div>
                  )}
                  {opts.length > 3 && (
                    <div className="px-4 py-2.5 border-b border-[#E2E6E9]">
                      <input
                        value={sectionSearch[col.key] ?? ""}
                        onChange={(e) => setSectionSearch((p) => ({ ...p, [col.key]: e.target.value }))}
                        placeholder={`Search ${col.label.toLowerCase()}...`}
                        className="w-full h-[32px] px-3 rounded-[8px] border border-[#E2E6E9] text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => setPending((p) => ({ ...p, [col.key]: allSelected ? new Set() : new Set(allKeys) }))}
                    className="w-full flex items-center gap-2.5 text-left px-4 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors border-b border-[#E2E6E9]"
                  >
                    <span
                      className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${allSelected ? "border-transparent" : "border-[#D9D9D6]"}`}
                      style={allSelected ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                    >
                      {allSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                    </span>
                    <span className="font-semibold text-[#262626]">Select All</span>
                  </button>
                  {visOpts.map(([optVal, count]) => {
                    const checked = selected?.has(optVal) ?? false;
                    return (
                      <button
                        key={optVal}
                        onClick={() => togglePending(col.key, optVal)}
                        className={`w-full flex items-center justify-between gap-2 text-left px-4 py-2 text-[12.5px] transition-colors ${checked ? "bg-[#30578D]/[0.06]" : "hover:bg-[#F7F7F7]"}`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${checked ? "border-transparent" : "border-[#D9D9D6]"}`}
                            style={checked ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                          >
                            {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                          </span>
                          <span className={`truncate ${checked ? "text-[#262626] font-medium" : "text-[#4D4D4D]"}`}>{optVal}</span>
                        </span>
                        <span className="shrink-0 bg-[#F1F2F4] px-1.5 h-[18px] flex items-center rounded-[8px] text-[10.5px] text-[#666666]">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="shrink-0 border-t border-[#E2E6E9] flex justify-end gap-2 px-4 py-3">
        <button
          onClick={close}
          className="px-3.5 py-1.5 rounded-[8px] border text-[12.5px] font-medium cursor-pointer transition-colors"
          style={{ borderColor: EMAIL_TABLE_NAVY, color: EMAIL_TABLE_NAVY }}
        >
          Cancel
        </button>
        <button
          onClick={save}
          className="px-3.5 py-1.5 rounded-[8px] text-white text-[12.5px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
          style={{ backgroundColor: EMAIL_TABLE_NAVY }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
