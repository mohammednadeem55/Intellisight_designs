import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import { Check, ChevronDown, CircleAlert, Info, RotateCcw, User } from "lucide-react";

// Shared input field — replaces every hand-rolled "bordered box with a label and maybe a status pill"
// across the app (the CCC Creation extraction review, Classify Intent's overridden fields, etc.) with one
// component driven by a state machine instead of each call site re-deriving its own border/bg colors.
export type TextFieldVariant =
  | "default"
  | "matched" // confirmed/correct value — green, checkmark, still editable
  | "missing" // required but empty — red border, invites input or an AI suggestion
  | "suggested" // has an AI suggestion available but not yet applied — navy accent
  | "needsReview" // two competing values (e.g. extracted vs. system-of-record) — amber
  | "notEditable" // read-only display, not a real form field — flat grey, no border emphasis
  | "disabled"; // temporarily unavailable — muted, non-interactive

export type FieldMessageType = "error" | "info" | "success";

const VARIANT_STYLES: Record<TextFieldVariant, { border: string; bg: string }> = {
  default: { border: "border-[#e5e7eb] focus-within:border-[#30578D]", bg: "bg-white" },
  matched: { border: "border-[#468657]", bg: "bg-[#EFF6F1]" },
  missing: { border: "border-[#BA1C1C]", bg: "bg-white" },
  suggested: { border: "border-[#30578D]/40", bg: "bg-[#EAF1FB]" },
  needsReview: { border: "border-[#E67919]", bg: "bg-[#FDF3E7]" },
  notEditable: { border: "border-transparent", bg: "bg-[#f3f4f6]" },
  disabled: { border: "border-[#e5e7eb]", bg: "bg-[#f7f8fa]" },
};

const BADGE_LABEL: Partial<Record<TextFieldVariant, { text: string; fg: string; bg: string }>> = {
  missing: { text: "Missing", fg: "#BA1C1C", bg: "#FDECEA" },
  needsReview: { text: "Needs Review", fg: "#92600B", bg: "#FDF3E7" },
  suggested: { text: "Suggested", fg: "#30578D", bg: "#EAF1FB" },
};

const MESSAGE_STYLE: Record<FieldMessageType, { icon: typeof CircleAlert; color: string }> = {
  error: { icon: CircleAlert, color: "#BA1C1C" },
  info: { icon: Info, color: "#6b7280" },
  success: { icon: Check, color: "#468657" },
};

