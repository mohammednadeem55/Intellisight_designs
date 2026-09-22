import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Braces,
  ChevronDown,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  HelpCircle,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Copy,
  Palette,
  Pencil,
  Plus,
  Redo2,
  Search,
  Strikethrough,
  Underline,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { EmailTableTooltip } from "../../components/common/EmailTable";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { Button } from "../../components/common/Button";
import { INITIAL_TEMPLATES, type EmailTemplate } from "./EmailTemplatePage";
import { loadEmailTemplates, saveEmailTemplates } from "./emailTemplateStorage";

const CATEGORIES = ["Uncategorized", "Trade Order", "Work Order", "Post Order Booking", "FCNV"];
const LANGUAGES = ["No Language", "English", "French", "Italian", "Japanese"];
const FROM_EMAILS = ["Default From Email", "noreply@keysight.com", "orders@keysight.com", "support@keysight.com"];

// Sample values, one per merge tag — the single source of truth for every merge tag in this editor. Both
// the tag list (below) and the "Sample Data (JSON)" panel are derived from this object's keys, so adding
// a new field here is the only step needed for it to show up in both places, with no risk of the two lists
// drifting out of sync.
const SAMPLE_DATA: Record<string, string> = {
  Contact_Name_Text_only__c: "John Doe",
  Account: "Acme Corporation",
  account_id: "ACC-001234",
  address_id: "ADDR-005678",
  Received_Date_Time: "2026-08-24T10:30:00Z",
  Request_Type: "Trade Order",
  Request_Sub_Type: "New Order",
  Contact: "john.doe@example.com",
  Origin: "Email",
  CCC_Number: "CCC-2026-04521",
  Owner: "Sourish Sarkar",
  Address: "1400 Fountaingrove Pkwy, Santa Rosa, CA 95403",
  PO: "PO-778899",
  POAmount: "24500.00",
  Currency: "USD",
  Quote_Number: "Q-12345",
  Tax_Status: "Exempt",
  Incoterm: "DDP",
  company_name: "Acme Corporation",
  product_interest: "N1055A Probe",
  contact_phone: "+1 (555) 012-3456",
  contact_name: "John Doe",
};

// Replaces {{field_name}} tokens with their sample value for the Preview tab — unresolved tags (typos,
// fields not present in `data`) are left as-is rather than silently dropped.
function renderMergePreview(text: string, data: Record<string, string>): string {
  return text.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key: string) => (key in data ? data[key] : match));
}

