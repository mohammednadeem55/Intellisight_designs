import { useState } from "react";
import { X, type LucideIcon } from "lucide-react";
import { EMAIL_TABLE_NAVY } from "./EmailTable";

export type AuditEntry = {
  id: string;
  user: string;
  initials: string;
  action: string; // e.g. "Commented", "Reclassified", "Assigned"
  icon?: LucideIcon;
  detail?: string; // optional diff/body text shown in the grey box below the action line
  at: Date;
};

function formatAuditDateTime(d: Date) {
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// Per-scope audit log — entries are grouped by an arbitrary `scopeKey` (e.g. one workflow step's key) so
// several independent logs can be tracked from a single hook instance without bleeding into each other.
// Client-only/in-memory for now: it resets on reload, same as every other piece of mock state in this app.
export function useAuditLog() {
  const [logs, setLogs] = useState<Record<string, AuditEntry[]>>({});
  const addEntry = (scopeKey: string, entry: Omit<AuditEntry, "id" | "at">) => {
    setLogs((prev) => ({
      ...prev,
      [scopeKey]: [...(prev[scopeKey] ?? []), { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, at: new Date() }],
    }));
  };
  const getEntries = (scopeKey: string) => logs[scopeKey] ?? [];
  return { addEntry, getEntries };
}

// Same visual pattern as EmailTable's Review History modal — centered, title + subtitle, X close, a
// reverse-chronological list of avatar/name/action/detail/timestamp rows.
export function AuditTrailModal({
  title = "Audit Trail",
  subtitle,
  entries,
  onClose,
}: {
  title?: string;
  subtitle?: string;
  entries: AuditEntry[];
  onClose: () => void;
}) {
  const sorted = [...entries].sort((a, b) => b.at.getTime() - a.at.getTime());
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE] shrink-0">
          <div>
            <h2 className="text-[16px] font-bold text-[#262626]">{title}</h2>
            {subtitle && <p className="text-[12px] text-[#97999B] mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3 overflow-y-auto">
          {sorted.length === 0 ? (
            <p className="text-[13px] text-[#97999B] text-center py-6">No history yet</p>
          ) : (
            sorted.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <span className="size-[30px] rounded-full bg-[#E2E6E9] flex items-center justify-center text-[10.5px] font-bold text-[#4D4D4D] shrink-0">
                  {entry.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-semibold text-[#262626]">{entry.user}</span>
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-medium" style={{ color: EMAIL_TABLE_NAVY }}>
                      {entry.icon && <entry.icon size={11} />}
                      {entry.action}
                    </span>
                  </div>
                  {entry.detail && (
                    <p className="text-[12.5px] text-[#4D4D4D] mt-1 bg-[#F7F7F7] rounded-[8px] px-3 py-2">{entry.detail}</p>
                  )}
                  <p className="text-[11px] text-[#97999B] mt-1">{formatAuditDateTime(entry.at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
