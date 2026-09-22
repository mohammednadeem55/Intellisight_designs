import { useState } from "react";
import { Check, Search, X } from "lucide-react";
import { EMAIL_TABLE_NAVY } from "./EmailTable";

// Shared between the Cmd Center Adv. Filter listing table (quick-assign without opening the row) and its
// full-page editor (Basic Info/Conditions live there, mailboxes should too) — same checklist + search, one
// definition instead of two copies drifting.
export function MailboxPickerModal({
  title = "Add Mailboxes",
  subtitle,
  mailboxes,
  selected,
  onSave,
  onClose,
}: {
  title?: string;
  subtitle?: string;
  mailboxes: string[];
  selected: string[];
  onSave: (next: string[]) => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState<string[]>(selected);
  const [searchQuery, setSearchQuery] = useState("");

  const toggle = (mailbox: string) =>
    setPending((prev) => (prev.includes(mailbox) ? prev.filter((m) => m !== mailbox) : [...prev, mailbox]));

  const q = searchQuery.trim().toLowerCase();
  const visibleMailboxes = q ? mailboxes.filter((m) => m.toLowerCase().includes(q)) : mailboxes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
          <div>
            <span className="text-[16px] font-bold text-[#262626]">{title}</span>
            <p className="text-[12px] text-[#97999B] mt-0.5">
              {subtitle ? `${subtitle} · ` : ""}
              {pending.length} selected
            </p>
          </div>
          <button onClick={onClose} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pt-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97999B]" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mailboxes..."
              className="w-full h-[36px] pl-9 pr-3 rounded-[6px] border border-[#e5e7eb] bg-white text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
            />
          </div>
        </div>
        <div className="px-6 py-4 flex flex-col gap-1 max-h-[320px] overflow-y-auto">
          {visibleMailboxes.length === 0 ? (
            <p className="px-2.5 py-2 text-[13px] text-[#97999B]">No mailboxes match "{searchQuery}".</p>
          ) : (
            visibleMailboxes.map((mailbox) => {
              const checked = pending.includes(mailbox);
              return (
                <button
                  key={mailbox}
                  onClick={() => toggle(mailbox)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] hover:bg-[#F7F7F7] cursor-pointer transition-colors text-left"
                >
                  <span
                    className={`flex items-center justify-center size-[16px] rounded-[5px] border shrink-0 transition-colors ${checked ? "border-transparent" : "border-[#D9D9D6]"}`}
                    style={checked ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
                  >
                    {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-[13px] text-[#262626]">{mailbox}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(pending)}
            className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: EMAIL_TABLE_NAVY }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