// Editable raw-JSON textarea for the Sample Data panel — plain monospace editing rather than a
// syntax-highlighted read-only view, since the whole point is that the user can change these values (and
// add new keys, which then also become insertable merge tags) directly. Kept as a fallback for pasting
// bulk data; the friendlier key/value row editor below is the default.
function SampleDataEditor({ value, onChange, error }: { value: string; onChange: (v: string) => void; error: string | null }) {
  return (
    <div className="flex flex-col">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-full h-[320px] px-4 py-3 text-[12px] font-mono leading-[1.6] text-[#374151] outline-none resize-none bg-white"
      />
      {error && <p className="px-4 pb-2.5 text-[11px] text-[#B91C1C]">{error} — showing the last valid data until this is fixed.</p>}
    </div>
  );
}

// Row-based editor for the Sample Data panel — one Field/Value pair per row, so adding or renaming a merge
// tag's sample value doesn't require knowing JSON syntax. Operates directly on the `data` record (keyed by
// array index, not by the record key, so a key mid-rename doesn't reshuffle rows or lose focus).
function SampleDataFieldsEditor({ data, onChange }: { data: Record<string, string>; onChange: (next: Record<string, string>) => void }) {
  const entries = Object.entries(data);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const keyInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevCountRef = useRef(entries.length);
  const justAddedRef = useRef(false);

  // A field appended past the visible scroll area is otherwise invisible until the user manually scrolls —
  // jump the list to the bottom and focus the new row's key input so it's immediately visible and ready to
  // name. Only fires on an actual row *count* increase (Add Field), not on every keystroke.
  useEffect(() => {
    if (entries.length > prevCountRef.current && justAddedRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      keyInputRefs.current[entries.length - 1]?.focus();
      justAddedRef.current = false;
    }
    prevCountRef.current = entries.length;
  }, [entries.length]);

  const renameKey = (index: number, newKey: string) => {
    const next = entries.slice();
    next[index] = [newKey, next[index][1]];
    onChange(Object.fromEntries(next));
  };
  const updateValue = (index: number, newValue: string) => {
    const next = entries.slice();
    next[index] = [next[index][0], newValue];
    onChange(Object.fromEntries(next));
  };
  const removeAt = (index: number) => {
    onChange(Object.fromEntries(entries.filter((_, i) => i !== index)));
  };
  const addField = () => {
    let n = 1;
    while (`field_${n}` in data) n++;
    justAddedRef.current = true;
    setQuery("");
    onChange({ ...data, [`field_${n}`]: "" });
  };
  const copyToken = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`);
    toast.success(`{{${key}}} copied`);
  };

  const q = query.trim().toLowerCase();
  const visibleIndices = entries
    .map((_, i) => i)
    .filter((i) => !q || entries[i][0].toLowerCase().includes(q) || entries[i][1].toLowerCase().includes(q));

  const addFieldButton = (
    <button
      onClick={addField}
      className="w-full flex items-center justify-center gap-1.5 h-[34px] rounded-[6px] border border-dashed border-[#D9D9D6] text-[12px] font-semibold text-[#30578D] hover:border-[#30578D] hover:bg-[#EAF1FB]/40 cursor-pointer transition-colors"
    >
      <Plus size={13} />
      Add Field
    </button>
  );

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center text-center px-4 py-8 gap-2.5">
        <div className="size-[36px] rounded-full bg-[#F1F2F4] flex items-center justify-center">
          <Braces size={16} className="text-[#9ca3af]" />
        </div>
        <div>
          <p className="text-[12.5px] font-semibold text-[#374151]">No sample fields yet</p>
          <p className="text-[11.5px] text-[#9ca3af] mt-0.5">Add a field to preview its {"{{merge_tag}}"} above.</p>
        </div>
        <div className="w-full max-w-[220px] mt-1">{addFieldButton}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-2.5 pb-2">
        <span className="text-[11px] text-[#9ca3af]">{entries.length} field{entries.length === 1 ? "" : "s"}</span>
      </div>
      {entries.length > 8 && (
        <div className="px-4 pb-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fields"
              className="w-full h-[30px] pl-7 pr-2.5 rounded-[6px] border border-[#e5e7eb] bg-white text-[12px] text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#30578D] transition-colors"
            />
          </div>
        </div>
      )}
      <div ref={scrollRef} className="max-h-[320px] overflow-y-auto px-4">
        {visibleIndices.length === 0 ? (
          <p className="text-[12px] text-[#9ca3af] text-center py-4">No fields match "{query}"</p>
        ) : (
          <div className="divide-y divide-[#f3f4f6]">
            {visibleIndices.map((i) => {
              const [key, value] = entries[i];
              return (
                <div key={i} className="group flex items-center gap-2 py-2">
                  <div className="w-[44%] min-w-0 flex items-center rounded-[6px] border border-[#e5e7eb] bg-[#f7f8fa] focus-within:border-[#30578D] focus-within:bg-white transition-colors overflow-hidden">
                    <span className="pl-2 text-[11px] font-mono text-[#B4B8C0] shrink-0">{"{{"}</span>
                    <input
                      ref={(el) => { keyInputRefs.current[i] = el; }}
                      value={key}
                      onChange={(e) => renameKey(i, e.target.value)}
                      placeholder="field_name"
                      spellCheck={false}
                      className="min-w-0 flex-1 h-[32px] px-0.5 text-[11.5px] font-mono text-[#30578D] font-medium placeholder:text-[#9ca3af] placeholder:font-normal outline-none bg-transparent"
                    />
                    <span className="pr-2 text-[11px] font-mono text-[#B4B8C0] shrink-0">{"}}"}</span>
                  </div>
                  <input
                    value={value}
                    onChange={(e) => updateValue(i, e.target.value)}
                    placeholder="Sample value"
                    className="flex-1 min-w-0 h-[32px] px-2.5 rounded-[6px] border border-[#e5e7eb] bg-white text-[12px] text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#30578D] transition-colors"
                  />
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyToken(key)}
                      title="Copy {{token}}"
                      className="flex items-center justify-center size-[26px] rounded-[6px] text-[#9ca3af] hover:bg-[#F1F2F4] hover:text-[#4D4D4D] cursor-pointer transition-colors"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => removeAt(i)}
                      title="Remove field"
                      className="flex items-center justify-center size-[26px] rounded-[6px] text-[#9ca3af] hover:bg-[#FDECEA] hover:text-[#BA1C1C] cursor-pointer transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="px-4 pt-2 pb-3">{addFieldButton}</div>
    </div>
  );
}

const HANDLEBARS_SYNTAX: { title: string; code: string }[] = [
  { title: "Variable", code: "{{field_name}}" },
  { title: "If / Else", code: "{{#if field_name}}\n  Show when truthy\n{{else}}\n  Show when falsy\n{{/if}}" },
  { title: "Unless", code: "{{#unless field_name}}\n  Show when falsy\n{{/unless}}" },
  { title: "Each (loop)", code: "{{#each items}}\n  {{this.name}} — {{this.value}}\n{{/each}}" },
  { title: "Equals", code: '{{#equals field_name "value"}}\n  Show when equal\n{{else}}\n  Show otherwise\n{{/equals}}' },
  { title: "Not Equals", code: '{{#notEquals field_name "value"}}\n  Show when not equal\n{{/notEquals}}' },
  { title: "Format Date", code: '{{formatDate this "Received_Date_Time" 0}}' },
  { title: "Nested access", code: "{{object.nested.field}}" },
  { title: "Comment", code: "{{!-- comment --}}" },
];

const FONT_OPTIONS = [
  { label: "Default", value: "inherit" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
];

// Font-family picker for the Rich Text toolbar — real (whole-body) effect like Bold/Italic/Align, not a
// placeholder, so "Default" actually meant something once populated with real font choices.
function FontFamilySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = FONT_OPTIONS.find((f) => f.value === value) ?? FONT_OPTIONS[0];
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1.5 h-[30px] px-2.5 rounded-[6px] text-[12.5px] text-[#374151] hover:bg-[#f1f2f4] cursor-pointer transition-colors"
      >
        <span style={{ fontFamily: current.value }}>{current.label}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-[190px] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-30 py-1 max-h-[240px] overflow-y-auto">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.value}
              onMouseDown={() => { onChange(f.value); setOpen(false); }}
              style={{ fontFamily: f.value }}
              className={`w-full text-left px-3.5 py-2 text-[13px] cursor-pointer transition-colors ${
                f.value === value ? "font-semibold text-[#30578D] bg-[#EAF1FB]" : "text-[#374151] hover:bg-[#F7F7F7]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact text field — same pill chrome (height, border, radius, colors) as NewOverviewPage's toolbar
// controls (e.g. the search box, EMAIL_TABLE_NAVY-accented focus state), so this row reads as part of the
// same design system instead of a bespoke "notched label" treatment.
function ToolbarTextField({ value, onChange, placeholder, className = "" }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-[36px] px-3.5 rounded-[8px] border border-[#E2E6E9] bg-white text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors ${className}`}
    />
  );
}

// Compact dropdown field — the exact pill-button pattern NewOverviewPage uses for its Classification/
// Interval toolbar filters (border-[#E2E6E9], h-[36px], text-[12.5px] font-medium, hover:bg-[#F7F7F7]).
function ToolbarSelectField({ value, placeholder, options, onChange, className = "" }: { value: string | null; placeholder: string; options: string[]; onChange: (v: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`w-full flex items-center justify-between gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer ${
          open ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7]"
        }`}
      >
        <span className="truncate">{value ?? placeholder}</span>
        <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[200px] bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-30 py-1 max-h-[240px] overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              onMouseDown={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2 text-[12.5px] cursor-pointer whitespace-nowrap transition-colors ${
                opt === value ? "font-semibold text-[#30578D] bg-[#EAF1FB]" : "text-[#374151] hover:bg-[#F7F7F7]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Purely-visual formatting button — same convention as SoaBody's compose toolbar: no real rich-text
// engine behind this editor, so most buttons just confirm the click rather than pretending to do
// something they can't. Bold/Italic/Underline/Strikethrough/Align are the exception — those toggle real
// (whole-body) formatting state, same as SoaBody's compose textarea.
function ToolbarButton({ icon: Icon, label, active, onClick }: { icon: typeof Bold; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <EmailTableTooltip label={label}>
      <button
        onClick={onClick}
        aria-label={label}
        className={`flex items-center justify-center size-[30px] rounded-[6px] cursor-pointer transition-colors ${
          active ? "bg-[#EAF1FB] text-[#30578D]" : "text-[#4b5563] hover:bg-[#f1f2f4] hover:text-[#111827]"
        }`}
      >
        <Icon size={15} />
      </button>
    </EmailTableTooltip>
  );
}

export function EmailTemplateEditorPage({
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
  // Editing an existing template arrives here with its row data via router state (from EmailTemplatePage's
  // row click / Edit button); creating a new one has no state, so every field just starts blank.
  const location = useLocation();
  const editing = location.state as EmailTemplate | null;

  const [name, setName] = useState(editing?.name ?? "");
  const [editingName, setEditingName] = useState(false);
  const [category, setCategory] = useState<string | null>(editing?.category ?? null);
  const [language, setLanguage] = useState<string | null>(editing?.language ?? null);
  const [fromEmail, setFromEmail] = useState<string | null>(null);
  const [subject, setSubject] = useState(editing?.subject ?? "");
  const [body, setBody] = useState("");
  const [htmlSource, setHtmlSource] = useState("");
  const [activeTab, setActiveTab] = useState<"rich" | "html" | "preview">("rich");
  // The editor+merge-tags row is tall enough (viewport-based) that Sample Data below it starts off-screen
  // on the Preview tab — scroll it into view automatically instead of leaving the user to find it.
  const sampleDataRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeTab === "preview") sampleDataRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeTab]);
  const [format, setFormat] = useState({ bold: false, italic: false, underline: false, strikethrough: false, align: "left" as "left" | "center" | "right", fontFamily: FONT_OPTIONS[0].value });

  // Sample data — editable JSON, seeded from the template being edited (if it has its own saved sample
  // data) or SAMPLE_DATA otherwise. `sampleData` only updates when the textarea's content parses as a valid
  // JSON object, so a mid-edit typo doesn't break the Preview tab or the merge tag list; `sampleDataText`
  // always reflects exactly what's typed, errors included.
  const [sampleDataText, setSampleDataText] = useState(() => JSON.stringify(editing?.sampleData ?? SAMPLE_DATA, null, 2));
  const [sampleData, setSampleData] = useState<Record<string, string>>(editing?.sampleData ?? SAMPLE_DATA);
  const [sampleDataError, setSampleDataError] = useState<string | null>(null);
  const handleSampleDataChange = (text: string) => {
    setSampleDataText(text);
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setSampleData(parsed);
        setSampleDataError(null);
      } else {
        setSampleDataError("Must be a JSON object");
      }
    } catch {
      setSampleDataError("Invalid JSON");
    }
  };
  // Row editor is the default (no JSON syntax required); JSON stays available for bulk-pasting data.
  // Switching to JSON re-serializes whatever's currently in `sampleData` so it always shows the latest state.
  const [sampleDataMode, setSampleDataMode] = useState<"fields" | "json">("fields");
  // Collapsed by default — Sample Data is a config widget, not the main content of the Preview tab; left
  // expanded, its field rows compete with the actual preview for vertical space in the same column and can
  // squeeze the preview down to a sliver. Closed by default gives the preview the full column height, and
  // it's one click away when the user actually wants to edit sample values.
  const [sampleDataOpen, setSampleDataOpen] = useState(false);
  const handleSampleDataFieldsChange = (next: Record<string, string>) => {
    setSampleData(next);
    setSampleDataText(JSON.stringify(next, null, 2));
    setSampleDataError(null);
  };

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);

  const notImplemented = (label: string) => toast.info(`${label} — coming soon`);

  const insertMergeTag = (tag: string) => {
    const token = `{{${tag}}}`;
    if (activeTab === "html") {
      setHtmlSource((prev) => prev + token);
      return;
    }
    const el = bodyRef.current;
    if (!el) { setBody((prev) => prev + token); return; }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length;
    });
  };

  const handleUploadHtml = () => htmlInputRef.current?.click();
  const handleHtmlFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setHtmlSource(String(reader.result ?? ""));
      setActiveTab("html");
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const displayName = name.trim() || "Untitled Template";
  const handleSave = () => {
    const template: EmailTemplate = {
      id: editing?.id ?? `${Date.now()}`,
      name: displayName,
      category: category ?? "Uncategorized",
      language: language ?? "No Language",
      subject,
      createdBy: editing?.createdBy ?? "you@keysight.com",
      updatedAt: new Date().toISOString(),
      sampleData,
    };
    const existing = loadEmailTemplates(INITIAL_TEMPLATES);
    const next = existing.some((t) => t.id === template.id)
      ? existing.map((t) => (t.id === template.id ? template : t))
      : [...existing, template];
    saveEmailTemplates(next);
    toast.success(`Template "${displayName}" saved`);
    onBack();
  };

  return (
    <div className="bg-[#f5f6fa] flex flex-col w-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0">
        {/* sticky, not just relative — the page itself scrolls now (see `main` below), so the header needs
            to stay pinned on its own instead of relying on an outer h-screen/overflow-hidden shell. */}
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

        {/* flex-1 (classic sticky-footer pattern, not min-h) — fills exactly the leftover space between
            header and footer when content is short, so the footer sits flush at the bottom of the screen;
            when Sample Data expands past that, this just grows along with it (no inner scroll region, no
            overflow-hidden anywhere above), pushing the footer down the page instead of shrinking anything. */}
        <main className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-5 pt-3 pb-5 gap-4">
          <Breadcrumbs
            items={[
              { label: "Admin" },
              { label: "Email", onClick: onNavigateEmailTemplate },
              { label: "Email Templates", onClick: onBack },
              { label: editing ? displayName : "New Template" },
            ]}
          />

          {/* Page header — back, inline-editable name (shows "Untitled Template" until one is given) */}
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
                placeholder="Untitled Template"
                className="text-[18px] font-semibold text-[#262626] placeholder:text-[#9ca3af] bg-transparent outline-none border-b border-[#30578D] min-w-0 w-[280px]"
              />
            ) : (
              <button onClick={() => setEditingName(true)} className="group flex items-center gap-2 min-w-0 cursor-pointer">
                <h1 className="text-[18px] font-semibold text-[#262626] truncate">{displayName}</h1>
                <Pencil size={14} className="text-[#9ca3af] group-hover:text-[#30578D] shrink-0 transition-colors" />
              </button>
            )}
          </div>

          {/* Subject/Category/Language/From Email — one compact row using the same toolbar-pill chrome as
              NewOverviewPage's Classification/Interval filters, so it reads as part of the app's design
              system rather than a bespoke field style. Template Name lives in the page header above
              (inline-editable there). */}
          <div className="shrink-0 flex items-center gap-3 flex-wrap">
            <ToolbarTextField value={subject} onChange={setSubject} placeholder="Subject" className="flex-[2] min-w-[220px]" />
            <ToolbarSelectField value={category} placeholder="Category" options={CATEGORIES} onChange={setCategory} className="flex-1 min-w-[160px]" />
            <ToolbarSelectField value={language} placeholder="Language" options={LANGUAGES} onChange={setLanguage} className="flex-1 min-w-[160px]" />
            <ToolbarSelectField value={fromEmail} placeholder="Default From Email" options={FROM_EMAILS} onChange={setFromEmail} className="flex-1 min-w-[180px]" />
          </div>

          {/* Content: editor + merge tags, matching the listing page's white rounded-[8px] card convention.
              This row gets a genuinely fixed height (viewport-based, so it still adapts to screen size) —
              not flex-1. flex-1 computed through several nested ancestors turned out to still let Merge
              Tags' own ~20-tag unclipped list influence the final height (the row's flex-basis starts from
              its children's content before growing), so its list never actually got small enough to need
              its own scroller. An explicit height is a hard value nothing can feed back into. */}
          <div className="flex flex-col gap-4">
          <div className="h-[calc(100vh-260px)] flex gap-5">
            {/* Editor card */}
            <div className="flex-1 min-w-0 min-h-0 bg-white border border-[#E2E6E9] rounded-[8px] flex flex-col overflow-hidden">
                <div className="shrink-0 flex items-center justify-between gap-2 px-2 border-b border-[#E2E6E9]">
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { key: "rich", label: "Rich Text" },
                        { key: "html", label: "HTML", icon: Code2 },
                        { key: "preview", label: "Preview", icon: Eye },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3.5 py-3 text-[13.5px] font-semibold cursor-pointer border-b-2 -mb-px transition-colors ${
                          activeTab === tab.key ? "border-[#30578D] text-[#30578D]" : "border-transparent text-[#6b7280] hover:text-[#111827]"
                        }`}
                      >
                        {"icon" in tab && tab.icon && <tab.icon size={14} />}
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="shrink-0">
                    <input ref={htmlInputRef} type="file" accept=".html,.htm" onChange={handleHtmlFileSelected} className="hidden" />
                    <button
                      onClick={handleUploadHtml}
                      className="flex items-center gap-1.5 h-[30px] px-3 rounded-[6px] border border-[#E2E6E9] bg-white text-[12.5px] font-semibold text-[#30578D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                    >
                      <Upload size={13} />
                      Upload HTML
                    </button>
                  </div>
                </div>

                {activeTab === "rich" && (
                  <div className="shrink-0 flex items-center gap-0.5 px-3 py-1.5 border-b border-[#E2E6E9] flex-wrap">
                    <FontFamilySelect value={format.fontFamily} onChange={(v) => setFormat((f) => ({ ...f, fontFamily: v }))} />
                    <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
                    <ToolbarButton icon={Bold} label="Bold" active={format.bold} onClick={() => setFormat((f) => ({ ...f, bold: !f.bold }))} />
                    <ToolbarButton icon={Italic} label="Italic" active={format.italic} onClick={() => setFormat((f) => ({ ...f, italic: !f.italic }))} />
                    <ToolbarButton icon={Underline} label="Underline" active={format.underline} onClick={() => setFormat((f) => ({ ...f, underline: !f.underline }))} />
                    <ToolbarButton icon={Strikethrough} label="Strikethrough" active={format.strikethrough} onClick={() => setFormat((f) => ({ ...f, strikethrough: !f.strikethrough }))} />
                    <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
                    <ToolbarButton icon={AlignLeft} label="Align left" active={format.align === "left"} onClick={() => setFormat((f) => ({ ...f, align: "left" }))} />
                    <ToolbarButton icon={AlignCenter} label="Align center" active={format.align === "center"} onClick={() => setFormat((f) => ({ ...f, align: "center" }))} />
                    <ToolbarButton icon={AlignRight} label="Align right" active={format.align === "right"} onClick={() => setFormat((f) => ({ ...f, align: "right" }))} />
                    <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
                    <ToolbarButton icon={List} label="Bulleted list" onClick={() => notImplemented("Bulleted list")} />
                    <ToolbarButton icon={ListOrdered} label="Numbered list" onClick={() => notImplemented("Numbered list")} />
                    <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
                    <ToolbarButton icon={LinkIcon} label="Insert link" onClick={() => notImplemented("Insert link")} />
                    <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
                    <ToolbarButton icon={Heading1} label="Heading 1" onClick={() => notImplemented("Heading 1")} />
                    <ToolbarButton icon={Heading2} label="Heading 2" onClick={() => notImplemented("Heading 2")} />
                    <ToolbarButton icon={Heading3} label="Heading 3" onClick={() => notImplemented("Heading 3")} />
                    <span className="w-px h-5 bg-[#E2E6E9] mx-1" />
                    <ToolbarButton icon={Palette} label="Text color" onClick={() => notImplemented("Text color")} />
                    <ToolbarButton icon={Undo2} label="Undo" onClick={() => notImplemented("Undo")} />
                    <ToolbarButton icon={Redo2} label="Redo" onClick={() => notImplemented("Redo")} />
                  </div>
                )}

                <div className="flex-1 min-h-0 overflow-auto">
                  {activeTab === "rich" && (
                    <textarea
                      ref={bodyRef}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Start writing your email template..."
                      style={{ fontFamily: format.fontFamily }}
                      className={`w-full h-full px-6 py-5 text-[13.5px] text-[#374151] leading-[1.7] outline-none resize-none ${
                        format.align === "center" ? "text-center" : format.align === "right" ? "text-right" : "text-left"
                      } ${format.bold ? "font-bold" : ""} ${format.italic ? "italic" : ""} ${format.underline ? "underline" : ""} ${format.strikethrough ? "line-through" : ""}`}
                    />
                  )}
                  {activeTab === "html" && (
                    <textarea
                      value={htmlSource}
                      onChange={(e) => setHtmlSource(e.target.value)}
                      placeholder="<p>Write raw HTML for this template...</p>"
                      spellCheck={false}
                      className="w-full h-full px-6 py-5 text-[12.5px] font-mono text-[#374151] leading-[1.6] outline-none resize-none"
                    />
                  )}
                  {activeTab === "preview" && (
                    <div className="px-6 py-5">
                      {body.trim() || htmlSource.trim() ? (
                        <div className="rounded-[8px] border border-[#E2E6E9] bg-white px-5 py-4">
                          <p
                            style={{ fontFamily: format.fontFamily }}
                            className={`text-[13.5px] text-[#374151] leading-[1.7] whitespace-pre-wrap ${
                              format.align === "center" ? "text-center" : format.align === "right" ? "text-right" : "text-left"
                            } ${format.bold ? "font-bold" : ""} ${format.italic ? "italic" : ""} ${format.underline ? "underline" : ""} ${format.strikethrough ? "line-through" : ""}`}
                          >
                            {renderMergePreview(body || htmlSource, sampleData)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[13px] text-[#9ca3af]">Nothing to preview yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

            {/* Merge tags — same card/search/list chrome as SoaBody's "Email Templates" panel
                (SoaBody.tsx:474-477), 380px to match that panel's column width. No height of its own —
                default flex stretch matches it to the Editor card's height exactly; the tag list inside
                (MergeTagSearch) scrolls internally via its own overflow-y-auto once it outgrows that. */}
            <div className="w-[380px] shrink-0 bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-2 shrink-0">
                <h3 className="text-[14px] font-bold text-[#111827]">Merge Tags</h3>
                <SyntaxHelpButton />
              </div>
              <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3 shrink-0">Insert a field into your template.</p>
              <MergeTagSearch tags={Object.keys(sampleData)} onInsert={insertMergeTag} />
            </div>
          </div>

          {/* Sample Data — the data the Preview tab substitutes into {{merge_tags}} above. Lives inside
              `main` (which scrolls), below the editor+merge-tags row — not a sibling pinned above the
              footer — so opening it extends the scrollable area downward (pushing the footer down) instead
              of shrinking the editor above it. Fields is the default (no JSON syntax needed); JSON stays
              available for pasting bulk data in one go. */}
          {activeTab === "preview" && (
            <div ref={sampleDataRef} className="shrink-0 scroll-mb-[80px] bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden">
              <button
                onClick={() => setSampleDataOpen((v) => !v)}
                className={`w-full flex items-start justify-between gap-2 px-4 py-3 cursor-pointer text-left ${sampleDataOpen ? "border-b border-[#E2E6E9]" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <ChevronDown size={14} className={`text-[#9ca3af] shrink-0 transition-transform duration-200 ${sampleDataOpen ? "" : "-rotate-90"}`} />
                  <div>
                    <span className="text-[13px] font-bold text-[#111827]">Sample Data</span>
                    <p className="text-[11px] text-[#9ca3af] mt-0.5">Values used to preview {"{{merge_tags}}"} in the body above.</p>
                  </div>
                </div>
                {sampleDataOpen && (
                  <div
                    className="flex items-center gap-1 p-0.5 rounded-[6px] bg-[#F1F2F4] shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(["fields", "json"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSampleDataMode(mode)}
                        className={`px-2 py-1 rounded-[5px] text-[10.5px] font-semibold uppercase tracking-wide cursor-pointer transition-colors ${
                          sampleDataMode === mode ? "bg-white text-[#262626] shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-[#97999B] hover:text-[#4D4D4D]"
                        }`}
                      >
                        {mode === "fields" ? "Fields" : "JSON"}
                      </button>
                    ))}
                  </div>
                )}
              </button>
              {sampleDataOpen && (
                sampleDataMode === "fields" ? (
                  <SampleDataFieldsEditor data={sampleData} onChange={handleSampleDataFieldsChange} />
                ) : (
                  <SampleDataEditor value={sampleDataText} onChange={handleSampleDataChange} error={sampleDataError} />
                )
              )}
            </div>
          )}
          </div>
        </main>

        {/* Footer actions — sticky to the bottom of the viewport (mirroring the sticky header), so it stays
            in view while the page scrolls instead of ending up wherever the content happens to end. */}
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

