import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Archive,
  Bold,
  Check,
  ChevronDown,
  Eraser,
  FileImage,
  FileSpreadsheet,
  FileText,
  Flame,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Mail,
  Paperclip,
  Quote,
  Search,
  Sparkles,
  Underline,
  X,
} from "lucide-react";
import { EmailTableTooltip } from "../../components/common/EmailTable";
import { WaveLoader } from "../../components/common/Loader";
import { Button } from "../../components/common/Button";
import { CollapsedEmailThread, senderDisplayName } from "./emailThread";
import { type Email } from "./emailData";
import { useSoaComposer } from "./useSoaComposer";

// Same icon + color per file type used throughout the app's document rows/chips.
function docMeta(name: string): { icon: typeof FileText; bg: string; fg: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: FileText, bg: "#FDECEA", fg: "#DC2626" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: FileSpreadsheet, bg: "#E8F5E9", fg: "#2E7D32" };
  if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) return { icon: FileImage, bg: "#EAF1FB", fg: "#30578D" };
  if (["zip", "rar", "7z"].includes(ext)) return { icon: Archive, bg: "#FDF3E7", fg: "#92600B" };
  if (ext === "eml") return { icon: Mail, bg: "#EAF1FB", fg: "#30578D" };
  return { icon: FileText, bg: "#f3f4f6", fg: "#6b7280" };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildTemplateBody(label: string, senderName: string, subjectLine: string): string {
  return `Dear ${senderName},\n\nPlease find attached the ${label.toLowerCase()} regarding "${subjectLine}".\n\nKind regards,\nCustomer Service — Trade Orders`;
}

// One To/Subject/CC/BCC row — plain grey label to the left, a borderless input to the right. Several of
// these stack inside one shared bordered container (see the "headers" card below) instead of each field
// carrying its own box, so the composer's metadata reads as one compact block rather than a stack of
// separate input boxes eating up vertical space.
function ComposerFieldRow({
  label,
  value,
  onChange,
  placeholder,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-6 min-h-[40px]">
      <label className="w-[62px] shrink-0 text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 text-[13px] text-[#111827] placeholder:text-[#9ca3af] outline-none bg-transparent"
      />
      {trailing && <div className="flex items-center gap-2.5 shrink-0">{trailing}</div>}
    </div>
  );
}

// A To/CC/BCC row that holds multiple addresses — type one, press Enter or comma (or just blur/tab away) to
// turn it into a pill; Backspace on an empty draft pops the last pill, same as most mail-client "to" fields.
function RecipientPillField({
  label,
  values,
  onChange,
  placeholder,
  trailing,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  trailing?: React.ReactNode;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const trimmed = draft.trim().replace(/,+$/, "");
    if (trimmed) onChange([...values, trimmed]);
    setDraft("");
  };

  const removeAt = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div className="flex items-center gap-3 px-6 min-h-[40px]">
      <label className="w-[62px] shrink-0 text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide">{label}</label>
      <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap py-1">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-[8px] bg-[#EAF1FB] text-[12px] font-medium text-[#30578D]"
          >
            {v}
            <button onClick={() => removeAt(i)} className="text-[#30578D]/70 hover:text-[#30578D] cursor-pointer">
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
              removeAt(values.length - 1);
            }
          }}
          onBlur={commit}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[140px] py-0.5 text-[13px] text-[#111827] placeholder:text-[#9ca3af] outline-none bg-transparent"
        />
      </div>
      {trailing && <div className="flex items-center gap-2.5 shrink-0">{trailing}</div>}
    </div>
  );
}

