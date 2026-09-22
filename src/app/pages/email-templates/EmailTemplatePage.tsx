import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ChevronDown, ChevronsUpDown, Copy, Plus, SquarePen, Trash2, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { EMAIL_TABLE_NAVY, EMPTY_SET, EmailTableColumnFilterButton, EmailTableTooltip, TruncateTooltip } from "../../components/common/EmailTable";
import { TableToolbarApplyReset, TableToolbarMultiSelect, TableToolbarSearch, useExclusiveOpen } from "../../components/common/TableToolbar";
import { TablePagination, type RowDensity } from "../../components/common/TablePagination";
import { loadEmailTemplates, saveEmailTemplates } from "./emailTemplateStorage";
import { loadTemplateExceptions, saveTemplateExceptions } from "./exceptionStorage";
import { CLASSIFICATIONS } from "../command-center/emailData";
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

export type EmailTemplate = {
  id: string;
  name: string;
  category: string;
  language: string;
  subject: string;
  createdBy: string;
  updatedAt: string; // ISO
  // The Preview tab's merge-tag values, edited in the template editor — carried on the template itself so
  // reopening it for edit later restores what was actually being previewed, instead of resetting to generic
  // defaults every time.
  sampleData?: Record<string, string>;
};

type ColumnKey = "name" | "category" | "language" | "subject" | "createdBy" | "updatedAt";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "language", label: "Language" },
  { key: "subject", label: "Subject" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedAt", label: "Updated At" },
];

const CATEGORY_PILL: Record<string, { bg: string; fg: string }> = {
  "Work Order": { bg: "#3882F61F", fg: "#3882F6" },
  "Trade Order": { bg: "#7C3BF61A", fg: "#7C3BF6" },
  "Post Order Booking": { bg: "#0891B51A", fg: "#0891B5" },
  Uncategorized: { bg: "#6375901A", fg: "#637590" },
  FCNV: { bg: "#16B1511A", fg: "#0C883C" },
};

export const CATEGORIES = ["Uncategorized", "Trade Order", "Work Order", "Post Order Booking", "FCNV"];
export const LANGUAGES = ["No Language", "English", "French", "Italian", "Japanese"];

// The three tabs sharing this page — Templates (the pool), Default Mapping (the plain baseline pick), and
// Exceptions (prioritized AND/OR overrides on top of that baseline). Shared array/type so the toggle render
// and the page header's per-tab copy stay in sync instead of three separately-maintained conditionals.
const TAB_KEYS = ["templates", "mapping", "exceptions"] as const;
type TemplateTab = (typeof TAB_KEYS)[number];
const TAB_LABELS: Record<TemplateTab, string> = { templates: "Templates", mapping: "Default Mapping", exceptions: "Exceptions" };

