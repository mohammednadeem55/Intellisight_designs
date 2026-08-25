import { Rows2, Rows3, Rows4 } from "lucide-react";
import { EMAIL_TABLE_NAVY, EmailTableTooltip } from "./EmailTable";

export type RowDensity = "small" | "medium" | "large";

// Bottom-of-table footer: "Displaying X of Y" always sits at the bottom-left, followed by Density and
// Rows-per-page controls, with page navigation on the right. Shared so every table's pagination looks and
// behaves identically instead of being re-typed per page.
export function TablePagination({
  showing,
  total,
  density,
  onDensityChange,
  rowsPerPage,
  rowsPerPageOptions = [10, 20, 30],
  onRowsPerPageChange,
  page,
  totalPages,
  onPageChange,
  densityTooltips,
}: {
  showing: number;
  total: number;
  density: RowDensity;
  onDensityChange: (d: RowDensity) => void;
  rowsPerPage: number;
  rowsPerPageOptions?: number[];
  onRowsPerPageChange: (n: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  densityTooltips?: Record<RowDensity, string>;
}) {
  const paginationPages = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#DEDEDE] shrink-0 flex-wrap">
      <div className="flex items-center gap-3">
        <p className="text-[12px] text-[#666666] whitespace-nowrap">
          Displaying {showing} of {total}
        </p>
        <div className="w-px h-5 bg-[#E2E6E9]" />
        <p className="text-[12px] text-[#666666] whitespace-nowrap">Density:</p>
        <div className="flex items-center gap-[3px] p-[3px] bg-[#F1F2F4] rounded-[8px] h-[30px]">
          {(
            [
              { key: "small", Icon: Rows4 },
              { key: "medium", Icon: Rows3 },
              { key: "large", Icon: Rows2 },
            ] as const
          ).map((opt) => {
            const button = (
              <button
                onClick={() => onDensityChange(opt.key)}
                className={`flex items-center justify-center w-[30px] h-[24px] rounded-[6px] outline-none transition-all cursor-pointer ${
                  density === opt.key ? "bg-white shadow-sm" : "text-[#8A8D93] hover:bg-white/70 hover:text-[#4D4D4D]"
                }`}
                style={density === opt.key ? { color: EMAIL_TABLE_NAVY } : undefined}
              >
                <opt.Icon size={14} strokeWidth={2.2} />
              </button>
            );
            return densityTooltips ? (
              <EmailTableTooltip key={opt.key} label={densityTooltips[opt.key]}>
                {button}
              </EmailTableTooltip>
            ) : (
              <span key={opt.key}>{button}</span>
            );
          })}
        </div>
        <div className="w-px h-5 bg-[#E2E6E9]" />
        <div className="flex items-center gap-2">
          <p className="text-[12px] text-[#666666] whitespace-nowrap">Rows:</p>
          <div className="flex items-center gap-[3px] p-[3px] bg-[#F1F2F4] rounded-[8px] h-[30px]">
            {rowsPerPageOptions.map((n) => (
              <button
                key={n}
                onClick={() => onRowsPerPageChange(n)}
                className={`flex items-center justify-center px-2.5 h-full rounded-[6px] text-[12px] outline-none transition-all cursor-pointer ${
                  rowsPerPage === n ? "bg-white shadow-sm font-semibold" : "text-[#8A8D93] hover:bg-white/70 hover:text-[#4D4D4D]"
                }`}
                style={rowsPerPage === n ? { color: EMAIL_TABLE_NAVY } : undefined}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-[4px]">
        <button onClick={() => onPageChange(1)} disabled={page === 1}
          className="h-[30px] px-2 rounded-[8px] border border-[#E2E6E9] text-[12px] text-[#666666] disabled:opacity-30 hover:enabled:bg-[#F7F7F7] cursor-pointer transition-colors">«</button>
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
          className="h-[30px] px-2 rounded-[8px] border border-[#E2E6E9] text-[12px] text-[#666666] disabled:opacity-30 hover:enabled:bg-[#F7F7F7] cursor-pointer transition-colors">‹</button>
        {paginationPages().map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="h-[30px] px-2 flex items-center text-[12px] text-[#97999B]">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p as number)}
              className="h-[30px] min-w-[30px] px-2 rounded-[8px] border text-[12px] cursor-pointer transition-colors"
              style={page === p ? { backgroundColor: EMAIL_TABLE_NAVY, borderColor: EMAIL_TABLE_NAVY, color: "white", fontWeight: 600 } : { borderColor: "#E2E6E9", color: "#666666" }}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="h-[30px] px-2 rounded-[8px] border border-[#E2E6E9] text-[12px] text-[#666666] disabled:opacity-30 hover:enabled:bg-[#F7F7F7] cursor-pointer transition-colors">›</button>
        <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages}
          className="h-[30px] px-2 rounded-[8px] border border-[#E2E6E9] text-[12px] text-[#666666] disabled:opacity-30 hover:enabled:bg-[#F7F7F7] cursor-pointer transition-colors">»</button>
      </div>
    </div>
  );
}
