import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

// Drag-to-resize column widths, shared by every table in the app.
//
// Tables start with their normal auto-sized columns. The first time someone drags a header edge, every
// column's current width is measured and the table switches to `table-layout: fixed` with those widths, so
// nothing else jumps — only the dragged column changes. Widths are remembered per table in localStorage
// (tied to which columns are visible, so toggling columns falls back to auto-sizing instead of applying
// stale widths). Double-clicking any handle resets the table to its natural widths.
//
// Usage in a table:
//   const rc = useResizableColumns("hold.orderListing", visibleKeys.join("|"));
//   <table className={`... ${rc.tableClass}`} style={rc.tableStyle}>
//     {rc.colgroup}
//     <thead><tr><th className="relative ...">Label <ColumnResizeHandle rc={rc} label="Label" /></th>...
// Sticky <th>s already count as positioned, so they don't need `relative`.

const MIN_COLUMN_WIDTH = 56;
const MAX_COLUMN_WIDTH = 900;

type Saved = { sig: string; widths: number[] };

export type ResizableColumns = ReturnType<typeof useResizableColumns>;

export function useResizableColumns(tableId: string, signature = "") {
  const storageKey = `intellisight.columnWidths.v2.${tableId}`;
  const [widths, setWidths] = useState<number[] | null>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const saved = JSON.parse(raw) as Saved;
      return saved.sig === signature && Array.isArray(saved.widths) ? saved.widths : null;
    } catch {
      return null;
    }
  });
  const [dragging, setDragging] = useState(false);

  // Different set of visible columns → old widths no longer line up with the columns; go back to auto.
  const sigRef = useRef(signature);
  useEffect(() => {
    if (sigRef.current === signature) return;
    sigRef.current = signature;
    setWidths(null);
  }, [signature]);

  useEffect(() => {
    try {
      if (widths) localStorage.setItem(storageKey, JSON.stringify({ sig: signature, widths } satisfies Saved));
      else localStorage.removeItem(storageKey);
    } catch {
      // storage unavailable (private mode etc.) — resizing still works for this session
    }
  }, [storageKey, signature, widths]);

  const beginResize = (e: ReactMouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const th = e.currentTarget.closest("th");
    const row = th?.parentElement;
    if (!th || !row) return;
    const headers = Array.from(row.children) as HTMLElement[];
    const index = headers.indexOf(th);
    if (index < 0) return;
    // Snapshot the live widths (not the saved ones) so the very first drag starts from what's on screen.
    const start = widths && widths.length === headers.length ? [...widths] : headers.map((h) => Math.round(h.getBoundingClientRect().width));
    const startX = e.clientX;
    const startWidth = start[index];
    setWidths(start);
    setDragging(true);

    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      const w = Math.round(Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, startWidth + ev.clientX - startX)));
      setWidths((prev) => {
        const next = [...(prev ?? start)];
        next[index] = w;
        return next;
      });
    };
    const onUp = () => {
      setDragging(false);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const reset = () => setWidths(null);

  const total = widths?.reduce((a, b) => a + b, 0) ?? 0;
  const tableStyle: CSSProperties | undefined = widths ? { tableLayout: "fixed", width: total, minWidth: total } : undefined;
  // Once widths are fixed, clip cell content so a long value can't spill into the next column.
  const tableClass = widths ? "[&_td]:overflow-hidden [&_td]:text-ellipsis [&_th]:overflow-hidden" : "";
  const colgroup: ReactNode = widths ? (
    <colgroup>
      {widths.map((w, i) => (
        <col key={i} style={{ width: w }} />
      ))}
    </colgroup>
  ) : null;

  return { beginResize, reset, dragging, isCustom: widths !== null, tableStyle, tableClass, colgroup };
}

export function ColumnResizeHandle({ rc, label }: { rc: ResizableColumns; label: string }) {
  const [active, setActive] = useState(false);
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label} column`}
      title="Drag to resize · double-click to reset all columns"
      onMouseDown={(e) => {
        setActive(true);
        const end = () => {
          setActive(false);
          document.removeEventListener("mouseup", end);
        };
        document.addEventListener("mouseup", end);
        rc.beginResize(e);
      }}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        rc.reset();
      }}
      className="absolute top-0 right-0 h-full w-[12px] z-10 flex items-center justify-end cursor-col-resize group/resize"
    >
      {/* Always-visible divider so the grab point is discoverable; thickens and turns navy on hover/drag.
          The hit area (12px wide, full header height) is much larger than the 1px line itself. */}
      <span
        className={`transition-all ${
          active
            ? "h-full w-[2px] bg-[#30578D]"
            : "h-[18px] w-px bg-[#C9CDD2] group-hover/resize:h-full group-hover/resize:w-[2px] group-hover/resize:bg-[#30578D]"
        }`}
      />
    </span>
  );
}