// Dropdown of AI-suggested values for a missing field — pick one, then Apply commits it. Kept separate
// from TextField's own open/close state since it has its own "currently highlighted option" state.
function SuggestionPicker({ suggestions, onApply }: { suggestions: string[]; onApply: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(suggestions[0]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded-[8px] bg-white/70 text-[11.5px] font-medium text-[#374151] cursor-pointer"
        >
          {selected}
          <ChevronDown size={11} className={`text-[#9ca3af] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-20 py-1 min-w-[140px] max-h-[180px] overflow-y-auto">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => { setSelected(s); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-[12px] text-[#374151] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => onApply(selected)} className="text-[11.5px] font-semibold text-[#30578D] hover:underline cursor-pointer shrink-0">
        Apply
      </button>
    </div>
  );
}

export function TextField({
  label,
  required,
  variant = "default",
  value,
  onChange,
  message,
  suggestions,
  onApplySuggestion,
  revertible,
  onRevert,
  manuallyFilled,
  className = "",
  ...inputProps
}: {
  label?: string;
  /** Marks the label with a red asterisk — purely visual, doesn't affect validation. */
  required?: boolean;
  variant?: TextFieldVariant;
  value: string;
  onChange?: (value: string) => void;
  message?: { type: FieldMessageType; text: string };
  /** Missing-variant only. Omit or pass an empty array to show "No suggestions available". */
  suggestions?: string[];
  onApplySuggestion?: (value: string) => void;
  /** Shows a revert-to-previous-state icon next to a matched field's checkmark. */
  revertible?: boolean;
  onRevert?: () => void;
  /** Marks the label with a "Manually Filled" pill — this value was typed/edited/chosen by a person rather than arriving pre-populated from extraction. */
  manuallyFilled?: boolean;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "value" | "onChange">) {
  const style = VARIANT_STYLES[variant];
  const badge = BADGE_LABEL[variant];
  const readOnly = variant === "notEditable" || inputProps.readOnly;
  const disabled = variant === "disabled" || inputProps.disabled;
  const showSuggestionRow = variant === "missing" && !!suggestions?.length;

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide">
            {label}
            {required && <span className="text-[#BA1C1C]"> *</span>}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {manuallyFilled && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[1px]" style={{ color: "#30578D", backgroundColor: "#EAF1FB" }}>
                <User size={9} /> Manually Filled
              </span>
            )}
            {badge && (
              <span className="text-[10px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[1px]" style={{ color: badge.fg, backgroundColor: badge.bg }}>
                {badge.text}
              </span>
            )}
          </div>
        </div>
      )}

      <div className={`rounded-[8px] border ${style.border} ${style.bg} ${disabled ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-2 px-3.5 h-[42px]">
          <input
            {...inputProps}
            value={value}
            onChange={e => onChange?.(e.target.value)}
            readOnly={readOnly}
            disabled={disabled}
            className={`flex-1 min-w-0 text-[13px] text-[#111827] placeholder:text-[#9ca3af] outline-none bg-transparent ${
              readOnly ? "cursor-default" : disabled ? "cursor-not-allowed" : ""
            }`}
          />
          {variant === "matched" && (
            <div className="flex items-center gap-2 shrink-0">
              {revertible && (
                <button onClick={onRevert} title="Revert" className="text-[#9ca3af] hover:text-[#111827] cursor-pointer transition-colors">
                  <RotateCcw size={13} />
                </button>
              )}
              <Check size={15} className="text-[#468657]" strokeWidth={3} />
            </div>
          )}
        </div>

        {showSuggestionRow && suggestions && (
          <div className="flex items-center gap-2 px-3.5 pb-2.5 pt-2 border-t border-black/5">
            <span className="text-[11px] text-[#9ca3af] shrink-0">AI Suggestion:</span>
            <SuggestionPicker suggestions={suggestions} onApply={v => onApplySuggestion?.(v)} />
          </div>
        )}
      </div>

      {message && (
        <p className="flex items-center gap-1.5 text-[11px] mt-1" style={{ color: MESSAGE_STYLE[message.type].color }}>
          {(() => {
            const Icon = MESSAGE_STYLE[message.type].icon;
            return <Icon size={12} className="shrink-0" />;
          })()}
          {message.text}
        </p>
      )}
    </div>
  );
}

// A "needs review" field carries two competing values (what was extracted vs. the trusted system value).
// When there's no system value to compare against, there's nothing to "review" — it just renders as a
// plain editable field seeded with the extracted value instead of the extracted-vs-system comparison UI.
export function ReviewField({
  label,
  extracted,
  systemLabel,
  systemValue,
  onUse,
  onExtractedChange,
  manuallyFilled,
}: {
  label: string;
  extracted: string;
  systemLabel: string;
  systemValue?: string;
  onUse: () => void;
  onExtractedChange?: (value: string) => void;
  /** The extracted value has been directly edited by a person, not just left as AI-extracted. */
  manuallyFilled?: boolean;
}) {
  if (!systemValue) {
    return <TextField label={label} variant="needsReview" value={extracted} onChange={onExtractedChange} manuallyFilled={manuallyFilled} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {manuallyFilled && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[1px]" style={{ color: "#30578D", backgroundColor: "#EAF1FB" }}>
              <User size={9} /> Manually Filled
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#92600B] bg-[#FDF3E7] px-1.5 py-[1px] rounded-[8px]">Needs Review</span>
        </div>
      </div>
      <div className="rounded-[8px] border border-[#E67919] bg-[#FDF3E7] px-3.5 py-2.5 flex flex-col gap-1.5">
        <p className="text-[12.5px] text-[#613305]">
          Extracted: <span className="font-semibold text-[#111827]">{extracted}</span>
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12.5px] text-[#613305] truncate">
            {systemLabel}: <span className="font-semibold text-[#30578D]">{systemValue}</span>
          </p>
          <button
            onClick={onUse}
            className="shrink-0 px-2.5 py-1 rounded-[8px] bg-white border border-[#E67919]/40 text-[11.5px] font-semibold text-[#92600B] hover:bg-[#FDF3E7] cursor-pointer transition-colors"
          >
            Use
          </button>
        </div>
      </div>
    </div>
  );
}
