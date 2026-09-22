import { useState } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Mail, Pencil, Plus, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { Button } from "../../components/common/Button";
import { ConditionBuilder, createConditionGroup, isConditionTreeComplete, type ConditionGroup } from "../../components/common/ConditionBuilder";
import { MailboxPickerModal } from "../../components/common/MailboxPickerModal";
import { loadCmdCenterAdvFilters, saveCmdCenterAdvFilters } from "./cmdCenterAdvFilterStorage";
import { CMD_CENTER_FILTER_FIELDS, type CmdCenterAdvFilter } from "./CmdCenterAdvFilterPage";
import { MAILBOXES } from "./emailData";

// Full page instead of a modal — same shape as the Email Template Exception editor: Name + Priority +
// Conditions (which can itself nest into AND/OR groups). What a matching filter actually *does* beyond
// being defined is still to be scoped later — for now this only captures the rule itself.
export function CmdCenterAdvFilterEditorPage({
  onBack,
  onViewAllNotifications,
  onLogout,
  onNavigateHome,
  onNavigateNewOverview,
  onNavigateHoldManagementOverview,
  onNavigateOrderListing,
  onNavigateReleasedOrders,
  onNavigateCommunication,
  onNavigateEmailTemplate,
  onNavigateCmdCenterAdvFilter,
  onNavigateFeedbackCenter,
  onNavigateEmailWorkflow,
}: {
  onBack: () => void;
  onViewAllNotifications: () => void;
  onLogout?: () => void;
  onNavigateHome?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateCommunication?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateCmdCenterAdvFilter?: () => void;
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  // Editing an existing filter arrives here with its row data via router state (from the listing page's row
  // click / Edit button); creating a new one has no state, so every field starts blank — same convention as
  // the Email Template / Exception editors.
  const location = useLocation();
  const editing = location.state as CmdCenterAdvFilter | null;

  const [name, setName] = useState(editing?.name ?? "");
  const [editingName, setEditingName] = useState(false);
  const [priority, setPriority] = useState(editing?.priority ?? 0);
  const [conditions, setConditions] = useState<ConditionGroup>(editing?.conditions ?? createConditionGroup("AND"));
  const [mailboxes, setMailboxes] = useState<string[]>(editing?.mailboxes ?? []);
  const [mailboxPickerOpen, setMailboxPickerOpen] = useState(false);

  const displayName = name.trim() || "Untitled Filter";

  const handleSave = () => {
    if (!name.trim()) { toast.warning("Give this filter a name"); return; }
    if (!isConditionTreeComplete(conditions)) { toast.warning("Finish or remove any incomplete conditions"); return; }

    const filter: CmdCenterAdvFilter = {
      id: editing?.id ?? `${Date.now()}`,
      name: name.trim(),
      priority,
      conditions,
      mailboxes,
    };
    const existing = loadCmdCenterAdvFilters([]);
    const next = existing.some((f) => f.id === filter.id)
      ? existing.map((f) => (f.id === filter.id ? filter : f))
      : [...existing, filter];
    saveCmdCenterAdvFilters(next);
    toast.success(`Filter "${displayName}" saved`);
    onBack();
  };

  return (
    <div className="bg-[#f5f6fa] flex flex-col w-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="shrink-0 sticky top-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] z-50 bg-[#f5f6fa]">
          <AppHeader
            activeNav="Cmd Center Adv. Filter"
            onViewAllNotifications={onViewAllNotifications}
            onLogout={onLogout}
            onNavigateHome={onNavigateHome}
            onNavigateNewOverview={onNavigateNewOverview}
            onNavigateHoldManagementOverview={onNavigateHoldManagementOverview}
            onNavigateOrderListing={onNavigateOrderListing}
            onNavigateReleasedOrders={onNavigateReleasedOrders}
            onNavigateCommunication={onNavigateCommunication}
            onNavigateEmailTemplate={onNavigateEmailTemplate}
            onNavigateCmdCenterAdvFilter={onNavigateCmdCenterAdvFilter}
            onNavigateFeedbackCenter={onNavigateFeedbackCenter}
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
          />
        </div>

        <main className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 gap-4">
          <Breadcrumbs
            items={[
              { label: "Admin" },
              { label: "Cmd Center Adv. Filter", onClick: onBack },
              { label: editing ? displayName : "New Filter" },
            ]}
          />

          {/* Page header — back, inline-editable name (shows "Untitled Filter" until one is given) */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <button onClick={onBack} className="text-[#4b5563] hover:text-[#111827] cursor-pointer transition-colors shrink-0">
              <ArrowLeft size={20} />
            </button>
            {editingName ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false); }}
                placeholder="Untitled Filter"
                className="text-[18px] font-semibold text-[#262626] placeholder:text-[#9ca3af] bg-transparent outline-none border-b border-[#30578D] min-w-0 w-[280px]"
              />
            ) : (
              <button onClick={() => setEditingName(true)} className="group flex items-center gap-2 min-w-0 cursor-pointer">
                <h1 className="text-[18px] font-semibold text-[#262626] truncate">{displayName}</h1>
                <Pencil size={14} className="text-[#9ca3af] group-hover:text-[#30578D] shrink-0 transition-colors" />
              </button>
            )}
          </div>

          {/* Basic Info + Mailboxes — side by side, both short enough that stacking them full-width would
              waste vertical space before the much taller Conditions card below. */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="bg-white rounded-[8px] border border-[#E2E6E9] px-5 py-5 flex flex-col gap-4 h-full">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#666666]">Basic Info</h2>
              <div className="grid grid-cols-[140px] gap-4">
                <div>
                  <label className="block text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide mb-1.5">Priority</label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full h-[38px] px-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[13px] text-[#262626] outline-none focus:border-[#30578D] transition-colors"
                  />
                  <p className="text-[11px] text-[#97999B] mt-1">Lower runs first.</p>
                </div>
              </div>
            </div>

            {/* Mailboxes — assigned separately from the AND/OR conditions below, same checklist modal the
                listing table's own "Add Mailboxes" pill uses. */}
            <div className="bg-white rounded-[8px] border border-[#E2E6E9] px-5 py-5 flex flex-col gap-4 h-full">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#666666]">Mailboxes</h2>
              <div className="flex items-center flex-wrap gap-2">
                {mailboxes.length === 0 ? (
                  <p className="text-[12px] text-[#97999B]">No mailboxes assigned yet.</p>
                ) : (
                  mailboxes.map((m) => (
                    <span key={m} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-[6px] bg-[#EAF1FB] text-[12px] font-medium text-[#30578D]">
                      <Mail size={11} />
                      {m}
                      <button onClick={() => setMailboxes(mailboxes.filter((x) => x !== m))} className="text-[#30578D]/70 hover:text-[#30578D] cursor-pointer">
                        <X size={11} />
                      </button>
                    </span>
                  ))
                )}
              </div>
              <button
                onClick={() => setMailboxPickerOpen(true)}
                className="inline-flex items-center gap-1.5 self-start h-[32px] px-3 rounded-[6px] border border-[#E2E6E9] text-[12.5px] font-semibold text-[#4D4D4D] hover:border-[#30578D] hover:text-[#30578D] hover:bg-[#EAF1FB] cursor-pointer transition-colors"
              >
                <Plus size={13} />
                Add Mailboxes
              </button>
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-white rounded-[8px] border border-[#E2E6E9] px-5 py-5 flex flex-col gap-4">
            <div>
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#666666]">Conditions</h2>
              <p className="text-[12px] text-[#97999B] mt-1">This filter applies when the conditions below are met.</p>
            </div>
            <ConditionBuilder value={conditions} onChange={setConditions} fields={CMD_CENTER_FILTER_FIELDS} />
          </div>
        </main>

        {/* Footer actions — sticky to the bottom of the viewport, matching the Email Template/Exception editors */}
        <div className="shrink-0 sticky bottom-0 z-40 bg-white border-t border-[#ebebeb]">
          <div className="max-w-[1600px] mx-auto px-5 py-3.5 flex items-center justify-between gap-3">
            <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>Back</Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </div>
        </div>
      </div>

      {mailboxPickerOpen && (
        <MailboxPickerModal
          subtitle={displayName}
          mailboxes={MAILBOXES}
          selected={mailboxes}
          onSave={(next) => { setMailboxes(next); setMailboxPickerOpen(false); }}
          onClose={() => setMailboxPickerOpen(false)}
        />
      )}
    </div>
  );
}