function MergeTagSearch({ tags, onInsert }: { tags: string[]; onInsert: (tag: string) => void }) {
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const q = query.trim().toLowerCase();
  const visible = q ? tags.filter((tag) => tag.toLowerCase().includes(q)) : tags;

  return (
    <>
      <div className="relative mb-3 shrink-0">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fields"
          className="w-full pl-8 pr-8 py-2 rounded-[8px] border border-[#e5e7eb] bg-white text-[12.5px] text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#30578D] transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#111827] cursor-pointer transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="relative -mx-5 flex-1 min-h-0">
        {scrolled && (
          <div className="absolute left-0 right-0 top-0 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
        )}
        <div className="h-full overflow-y-auto" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}>
          {visible.length === 0 ? (
            <p className="text-[12.5px] text-[#9ca3af] text-center py-6">No fields match "{query}"</p>
          ) : (
            visible.map((tag, i) => (
              <button
                key={tag}
                onClick={() => onInsert(tag)}
                className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-left cursor-pointer transition-colors hover:bg-[#f8fafc] ${
                  i !== 0 ? "border-t border-[#f3f4f6]" : ""
                }`}
              >
                <div className="size-[26px] rounded-[6px] bg-[#f3f4f6] flex items-center justify-center shrink-0">
                  <Braces size={13} className="text-[#9ca3af]" />
                </div>
                <p className="text-[12.5px] font-mono text-[#374151] truncate">{`{{${tag}}}`}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// "? Syntax Help" — opens a reference card for the Handlebars-style merge-tag syntax (conditionals, loops,
// date formatting, etc.), same backdrop/card modal convention as EmailTableAssignModal.
function SyntaxHelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F1F2F4] text-[11px] font-medium text-[#4b5563] hover:bg-[#E2E6E9] cursor-pointer transition-colors shrink-0"
      >
        <HelpCircle size={12} />
        Syntax Help
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[440px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE] shrink-0">
              <span className="text-[16px] font-bold text-[#262626]">Handlebars Syntax</span>
              <button onClick={() => setOpen(false)} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 flex flex-col gap-4">
              {HANDLEBARS_SYNTAX.map((s) => (
                <div key={s.title}>
                  <p className="text-[12.5px] font-semibold text-[#374151] mb-1.5">{s.title}</p>
                  <pre className="rounded-[8px] bg-[#F7F7F7] border border-[#E2E6E9] px-3.5 py-2.5 text-[12px] font-mono text-[#374151] whitespace-pre-wrap overflow-x-auto">
                    {s.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
