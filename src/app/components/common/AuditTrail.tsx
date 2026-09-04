import { useState } from "react";
import { ArrowRightLeft, Check, CircleAlert, MessageSquare, Pencil, Search, X, type LucideIcon } from "lucide-react";
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

// Module-level store (not React state) so entries survive navigating away from whatever component wrote
// them — e.g. a workflow step's audit entries need to still be there when the listing table's "Overall
// Audit" button reads them later, well after that WorkflowPage instance has unmounted. Client-only/in-memory
// for now: it resets on reload, same as every other piece of mock state in this app. Scope keys are plain
// strings; workflow stages use "emailId:stageKey" so getAllEntriesForEmail can flatten across stages.
const auditStore: Record<string, AuditEntry[]> = {};

// Illustrative history for a few real listing rows so "Overall Audit" has something to show before anyone
// has actually stepped through those emails' workflows in this session.
function mockEntry(user: string, initials: string, action: string, icon: LucideIcon, hoursAgo: number, detail?: string): AuditEntry {
  return { id: `mock-${user}-${action}-${hoursAgo}`, user, initials, action, icon, detail, at: new Date(Date.now() - hoursAgo * 60 * 60 * 1000) };
}
// Field changes are their own flavor of entry — action names the field, detail is "old → new" — so they
// read the same way as Order Details' Audit History ("changed the field X from A to B") but fit this
// component's existing action/detail shape instead of needing a separate entry type.
function mockFieldChange(user: string, initials: string, field: string, from: string, to: string, hoursAgo: number): AuditEntry {
  return mockEntry(user, initials, `Changed ${field}`, ArrowRightLeft, hoursAgo, `${from} → ${to}`);
}

auditStore["EML-10234:classify"] = [mockEntry("Priya Shah", "PS", "Reclassified", Pencil, 30, "Finance → Finance / Invoice Approval")];
auditStore["EML-10234:ccc"] = [
  mockEntry("Wasim Shaikh", "WS", "CCC Created", Check, 27),
  mockEntry("Pranjal Bailung", "PB", "CCC Creation — On Hold", CircleAlert, 22, "Awaiting vendor W-9 before the CCC can be finalized"),
];
auditStore["EML-10234:validation"] = [
  mockEntry("Khaja Mohideen", "KM", "Commented", MessageSquare, 6, "PO total doesn't match the invoice line items — flagging for finance review"),
  mockFieldChange("Khaja Mohideen", "KM", "Invoice Amount", "$12,400", "$11,980", 5),
];
auditStore["EML-10234:order"] = [
  mockEntry("Priya Shah", "PS", "Order Created", Check, 4),
  mockFieldChange("Priya Shah", "PS", "Approval Status", "Pending", "Approved", 3),
];
auditStore["EML-10234:soa"] = [mockEntry("Priya Shah", "PS", "Email Sent", Check, 2)];

auditStore["EML-10235:classify"] = [mockEntry("Winstina D'Souza", "WD", "Reclassified", Pencil, 48, "General → Legal / Contract Renewal")];
auditStore["EML-10235:ccc"] = [mockEntry("Brenden Kirby", "BK", "CCC Created", Check, 44)];
auditStore["EML-10235:validation"] = [mockEntry("Brenden Kirby", "BK", "Commented", MessageSquare, 30, "Waiting on legal sign-off before the quote can be finalized")];
auditStore["EML-10235:order"] = [
  mockEntry("Jouni Lantto", "JL", "Quote Updated", Pencil, 20, "Order invalidated — Create Order required again"),
  mockFieldChange("Jouni Lantto", "JL", "Payment Terms", "Net 30", "Net 45", 19),
  mockEntry("Jouni Lantto", "JL", "Order Created", Check, 18),
];
auditStore["EML-10235:soa"] = [mockEntry("Jouni Lantto", "JL", "Email Sent", Check, 16)];

auditStore["EML-10236:classify"] = [mockFieldChange("Sari Pellinen", "SP", "Priority", "Medium", "High", 36)];
auditStore["EML-10236:ccc"] = [mockEntry("Sari Pellinen", "SP", "CCC Created", Check, 33)];

auditStore["EML-10238:classify"] = [mockEntry("Khaja Mohideen", "KM", "Commented", MessageSquare, 16, "Login came from an unrecognized device — escalating to IT Security")];
auditStore["EML-10238:validation"] = [mockFieldChange("Khaja Mohideen", "KM", "Risk Level", "Low", "Critical", 15)];

