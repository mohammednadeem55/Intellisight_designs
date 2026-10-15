import { useState } from "react";
import { toast } from "sonner";
import { Archive, ChevronRight, Download, FileImage, FileSpreadsheet, FileText, Paperclip } from "lucide-react";
import { Button } from "../../components/common/Button";
import { AttachmentPreviewModal } from "../../components/common/AttachmentPreviewModal";
import { type Email } from "./emailData";

// "priya.shah@acme.com" → "Priya Shah" — the data model only stores raw addresses, so the detail page's
// "from" display name is derived from the local-part rather than added as a separate (redundant) field.
export function senderDisplayName(sender: string): string {
  const local = sender.split("@")[0] ?? sender;
  const words = local.split(/[._-]+/).filter(Boolean);
  if (words.length === 0) return sender;
  return words.map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export function isExternalSender(sender: string): boolean {
  return !sender.endsWith("@intellisight.io");
}

// "Order_details.pdf" → "PDF", "lorem_ipsum.docx" → "DOCX", "notes.txt" → "PLAIN" (matches how mail clients
// label plain-text attachments) — used next to the file size in the attachment chip.
function attachmentTypeLabel(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "txt") return "PLAIN";
  return ext.toUpperCase();
}

// Icon + color per file type, so the attachment list reads at a glance instead of every file looking the same.
function attachmentMeta(name: string): { icon: typeof FileText; bg: string; fg: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: FileText, bg: "#FDECEA", fg: "#DC2626" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: FileSpreadsheet, bg: "#E8F5E9", fg: "#2E7D32" };
  if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) return { icon: FileImage, bg: "#EAF1FB", fg: "#30578D" };
  if (["zip", "rar", "7z"].includes(ext)) return { icon: Archive, bg: "#FDF3E7", fg: "#92600B" };
  return { icon: FileText, bg: "#f3f4f6", fg: "#6b7280" };
}

// Outlook-style compact chip: icon + name + size on one 28px line. The download button only shows on
// hover so a row of several attachments stays quiet.
function AttachmentChip({ attachment }: { attachment: { name: string; size: string } }) {
  const meta = attachmentMeta(attachment.name);
  const [previewOpen, setPreviewOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setPreviewOpen(true)}
        title={`${attachment.name} · ${attachment.size} · ${attachmentTypeLabel(attachment.name)}`}
        className="group flex items-center gap-1.5 h-[28px] pl-1.5 pr-2 rounded-[6px] border border-[#e5e7eb] bg-white max-w-[220px] hover:border-[#d1d5db] hover:bg-[#f8fafc] cursor-pointer transition-colors text-left"
      >
        <span className="size-[18px] rounded-[4px] flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg }}>
          <meta.icon size={11} style={{ color: meta.fg }} />
        </span>
        <span className="text-[11.5px] font-medium text-[#111827] truncate">{attachment.name}</span>
        <span className="text-[10.5px] text-[#9ca3af] shrink-0">{attachment.size}</span>
        <Download
          size={12}
          className="hidden group-hover:block text-[#9ca3af] hover:text-[#111827] transition-colors shrink-0"
          onClick={(e) => { e.stopPropagation(); toast.info(`Downloading ${attachment.name}`); }}
        />
      </button>
      {previewOpen && <AttachmentPreviewModal attachment={attachment} onClose={() => setPreviewOpen(false)} />}
    </>
  );
}

// Attachments sit above the message body (like Outlook) so they're seen without scrolling, but stay slim:
// a single paperclip-led row showing the first few chips, with the rest behind a "+N more" toggle.
const VISIBLE_ATTACHMENTS = 3;
function AttachmentStrip({ attachments, flush = false }: { attachments: { name: string; size: string }[]; flush?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? attachments : attachments.slice(0, VISIBLE_ATTACHMENTS);
  const hidden = attachments.length - shown.length;
  return (
    <div className={`flex items-center flex-wrap gap-1.5 ${flush ? "" : "mb-3"}`}>
      {shown.map((a, i) => (
        <AttachmentChip key={i} attachment={a} />
      ))}
      {hidden > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="h-[28px] px-2.5 rounded-[6px] border border-[#e5e7eb] text-[11.5px] font-semibold text-[#30578D] hover:bg-[#EAF1FB] cursor-pointer transition-colors"
        >
          +{hidden} more
        </button>
      )}
      {showAll && attachments.length > VISIBLE_ATTACHMENTS && (
        <button onClick={() => setShowAll(false)} className="h-[28px] px-2 text-[11.5px] font-semibold text-[#6b7280] hover:text-[#111827] cursor-pointer transition-colors">
          Show less
        </button>
      )}
      {attachments.length > 1 && (
        <button
          onClick={() => toast.info(`Downloading all ${attachments.length} attachments`)}
          title="Download every attachment"
          className="h-[28px] flex items-center gap-1 px-2 rounded-[6px] text-[11.5px] font-semibold text-[#30578D] hover:bg-[#EAF1FB] cursor-pointer transition-colors whitespace-nowrap"
        >
          <Download size={12} />
          Download all
        </button>
      )}
    </div>
  );
}

