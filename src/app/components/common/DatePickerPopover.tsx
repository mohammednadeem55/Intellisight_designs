import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";

// Calendar popover for every date field in the app — react-day-picker was already a dependency (unused
// until now), so this wraps it once with the app's own navy/grey styling (via `classNames`, not RDP's
// default stylesheet) instead of each date field hand-rolling a native `<input type="date">` +
// `showPicker()` button, which is how every one of these looked before.
//
// The navy hex below is hardcoded rather than referencing EMAIL_TABLE_NAVY — Tailwind's class scanner
// only picks up arbitrary-value classes it can see as literal strings in source, so an interpolated
// `bg-[${EMAIL_TABLE_NAVY}]` would silently never generate any CSS.
const CALENDAR_CLASS_NAMES = {
  months: "flex flex-col",
  month: "space-y-2",
  caption: "flex items-center justify-between px-1 pt-1 pb-2 relative",
  caption_label: "text-[13px] font-semibold text-[#262626]",
  nav: "flex items-center gap-1",
  nav_button: "size-[26px] rounded-[6px] flex items-center justify-center text-[#666666] hover:bg-[#F7F7F7] transition-colors cursor-pointer",
  nav_button_previous: "",
  nav_button_next: "",
  table: "border-collapse",
  head_row: "flex",
  head_cell: "text-[10.5px] font-semibold text-[#97999B] uppercase w-[32px] h-[26px] flex items-center justify-center",
  row: "flex",
  cell: "p-0",
  day: "size-[32px] rounded-[6px] text-[12.5px] text-[#262626] hover:bg-[#F7F7F7] transition-colors flex items-center justify-center cursor-pointer",
  day_selected: "!bg-[#30578D] !text-white font-semibold hover:!bg-[#30578D]",
  day_today: "font-bold text-[#30578D]",
  day_outside: "text-[#D9D9D6]",
  day_disabled: "text-[#D9D9D6] cursor-not-allowed hover:bg-transparent",
};

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function DatePickerPopover({
  open,
  anchorRef,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (iso: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null);

  // Positioned once per open (from the anchor button passed in by the caller), same fixed/portal pattern
  // used for every other floating panel in the app so it can't be clipped by a scrollable ancestor.
  useEffect(() => {
    if (!open) { setRect(null); return; }
    const r = anchorRef.current?.getBoundingClientRect();
    if (r) setRect({ top: r.bottom + 4, left: r.left });
  }, [open, anchorRef]);

  // Closes on an outside click, or on scroll/resize — excluding scrolling *inside* the calendar itself
  // (e.g. a future month-scroll gesture) via the same containment check used by the app's other
  // scroll-aware dropdowns.
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const target = e.target;
      if (target instanceof Node && (panelRef.current?.contains(target) || anchorRef.current?.contains(target))) return;
      onOpenChange(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, anchorRef, onOpenChange]);

  if (!open || !rect) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg p-3"
      style={{ top: rect.top, left: rect.left }}
    >
      <DayPicker
        mode="single"
        selected={parseIsoDate(value)}
        defaultMonth={parseIsoDate(value)}
        onSelect={(d) => { if (d) { onChange(toIsoDate(d)); onOpenChange(false); } }}
        classNames={CALENDAR_CLASS_NAMES}
      />
    </div>,
    document.body
  );
}
