import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";

// "Justify" glyph: a ">" prompt beside two short lines, with two full lines under it — a written statement.
// Drawn with square line ends and mitred corners (small corner radius) rather than lucide's fully rounded
// strokes. Same props as a lucide icon (size / className / style) so it drops in where one is used.
function JustifyIconImpl({ size = 16, className, style, strokeWidth = 2 }: { size?: number | string; className?: string; style?: CSSProperties; strokeWidth?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d="M4.5 5.6 8.6 8.1 4.5 10.6" />
      <path d="M11 6.1h8.5" />
      <path d="M11 10.1h8.5" />
      <path d="M4.5 14.3h15" />
      <path d="M4.5 18.5h15" />
    </svg>
  );
}

export const JustifyIcon = JustifyIconImpl as unknown as LucideIcon;