// A "From" row — a closed set of send-as addresses, picked from a dropdown rather than typed freely.
function ComposerSelectRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-3 px-6 min-h-[40px]">
      <label className="w-[62px] shrink-0 text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide">{label}</label>
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="inline-flex items-center gap-2 pl-3 pr-2.5 py-1 rounded-[8px] border border-[#e5e7eb] bg-[#f7f8fa] hover:bg-[#eef0f2] text-[13px] text-[#111827] cursor-pointer transition-colors"
        >
          <span>{value}</span>
          <ChevronDown size={14} className={`text-[#9ca3af] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 min-w-[240px] bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-20 py-1 max-h-[200px] overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-[12.5px] cursor-pointer whitespace-nowrap transition-colors ${
                  opt === value ? "font-semibold text-[#30578D] bg-[#EAF1FB]" : "text-[#374151] hover:bg-[#f8fafc]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Purely-visual formatting button — toggles its own pressed state; there's no real rich-text engine behind
// this editor, just a plain draft textarea. `label` shows via the same EmailTableTooltip used on the
// Overview page's icon buttons, so hover tooltips look identical everywhere in the app.
function ToolbarButton({ icon: Icon, label, active, onClick }: { icon: typeof Bold; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <EmailTableTooltip label={label}>
      <button
        onClick={onClick}
        aria-label={label}
        className={`flex items-center justify-center size-[28px] rounded-[6px] cursor-pointer transition-colors ${
          active ? "bg-[#EAF1FB] text-[#30578D]" : "text-[#6b7280] hover:bg-[#eef0f2] hover:text-[#111827]"
        }`}
      >
        <Icon size={15} />
      </button>
    </EmailTableTooltip>
  );
}

export function SoaBody({ email }: { email: Email }) {
  const { data: composer, loading, error, reload } = useSoaComposer(email.id);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [cc, setCc] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [bcc, setBcc] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [format, setFormat] = useState({ bold: false, italic: false, underline: false, align: "left" as "left" | "center" | "right" });
  const [templateQuery, setTemplateQuery] = useState("");
  const [templatesScrolled, setTemplatesScrolled] = useState(false);

  useEffect(() => {
    if (!composer) return;
    const defaultTemplate = composer.templates.find(t => t.recommended) ?? composer.templates[0];
    setFrom(composer.fromOptions[0]);
    setTo(composer.to);
    setSubject(composer.subject);
    setCc(composer.cc);
    setBcc(composer.bcc);
    setSelectedTemplate(defaultTemplate?.label ?? null);
    setBody(defaultTemplate ? buildTemplateBody(defaultTemplate.label, senderDisplayName(email.sender), composer.subject) : "");
  }, [composer, email.sender]);

  const applyTemplate = (label: string) => {
    setSelectedTemplate(label);
    setBody(buildTemplateBody(label, senderDisplayName(email.sender), subject));
    toast.success(`${label} applied`);
  };

  const handleAttachEmail = () => {
    setAttachedFiles(prev => [...prev, { name: `${email.subject.slice(0, 30)}.eml`, size: "24 KB" }]);
    toast.success("Reference email attached");
  };

  // "Upload Attachment" opens the OS file picker for real and attaches whatever's chosen — no upload
  // destination behind it yet, but the picker itself is the genuine native one, not a mocked file.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadAttachment = () => fileInputRef.current?.click();
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setAttachedFiles(prev => [...prev, ...files.map(f => ({ name: f.name, size: formatFileSize(f.size) }))]);
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} attached`);
    }
    e.target.value = "";
  };

  const removeAttachment = (i: number) => {
    setAttachedFiles(prev => {
      const removed = prev[i];
      if (removed) toast.info(`${removed.name} removed`);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  if (loading || error) {
    return (
      <div className="bg-white rounded-[8px] border border-[#ebebeb] flex items-center justify-center py-20">
        {error ? (
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <p className="text-[14px] font-semibold text-[#111827]">Couldn't load the SOA composer</p>
            <p className="text-[12.5px] text-[#9ca3af] max-w-[360px]">{error}</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : (
          <WaveLoader size={40} />
        )}
      </div>
    );
  }

  const c = composer!; // guaranteed non-null past the loading/error guard above

  const filteredTemplates = c.templates.filter(t => t.label.toLowerCase().includes(templateQuery.toLowerCase())).sort(
    (a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">
      {/* Left: composer + reference strip */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-[8px] border border-[#ebebeb] flex flex-col">
          <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4 border-b border-[#f3f4f6]">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#111827]">Draft Email</h2>
            {selectedTemplate && (
              <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-[8px] bg-[#EAF1FB] text-[11px] font-semibold text-[#30578D] whitespace-nowrap">
                Applied: {selectedTemplate}
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setBody("");
                    toast.info("Template removed");
                  }}
                  title="Remove applied template"
                  className="text-[#30578D]/70 hover:text-[#30578D] cursor-pointer transition-colors"
                >
                  <X size={13} />
                </button>
              </span>
            )}
          </div>

          <div className="divide-y divide-[#f3f4f6] border-b border-[#f3f4f6]">
            <ComposerSelectRow label="From" value={from} options={c.fromOptions} onChange={setFrom} />
            <RecipientPillField
              label="To"
              values={to}
              onChange={setTo}
              placeholder="Enter recipient email address..."
              trailing={
                <>
                  {!showCc && (
                    <button onClick={() => setShowCc(true)} className="text-[12px] font-semibold text-[#30578D] hover:underline cursor-pointer">
                      Cc
                    </button>
                  )}
                  {!showBcc && (
                    <button onClick={() => setShowBcc(true)} className="text-[12px] font-semibold text-[#30578D] hover:underline cursor-pointer">
                      Bcc
                    </button>
                  )}
                </>
              }
            />
            <ComposerFieldRow label="Subject" value={subject} onChange={setSubject} />
            {showCc && (
              <RecipientPillField
                label="CC"
                values={cc}
                onChange={setCc}
                placeholder="Enter CC email addresses..."
                trailing={
                  <button onClick={() => setShowCc(false)} className="text-[#9ca3af] hover:text-[#111827] cursor-pointer">
                    <X size={14} />
                  </button>
                }
              />
            )}
            {showBcc && (
              <RecipientPillField
                label="BCC"
                values={bcc}
                onChange={setBcc}
                placeholder="Enter BCC email addresses..."
                trailing={
                  <button onClick={() => setShowBcc(false)} className="text-[#9ca3af] hover:text-[#111827] cursor-pointer">
                    <X size={14} />
                  </button>
                }
              />
            )}
          </div>

          <div className="flex items-center gap-0.5 flex-wrap px-6 py-2 bg-[#f7f8fa] border-b border-[#f3f4f6]">
            <ToolbarButton icon={Bold} label="Bold" active={format.bold} onClick={() => setFormat(f => ({ ...f, bold: !f.bold }))} />
            <ToolbarButton icon={Italic} label="Italic" active={format.italic} onClick={() => setFormat(f => ({ ...f, italic: !f.italic }))} />
            <ToolbarButton
              icon={Underline}
              label="Underline"
              active={format.underline}
              onClick={() => setFormat(f => ({ ...f, underline: !f.underline }))}
            />
            <span className="w-px h-5 bg-[#e5e7eb] mx-1" />
            <ToolbarButton icon={AlignLeft} label="Align left" active={format.align === "left"} onClick={() => setFormat(f => ({ ...f, align: "left" }))} />
            <ToolbarButton
              icon={AlignCenter}
              label="Align center"
              active={format.align === "center"}
              onClick={() => setFormat(f => ({ ...f, align: "center" }))}
            />
            <ToolbarButton
              icon={AlignRight}
              label="Align right"
              active={format.align === "right"}
              onClick={() => setFormat(f => ({ ...f, align: "right" }))}
            />
            <span className="w-px h-5 bg-[#e5e7eb] mx-1" />
            <ToolbarButton icon={List} label="Bulleted list" />
            <ToolbarButton icon={ListOrdered} label="Numbered list" />
            <span className="w-px h-5 bg-[#e5e7eb] mx-1" />
            <ToolbarButton icon={LinkIcon} label="Insert link" />
            <ToolbarButton icon={Quote} label="Quote" />
            <span className="w-px h-5 bg-[#e5e7eb] mx-1" />
            <ToolbarButton icon={Heading1} label="Heading 1" />
            <ToolbarButton icon={Heading2} label="Heading 2" />
            <span className="w-px h-5 bg-[#e5e7eb] mx-1" />
            <ToolbarButton
              icon={Eraser}
              label="Clear formatting"
              onClick={() => setFormat({ bold: false, italic: false, underline: false, align: "left" })}
            />
            <span className="w-px h-5 bg-[#e5e7eb] mx-1" />
            <ToolbarButton icon={Mail} label="Attach Email" onClick={handleAttachEmail} />
            <ToolbarButton icon={Paperclip} label="Upload Attachment" onClick={handleUploadAttachment} />
          </div>
          <input ref={fileInputRef} type="file" multiple onChange={handleFilesSelected} className="hidden" />

          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Compose your email..."
            className={`w-full min-h-[320px] px-6 py-4 text-[13px] text-[#374151] leading-[1.7] outline-none resize-y ${
              format.align === "center" ? "text-center" : format.align === "right" ? "text-right" : "text-left"
            } ${format.bold ? "font-bold" : ""} ${format.italic ? "italic" : ""} ${format.underline ? "underline" : ""}`}
          />

          <div className="px-6 py-4 border-t border-[#f3f4f6]">
            {attachedFiles.length === 0 ? (
              <p className="text-[12.5px] text-[#9ca3af]">No files attached yet.</p>
            ) : (
              <div className="flex items-center gap-2.5 flex-wrap">
                {attachedFiles.map((doc, i) => {
                  const meta = docMeta(doc.name);
                  return (
                    <div
                      key={i}
                      className="group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-[8px] border border-[#ebebeb] hover:border-[#d1d5db] transition-colors"
                    >
                      <button
                        onClick={() => toast.info(`Downloading ${doc.name}`)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className="size-[26px] rounded-[6px] flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg }}>
                          <meta.icon size={13} style={{ color: meta.fg }} />
                        </div>
                        <div className="text-left">
                          <p className="text-[12px] font-medium text-[#111827] leading-tight">{doc.name}</p>
                          <p className="text-[10.5px] text-[#9ca3af] leading-tight">{doc.size}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => removeAttachment(i)}
                        title="Remove attachment"
                        className="text-[#9ca3af] hover:text-[#BA1C1C] cursor-pointer transition-colors shrink-0 ml-1"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide mb-2 px-1">Email thread for reference</p>
          <CollapsedEmailThread email={email} />
        </div>
      </div>

      {/* Right: templates */}
      <div className="flex flex-col gap-4">
          <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
            <h3 className="text-[14px] font-bold text-[#111827]">Email Templates</h3>
            <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">Choose a template to replace the email body.</p>

            <div className="relative mb-3">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
              <input
                value={templateQuery}
                onChange={e => setTemplateQuery(e.target.value)}
                placeholder="Search templates"
                className="w-full pl-8 pr-8 py-2 rounded-[8px] border border-[#e5e7eb] bg-white text-[12.5px] text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#30578D] transition-colors"
              />
              {templateQuery && (
                <button
                  onClick={() => setTemplateQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#111827] cursor-pointer transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="relative -mx-5">
              {templatesScrolled && (
                <div className="absolute left-0 right-0 top-0 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
              )}
              <div
                className="max-h-[640px] overflow-y-auto"
                onScroll={e => setTemplatesScrolled(e.currentTarget.scrollTop > 0)}
              >
              {filteredTemplates.length === 0 ? (
                <p className="text-[12.5px] text-[#9ca3af] text-center py-6">No templates match "{templateQuery}"</p>
              ) : (
                filteredTemplates.map((t, i) => {
                  const selected = selectedTemplate === t.label;
                  return (
                    <button
                      key={t.label}
                      onClick={() => applyTemplate(t.label)}
                      className={`w-full flex items-center gap-2.5 px-5 py-2.5 min-h-[58px] text-left cursor-pointer transition-colors ${
                        i !== 0 ? "border-t border-[#f3f4f6]" : ""
                      } ${selected ? "bg-[#EAF1FB]" : "hover:bg-[#f8fafc]"}`}
                    >
                      <div
                        className={`size-[26px] rounded-[6px] flex items-center justify-center shrink-0 ${
                          selected ? "bg-white" : "bg-[#f3f4f6]"
                        }`}
                      >
                        <FileText size={13} className={selected ? "text-[#30578D]" : "text-[#9ca3af]"} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] leading-tight truncate ${selected ? "font-semibold text-[#111827]" : "text-[#374151]"}`}>
                          {t.label}
                        </p>
                        {(t.recommended || t.mostUsed) && (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {t.recommended && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[2px] text-[#7C3BF6] bg-[#7C3BF6]/10">
                                <Sparkles size={9} />
                                Recommended
                              </span>
                            )}
                            {t.mostUsed && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[2px] text-[#387D85] bg-[#387D85]/10">
                                <Flame size={9} />
                                Most Used
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {selected && <Check size={14} className="text-[#30578D] shrink-0" strokeWidth={3} />}
                    </button>
                  );
                })
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