// Shared by the latest message and each (expanded) history item: external-sender warning, attachments strip,
// subject + body. Kept separate so the two message treatments below don't duplicate this rendering.
function MessageBody({ message, showAttachments = true }: { message: Email; showAttachments?: boolean }) {
  const attachmentCount = message.attachments?.length ?? 0;
  return (
    <>
      {isExternalSender(message.sender) && (
        <div className="mb-3 flex items-center justify-between gap-3 flex-wrap px-3.5 py-2.5 rounded-[8px] bg-[#F5B8AC]">
          <p className="text-[12px] font-semibold text-[#111827] leading-[1.5]">
            This Message is From an External Sender: Use caution opening files, clicking links or responding to requests.
          </p>
          <Button variant="danger" size="sm" className="shrink-0" onClick={() => toast.success("Reported as suspicious")}>
            Report Suspicious
          </Button>
        </div>
      )}

      {showAttachments && attachmentCount > 0 && <AttachmentStrip attachments={message.attachments!} />}

      <p className="text-[13.5px] font-bold text-[#111827] mb-1.5">{message.subject}</p>
      <p className="text-[13px] text-[#374151] leading-[1.65] whitespace-pre-wrap">{message.body ?? "No content preview available."}</p>
    </>
  );
}

// The message being triaged right now — always fully visible, never collapsed, so there's no ambiguity
// about what's the main content vs. reference history below it.
export function LatestMessage({ message }: { message: Email }) {
  const name = senderDisplayName(message.sender);
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");

  const attachmentCount = message.attachments?.length ?? 0;

  return (
    <div className="px-4 py-4">
      <div className="flex items-start gap-3 pb-3.5 mb-3.5 border-b border-[#f3f4f6]">
        <div className="size-[36px] rounded-full bg-[#30578D] flex items-center justify-center shrink-0 text-[12px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13.5px] font-bold text-[#111827] truncate">{name}</p>
            <p className="text-[11px] text-[#9ca3af] shrink-0">{message.received}</p>
          </div>
          <p className="text-[12px] text-[#6b7280] truncate">{message.sender}</p>
          {/* Attachments sit right under the sender's address (Outlook-style) — one slim row, extras behind "+N more". */}
          {attachmentCount > 0 && (
            <div className="mt-2">
              <AttachmentStrip attachments={message.attachments!} flush />
            </div>
          )}
        </div>
      </div>
      <MessageBody message={message} showAttachments={false} />
    </div>
  );
}

// One item in "Earlier in this thread" — collapsed to a single scannable row (sender, snippet, timestamp,
// attachment count) by default; expands in place on click to show the full message via MessageBody. Each
// item is its own white card against the section's grey backdrop, so adjacent messages are unmistakably
// separate rather than one continuous list broken only by hairline dividers.
export function HistoryMessageItem({ message, expanded, onToggle }: { message: Email; expanded: boolean; onToggle: () => void }) {
  const name = senderDisplayName(message.sender);
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");
  const attachmentCount = message.attachments?.length ?? 0;

  return (
    <div className="bg-white rounded-[8px] border border-[#ebebeb] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer hover:bg-[#f8fafc] transition-colors"
      >
        <div className="size-[24px] rounded-full bg-[#9ca3af] flex items-center justify-center shrink-0 text-[9.5px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-[12.5px] font-medium text-[#4b5563] truncate">{name}</p>
            <span className="text-[11.5px] text-[#9ca3af] truncate">· {message.sender}</span>
          </div>
          {!expanded && (
            <p className="text-[11.5px] text-[#9ca3af] truncate mt-0.5">{message.subject}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {attachmentCount > 0 && (
            <span className="flex items-center gap-1 text-[10.5px] text-[#9ca3af]">
              <Paperclip size={10} /> {attachmentCount}
            </span>
          )}
          <p className="text-[10.5px] text-[#9ca3af] whitespace-nowrap">{message.received}</p>
          <ChevronRight size={12} className={`text-[#9ca3af] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-2.5 border-t border-[#f3f4f6]">
          <MessageBody message={message} />
        </div>
      )}
    </div>
  );
}

// Full thread block — thread-count label, the always-open latest message, and a collapsible "Earlier in
// this thread" history list. Used identically by the Email & Classify stage and the SOA composer's
// reference strip, so a thread reads the same wherever it shows up in the workflow.
export function EmailThreadCard({ email }: { email: Email }) {
  const earlierMessages = [...(email.replies ?? []), ...(email.linkedCccs ?? []).flatMap(c => c.replies ?? [])];
  const threadCount = 1 + earlierMessages.length;
  const [expandedThreadIds, setExpandedThreadIds] = useState<Set<string>>(new Set());
  const toggleThreadMessage = (id: string) => {
    setExpandedThreadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-[8px] border border-[#ebebeb] flex flex-col min-h-0 h-fit">
      {earlierMessages.length > 0 && (
        <div className="px-5 pt-4">
          <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide">{threadCount} emails in this thread</p>
        </div>
      )}

      <LatestMessage message={email} />

      {earlierMessages.length > 0 && (
        <div className="border-t border-[#f3f4f6] bg-[#f7f8fa] rounded-b-[8px] px-3 py-3">
          <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide mb-2 px-1">
            Earlier in this thread ({earlierMessages.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {earlierMessages.map(m => (
              <HistoryMessageItem key={m.id} message={m} expanded={expandedThreadIds.has(m.id)} onToggle={() => toggleThreadMessage(m.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// A purely-for-reference thread — every message, including the current one, starts collapsed to a single
// row (unlike EmailThreadCard, which always keeps the latest message open since it's the thing being
// triaged there). Used where the thread is background context rather than the main task, e.g. the SOA
// composer.
export function CollapsedEmailThread({ email }: { email: Email }) {
  const messages = [email, ...(email.replies ?? []), ...(email.linkedCccs ?? []).flatMap(c => c.replies ?? [])];
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      {messages.map(m => (
        <HistoryMessageItem key={m.id} message={m} expanded={expandedIds.has(m.id)} onToggle={() => toggle(m.id)} />
      ))}
    </div>
  );
}
