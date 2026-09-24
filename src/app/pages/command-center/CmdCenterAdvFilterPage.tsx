import { useMemo, useState } from "react";
import { Mail, Plus, SquarePen, Trash2, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { EMAIL_TABLE_NAVY, EmailTableTooltip, TruncateTooltip } from "../../components/common/EmailTable";
import { MailboxPickerModal } from "../../components/common/MailboxPickerModal";
import { TableToolbarSearch } from "../../components/common/TableToolbar";
import {
  createConditionGroup,
  createConditionRule,
  summarizeConditionTree,
  type ConditionFieldOption,
  type ConditionGroup,
  type ConditionNode,
  type ConditionOperator,
  type ConditionRule,
} from "../../components/common/ConditionBuilder";
import { loadCmdCenterAdvFilters, saveCmdCenterAdvFilters } from "./cmdCenterAdvFilterStorage";
import { BUSINESS_GROUPS, CLASSIFICATIONS, LANGUAGE_DETECTED_OPTIONS, MAILBOXES, SENSITIVITY_OPTIONS, SOURCE_OPTIONS } from "./emailData";

export type CmdCenterAdvFilter = {
  id: string;
  name: string;
  priority: number;
  conditions: ConditionGroup;
  /** Which mailboxes this filter applies to — assigned separately from the AND/OR conditions, via the
      listing table's own "Add Mailboxes" checklist modal rather than as a condition rule. */
  mailboxes: string[];
  /** "predefined" = created here, on the admin page. "user" = a CSR/manager's own fork, created from the
      New Overview Filters panel when they edit a predefined filter's values (see CmdCenterAdvFilterModal
      in NewOverviewPage.tsx) — never listed or editable on this admin page. */
  scope: "predefined" | "user";
  /** Set only on a "user"-scoped fork — whose predefined (or user) filter it started from, for lineage. */
  originId?: string;
  /** Set only on a "user"-scoped fork — who created it. */
  createdBy?: string;
};

// The Command Center fields an advanced filter's conditions can be built from — the same fields already
// exposed as simple single-value dropdowns in the New Overview filter panel (Classification, Business
// Group, Sensitivity, Language Detected, Source), now composable with AND/OR/nesting via the same
// ConditionBuilder used for Email Template Exceptions. What a matching filter actually *does* (beyond being
// defined) is still to be scoped — this page mirrors Exceptions' list + full-page editor shape for now.
export const CMD_CENTER_FILTER_FIELDS: ConditionFieldOption[] = [
  { key: "classification", label: "Classification", options: CLASSIFICATIONS },
  { key: "businessGroup", label: "Business Group", options: BUSINESS_GROUPS },
  { key: "sensitivity", label: "Sensitivity", options: SENSITIVITY_OPTIONS },
  { key: "languageDetected", label: "Language Detected", options: LANGUAGE_DETECTED_OPTIONS },
  { key: "source", label: "Source", options: SOURCE_OPTIONS },
];

// EmailTableTooltip renders as one whitespace-nowrap line — fine for a handful of mailboxes, but with
// potentially dozens assigned, dumping the full comma-joined list into it would produce a tooltip wide
// enough to run off the screen. Cap the preview instead so its width stays bounded regardless of scale.
const MAILBOX_TOOLTIP_PREVIEW_COUNT = 5;
function mailboxTooltipLabel(mailboxes: string[]): string {
  if (mailboxes.length === 0) return "No mailboxes assigned yet";
  if (mailboxes.length <= MAILBOX_TOOLTIP_PREVIEW_COUNT) return mailboxes.join(", ");
  const remaining = mailboxes.length - MAILBOX_TOOLTIP_PREVIEW_COUNT;
  return `${mailboxes.slice(0, MAILBOX_TOOLTIP_PREVIEW_COUNT).join(", ")} +${remaining} more`;
}

function mockRule(field: string, operator: ConditionOperator, values: string[]): ConditionRule {
  return { ...createConditionRule(field), operator, values };
}
function mockGroup(combinator: ConditionGroup["combinator"], children: ConditionNode[]): ConditionGroup {
  return { ...createConditionGroup(combinator), children };
}

// Exported so New Overview (FCNV/CSR listing) can use the same defaults as its "Saved Filters" fallback
// when localStorage hasn't been seeded yet — the listing page and this admin page must agree on what
// "predefined" means out of the box.
export const INITIAL_CMD_CENTER_FILTERS: CmdCenterAdvFilter[] = [
  {
    id: "ccf-1",
    name: "Sensitive Enterprise Work Orders",
    priority: 1,
    conditions: mockGroup("AND", [
      mockRule("businessGroup", "is one of", ["Enterprise"]),
      mockRule("sensitivity", "is one of", ["SENSITIVE"]),
      mockRule("classification", "is one of", ["WORK_ORDER"]),
    ]),
    mailboxes: ["usa_orders@keysight.com"],
    scope: "predefined",
  },
  {
    id: "ccf-2",
    name: "External Non-English Sources",
    priority: 2,
    conditions: mockGroup("AND", [
      mockRule("source", "is one of", ["EXTERNAL"]),
      mockGroup("OR", [
        mockRule("languageDetected", "is not", ["en"]),
        mockRule("classification", "is one of", ["REVIEW_REQUIRED"]),
      ]),
    ]),
    mailboxes: ["contact_japan@keysight.com", "service_japan@keysight.com"],
    scope: "predefined",
  },
  {
    id: "ccf-3",
    name: "USA & LAR Trade/Work Orders",
    priority: 3,
    conditions: mockGroup("AND", [mockRule("classification", "is one of", ["TRADE_ORDER", "WORK_ORDER"])]),
    mailboxes: ["usa_orders@keysight.com", "lar_orders@keysight.com"],
    scope: "predefined",
  },
];

export function CmdCenterAdvFilterPage({
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
  onNavigateCreateCmdCenterFilter,
  onNavigateEditCmdCenterFilter,
}: {
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
  onNavigateCreateCmdCenterFilter?: () => void;
  onNavigateEditCmdCenterFilter?: (filter: CmdCenterAdvFilter) => void;
}) {
  const [filters, setFilters] = useState<CmdCenterAdvFilter[]>(() => loadCmdCenterAdvFilters(INITIAL_CMD_CENTER_FILTERS));
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CmdCenterAdvFilter | null>(null);

  // Mailbox assignment — a checklist modal (shared with the full-page editor via MailboxPickerModal)
  // scoped to one filter row, separate from that row's AND/OR conditions.
  const [mailboxModalTarget, setMailboxModalTarget] = useState<CmdCenterAdvFilter | null>(null);

  const persist = (next: CmdCenterAdvFilter[]) => {
    setFilters(next);
    saveCmdCenterAdvFilters(next);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    persist(filters.filter((f) => f.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const saveMailboxes = (next: string[]) => {
    if (!mailboxModalTarget) return;
    persist(filters.map((f) => (f.id === mailboxModalTarget.id ? { ...f, mailboxes: next } : f)));
    setMailboxModalTarget(null);
  };

  const sortedFilters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return filters
      .filter((f) => !q || f.name.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => a.priority - b.priority);
  }, [filters, searchQuery]);

  return (
    <>
      <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
          <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
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

          <main className="flex-1 min-h-0 flex flex-col w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 gap-4 overflow-hidden">
            <div>
              <Breadcrumbs items={[{ label: "Admin" }, { label: "Cmd Center Adv. Filter" }]} />
              <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Command Center Advanced Filters</h1>
              <p className="text-[12px] text-[#97999B] mt-0.5">
                Admin-defined AND/OR rules for advanced Command Center filtering.
              </p>
            </div>

            <div className="flex-1 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
                <TableToolbarSearch value={searchQuery} onCommit={setSearchQuery} placeholder="Search filters..." />
                <button
                  onClick={() => onNavigateCreateCmdCenterFilter?.()}
                  className="ml-auto flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                >
                  <Plus size={15} />
                  Add Filter
                </button>
              </div>

              {sortedFilters.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-5">
                  <p className="text-[13px] text-[#97999B]">No advanced filters configured yet. Click "Add Filter" to create one.</p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-auto">
                  <table className="w-full min-w-[720px] border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-[#F7F7F7]">
                        {["Priority", "Name", "Mailboxes", "Conditions", "Actions"].map((label) => (
                          <th key={label} className="sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                            <span className="text-[12px] font-semibold text-[#4D4D4D]">{label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFilters.map((f) => (
                        <tr
                          key={f.id}
                          onClick={() => onNavigateEditCmdCenterFilter?.(f)}
                          className="group hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3.5 whitespace-nowrap border-b border-[#DEDEDE]">
                            <span className="inline-flex items-center justify-center min-w-[24px] h-[22px] px-1.5 rounded-[6px] bg-[#F1F2F4] text-[11.5px] font-bold text-[#4D4D4D]">{f.priority}</span>
                          </td>
                          <td className="px-4 py-3.5 max-w-[260px] border-b border-[#DEDEDE]">
                            <TruncateTooltip label={f.name} className="text-[12.5px] font-semibold text-[#262626]" />
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap border-b border-[#DEDEDE]">
                            {/* One clickable pill, not a count badge glued to a separate icon button — the
                                whole thing is the entry point into the modal, and its own label says what
                                it does instead of relying on a hover tooltip to explain a bare "+". */}
                            <EmailTableTooltip label={mailboxTooltipLabel(f.mailboxes)}>
                              <button
                                onClick={(ev) => { ev.stopPropagation(); setMailboxModalTarget(f); }}
                                className={`inline-flex items-center gap-1.5 h-[28px] pl-2.5 pr-3 rounded-full border text-[12px] font-semibold cursor-pointer transition-colors ${
                                  f.mailboxes.length === 0
                                    ? "border-dashed border-[#D9D9D6] text-[#97999B] hover:border-[#30578D] hover:text-[#30578D]"
                                    : "border-[#E2E6E9] bg-[#F7F8FA] text-[#4D4D4D] hover:border-[#30578D] hover:bg-[#EAF1FB] hover:text-[#30578D]"
                                }`}
                              >
                                {f.mailboxes.length === 0 ? (
                                  <>
                                    <Plus size={13} />
                                    Add mailboxes
                                  </>
                                ) : (
                                  <>
                                    <Mail size={13} />
                                    {f.mailboxes.length} mailbox{f.mailboxes.length === 1 ? "" : "es"}
                                  </>
                                )}
                              </button>
                            </EmailTableTooltip>
                          </td>
                          <td className="px-4 py-3.5 max-w-[480px] border-b border-[#DEDEDE]">
                            <TruncateTooltip label={summarizeConditionTree(f.conditions, CMD_CENTER_FILTER_FIELDS) || "—"} className="text-[12px] text-[#4D4D4D]" />
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap border-b border-[#DEDEDE]">
                            <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                              <EmailTableTooltip label="Edit">
                                <button
                                  onClick={() => onNavigateEditCmdCenterFilter?.(f)}
                                  className="flex items-center justify-center size-[28px] rounded-[6px] text-[#666666] hover:bg-[#F1F2F4] hover:text-[#262626] cursor-pointer transition-colors"
                                >
                                  <SquarePen size={14} />
                                </button>
                              </EmailTableTooltip>
                              <EmailTableTooltip label="Delete">
                                <button
                                  onClick={() => setDeleteTarget(f)}
                                  className="flex items-center justify-center size-[28px] rounded-[6px] text-[#666666] hover:bg-[#FAEBEB] hover:text-[#C83737] cursor-pointer transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </EmailTableTooltip>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
              <span className="text-[16px] font-bold text-[#262626]">Delete filter</span>
              <button onClick={() => setDeleteTarget(null)} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-[13px] text-[#4D4D4D] leading-[1.6]">
                Are you sure you want to delete <span className="font-semibold text-[#262626]">"{deleteTarget.name}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
                style={{ backgroundColor: "#C83737" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {mailboxModalTarget && (
        <MailboxPickerModal
          subtitle={mailboxModalTarget.name}
          mailboxes={MAILBOXES}
          selected={mailboxModalTarget.mailboxes}
          onSave={saveMailboxes}
          onClose={() => setMailboxModalTarget(null)}
        />
      )}
    </>
  );
}
