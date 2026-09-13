import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ChevronDown, ChevronsUpDown, Plus, SquarePen, Trash2, X } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { EMAIL_TABLE_NAVY, EMPTY_SET, EmailTableColumnFilterButton, EmailTableTooltip } from "../../components/common/EmailTable";
import { TableToolbarApplyReset, TableToolbarMultiSelect, TableToolbarSearch, useExclusiveOpen } from "../../components/common/TableToolbar";
import { TablePagination, type RowDensity } from "../../components/common/TablePagination";
import { CLASSIFICATIONS } from "../command-center/emailData";
import { CATEGORIES, LANGUAGES, INITIAL_TEMPLATES } from "./EmailTemplatePage";

// Matching criteria a mapping can be scoped by, beyond just Workflow Type + Step — each independently
// optional via the "Any (wildcard)" option, so a mapping can be as broad or as specific as needed.
const STEPS = ["Email & Classify", "CCC Creation", "AI Order Validation", "Order Creation", "SOA"];
const COUNTRIES = ["India", "Japan", "UAE", "UK", "USA"];
const OPERATING_UNITS = ["KRS-OU-4123", "KRS-OU-5001", "KRS-OU-6002", "KRS-OU-7003", "KRS-OU-8004", "USO-OU-8213"];
const WILDCARD = "Any (wildcard)";

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

type ColumnKey = "workflowType" | "step" | "classification" | "country" | "language" | "operatingUnit" | "defaultTemplate";

// Same shape/order as EmailTemplatePage's COLUMNS — Workflow Type and Language get the toolbar's quick
// multi-select (mirroring that page's Category + Language), everything else gets a per-column funnel filter.
const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "workflowType", label: "Workflow Type" },
  { key: "step", label: "Step" },
  { key: "classification", label: "Classification" },
  { key: "country", label: "Country" },
  { key: "language", label: "Language" },
  { key: "operatingUnit", label: "Operating Unit (OU)" },
  { key: "defaultTemplate", label: "Default Template" },
];

const INITIAL_MAPPINGS: DefaultMapping[] = [
  { id: "1", workflowType: "Work Order", step: "Order Creation", classification: "TRADE_ORDER", country: WILDCARD, language: "English", operatingUnit: WILDCARD, defaultTemplate: "test_from_2" },
  { id: "2", workflowType: "Trade Order", step: "CCC Creation", classification: WILDCARD, country: "India", language: "English", operatingUnit: "KRS-OU-4123", defaultTemplate: "Order Confirmation" },
  { id: "3", workflowType: "Post Order Booking", step: "SOA", classification: "WORK_ORDER", country: WILDCARD, language: WILDCARD, operatingUnit: WILDCARD, defaultTemplate: "SOA_Ack_Template" },
];