auditStore["EML-10240:order"] = [mockFieldChange("Priya Shah", "PS", "Order Value", "$14,850", "$15,320", 10)];
auditStore["EML-10240:soa"] = [mockEntry("Priya Shah", "PS", "Email Sent", Check, 8)];

auditStore["EML-10242:ccc"] = [mockEntry("Wasim Shaikh", "WS", "CCC Created", Check, 60)];
auditStore["EML-10242:order"] = [mockFieldChange("Wasim Shaikh", "WS", "Vendor Status", "Pending", "Approved", 40)];

auditStore["EML-10243:classify"] = [mockEntry("Sari Pellinen", "SP", "Commented", MessageSquare, 14, "Customer already escalated once via phone — prioritize response")];
auditStore["EML-10243:soa"] = [mockEntry("Sari Pellinen", "SP", "Email Sent", Check, 3)];

auditStore["EML-10246:classify"] = [mockFieldChange("Winstina D'Souza", "WD", "Dispute Amount", "$1,240", "$980", 26)];
auditStore["EML-10246:validation"] = [mockEntry("Winstina D'Souza", "WD", "Commented", MessageSquare, 24, "Discrepancy traced to a duplicate line item on the vendor's invoice")];

// Per-scope audit log — entries are grouped by an arbitrary `scopeKey` (e.g. one workflow step's key) so
// several independent logs can be tracked without bleeding into each other. Backed by the shared module-level
// store above; the hook just forces a re-render on write so components stay in sync with their own reads.
export function useAuditLog() {
  const [, forceRender] = useState(0);
  const addEntry = (scopeKey: string, entry: Omit<AuditEntry, "id" | "at">) => {
    auditStore[scopeKey] = [...(auditStore[scopeKey] ?? []), { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, at: new Date() }];
    forceRender((n) => n + 1);
  };
  const getEntries = (scopeKey: string) => auditStore[scopeKey] ?? [];
  return { addEntry, getEntries };
}

// Flattens every workflow stage's entries for one email (scope keys "${emailId}:${stageKey}") — used by the
// listing table's "Overall Audit" button, which has no live workflow session of its own to read from.
export function getAllAuditEntriesForEmail(emailId: string): AuditEntry[] {
  const prefix = `${emailId}:`;
  return Object.entries(auditStore)
    .filter(([key]) => key.startsWith(prefix))
    .flatMap(([, entries]) => entries);
}

const AUDIT_PAGE_SIZE = 4;

// Same visual pattern as EmailTable's Review History modal — centered, title + subtitle, X close, a
// reverse-chronological list of avatar/name/action/detail/timestamp rows. Search filters by user/action/
// detail text; the list only renders a page at a time (View More reveals the rest) so a long history stays
// scannable instead of dumping every entry into one unbounded scroll. Shared by every place that shows an
// audit trail — the listing table's "Overall Audit" button and WorkflowPage's per-stage trail both render
// this same component, so improvements here apply everywhere at once.
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
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(AUDIT_PAGE_SIZE);

  const sorted = [...entries].sort((a, b) => b.at.getTime() - a.at.getTime());
  const q = query.trim().toLowerCase();
  const filtered = q
    ? sorted.filter((e) => e.user.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || (e.detail ?? "").toLowerCase().includes(q))
    : sorted;
  const visible = filtered.slice(0, visibleCount);

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

        {sorted.length > AUDIT_PAGE_SIZE && (
          <div className="px-6 pt-3 shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setVisibleCount(AUDIT_PAGE_SIZE); }}
                placeholder="Search audit trail"
                className="w-full h-[34px] pl-8 pr-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
              />
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <p className="text-[13px] text-[#97999B] text-center py-6">{q ? `No entries match "${query}"` : "No history yet"}</p>
          ) : (
            <>
              {visible.map((entry) => (
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
              ))}
              {filtered.length > visible.length && (
                <button
                  onClick={() => setVisibleCount((n) => n + AUDIT_PAGE_SIZE)}
                  className="self-center text-[12.5px] font-semibold cursor-pointer hover:underline"
                  style={{ color: EMAIL_TABLE_NAVY }}
                >
                  View more ({filtered.length - visible.length} more)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
