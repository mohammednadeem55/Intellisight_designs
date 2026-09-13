import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  /** Omit for a segment with no destination of its own (e.g. a nav-dropdown category with no landing page) — renders as plain, non-interactive text. */
  onClick?: () => void;
};

// Full trail including the current page as the last, non-interactive segment — kept at the same small,
// muted weight as the rest (just a shade darker) rather than bold/dark, so it reads as a quiet "you are
// here" meta line instead of a second title competing with the page's real H1 right below it.
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 flex-wrap mb-1.5">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {item.onClick && !isLast ? (
              <button onClick={item.onClick} className="text-[11px] text-[#97999B] hover:text-[#30578D] hover:underline cursor-pointer transition-colors">
                {item.label}
              </button>
            ) : (
              <span className={`text-[11px] ${isLast ? "text-[#666666]" : "text-[#97999B]"}`}>{item.label}</span>
            )}
            {!isLast && <ChevronRight size={10} className="text-[#D9D9D6] shrink-0" />}
          </span>
        );
      })}
    </nav>
  );
}
