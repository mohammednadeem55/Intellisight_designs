import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { EMAIL_TABLE_NAVY } from "./EmailTable";

// Shared by the Feedback Center review and the Order Acceptance Validation feedback modal, so "what did the
// AI get wrong?" offers the same reasons in both places and feeds the same kind of feedback.
// Custom single-select for "What did the AI get wrong?" — styled like the rest of the app's dropdowns
// (trigger + portaled floating list) instead of a native <select>, which can't carry the required-field red
// border or the app's selected-row check glyph consistently across browsers.
export function ReasonSelect({ value, onChange, options, invalid, placeholder = "Select a reason…" }: { value: string; onChange: (v: string) => void; options: readonly string[]; invalid: boolean; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const openPanel = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="mt-1.5 w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[8px] border bg-white text-[12.5px] outline-none cursor-pointer transition-colors"
        style={{ borderColor: open ? "#30578D" : invalid ? "#BA1C1C" : "#E2E6E9" }}
      >
        <span className={`truncate text-left ${value ? "text-[#262626]" : "text-[#97999B]"}`}>{value || placeholder}</span>
        <ChevronDown size={14} className={`shrink-0 text-[#9ca3af] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && pos && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[100] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg py-1.5 overflow-y-auto"
          style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: 260 }}
        >
          {options.map((o) => {
            const selected = o === value;
            return (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2.5 text-left px-3.5 py-2 text-[12.5px] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
              >
                <span className={`truncate ${selected ? "font-semibold" : "text-[#4D4D4D]"}`} style={selected ? { color: EMAIL_TABLE_NAVY } : undefined}>
                  {o}
                </span>
                {selected && <Check size={13} className="shrink-0" style={{ color: EMAIL_TABLE_NAVY }} />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

export const OTHER_REASON = "Other — I'll write my own";
export const WRONG_REASON_OPTIONS = [
  "Data is right, verdict is wrong",
  "Supporting document was not considered",
  "Outdated or superseded information",
  "Wrong PO data",
  "Wrong Quote data",
  OTHER_REASON,
];

