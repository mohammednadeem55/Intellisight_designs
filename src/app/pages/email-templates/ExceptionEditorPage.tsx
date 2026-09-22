import { useState } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Pencil } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { Button } from "../../components/common/Button";
import { ConditionBuilder, createConditionGroup, isConditionTreeComplete, type ConditionGroup } from "../../components/common/ConditionBuilder";
import { loadTemplateExceptions, saveTemplateExceptions } from "./exceptionStorage";
import {
  CATEGORIES,
  EXCEPTION_FIELDS,
  INITIAL_TEMPLATES,
  MAPPING_STEPS,
  MappingSelectField,
  type TemplateException,
} from "./EmailTemplatePage";

// Full page instead of a modal — same reasoning as the Email Template editor: Conditions (which can itself
// nest into groups) plus Basic Info plus the two template pickers made for a genuinely crowded dialog no
// amount of step-wizarding fixed cleanly, whereas a page just gives each section room to breathe.
export function ExceptionEditorPage({
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
  // Editing an existing exception arrives here with its row data via router state (from EmailTemplatePage's
  // Exceptions tab row click / Edit button); creating a new one has no state, so every field starts blank —
  // same convention as the Email Template editor.
  const location = useLocation();
  const editing = location.state as TemplateException | null;

  const [name, setName] = useState(editing?.name ?? "");
  const [editingName, setEditingName] = useState(false);
  const [workflowCategory, setWorkflowCategory] = useState(editing?.workflowCategory ?? "");
  const [workflowStep, setWorkflowStep] = useState(editing?.step ?? "");
  const [priority, setPriority] = useState(editing?.priority ?? 0);
  const [conditions, setConditions] = useState<ConditionGroup>(editing?.conditions ?? createConditionGroup("OR"));
  const [templateIfMatch, setTemplateIfMatch] = useState(editing?.templateIfMatch ?? "");
  const [templateIfNoMatch, setTemplateIfNoMatch] = useState(editing?.templateIfNoMatch ?? "");

  const displayName = name.trim() || "Untitled Exception";
  const templateOptions = workflowCategory ? INITIAL_TEMPLATES.filter((t) => t.category === workflowCategory).map((t) => t.name) : [];

  const handleSave = () => {
    if (!name.trim()) { toast.warning("Give this exception a name"); return; }
    if (!workflowCategory) { toast.warning("Select a workflow category"); return; }
    if (!isConditionTreeComplete(conditions)) { toast.warning("Finish or remove any incomplete conditions"); return; }
    if (!templateIfMatch) { toast.warning("Select a template for when conditions match"); return; }

    const exception: TemplateException = {
      id: editing?.id ?? `${Date.now()}`,
      name: name.trim(),
      workflowCategory,
      step: workflowStep,
      priority,
      conditions,
      templateIfMatch,
      templateIfNoMatch,
    };
    const existing = loadTemplateExceptions([]);
    const next = existing.some((e) => e.id === exception.id)
      ? existing.map((e) => (e.id === exception.id ? exception : e))
      : [...existing, exception];
    saveTemplateExceptions(next);
    toast.success(`Exception "${displayName}" saved`);
    onBack();
  };

  return (
    <div className="bg-[#f5f6fa] flex flex-col w-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="shrink-0 sticky top-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] z-50 bg-[#f5f6fa]">
          <AppHeader
            activeNav="Email Template"
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
              { label: "Email", onClick: onNavigateEmailTemplate },
              { label: "Exceptions", onClick: onBack },
              { label: editing ? displayName : "New Exception" },
            ]}
          />

          {/* Page header — back, inline-editable name (shows "Untitled Exception" until one is given) */}
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
                placeholder="Untitled Exception"
                className="text-[18px] font-semibold text-[#262626] placeholder:text-[#9ca3af] bg-transparent outline-none border-b border-[#30578D] min-w-0 w-[280px]"
              />
            ) : (
              <button onClick={() => setEditingName(true)} className="group flex items-center gap-2 min-w-0 cursor-pointer">
                <h1 className="text-[18px] font-semibold text-[#262626] truncate">{displayName}</h1>
                <Pencil size={14} className="text-[#9ca3af] group-hover:text-[#30578D] shrink-0 transition-colors" />
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-[8px] border border-[#E2E6E9] px-5 py-5 flex flex-col gap-4">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#666666]">Basic Info</h2>
            <div className="grid grid-cols-[1fr_1fr_140px] gap-4">
              <MappingSelectField
                label="Workflow Category"
                value={workflowCategory}
                options={CATEGORIES}
                onChange={(v) => { setWorkflowCategory(v); setTemplateIfMatch(""); setTemplateIfNoMatch(""); }}
                placeholder="Workflow Category"
              />
              <MappingSelectField label="Step" value={workflowStep} options={MAPPING_STEPS} onChange={setWorkflowStep} placeholder="Step (optional)" />
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

          {/* Conditions */}
          <div className="bg-white rounded-[8px] border border-[#E2E6E9] px-5 py-5 flex flex-col gap-4">
            <div>
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#666666]">Conditions</h2>
              <p className="text-[12px] text-[#97999B] mt-1">This exception applies when the conditions below are met.</p>
            </div>
            <ConditionBuilder value={conditions} onChange={setConditions} fields={EXCEPTION_FIELDS} />
          </div>

          {/* Resulting Template */}
          <div className="bg-white rounded-[8px] border border-[#E2E6E9] px-5 py-5 flex flex-col gap-4">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#666666]">Resulting Template</h2>
            <div className="grid grid-cols-2 gap-4">
              <MappingSelectField
                label="Template if conditions match"
                value={templateIfMatch}
                options={templateOptions}
                onChange={setTemplateIfMatch}
                disabled={!workflowCategory}
                disabledHelperText="Select a workflow category first"
              />
              <MappingSelectField
                label="Template if conditions don't match (optional)"
                value={templateIfNoMatch}
                options={templateOptions}
                onChange={setTemplateIfNoMatch}
                disabled={!workflowCategory}
                disabledHelperText="Select a workflow category first"
              />
            </div>
            <p className="text-[11px] text-[#97999B]">
              Leaving either template blank means "no decision here" — evaluation falls through to the next exception (by priority), then to the plain category/step/country/language default.
            </p>
          </div>
        </main>

        {/* Footer actions — sticky to the bottom of the viewport, matching the Email Template editor */}
        <div className="shrink-0 sticky bottom-0 z-40 bg-white border-t border-[#ebebeb]">
          <div className="max-w-[1600px] mx-auto px-5 py-3.5 flex items-center justify-between gap-3">
            <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>Back</Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