// Exported so the Default Mapping page (a sibling under the same "Email Template" nav dropdown) can offer
// the same real template names in its "Default Template" picker, instead of drifting from this list.
export const INITIAL_TEMPLATES: EmailTemplate[] = [
  { id: "1", name: "test_sourish", category: "Work Order", language: "No Language", subject: "text", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-24T22:48:00" },
  { id: "2", name: "test_ss", category: "Trade Order", language: "No Language", subject: "test", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-23T10:43:00" },
  { id: "3", name: "SOA_TEST101", category: "Uncategorized", language: "English", subject: "intellisight", createdBy: "gaurish.sharma@keysight.com", updatedAt: "2026-08-21T12:01:00" },
  { id: "4", name: "SOA_Ack_Template", category: "Trade Order", language: "English", subject: "Sales Order Acknowledgement example", createdBy: "amit_tuteja@keysight.com", updatedAt: "2026-08-19T21:25:00" },
  { id: "5", name: "SOA_Template", category: "Trade Order", language: "English", subject: "Sales Order Acknowledgement", createdBy: "amit_tuteja@keysight.com", updatedAt: "2026-08-19T18:55:00" },
  { id: "6", name: "SOA_ASO_QuoteTerms (Copy 2)", category: "Trade Order", language: "French", subject: "Sales Order Acknowledgement – Quote Terms", createdBy: "amit_tuteja@keysight.com", updatedAt: "2026-08-19T18:51:00" },
  { id: "7", name: "SOA_ASO_QuoteTerms (Copy)", category: "Trade Order", language: "Italian", subject: "Sales Order Acknowledgement – Quote Terms", createdBy: "amit_tuteja@keysight.com", updatedAt: "2026-08-19T17:51:00" },
  { id: "8", name: "SOA_ASO_PATerms", category: "Trade Order", language: "No Language", subject: "Sales Order Acknowledgement – Purchase Agreement Terms", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-19T14:15:00" },
  { id: "9", name: "SOA_EMEA_GB_GB_EN", category: "Trade Order", language: "Japanese", subject: "Your Keysight Sales Order Acknowledgement", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-19T02:16:00" },
  { id: "10", name: "Order Confirmation", category: "Trade Order", language: "English", subject: "Order Confirmation — {{CCC_Number}} | {{Account}}", createdBy: "pranay.gupta@keysight.com", updatedAt: "2026-08-18T21:03:00" },
  { id: "11", name: "Order Status Update", category: "Post Order Booking", language: "No Language", subject: "Order Update - {{PO}} ({{Owner}})", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-18T13:00:00" },
  { id: "12", name: "Order Hold Follow-Up", category: "Post Order Booking", language: "No Language", subject: "Order Hold Follow-Up", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-18T12:57:00" },
  { id: "13", name: "Shipment Delay Notice", category: "Post Order Booking", language: "English", subject: "Shipment Delay Notice — {{PO}}", createdBy: "pranay.gupta@keysight.com", updatedAt: "2026-08-17T16:20:00" },
  { id: "14", name: "Quote Expiry Reminder", category: "Trade Order", language: "English", subject: "Your Quote is Expiring Soon — {{Quote_Number}}", createdBy: "amit_tuteja@keysight.com", updatedAt: "2026-08-16T11:05:00" },
  { id: "15", name: "Credit Hold Notification", category: "Post Order Booking", language: "English", subject: "Account on Credit Hold — Action Required", createdBy: "gaurish.sharma@keysight.com", updatedAt: "2026-08-15T09:40:00" },
  { id: "16", name: "Welcome Email", category: "Uncategorized", language: "English", subject: "Welcome to Keysight", createdBy: "sourish.sarkar1@keysight.com", updatedAt: "2026-08-14T15:10:00" },
  { id: "17", name: "Invoice Reminder", category: "Trade Order", language: "No Language", subject: "Invoice Past Due — {{Invoice_Number}}", createdBy: "pranay.gupta@keysight.com", updatedAt: "2026-08-13T10:00:00" },
  { id: "18", name: "RMA Confirmation", category: "Post Order Booking", language: "English", subject: "Return Merchandise Authorization Confirmed", createdBy: "amit_tuteja@keysight.com", updatedAt: "2026-08-12T14:30:00" },
  { id: "19", name: "Order Escalation", category: "FCNV", language: "No Language", subject: "Escalation Required — {{CCC_Number}}", createdBy: "gaurish.sharma@keysight.com", updatedAt: "2026-08-11T08:45:00" },
  { id: "20", name: "Test_pranay", category: "FCNV", language: "No Language", subject: "draft test", createdBy: "pranay.gupta@keysight.com", updatedAt: "2026-08-10T19:12:00" },
];

function formatUpdatedAt(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// Display/filter value per column — Updated At filters by its formatted string (what the user actually
// sees in the filter dropdown) while sorting still uses the raw ISO value for correct chronological order.
function columnDisplayValue(key: ColumnKey, t: EmailTemplate): string {
  return key === "updatedAt" ? formatUpdatedAt(t.updatedAt) : t[key];
}

// ─── Default Mapping tab — merged in from the former standalone Default Mapping page, since it was always
// just the sibling half of "manage email templates" (which template auto-applies where) rather than a
// separate concern, and the two pages duplicated the same chrome for no benefit. ──────────────────────────

// Matching criteria a mapping can be scoped by, beyond just Workflow Type + Step — each independently
// optional via the "Any (wildcard)" option, so a mapping can be as broad or as specific as needed.
export const MAPPING_STEPS = ["Email & Classify", "CCC Creation", "AI Order Validation", "Order Creation", "SOA"];
const MAPPING_COUNTRIES = ["India", "Japan", "UAE", "UK", "USA"];
const MAPPING_OPERATING_UNITS = ["KRS-OU-4123", "KRS-OU-5001", "KRS-OU-6002", "KRS-OU-7003", "KRS-OU-8004", "USO-OU-8213"];
const MAPPING_WILDCARD = "Any (wildcard)";

type DefaultMapping = {
  id: string;
  workflowType: string;
  step: string;
  classification: string;
  country: string;
  language: string;
  operatingUnit: string;
  defaultTemplate: string;
};

type MappingColumnKey = "workflowType" | "step" | "classification" | "country" | "language" | "operatingUnit" | "defaultTemplate";

// Same shape/order as the Templates tab's COLUMNS — Workflow Type and Language get the toolbar's quick
// multi-select (mirroring that tab's Category + Language), everything else gets a per-column funnel filter.
const MAPPING_COLUMNS: { key: MappingColumnKey; label: string }[] = [
  { key: "workflowType", label: "Workflow Type" },
  { key: "step", label: "Step" },
  { key: "classification", label: "Classification" },
  { key: "country", label: "Country" },
  { key: "language", label: "Language" },
  { key: "operatingUnit", label: "Operating Unit (OU)" },
  { key: "defaultTemplate", label: "Default Template" },
];

const INITIAL_MAPPINGS: DefaultMapping[] = [
  { id: "1", workflowType: "Work Order", step: "Order Creation", classification: "TRADE_ORDER", country: MAPPING_WILDCARD, language: "English", operatingUnit: MAPPING_WILDCARD, defaultTemplate: "test_from_2" },
  { id: "2", workflowType: "Trade Order", step: "CCC Creation", classification: MAPPING_WILDCARD, country: "India", language: "English", operatingUnit: "KRS-OU-4123", defaultTemplate: "Order Confirmation" },
  { id: "3", workflowType: "Post Order Booking", step: "SOA", classification: "WORK_ORDER", country: MAPPING_WILDCARD, language: MAPPING_WILDCARD, operatingUnit: MAPPING_WILDCARD, defaultTemplate: "SOA_Ack_Template" },
];

// Compact single-select dropdown for the Add/Edit modal's fields — plain button + absolute menu, same
// visual language as the rest of this app's simple pickers (e.g. SoaBody's template filters).
export function MappingSelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
  helperText,
  disabled,
  disabledHelperText,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  disabledHelperText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggleOpen = () => {
    if (!open) {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen((v) => !v);
  };

  return (
    <div>
      <label className="block text-[10.5px] font-bold text-[#97999B] uppercase tracking-wide mb-1.5">{label}</label>
      <button
        ref={btnRef}
        onClick={() => !disabled && toggleOpen()}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 h-[38px] px-3 rounded-[8px] border text-[13px] text-left transition-colors ${
          disabled
            ? "border-[#E2E6E9] bg-[#F7F7F7] text-[#97999B] cursor-not-allowed"
            : "border-[#E2E6E9] bg-white hover:bg-[#F7F7F7] cursor-pointer text-[#262626]"
        }`}
      >
        <span className={value ? "" : "text-[#97999B]"}>{value || placeholder}</span>
        <ChevronDown size={14} className={`shrink-0 text-[#97999B] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && rect && !disabled && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-[9999] py-1 max-h-[220px] overflow-y-auto"
            style={{ top: rect.top, left: rect.left, width: rect.width }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[12.5px] cursor-pointer transition-colors ${
                  opt === value ? "font-semibold text-[#30578D] bg-[#EAF1FB]" : "text-[#4D4D4D] hover:bg-[#F7F7F7]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
      {disabled && disabledHelperText ? (
        <p className="text-[11px] text-[#97999B] mt-1">{disabledHelperText}</p>
      ) : (
        helperText && <p className="text-[11px] text-[#97999B] mt-1">{helperText}</p>
      )}
    </div>
  );
}

function MappingModal({
  mapping,
  onClose,
  onSave,
}: {
  mapping: DefaultMapping | null;
  onClose: () => void;
  onSave: (m: DefaultMapping) => void;
}) {
  const isEdit = !!mapping;
  const [workflowType, setWorkflowType] = useState(mapping?.workflowType ?? "");
  const [step, setStep] = useState(mapping?.step ?? "");
  const [classification, setClassification] = useState(mapping?.classification ?? MAPPING_WILDCARD);
  const [country, setCountry] = useState(mapping?.country ?? MAPPING_WILDCARD);
  const [language, setLanguage] = useState(mapping?.language ?? MAPPING_WILDCARD);
  const [operatingUnit, setOperatingUnit] = useState(mapping?.operatingUnit ?? MAPPING_WILDCARD);
  const [defaultTemplate, setDefaultTemplate] = useState(mapping?.defaultTemplate ?? "");

  const templateOptions = workflowType
    ? INITIAL_TEMPLATES.filter((t) => t.category === workflowType).map((t) => t.name)
    : [];

  const submit = () => {
    if (!workflowType) { toast.warning("Select a workflow type"); return; }
    if (!step) { toast.warning("Select a step"); return; }
    if (!defaultTemplate) { toast.warning("Select a default template"); return; }
    onSave({
      id: mapping?.id ?? `${Date.now()}`,
      workflowType,
      step,
      classification,
      country,
      language,
      operatingUnit,
      defaultTemplate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[620px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE] shrink-0">
          <span className="text-[16px] font-bold text-[#262626]">{isEdit ? "Edit Default Mapping" : "Add Default Mapping"}</span>
          <button onClick={onClose} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <MappingSelectField label="Workflow Type" value={workflowType} options={CATEGORIES} onChange={(v) => { setWorkflowType(v); setDefaultTemplate(""); }} placeholder="Workflow Type" />
            <MappingSelectField
              label="Step"
              value={step}
              options={MAPPING_STEPS}
              onChange={setStep}
              placeholder="Step"
              disabled={!workflowType}
              disabledHelperText="Select a workflow type first"
            />
          </div>

          <MappingSelectField
            label="Classification"
            value={classification}
            options={[MAPPING_WILDCARD, ...CLASSIFICATIONS]}
            onChange={setClassification}
            helperText={`Leave as "${MAPPING_WILDCARD}" to match all classifications for this workflow/step.`}
          />

          <div className="grid grid-cols-2 gap-4">
            <MappingSelectField label="Country" value={country} options={[MAPPING_WILDCARD, ...MAPPING_COUNTRIES]} onChange={setCountry} />
            <MappingSelectField label="Language" value={language} options={[MAPPING_WILDCARD, ...LANGUAGES]} onChange={setLanguage} />
          </div>

          <div className="pt-1 border-t border-[#E2E6E9]">
            <p className="text-[11px] font-bold text-[#666666] uppercase tracking-wide pt-3 mb-3">Flex Fields</p>
            <div className="grid grid-cols-2 gap-4">
              <MappingSelectField label="Operating Unit (OU)" value={operatingUnit} options={[MAPPING_WILDCARD, ...MAPPING_OPERATING_UNITS]} onChange={setOperatingUnit} />
            </div>
          </div>

          <MappingSelectField
            label="Default Template"
            value={defaultTemplate}
            options={templateOptions}
            onChange={setDefaultTemplate}
            disabled={!workflowType}
            disabledHelperText="Select a workflow type first"
            helperText={workflowType && templateOptions.length === 0 ? `No templates in "${workflowType}" yet.` : undefined}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE] shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: EMAIL_TABLE_NAVY }}
          >
            {isEdit ? "Save Mapping" : "Create Mapping"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Exceptions tab — admin-defined AND/OR rules that override the plain category/step/country/language
// default (the Default Mapping tab above) for a given workflow category + step, e.g. "if Operating Unit is
// GBS-OU-2613, use this template regardless of what Default Mapping would otherwise pick." Evaluated in
// priority order; the first exception whose conditions match (or don't, if using the "don't match" template)
// wins, falling through to the next exception and finally to Default Mapping if nothing matches. ───────────

export type TemplateException = {
  id: string;
  name: string;
  workflowCategory: string;
  step: string;
  priority: number;
  conditions: ConditionGroup;
  templateIfMatch: string;
  /** Optional — leaving this blank means "no decision here," per the editor page's own explanatory copy. */
  templateIfNoMatch: string;
};

// The fields an exception's conditions can be built from — pulled from the same reference data as Default
// Mapping (Operating Unit, Country, Language, Classification) plus a couple of free-text Oracle fields seen
// in the real SOA-by-email rules (Customer Number, Bill To Country). Exported so ExceptionEditorPage (a
// separate route/page, same as the Email Template editor) can build the same Conditions UI.
export const EXCEPTION_FIELDS: ConditionFieldOption[] = [
  { key: "operatingUnit", label: "Operating Unit", options: MAPPING_OPERATING_UNITS },
  { key: "billToCountry", label: "Bill To Country", options: MAPPING_COUNTRIES },
  { key: "language", label: "Language", options: LANGUAGES },
  { key: "classification", label: "Classification", options: CLASSIFICATIONS },
  { key: "customerNumber", label: "Customer Number" },
];

// Small helpers so the mock data below reads as plain rules/groups instead of raw id-bearing object
// literals — go through the real create* factories (for correct ids/kind tags) and just fill in the parts
// a fixture actually needs to specify.
function mockRule(field: string, operator: ConditionOperator, values: string[]): ConditionRule {
  return { ...createConditionRule(field), operator, values };
}
function mockGroup(combinator: ConditionGroup["combinator"], children: ConditionNode[]): ConditionGroup {
  return { ...createConditionGroup(combinator), children };
}

// Sample rows so the Exceptions tab isn't empty on first load — mirrors the kind of overrides in the real
// SOA-by-email spreadsheet (OU/country/language/classification combinations routing to a specific template
// instead of the plain category/step default), including one nested AND-inside-OR to show the builder
// actually handles that case.
const INITIAL_EXCEPTIONS: TemplateException[] = [
  {
    id: "exc-1",
    name: "UK Sales Order Acknowledgement",
    workflowCategory: "Trade Order",
    step: "SOA",
    priority: 1,
    conditions: mockGroup("AND", [
      mockRule("operatingUnit", "is one of", ["KRS-OU-5001"]),
      mockRule("billToCountry", "is one of", ["UK"]),
    ]),
    templateIfMatch: "SOA_EMEA_GB_GB_EN",
    templateIfNoMatch: "SOA_Template",
  },
  {
    id: "exc-2",
    name: "French & Italian Quote Terms",
    workflowCategory: "Trade Order",
    step: "SOA",
    priority: 2,
    conditions: mockGroup("AND", [
      mockRule("classification", "is one of", ["TRADE_ORDER"]),
      mockRule("language", "is one of", ["French", "Italian"]),
    ]),
    templateIfMatch: "SOA_ASO_QuoteTerms (Copy 2)",
    templateIfNoMatch: "SOA_ASO_QuoteTerms (Copy)",
  },
  {
    id: "exc-3",
    name: "APAC High-Value OU Override",
    workflowCategory: "Post Order Booking",
    step: "Order Creation",
    priority: 1,
    conditions: mockGroup("AND", [
      mockRule("classification", "is one of", ["WORK_ORDER", "QUOTE_REQUEST"]),
      mockGroup("OR", [
        mockRule("operatingUnit", "is one of", ["KRS-OU-7003", "KRS-OU-8004"]),
        mockRule("billToCountry", "is one of", ["Japan"]),
      ]),
    ]),
    templateIfMatch: "Order Status Update",
    templateIfNoMatch: "Order Hold Follow-Up",
  },
  {
    id: "exc-4",
    name: "India/UAE Credit Hold",
    workflowCategory: "Post Order Booking",
    step: "AI Order Validation",
    priority: 3,
    conditions: mockGroup("AND", [mockRule("billToCountry", "is one of", ["India", "UAE"])]),
    templateIfMatch: "Credit Hold Notification",
    templateIfNoMatch: "",
  },
  {
    id: "exc-5",
    name: "FCNV Escalation — Priority Accounts",
    workflowCategory: "FCNV",
    step: "Email & Classify",
    priority: 1,
    conditions: mockGroup("AND", [mockRule("customerNumber", "contains", ["90210", "90211", "90244"])]),
    templateIfMatch: "Order Escalation",
    templateIfNoMatch: "Test_pranay",
  },
  {
    id: "exc-6",
    name: "No-Language Trade Order Fallback",
    workflowCategory: "Trade Order",
    step: "Order Creation",
    priority: 5,
    conditions: mockGroup("AND", [mockRule("language", "is one of", ["No Language"])]),
    templateIfMatch: "SOA_ASO_PATerms",
    templateIfNoMatch: "",
  },
];

export function EmailTemplatePage({
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
  onNavigateCreateEmailTemplate,
  onNavigateEditEmailTemplate,
  onNavigateCreateException,
  onNavigateEditException,
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
  onNavigateCreateEmailTemplate?: () => void;
  onNavigateEditEmailTemplate?: (template: EmailTemplate) => void;
  onNavigateCreateException?: () => void;
  onNavigateEditException?: (exception: TemplateException) => void;
}) {
  // Which tab to land on — read once from ?tab= so navigating back from the (now full-page) Exception
  // editor returns to the Exceptions tab instead of resetting to Templates.
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");

  // Search — shared toolbar search box, live filtering (no debounce) since this is local mock data.
  const [searchQuery, setSearchQuery] = useState("");
  const updateSearch = (v: string) => { setSearchQuery(v); setPage(1); };

  // Row data — stateful (not the static INITIAL_TEMPLATES) so Duplicate/Delete can actually add/remove rows.
  const [templates, setTemplates] = useState<EmailTemplate[]>(() => loadEmailTemplates(INITIAL_TEMPLATES));

  // Persist every change (create/edit via the editor, Duplicate, Delete) so the list — and each template's
  // sample data — survives navigating away and back, or a page reload.
  useEffect(() => {
    saveEmailTemplates(templates);
  }, [templates]);

  // Duplicate — inserts a real copy right after the original, named the same way the reference data does
  // it ("X (Copy)", "X (Copy 2)", ...) rather than just re-using "(Copy)" if one already exists.
  const duplicateTemplate = (t: EmailTemplate) => {
    const copyPattern = new RegExp(`^${t.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(Copy(?: (\\d+))?\\)$`);
    const existingCopyNumbers = templates
      .map((existing) => existing.name.match(copyPattern)?.[1])
      .filter((n): n is string => n !== undefined)
      .map(Number);
    const hasBareCopy = templates.some((existing) => existing.name === `${t.name} (Copy)`);
    const nextNumber = existingCopyNumbers.length > 0 ? Math.max(...existingCopyNumbers) + 1 : hasBareCopy ? 2 : null;
    const newName = nextNumber ? `${t.name} (Copy ${nextNumber})` : `${t.name} (Copy)`;
    const copy: EmailTemplate = { ...t, id: `${t.id}-copy-${Date.now()}`, name: newName, updatedAt: new Date().toISOString() };
    setTemplates((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
    toast.success(`Duplicated "${t.name}"`);
  };

  // Delete — gated behind a confirmation modal rather than firing immediately from the row icon.
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setTemplates((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    toast.error(`Deleted "${deleteTarget.name}"`);
    setDeleteTarget(null);
  };

  // Per-column filters — same funnel-icon-in-header convention as EmailTable.
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const columnFilterOptions = (key: string): [string, number][] => {
    const counts: Record<string, number> = {};
    for (const t of templates) {
      const v = columnDisplayValue(key as ColumnKey, t);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };
  const toggleColumnFilterValue = (key: string, value: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      const set = new Set(next[key] ?? []);
      if (set.has(value)) set.delete(value); else set.add(value);
      next[key] = set;
      return next;
    });
    setPage(1);
  };
  const clearColumnFilter = (key: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: new Set() }));
    setPage(1);
  };

  // Category + Language — staged multi-select toolbar filters, copied from NewOverviewPage's
  // Classification/Interval pattern: always visible, picks stage in `pending` until Apply commits them
  // into `columnFilters` (the same state the per-column funnel filters on the other columns write to).
  const appliedCategories = Array.from(columnFilters.category ?? []);
  const appliedLanguages = Array.from(columnFilters.language ?? []);
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const [pendingLanguages, setPendingLanguages] = useState<string[]>([]);
  const { openKey, setOpenKey, registerRef } = useExclusiveOpen();
  const categoryDirty = pendingCategories.slice().sort().join("|") !== appliedCategories.slice().sort().join("|");
  const languageDirty = pendingLanguages.slice().sort().join("|") !== appliedLanguages.slice().sort().join("|");
  const toolbarFiltersDirty = categoryDirty || languageDirty;
  const toggleCategory = (c: string) => setPendingCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleAllCategories = () => setPendingCategories((prev) => (prev.length === CATEGORIES.length ? [] : [...CATEGORIES]));
  const toggleLanguage = (l: string) => setPendingLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  const toggleAllLanguages = () => setPendingLanguages((prev) => (prev.length === LANGUAGES.length ? [] : [...LANGUAGES]));
  const applyToolbarFilters = () => {
    setColumnFilters((prev) => ({ ...prev, category: new Set(pendingCategories), language: new Set(pendingLanguages) }));
    setOpenKey(null);
    setPage(1);
  };
  const resetToolbarFilters = () => {
    setPendingCategories(appliedCategories);
    setPendingLanguages(appliedLanguages);
  };

  const [sortKey, setSortKey] = useState<ColumnKey>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const toggleSort = (key: ColumnKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const [rowDensity, setRowDensity] = useState<RowDensity>("large");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const changeRowsPerPage = (n: number) => { setRowsPerPage(n); setPage(1); };

  const sortedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = templates.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
      for (const col of COLUMNS) {
        const active = columnFilters[col.key];
        if (active && active.size > 0 && !active.has(columnDisplayValue(col.key, t))) return false;
      }
      return true;
    });
    filtered = filtered.slice().sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [templates, searchQuery, columnFilters, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const pageRows = sortedRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const rowPadY = rowDensity === "small" ? "py-1.5" : rowDensity === "medium" ? "py-2.5" : "py-3.5";

  // ─── Default Mapping tab state — same shape as the Templates state above, just scoped to mappings so
  // the two tabs' toolbars/tables/pagination don't collide. ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TemplateTab>(
    initialTab && (TAB_KEYS as readonly string[]).includes(initialTab) ? (initialTab as TemplateTab) : "templates"
  );

  const [mappingSearchQuery, setMappingSearchQuery] = useState("");
  const updateMappingSearch = (v: string) => { setMappingSearchQuery(v); setMappingPage(1); };

  const [mappings, setMappings] = useState<DefaultMapping[]>(INITIAL_MAPPINGS);

  const [mappingFormTarget, setMappingFormTarget] = useState<{ mapping: DefaultMapping | null } | null>(null);
  const [mappingDeleteTarget, setMappingDeleteTarget] = useState<DefaultMapping | null>(null);

  const saveMapping = (m: DefaultMapping) => {
    setMappings((prev) => {
      const exists = prev.some((x) => x.id === m.id);
      return exists ? prev.map((x) => (x.id === m.id ? m : x)) : [...prev, m];
    });
    toast.success(mappingFormTarget?.mapping ? "Mapping updated" : "Mapping created");
    setMappingFormTarget(null);
  };

  const confirmMappingDelete = () => {
    if (!mappingDeleteTarget) return;
    setMappings((prev) => prev.filter((x) => x.id !== mappingDeleteTarget.id));
    toast.error("Mapping deleted");
    setMappingDeleteTarget(null);
  };

  const [mappingColumnFilters, setMappingColumnFilters] = useState<Record<string, Set<string>>>({});
  const mappingColumnFilterOptions = (key: string): [string, number][] => {
    const counts: Record<string, number> = {};
    for (const m of mappings) {
      const v = m[key as MappingColumnKey];
      counts[v] = (counts[v] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };
  const toggleMappingColumnFilterValue = (key: string, value: string) => {
    setMappingColumnFilters((prev) => {
      const next = { ...prev };
      const set = new Set(next[key] ?? []);
      if (set.has(value)) set.delete(value); else set.add(value);
      next[key] = set;
      return next;
    });
    setMappingPage(1);
  };
  const clearMappingColumnFilter = (key: string) => {
    setMappingColumnFilters((prev) => ({ ...prev, [key]: new Set() }));
    setMappingPage(1);
  };

  const appliedMappingWorkflowTypes = Array.from(mappingColumnFilters.workflowType ?? []);
  const appliedMappingLanguages = Array.from(mappingColumnFilters.language ?? []);
  const [pendingMappingWorkflowTypes, setPendingMappingWorkflowTypes] = useState<string[]>([]);
  const [pendingMappingLanguages, setPendingMappingLanguages] = useState<string[]>([]);
  const { openKey: mappingOpenKey, setOpenKey: setMappingOpenKey, registerRef: registerMappingRef } = useExclusiveOpen();
  const mappingWorkflowTypeDirty = pendingMappingWorkflowTypes.slice().sort().join("|") !== appliedMappingWorkflowTypes.slice().sort().join("|");
  const mappingLanguageDirty = pendingMappingLanguages.slice().sort().join("|") !== appliedMappingLanguages.slice().sort().join("|");
  const mappingToolbarFiltersDirty = mappingWorkflowTypeDirty || mappingLanguageDirty;
  const toggleMappingWorkflowType = (c: string) => setPendingMappingWorkflowTypes((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleAllMappingWorkflowTypes = () => setPendingMappingWorkflowTypes((prev) => (prev.length === CATEGORIES.length ? [] : [...CATEGORIES]));
  const toggleMappingLanguage = (l: string) => setPendingMappingLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  const toggleAllMappingLanguages = () => setPendingMappingLanguages((prev) => (prev.length === LANGUAGES.length ? [] : [...LANGUAGES]));
  const applyMappingToolbarFilters = () => {
    setMappingColumnFilters((prev) => ({ ...prev, workflowType: new Set(pendingMappingWorkflowTypes), language: new Set(pendingMappingLanguages) }));
    setMappingOpenKey(null);
    setMappingPage(1);
  };
  const resetMappingToolbarFilters = () => {
    setPendingMappingWorkflowTypes(appliedMappingWorkflowTypes);
    setPendingMappingLanguages(appliedMappingLanguages);
  };

  const [mappingSortKey, setMappingSortKey] = useState<MappingColumnKey>("workflowType");
  const [mappingSortDirection, setMappingSortDirection] = useState<"asc" | "desc">("asc");
  const toggleMappingSort = (key: MappingColumnKey) => {
    if (mappingSortKey === key) {
      setMappingSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setMappingSortKey(key);
      setMappingSortDirection("asc");
    }
  };

  const [mappingRowDensity, setMappingRowDensity] = useState<RowDensity>("large");
  const [mappingRowsPerPage, setMappingRowsPerPage] = useState(10);
  const [mappingPage, setMappingPage] = useState(1);
  const changeMappingRowsPerPage = (n: number) => { setMappingRowsPerPage(n); setMappingPage(1); };

  const sortedMappingRows = useMemo(() => {
    const q = mappingSearchQuery.trim().toLowerCase();
    let filtered = mappings.filter((m) => {
      if (q && !m.workflowType.toLowerCase().includes(q) && !m.defaultTemplate.toLowerCase().includes(q)) return false;
      for (const col of MAPPING_COLUMNS) {
        const active = mappingColumnFilters[col.key];
        if (active && active.size > 0 && !active.has(m[col.key])) return false;
      }
      return true;
    });
    filtered = filtered.slice().sort((a, b) => {
      const cmp = a[mappingSortKey].localeCompare(b[mappingSortKey], undefined, { sensitivity: "base" });
      return mappingSortDirection === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [mappings, mappingSearchQuery, mappingColumnFilters, mappingSortKey, mappingSortDirection]);

  const mappingTotalPages = Math.max(1, Math.ceil(sortedMappingRows.length / mappingRowsPerPage));
  const mappingPageRows = sortedMappingRows.slice((mappingPage - 1) * mappingRowsPerPage, mappingPage * mappingRowsPerPage);

  const mappingRowPadY = mappingRowDensity === "small" ? "py-1.5" : mappingRowDensity === "medium" ? "py-2.5" : "py-3.5";

  // ─── Exceptions tab state — creating/editing now happens on its own page (ExceptionEditorPage, same
  // pattern as the Email Template editor), which reads/writes localStorage directly, so this list is loaded
  // from storage (not just INITIAL_EXCEPTIONS) and re-synced whenever it changes here (i.e. on delete). ────
  const [exceptionSearchQuery, setExceptionSearchQuery] = useState("");
  const [exceptions, setExceptions] = useState<TemplateException[]>(() => loadTemplateExceptions(INITIAL_EXCEPTIONS));
  const [exceptionDeleteTarget, setExceptionDeleteTarget] = useState<TemplateException | null>(null);

  useEffect(() => {
    saveTemplateExceptions(exceptions);
  }, [exceptions]);

  const confirmExceptionDelete = () => {
    if (!exceptionDeleteTarget) return;
    setExceptions((prev) => prev.filter((x) => x.id !== exceptionDeleteTarget.id));
    toast.error("Exception deleted");
    setExceptionDeleteTarget(null);
  };

  const sortedExceptions = useMemo(() => {
    const q = exceptionSearchQuery.trim().toLowerCase();
    return exceptions
      .filter((e) => !q || e.name.toLowerCase().includes(q) || e.workflowCategory.toLowerCase().includes(q) || e.templateIfMatch.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => a.priority - b.priority);
  }, [exceptions, exceptionSearchQuery]);

  return (
    <>
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
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

        <main className="flex-1 min-h-0 flex flex-col w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 gap-4 overflow-hidden">
          {/* Page header */}
          <div>
            <Breadcrumbs items={[{ label: "Admin" }, { label: "Email" }, { label: TAB_LABELS[activeTab] }]} />
            <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">
              {activeTab === "templates" ? "Email Templates" : activeTab === "mapping" ? "Template Default Mappings" : "Template Exceptions"}
            </h1>
            <p className="text-[12px] text-[#97999B] mt-0.5">
              {activeTab === "templates"
                ? "Manage email templates for automated responses"
                : activeTab === "mapping"
                  ? "Configure which template auto-selects for each workflow type, step, and email classification."
                  : "Admin-defined rules that can override the plain category/step/country/language default for a workflow category and step (e.g. based on Operating Unit)."}
            </p>
          </div>

          {/* Content card: toolbar + table */}
          {activeTab === "templates" ? (
          <div className="flex-1 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
              {/* Templates / Default Mapping / Exceptions — three views of the same "which template applies"
                  system, previously separate pages under the same "Email" nav item, now one page since
                  switching between them is a single admin workflow, not three destinations. */}
              <div className="inline-flex items-center gap-1 p-1 rounded-[8px] bg-[#F1F2F4] shrink-0">
                {TAB_KEYS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 rounded-[6px] text-[12.5px] font-semibold transition-colors cursor-pointer ${
                      activeTab === tab ? "bg-white text-[#262626] shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-[#666666] hover:text-[#262626]"
                    }`}
                  >
                    {TAB_LABELS[tab]}
                  </button>
                ))}
              </div>

              <TableToolbarSearch value={searchQuery} onCommit={updateSearch} placeholder="Search templates..." />

              <div className="flex items-center gap-2.5 flex-wrap ml-auto">
                <TableToolbarMultiSelect
                  label="Category"
                  options={CATEGORIES}
                  pending={pendingCategories}
                  onToggle={toggleCategory}
                  onToggleAll={toggleAllCategories}
                  onClear={() => setPendingCategories([])}
                  open={openKey === "category"}
                  onOpenChange={(o) => setOpenKey(o ? "category" : null)}
                  containerRef={registerRef("category")}
                  appliedCount={appliedCategories.length}
                  dirty={categoryDirty}
                />
                <TableToolbarMultiSelect
                  label="Language"
                  options={LANGUAGES}
                  pending={pendingLanguages}
                  onToggle={toggleLanguage}
                  onToggleAll={toggleAllLanguages}
                  onClear={() => setPendingLanguages([])}
                  open={openKey === "language"}
                  onOpenChange={(o) => setOpenKey(o ? "language" : null)}
                  containerRef={registerRef("language")}
                  appliedCount={appliedLanguages.length}
                  dirty={languageDirty}
                />

                <TableToolbarApplyReset dirty={toolbarFiltersDirty} onApply={applyToolbarFilters} onReset={resetToolbarFilters} />

                <div className="w-px h-5 bg-[#E2E6E9]" />

                <button
                  onClick={() => (onNavigateCreateEmailTemplate ? onNavigateCreateEmailTemplate() : toast.info("Create Template — coming soon"))}
                  title="Create Template"
                  className="flex items-center justify-center size-[36px] rounded-[8px] text-white hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#F7F7F7]">
                    {COLUMNS.map((col) => {
                      const active = sortKey === col.key;
                      const SortIcon = sortDirection === "desc" ? ArrowDown : ArrowUp;
                      return (
                        <th key={col.key} className="group sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 cursor-pointer">
                              <span className={`text-[12px] font-semibold ${active ? "text-[#262626]" : "text-[#4D4D4D]"}`}>{col.label}</span>
                              {active ? (
                                <SortIcon size={12} style={{ color: EMAIL_TABLE_NAVY }} />
                              ) : (
                                <ChevronsUpDown size={12} className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" style={{ color: "#97999B" }} />
                              )}
                            </button>
                            {col.key !== "category" && col.key !== "language" && (
                              <EmailTableColumnFilterButton
                                colKey={col.key}
                                getOptions={columnFilterOptions}
                                selected={columnFilters[col.key] ?? EMPTY_SET}
                                onToggle={(v) => toggleColumnFilterValue(col.key, v)}
                                onClear={() => clearColumnFilter(col.key)}
                              />
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                      <span className="text-[12px] font-semibold text-[#4D4D4D]">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-[13px] text-[#97999B]">No templates match your filters</td>
                    </tr>
                  ) : (
                    pageRows.map((t) => {
                      const pill = CATEGORY_PILL[t.category] ?? CATEGORY_PILL.Uncategorized;
                      return (
                        <tr
                          key={t.id}
                          onClick={() => onNavigateEditEmailTemplate?.(t)}
                          className="group hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                        >
                          <td className={`px-4 ${rowPadY} max-w-[220px] border-b border-[#DEDEDE]`}>
                            <TruncateTooltip label={t.name} className="text-[12.5px] font-semibold text-[#262626]" />
                          </td>
                          <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: pill.bg, color: pill.fg }}>
                              {t.category}
                            </span>
                          </td>
                          <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                            <span className={`text-[12.5px] ${t.language === "No Language" ? "text-[#97999B]" : "text-[#4D4D4D]"}`}>
                              {t.language === "No Language" ? "-" : t.language}
                            </span>
                          </td>
                          <td className={`px-4 ${rowPadY} max-w-[280px] border-b border-[#DEDEDE]`}>
                            <TruncateTooltip label={t.subject} className="text-[12.5px] text-[#4D4D4D]" />
                          </td>
                          <td className={`px-4 ${rowPadY} max-w-[200px] border-b border-[#DEDEDE]`}>
                            <TruncateTooltip label={t.createdBy} className="text-[12.5px] text-[#4D4D4D]" />
                          </td>
                          <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                            <span className="text-[12px] text-[#97999B]">{formatUpdatedAt(t.updatedAt)}</span>
                          </td>
                          <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <EmailTableTooltip label="Edit">
                                <button
                                  onClick={() => onNavigateEditEmailTemplate?.(t)}
                                  className="flex items-center justify-center size-[28px] rounded-[6px] text-[#666666] hover:bg-[#F1F2F4] hover:text-[#262626] cursor-pointer transition-colors"
                                >
                                  <SquarePen size={14} />
                                </button>
                              </EmailTableTooltip>
                              <EmailTableTooltip label="Duplicate">
                                <button
                                  onClick={() => duplicateTemplate(t)}
                                  className="flex items-center justify-center size-[28px] rounded-[6px] text-[#666666] hover:bg-[#F1F2F4] hover:text-[#262626] cursor-pointer transition-colors"
                                >
                                  <Copy size={14} />
                                </button>
                              </EmailTableTooltip>
                              <EmailTableTooltip label="Delete">
                                <button
                                  onClick={() => setDeleteTarget(t)}
                                  className="flex items-center justify-center size-[28px] rounded-[6px] text-[#666666] hover:bg-[#FAEBEB] hover:text-[#C83737] cursor-pointer transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </EmailTableTooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              showing={pageRows.length}
              total={sortedRows.length}
              density={rowDensity}
              onDensityChange={setRowDensity}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={changeRowsPerPage}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              densityTooltips={{ small: "Compact", medium: "Medium", large: "Comfortable" }}
            />
          </div>
          ) : activeTab === "mapping" ? (
          <div className="flex-1 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
              <div className="inline-flex items-center gap-1 p-1 rounded-[8px] bg-[#F1F2F4] shrink-0">
                {TAB_KEYS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 rounded-[6px] text-[12.5px] font-semibold transition-colors cursor-pointer ${
                      activeTab === tab ? "bg-white text-[#262626] shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-[#666666] hover:text-[#262626]"
                    }`}
                  >
                    {TAB_LABELS[tab]}
                  </button>
                ))}
              </div>

              <TableToolbarSearch value={mappingSearchQuery} onCommit={updateMappingSearch} placeholder="Search mappings..." />

              <div className="flex items-center gap-2.5 flex-wrap ml-auto">
                <TableToolbarMultiSelect
                  label="Workflow Type"
                  options={CATEGORIES}
                  pending={pendingMappingWorkflowTypes}
                  onToggle={toggleMappingWorkflowType}
                  onToggleAll={toggleAllMappingWorkflowTypes}
                  onClear={() => setPendingMappingWorkflowTypes([])}
                  open={mappingOpenKey === "workflowType"}
                  onOpenChange={(o) => setMappingOpenKey(o ? "workflowType" : null)}
                  containerRef={registerMappingRef("workflowType")}
                  appliedCount={appliedMappingWorkflowTypes.length}
                  dirty={mappingWorkflowTypeDirty}
                />
                <TableToolbarMultiSelect
                  label="Language"
                  options={LANGUAGES}
                  pending={pendingMappingLanguages}
                  onToggle={toggleMappingLanguage}
                  onToggleAll={toggleAllMappingLanguages}
                  onClear={() => setPendingMappingLanguages([])}
                  open={mappingOpenKey === "language"}
                  onOpenChange={(o) => setMappingOpenKey(o ? "language" : null)}
                  containerRef={registerMappingRef("language")}
                  appliedCount={appliedMappingLanguages.length}
                  dirty={mappingLanguageDirty}
                />

                <TableToolbarApplyReset dirty={mappingToolbarFiltersDirty} onApply={applyMappingToolbarFilters} onReset={resetMappingToolbarFilters} />

                <div className="w-px h-5 bg-[#E2E6E9]" />

                <button
                  onClick={() => setMappingFormTarget({ mapping: null })}
                  title="Add Mapping"
                  className="flex items-center justify-center size-[36px] rounded-[8px] text-white hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: EMAIL_TABLE_NAVY }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full min-w-[1150px] border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#F7F7F7]">
                    {MAPPING_COLUMNS.map((col) => {
                      const active = mappingSortKey === col.key;
                      const SortIcon = mappingSortDirection === "desc" ? ArrowDown : ArrowUp;
                      return (
                        <th key={col.key} className="group sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => toggleMappingSort(col.key)} className="flex items-center gap-1 cursor-pointer">
                              <span className={`text-[12px] font-semibold ${active ? "text-[#262626]" : "text-[#4D4D4D]"}`}>{col.label}</span>
                              {active ? (
                                <SortIcon size={12} style={{ color: EMAIL_TABLE_NAVY }} />
                              ) : (
                                <ChevronsUpDown size={12} className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" style={{ color: "#97999B" }} />
                              )}
                            </button>
                            {col.key !== "workflowType" && col.key !== "language" && (
                              <EmailTableColumnFilterButton
                                colKey={col.key}
                                getOptions={mappingColumnFilterOptions}
                                selected={mappingColumnFilters[col.key] ?? EMPTY_SET}
                                onToggle={(v) => toggleMappingColumnFilterValue(col.key, v)}
                                onClear={() => clearMappingColumnFilter(col.key)}
                              />
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                      <span className="text-[12px] font-semibold text-[#4D4D4D]">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mappingPageRows.length === 0 ? (
                    <tr>
                      <td colSpan={MAPPING_COLUMNS.length + 1} className="px-4 py-16 text-center text-[13px] text-[#97999B]">No mappings match your filters</td>
                    </tr>
                  ) : (
                    mappingPageRows.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => setMappingFormTarget({ mapping: m })}
                        className="group hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                      >
                        <td className={`px-4 ${mappingRowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <span className="text-[12.5px] font-semibold text-[#262626]">{m.workflowType}</span>
                        </td>
                        <td className={`px-4 ${mappingRowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <span className="text-[12.5px] text-[#4D4D4D]">{m.step}</span>
                        </td>
                        <td className={`px-4 ${mappingRowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          {m.classification === MAPPING_WILDCARD ? (
                            <span className="text-[12px] text-[#97999B]">{MAPPING_WILDCARD}</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F2F4] text-[#4D4D4D]">{m.classification}</span>
                          )}
                        </td>
                        <td className={`px-4 ${mappingRowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <span className={`text-[12.5px] ${m.country === MAPPING_WILDCARD ? "text-[#97999B]" : "text-[#4D4D4D]"}`}>{m.country}</span>
                        </td>
                        <td className={`px-4 ${mappingRowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <span className={`text-[12.5px] ${m.language === MAPPING_WILDCARD ? "text-[#97999B]" : "text-[#4D4D4D]"}`}>{m.language}</span>
                        </td>
                        <td className={`px-4 ${mappingRowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <span className={`text-[12.5px] ${m.operatingUnit === MAPPING_WILDCARD ? "text-[#97999B]" : "text-[#4D4D4D]"}`}>{m.operatingUnit}</span>
                        </td>
                        <td className={`px-4 ${mappingRowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <span className="text-[12.5px] font-semibold text-[#262626]">{m.defaultTemplate}</span>
                        </td>
                        <td className={`px-4 ${mappingRowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <EmailTableTooltip label="Edit">
                              <button
                                onClick={() => setMappingFormTarget({ mapping: m })}
                                className="flex items-center justify-center size-[28px] rounded-[6px] text-[#666666] hover:bg-[#F1F2F4] hover:text-[#262626] cursor-pointer transition-colors"
                              >
                                <SquarePen size={14} />
                              </button>
                            </EmailTableTooltip>
                            <EmailTableTooltip label="Delete">
                              <button
                                onClick={() => setMappingDeleteTarget(m)}
                                className="flex items-center justify-center size-[28px] rounded-[6px] text-[#666666] hover:bg-[#FAEBEB] hover:text-[#C83737] cursor-pointer transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </EmailTableTooltip>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              showing={mappingPageRows.length}
              total={sortedMappingRows.length}
              density={mappingRowDensity}
              onDensityChange={setMappingRowDensity}
              rowsPerPage={mappingRowsPerPage}
              onRowsPerPageChange={changeMappingRowsPerPage}
              page={mappingPage}
              totalPages={mappingTotalPages}
              onPageChange={setMappingPage}
              densityTooltips={{ small: "Compact", medium: "Medium", large: "Comfortable" }}
            />
          </div>
          ) : (
          <div className="flex-1 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
              <div className="inline-flex items-center gap-1 p-1 rounded-[8px] bg-[#F1F2F4] shrink-0">
                {TAB_KEYS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 rounded-[6px] text-[12.5px] font-semibold transition-colors cursor-pointer ${
                      activeTab === tab ? "bg-white text-[#262626] shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-[#666666] hover:text-[#262626]"
                    }`}
                  >
                    {TAB_LABELS[tab]}
                  </button>
                ))}
              </div>

              <TableToolbarSearch value={exceptionSearchQuery} onCommit={setExceptionSearchQuery} placeholder="Search exceptions..." />

              <button
                onClick={() => onNavigateCreateException?.()}
                className="ml-auto flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                style={{ backgroundColor: EMAIL_TABLE_NAVY }}
              >
                <Plus size={15} />
                Add Exception
              </button>
            </div>

            {sortedExceptions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-5">
                <p className="text-[13px] text-[#97999B]">No exceptions configured yet. Click "Add Exception" to create one.</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full min-w-[1150px] border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-[#F7F7F7]">
                      {["Priority", "Name", "Workflow Category", "Step", "Conditions", "If Match", "If No Match", "Actions"].map((label) => (
                        <th key={label} className="sticky top-0 z-10 bg-[#F7F7F7] px-4 h-[42px] text-left whitespace-nowrap border-b border-[#DEDEDE]">
                          <span className="text-[12px] font-semibold text-[#4D4D4D]">{label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedExceptions.map((e) => (
                      <tr
                        key={e.id}
                        onClick={() => onNavigateEditException?.(e)}
                        className="group hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap border-b border-[#DEDEDE]">
                          <span className="inline-flex items-center justify-center min-w-[24px] h-[22px] px-1.5 rounded-[6px] bg-[#F1F2F4] text-[11.5px] font-bold text-[#4D4D4D]">{e.priority}</span>
                        </td>
                        <td className="px-4 py-3.5 max-w-[220px] border-b border-[#DEDEDE]">
                          <TruncateTooltip label={e.name} className="text-[12.5px] font-semibold text-[#262626]" />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap border-b border-[#DEDEDE]">
                          <span className="text-[12.5px] text-[#4D4D4D]">{e.workflowCategory}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap border-b border-[#DEDEDE]">
                          <span className="text-[12.5px] text-[#4D4D4D]">{e.step || "—"}</span>
                        </td>
                        <td className="px-4 py-3.5 max-w-[320px] border-b border-[#DEDEDE]">
                          <TruncateTooltip label={summarizeConditionTree(e.conditions, EXCEPTION_FIELDS) || "—"} className="text-[12px] text-[#4D4D4D]" />
                        </td>
                        <td className="px-4 py-3.5 max-w-[180px] border-b border-[#DEDEDE]">
                          <TruncateTooltip label={e.templateIfMatch} className="text-[12.5px] font-semibold text-[#262626]" />
                        </td>
                        <td className="px-4 py-3.5 max-w-[180px] border-b border-[#DEDEDE]">
                          <span className={`text-[12.5px] ${e.templateIfNoMatch ? "text-[#4D4D4D]" : "text-[#97999B]"}`}>{e.templateIfNoMatch || "—"}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap border-b border-[#DEDEDE]">
                          <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                            <EmailTableTooltip label="Edit">
                              <button
                                onClick={() => onNavigateEditException?.(e)}
                                className="flex items-center justify-center size-[28px] rounded-[6px] text-[#666666] hover:bg-[#F1F2F4] hover:text-[#262626] cursor-pointer transition-colors"
                              >
                                <SquarePen size={14} />
                              </button>
                            </EmailTableTooltip>
                            <EmailTableTooltip label="Delete">
                              <button
                                onClick={() => setExceptionDeleteTarget(e)}
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
          )}
        </main>
      </div>
    </div>

    {deleteTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
        <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
            <span className="text-[16px] font-bold text-[#262626]">Delete template</span>
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

    {mappingFormTarget && (
      <MappingModal mapping={mappingFormTarget.mapping} onClose={() => setMappingFormTarget(null)} onSave={saveMapping} />
    )}

    {mappingDeleteTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setMappingDeleteTarget(null)} />
        <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
            <span className="text-[16px] font-bold text-[#262626]">Delete mapping</span>
            <button onClick={() => setMappingDeleteTarget(null)} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5">
            <p className="text-[13px] text-[#4D4D4D] leading-[1.6]">
              Are you sure you want to delete the mapping for{" "}
              <span className="font-semibold text-[#262626]">"{mappingDeleteTarget.workflowType} / {mappingDeleteTarget.step}"</span>? This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
            <button
              onClick={() => setMappingDeleteTarget(null)}
              className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmMappingDelete}
              className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
              style={{ backgroundColor: "#C83737" }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {exceptionDeleteTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setExceptionDeleteTarget(null)} />
        <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
            <span className="text-[16px] font-bold text-[#262626]">Delete exception</span>
            <button onClick={() => setExceptionDeleteTarget(null)} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5">
            <p className="text-[13px] text-[#4D4D4D] leading-[1.6]">
              Are you sure you want to delete the exception for{" "}
              <span className="font-semibold text-[#262626]">"{exceptionDeleteTarget.name}"</span>? This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
            <button
              onClick={() => setExceptionDeleteTarget(null)}
              className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmExceptionDelete}
              className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
              style={{ backgroundColor: "#C83737" }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
