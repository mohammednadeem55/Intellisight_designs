import type { ButtonHTMLAttributes, ReactNode } from "react";

// Shared button — every one-off `<button className="...">` in the app collapses into one of these
// variant/size combinations. Add a new variant here rather than hand-rolling classes at the call site.
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // The app's one brand CTA color — Proceed, Submit, primary form actions.
  primary: "text-white hover:opacity-90 disabled:hover:opacity-100",
  // White + border — Back, Cancel, Save & Update; the default "there's also this option" action.
  secondary: "bg-white border border-[#d1d1d1] text-[#374151] hover:bg-[#f8fafc]",
  // White + tinted border/text — Copy, Use, View full summary; quieter than secondary, still a real button.
  outline: "bg-white border",
  // No border/background at all — inline text-link actions like "View more".
  ghost: "text-[#30578D] hover:underline",
  // Destructive/report actions.
  danger: "bg-white border border-[#111827]/20 text-[#111827] hover:bg-[#f8fafc]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-[11.5px] gap-1",
  md: "px-4 py-2 text-[13px] gap-1.5",
};

export function Button({
  variant = "secondary",
  size = "md",
  accent = "#E90029",
  icon: Icon,
  iconSize,
  disabled,
  className = "",
  children,
  ...props
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Accent color for `primary` (background) and `outline` (border/text). Defaults to the brand red. */
  accent?: string;
  icon?: (props: { size?: number; className?: string }) => ReactNode;
  iconSize?: number;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const style =
    variant === "primary"
      ? { backgroundColor: accent }
      : variant === "outline"
      ? { borderColor: `${accent}33`, color: accent }
      : undefined;

  return (
    <button
      {...props}
      disabled={disabled}
      style={{ ...style, ...props.style }}
      className={`inline-flex items-center justify-center rounded-[8px] font-semibold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        variant !== "ghost" ? SIZE_CLASSES[size] : "gap-1"
      } ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {Icon && <Icon size={iconSize ?? (size === "sm" ? 11 : 13)} />}
      {children}
    </button>
  );
}

// Small icon-only button — Download, close (X), kebab menus, etc. Same variant language as Button.
export function IconButton({
  variant = "secondary",
  className = "",
  children,
  ...props
}: {
  variant?: "secondary" | "ghost";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex items-center justify-center rounded-[8px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        variant === "secondary"
          ? "size-[38px] border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f8fafc] hover:text-[#111827]"
          : "text-[#9ca3af] hover:text-[#111827]"
      } ${className}`}
    >
      {children}
    </button>
  );
}
