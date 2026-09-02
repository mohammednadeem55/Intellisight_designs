import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, GripVertical, SlidersHorizontal, X } from "lucide-react";
import { EMAIL_TABLE_NAVY } from "./EmailTable";
import type { TableColumnDef } from "./TableFilterPanel";

// Icon button in the toolbar row that opens the Column Mgmt slide-in panel. Kept separate from the panel
// itself for the same reason as TableFilterTrigger/TableFilterPanel — different DOM location, shared
// controlled `open` state.
export function TableColumnMgmtTrigger({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <button
      onClick={() => onOpenChange(!open)}
      title="Manage columns"
      className={`relative flex items-center justify-center size-[36px] rounded-[8px] border transition-colors cursor-pointer ${open ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#666666] hover:bg-[#F7F7F7]"}`}
    >
      <SlidersHorizontal size={15} />
    </button>
  );
}

// Slide-in Column Mgmt panel — "Columns" (visibility checklist, minimum one stays visible) and
// "Sort Columns" (drag-reorder) tabs, staged behind Cancel/Save. `value` is the committed, ordered list of
// visible column keys; `onApply` commits a new one. Must be rendered inside a `relative overflow-hidden`
// wrapper so it can position itself absolutely over just the table body.
export function TableColumnMgmtPanel({
  open,
  onOpenChange,
  columns,
  value,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: TableColumnDef[];
  value: string[];
  onApply: (next: string[]) => void;
}) {
  const [activeTab, setActiveTab] = useState<"columns" | "sort">("columns");
  const [tempOrder, setTempOrder] = useState<string[]>(value);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (open) { setTempOrder([...value]); setActiveTab("columns"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => { setTempOrder([...value]); onOpenChange(false); };
  const toggleColumn = (key: string) => {
    setTempOrder((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };
  const save = () => { onApply([...tempOrder]); onOpenChange(false); toast.success("Column settings saved"); };

  return (
    <div className={`absolute top-0 right-0 bottom-0 w-[320px] bg-white border-l border-[#E2E6E9] z-40 flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}>
      <div className="h-[48px] shrink-0 border-b border-[#E2E6E9] flex items-center px-4">
        <p className="flex-1 text-[14px] font-bold text-[#262626]">Column Mgmt</p>
        <button onClick={close} className="text-[#666666] hover:text-[#262626] cursor-pointer transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="flex shrink-0 border-b border-[#E2E6E9]">
        {(["columns", "sort"] as const).map((tab) => {
          const labels = { columns: "Columns", sort: "Sort Columns" };
          const active = activeTab === tab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 flex flex-col items-center pt-2.5 cursor-pointer transition-colors">
              <span className="text-[12px] font-medium pb-2 whitespace-nowrap" style={{ color: active ? EMAIL_TABLE_NAVY : "#666666" }}>{labels[tab]}</span>
              <div className="h-[2px] w-full" style={{ backgroundColor: active ? EMAIL_TABLE_NAVY : "transparent" }} />
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "columns" && (
          <div>
            {columns.map((col) => {
              const checked = tempOrder.includes(col.key);
              return (
                <button
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 hover:bg-[#F7F7F7] cursor-pointer transition-colors border-b border-[#E2E6E9]"
                >
                  <span
                    className={`flex items-center justify-center size-[15px] rounded-[8px] border shrink-0 transition-colors ${checked ? "border-transparent" : "border-[#D9D9D6]"}`}
                    style={checked ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                  >
                    {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className={checked ? "text-[#262626] font-medium text-[13px]" : "text-[#4D4D4D] text-[13px]"}>{col.label}</span>
                </button>
              );
            })}
          </div>
        )}
        {activeTab === "sort" && (
          <div>
            <div className="px-4 py-2 border-b border-[#E2E6E9] bg-[#30578D]/[0.05]">
              <p className="text-[11px] text-[#666666]">Drag rows to reorder the columns in the table</p>
            </div>
            {tempOrder.map((key, idx) => {
              const label = columns.find((c) => c.key === key)?.label ?? key;
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                  onDrop={() => {
                    if (dragIdx === null || dragIdx === idx) return;
                    const next = [...tempOrder];
                    const [moved] = next.splice(dragIdx, 1);
                    next.splice(idx, 0, moved);
                    setTempOrder(next);
                    setDragIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 border-b border-[#E2E6E9] cursor-grab active:cursor-grabbing transition-colors ${dragOverIdx === idx && dragIdx !== idx ? "bg-[#30578D]/[0.06] border-t-2" : "hover:bg-[#F7F7F7]"}`}
                  style={dragOverIdx === idx && dragIdx !== idx ? { borderTopColor: EMAIL_TABLE_NAVY } : undefined}
                >
                  <GripVertical size={14} className="text-[#D9D9D6] shrink-0" />
                  <span className="flex-1 text-[13px] text-[#262626]">{label}</span>
                  <span className="text-[11px] text-[#97999B]">{idx + 1}</span>
                </div>
              );
            })}
          </div>
        )}
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