// Compact single-select dropdown for the Add/Edit modal's fields — plain button + absolute menu, same
// visual language as the rest of this app's simple pickers (e.g. SoaBody's template filters).
function SelectField({
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
  const [classification, setClassification] = useState(mapping?.classification ?? WILDCARD);
  const [country, setCountry] = useState(mapping?.country ?? WILDCARD);
  const [language, setLanguage] = useState(mapping?.language ?? WILDCARD);
  const [operatingUnit, setOperatingUnit] = useState(mapping?.operatingUnit ?? WILDCARD);
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
            <SelectField label="Workflow Type" value={workflowType} options={CATEGORIES} onChange={(v) => { setWorkflowType(v); setDefaultTemplate(""); }} placeholder="Workflow Type" />
            <SelectField
              label="Step"
              value={step}
              options={STEPS}
              onChange={setStep}
              placeholder="Step"
              disabled={!workflowType}
              disabledHelperText="Select a workflow type first"
            />
          </div>

          <SelectField
            label="Classification"
            value={classification}
            options={[WILDCARD, ...CLASSIFICATIONS]}
            onChange={setClassification}
            helperText={`Leave as "${WILDCARD}" to match all classifications for this workflow/step.`}
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Country" value={country} options={[WILDCARD, ...COUNTRIES]} onChange={setCountry} />
            <SelectField label="Language" value={language} options={[WILDCARD, ...LANGUAGES]} onChange={setLanguage} />
          </div>

          <div className="pt-1 border-t border-[#E2E6E9]">
            <p className="text-[11px] font-bold text-[#666666] uppercase tracking-wide pt-3 mb-3">Flex Fields</p>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Operating Unit (OU)" value={operatingUnit} options={[WILDCARD, ...OPERATING_UNITS]} onChange={setOperatingUnit} />
            </div>
          </div>

          <SelectField
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

export function DefaultMappingPage({
  onViewAllNotifications,
  onLogout,
  onNavigateHome,
  onNavigateCommandCenterOverview,
  onNavigateCommandCenterEmailView,
  onNavigateNewOverview,
  onNavigateHoldManagementOverview,
  onNavigateOrderListing,
  onNavigateReleasedOrders,
  onNavigateCommunication,
  onNavigateEmailTemplate,
  onNavigateDefaultMapping,
  onNavigateFeedbackCenter,
  onNavigateReview,
  onNavigateEmailWorkflow,
}: {
  onViewAllNotifications: () => void;
  onLogout?: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateCommunication?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateDefaultMapping?: () => void;
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
  onNavigateReview?: () => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  // Search — shared toolbar search box, live filtering (no debounce) since this is local mock data.
  const [searchQuery, setSearchQuery] = useState("");
  const updateSearch = (v: string) => { setSearchQuery(v); setPage(1); };

  // Row data — stateful (not the static INITIAL_MAPPINGS) so Add/Edit/Delete can actually mutate rows.
  const [mappings, setMappings] = useState<DefaultMapping[]>(INITIAL_MAPPINGS);

  const [formTarget, setFormTarget] = useState<{ mapping: DefaultMapping | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DefaultMapping | null>(null);

  const saveMapping = (m: DefaultMapping) => {
    setMappings((prev) => {
      const exists = prev.some((x) => x.id === m.id);
      return exists ? prev.map((x) => (x.id === m.id ? m : x)) : [...prev, m];
    });
    toast.success(formTarget?.mapping ? "Mapping updated" : "Mapping created");
    setFormTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setMappings((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    toast.error("Mapping deleted");
    setDeleteTarget(null);
  };

  // Per-column filters — same funnel-icon-in-header convention as EmailTable / EmailTemplatePage.
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const columnFilterOptions = (key: string): [string, number][] => {
    const counts: Record<string, number> = {};
    for (const m of mappings) {
      const v = m[key as ColumnKey];
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

  // Workflow Type + Language — staged multi-select toolbar filters, same pattern as EmailTemplatePage's
  // Category + Language: always visible, picks stage in `pending` until Apply commits them into
  // `columnFilters` (the same state the per-column funnel filters on the other columns write to).
  const appliedWorkflowTypes = Array.from(columnFilters.workflowType ?? []);
  const appliedLanguages = Array.from(columnFilters.language ?? []);
  const [pendingWorkflowTypes, setPendingWorkflowTypes] = useState<string[]>([]);
  const [pendingLanguages, setPendingLanguages] = useState<string[]>([]);
  const { openKey, setOpenKey, registerRef } = useExclusiveOpen();
  const workflowTypeDirty = pendingWorkflowTypes.slice().sort().join("|") !== appliedWorkflowTypes.slice().sort().join("|");
  const languageDirty = pendingLanguages.slice().sort().join("|") !== appliedLanguages.slice().sort().join("|");
  const toolbarFiltersDirty = workflowTypeDirty || languageDirty;
  const toggleWorkflowType = (c: string) => setPendingWorkflowTypes((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleAllWorkflowTypes = () => setPendingWorkflowTypes((prev) => (prev.length === CATEGORIES.length ? [] : [...CATEGORIES]));
  const toggleLanguage = (l: string) => setPendingLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  const toggleAllLanguages = () => setPendingLanguages((prev) => (prev.length === LANGUAGES.length ? [] : [...LANGUAGES]));
  const applyToolbarFilters = () => {
    setColumnFilters((prev) => ({ ...prev, workflowType: new Set(pendingWorkflowTypes), language: new Set(pendingLanguages) }));
    setOpenKey(null);
    setPage(1);
  };
  const resetToolbarFilters = () => {
    setPendingWorkflowTypes(appliedWorkflowTypes);
    setPendingLanguages(appliedLanguages);
  };

  const [sortKey, setSortKey] = useState<ColumnKey>("workflowType");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
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
    let filtered = mappings.filter((m) => {
      if (q && !m.workflowType.toLowerCase().includes(q) && !m.defaultTemplate.toLowerCase().includes(q)) return false;
      for (const col of COLUMNS) {
        const active = columnFilters[col.key];
        if (active && active.size > 0 && !active.has(m[col.key])) return false;
      }
      return true;
    });
    filtered = filtered.slice().sort((a, b) => {
      const cmp = a[sortKey].localeCompare(b[sortKey], undefined, { sensitivity: "base" });
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [mappings, searchQuery, columnFilters, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const pageRows = sortedRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const rowPadY = rowDensity === "small" ? "py-1.5" : rowDensity === "medium" ? "py-2.5" : "py-3.5";

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
            onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
            onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
            onNavigateNewOverview={onNavigateNewOverview}
            onNavigateHoldManagementOverview={onNavigateHoldManagementOverview}
            onNavigateOrderListing={onNavigateOrderListing}
            onNavigateReleasedOrders={onNavigateReleasedOrders}
            onNavigateCommunication={onNavigateCommunication}
            onNavigateEmailTemplate={onNavigateEmailTemplate}
            onNavigateDefaultMapping={onNavigateDefaultMapping}
            onNavigateFeedbackCenter={onNavigateFeedbackCenter}
            onNavigateReview={onNavigateReview}
            onNavigateEmailWorkflow={onNavigateEmailWorkflow}
          />
        </div>

        <main className="flex-1 min-h-0 flex flex-col w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 gap-4 overflow-hidden">
          {/* Page header */}
          <div>
            <Breadcrumbs items={[{ label: "Email", onClick: onNavigateEmailTemplate }, { label: "Default Mapping" }]} />
            <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Template Default Mappings</h1>
            <p className="text-[12px] text-[#97999B] mt-0.5">Configure which template auto-selects for each workflow type, step, and email classification.</p>
          </div>

          {/* Content card: toolbar + table */}
          <div className="flex-1 bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#DEDEDE] flex-wrap">
              <TableToolbarSearch value={searchQuery} onCommit={updateSearch} placeholder="Search mappings..." />

              <div className="flex items-center gap-2.5 flex-wrap ml-auto">
                <TableToolbarMultiSelect
                  label="Workflow Type"
                  options={CATEGORIES}
                  pending={pendingWorkflowTypes}
                  onToggle={toggleWorkflowType}
                  onToggleAll={toggleAllWorkflowTypes}
                  onClear={() => setPendingWorkflowTypes([])}
                  open={openKey === "workflowType"}
                  onOpenChange={(o) => setOpenKey(o ? "workflowType" : null)}
                  containerRef={registerRef("workflowType")}
                  appliedCount={appliedWorkflowTypes.length}
                  dirty={workflowTypeDirty}
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
                  onClick={() => setFormTarget({ mapping: null })}
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
                            {col.key !== "workflowType" && col.key !== "language" && (
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
                      <td colSpan={COLUMNS.length + 1} className="px-4 py-16 text-center text-[13px] text-[#97999B]">No mappings match your filters</td>
                    </tr>
                  ) : (
                    pageRows.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => setFormTarget({ mapping: m })}
                        className="group hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                      >
                        <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <span className="text-[12.5px] font-semibold text-[#262626]">{m.workflowType}</span>
                        </td>
                        <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <span className="text-[12.5px] text-[#4D4D4D]">{m.step}</span>
                        </td>
                        <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          {m.classification === WILDCARD ? (
                            <span className="text-[12px] text-[#97999B]">{WILDCARD}</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F2F4] text-[#4D4D4D]">{m.classification}</span>
                          )}
                        </td>
                        <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <span className={`text-[12.5px] ${m.country === WILDCARD ? "text-[#97999B]" : "text-[#4D4D4D]"}`}>{m.country}</span>
                        </td>
                        <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <span className={`text-[12.5px] ${m.language === WILDCARD ? "text-[#97999B]" : "text-[#4D4D4D]"}`}>{m.language}</span>
                        </td>
                        <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <span className={`text-[12.5px] ${m.operatingUnit === WILDCARD ? "text-[#97999B]" : "text-[#4D4D4D]"}`}>{m.operatingUnit}</span>
                        </td>
                        <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <span className="text-[12.5px] font-semibold text-[#262626]">{m.defaultTemplate}</span>
                        </td>
                        <td className={`px-4 ${rowPadY} whitespace-nowrap border-b border-[#DEDEDE]`}>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <EmailTableTooltip label="Edit">
                              <button
                                onClick={() => setFormTarget({ mapping: m })}
                                className="flex items-center justify-center size-[28px] rounded-[6px] text-[#666666] hover:bg-[#F1F2F4] hover:text-[#262626] cursor-pointer transition-colors"
                              >
                                <SquarePen size={14} />
                              </button>
                            </EmailTableTooltip>
                            <EmailTableTooltip label="Delete">
                              <button
                                onClick={() => setDeleteTarget(m)}
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
        </main>
      </div>
    </div>

    {formTarget && (
      <MappingModal mapping={formTarget.mapping} onClose={() => setFormTarget(null)} onSave={saveMapping} />
    )}

    {deleteTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
        <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
            <span className="text-[16px] font-bold text-[#262626]">Delete mapping</span>
            <button onClick={() => setDeleteTarget(null)} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5">
            <p className="text-[13px] text-[#4D4D4D] leading-[1.6]">
              Are you sure you want to delete the mapping for{" "}
              <span className="font-semibold text-[#262626]">"{deleteTarget.workflowType} / {deleteTarget.step}"</span>? This action cannot be undone.
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
    </>
  );
}
