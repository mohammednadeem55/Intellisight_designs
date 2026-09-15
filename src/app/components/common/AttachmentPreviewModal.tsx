import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Archive, Download, FileImage, FileSpreadsheet, FileText, Paperclip, X } from "lucide-react";

// Icon + color per file type — mirrors the per-file `attachmentMeta`/`docMeta` helpers duplicated across
// the email/order pages, kept local here so this shared modal has no dependency on any one page.
function attachmentMeta(name: string): { icon: typeof FileText; bg: string; fg: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: FileText, bg: "#FDECEA", fg: "#DC2626" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: FileSpreadsheet, bg: "#EFF6F1", fg: "#468657" };
  if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) return { icon: FileImage, bg: "#EAF1FB", fg: "#30578D" };
  if (["zip", "rar", "7z"].includes(ext)) return { icon: Archive, bg: "#FDF3E7", fg: "#92600B" };
  return { icon: FileText, bg: "#F1F2F4", fg: "#666666" };
}

export type AttachmentPreviewFile = { name: string; size: string };

// Shared "your file goes here" preview modal for attachment chips across the app — styled to match the
// app's established modal pattern (EmailTableAssignModal, WorkflowPage's summary modal): separate backdrop
// element, rounded-[8px] card, bordered header/footer rows. Sized larger than that pattern's usual
// ~440-560px since this one is previewing a file rather than a short form. There's no real file content
// behind these attachments (mock data is just name + size), so this is an honest placeholder preview
// rather than a real viewer — Download stays a toast, matching how download already works everywhere
// else in the app.
//
// Most callers only ever have one attachment to show and just pass `attachment`. The Command Center
// worklist's attachment badge opens straight into this modal for the whole row instead of showing a
// separate picker first — it passes the full `attachments` list, and this modal shows the count + an
// in-modal switcher so browsing multiple files happens in one place instead of two.
export function AttachmentPreviewModal({
  attachment,
  attachments,
  onClose,
}: {
  attachment: AttachmentPreviewFile | null;
  attachments?: AttachmentPreviewFile[];
  onClose: () => void;
}) {
  const list = attachments && attachments.length > 0 ? attachments : attachment ? [attachment] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    setActiveIndex(0);
  }, [attachment, attachments]);

  if (list.length === 0) return null;
  const current = list[Math.min(activeIndex, list.length - 1)];
  const meta = attachmentMeta(current.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[640px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
          <div className="min-w-0">
            <span className="text-[16px] font-bold text-[#262626] truncate block">{current.name}</span>
            {list.length > 1 && (
              <span className="flex items-center gap-1 text-[11.5px] text-[#97999B] mt-0.5">
                <Paperclip size={11} />
                Attachments ({list.length})
              </span>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        {list.length > 1 && (
          <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-[#DEDEDE] overflow-x-auto">
            {list.map((f, i) => (
              <button
                key={f.name}
                onClick={() => setActiveIndex(i)}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors ${i === activeIndex ? "text-white" : "text-[#4D4D4D] bg-[#F1F2F4] hover:bg-[#E2E6E9]"}`}
                style={i === activeIndex ? { backgroundColor: "#30578D" } : undefined}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-auto px-6 py-6">
          <div className="flex flex-col items-center justify-center gap-4 rounded-[8px] bg-[#F7F7F7] border border-[#E2E6E9] h-[420px]">
            <div className="flex items-center justify-center size-[72px] rounded-[12px] shrink-0" style={{ backgroundColor: meta.bg }}>
              <meta.icon size={32} style={{ color: meta.fg }} />
            </div>
            <div className="text-center min-w-0 max-w-[420px] px-4">
              <p className="text-[14px] font-semibold text-[#262626] break-all">{current.name}</p>
              <p className="text-[12px] text-[#97999B] mt-1">{current.size}</p>
            </div>
            <p className="text-[12px] text-[#97999B] text-center">Your file appears here</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#DEDEDE]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] border border-[#E2E6E9] text-[13px] font-medium text-[#4D4D4D] hover:bg-[#F7F7F7] transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => toast.info(`Downloading ${current.name}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: "#30578D" }}
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
