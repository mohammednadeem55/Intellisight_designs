import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar, ChevronDown, Copy, Download, FileText, Link, Mail, MapPin, Phone, User, X } from "lucide-react";
import { TextField } from "../../components/common/TextField";
import { EmailTableTooltip, TruncateTooltip } from "../../components/common/EmailTable";
import { WaveLoader } from "../../components/common/Loader";
import { Button } from "../../components/common/Button";
import { useOrderCreation } from "./useOrderCreation";

// Same collapsible-section chrome as CCC Creation's and AI Order Validation's field groups — chevron,
// title, optional "X/Y matched" badge, divider only while open — so every stage's cards read identically.
function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-[8px] border border-[#ebebeb]">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-5 py-4 cursor-pointer ${open ? "border-b border-[#f3f4f6]" : ""}`}
      >
        <ChevronDown size={15} className={`text-[#6b7280] transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
        <h3 className="text-[14px] font-bold text-[#111827]">{title}</h3>
        {badge && <span className="text-[11px] font-medium text-[#9ca3af] bg-[#f3f4f6] px-2 py-0.5 rounded-[8px]">{badge}</span>}
      </button>
      {open && <div className="px-5 py-5">{children}</div>}
    </div>
  );
}

// Viewable-in-place instructions, not a file to download — same overlay/card chrome as the app's other
// modals (see EmailTable.tsx's review-history modal).
function ShippingInstructionsModal({ instructions, onClose }: { instructions: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-[480px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE] shrink-0">
          <h2 className="text-[16px] font-bold text-[#262626]">Shipping Instructions</h2>
          <button onClick={onClose} className="text-[#97999B] hover:text-[#4D4D4D] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">
          <p className="text-[13px] text-[#374151] leading-[1.7] whitespace-pre-line">{instructions}</p>
        </div>
      </div>
    </div>
  );
}

export function OrderCreationBody({ emailId }: { emailId: string }) {
  const { data: creation, loading, error, reload } = useOrderCreation(emailId);
  const [quoteNumber, setQuoteNumber] = useState("");
  const [quoteVersion, setQuoteVersion] = useState("");
  const [shipToCity, setShipToCity] = useState("");
  const [accountName, setAccountName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    if (!creation) return;
    setQuoteNumber(creation.quoteFields.quoteNumber);
    setQuoteVersion(creation.quoteFields.quoteVersion);
    setShipToCity(creation.quoteFields.shipToCity);
    setAccountName(creation.quoteFields.accountName);
    setContactName(creation.quoteFields.contactName);
    setEmail(creation.quoteFields.email);
    setPhone(creation.quoteFields.phone);
  }, [creation]);

  const copyToClipboard = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  if (loading || error) {
    return (
      <div className="bg-white rounded-[8px] border border-[#ebebeb] flex items-center justify-center py-20">
        {error ? (
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <p className="text-[14px] font-semibold text-[#111827]">Couldn't load order creation data</p>
            <p className="text-[12.5px] text-[#9ca3af] max-w-[360px]">{error}</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : (
          <WaveLoader size={40} />
        )}
      </div>
    );
  }

  const c = creation!; // guaranteed non-null past the loading/error guard above

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      {/* Left: quote / order creation details */}
      <div className="flex flex-col gap-4">
        <Section title="Quote" badge="6/7 matched">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <TextField
              label="Quote Number"
              required
              variant="missing"
              value={quoteNumber}
              onChange={setQuoteNumber}
              placeholder="Required - enter value"
            />
            <TextField label="Ship To City" required variant="matched" value={shipToCity} onChange={setShipToCity} />
            <TextField label="Quote Version" required variant="matched" value={quoteVersion} onChange={setQuoteVersion} />
            <TextField label="Account Name" variant="matched" value={accountName} onChange={setAccountName} />
            <TextField label="Contact Name" variant="matched" value={contactName} onChange={setContactName} />
            <TextField label="Email" variant="matched" value={email} onChange={setEmail} />
            <TextField label="Phone" variant="matched" value={phone} onChange={setPhone} />
          </div>
        </Section>
      </div>

      {/* Right: order summary + ship-to + documents */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
          <h3 className="text-[14px] font-bold text-[#111827]">Order Summary</h3>
          <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">Key details captured for this order.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 rounded-[8px] bg-[#f7f8fa] px-3 py-2.5">
              <div className="size-[30px] rounded-[8px] bg-[#EAF1FB] flex items-center justify-center shrink-0">
                <Calendar size={14} className="text-[#30578D]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[#9ca3af]">Request Date</p>
                <p className="text-[12.5px] font-semibold text-[#111827] truncate">{c.orderSummary.requestDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-[8px] bg-[#f7f8fa] px-3 py-2.5">
              <div className="size-[30px] rounded-[8px] bg-[#EAF1FB] flex items-center justify-center shrink-0">
                <User size={14} className="text-[#30578D]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[#9ca3af]">Sales Order Owner</p>
                <p className="text-[12.5px] font-semibold text-[#111827] truncate">{c.orderSummary.salesOrderOwner}</p>
              </div>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-[8px] bg-[#f7f8fa] px-3.5 py-3 min-w-0">
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-1.5">Bill To Contact</p>
              <TruncateTooltip label={c.orderSummary.billTo.name} className="text-[12.5px] font-semibold text-[#111827]" />
              <p className="flex items-center gap-1.5 text-[11.5px] text-[#6b7280] mt-1.5">
                <Mail size={11} className="shrink-0" />
                <TruncateTooltip label={c.orderSummary.billTo.email} className="flex-1" />
                <EmailTableTooltip label="Copy email">
                  <button
                    onClick={() => copyToClipboard("Email", c.orderSummary.billTo.email)}
                    className="text-[#9ca3af] hover:text-[#111827] cursor-pointer transition-colors shrink-0"
                  >
                    <Copy size={11} />
                  </button>
                </EmailTableTooltip>
              </p>
              <p className="flex items-center gap-1.5 text-[11.5px] text-[#6b7280] mt-1">
                <Phone size={11} className="shrink-0" />
                <TruncateTooltip label={c.orderSummary.billTo.phone} className="flex-1" />
              </p>
            </div>
            <div className="rounded-[8px] bg-[#f7f8fa] px-3.5 py-3 min-w-0">
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-1.5">Ship To Contact</p>
              <TruncateTooltip label={c.orderSummary.shipTo.name} className="text-[12.5px] font-semibold text-[#111827]" />
              <p className="flex items-center gap-1.5 text-[11.5px] text-[#6b7280] mt-1.5">
                <Mail size={11} className="shrink-0" />
                <TruncateTooltip label={c.orderSummary.shipTo.email} className="flex-1" />
                <EmailTableTooltip label="Copy email">
                  <button
                    onClick={() => copyToClipboard("Email", c.orderSummary.shipTo.email)}
                    className="text-[#9ca3af] hover:text-[#111827] cursor-pointer transition-colors shrink-0"
                  >
                    <Copy size={11} />
                  </button>
                </EmailTableTooltip>
              </p>
              <p className="flex items-center gap-1.5 text-[11.5px] text-[#6b7280] mt-1">
                <Phone size={11} className="shrink-0" />
                <TruncateTooltip label={c.orderSummary.shipTo.phone} className="flex-1" />
              </p>
            </div>
          </div>

          <button
            onClick={() => setInstructionsOpen(true)}
            className="group w-full flex items-center gap-2.5 rounded-[8px] border border-[#ebebeb] hover:border-[#d1d5db] hover:bg-[#f8fafc] px-3 py-2.5 mt-2.5 transition-colors text-left cursor-pointer"
          >
            <div className="size-[30px] rounded-[8px] bg-[#EAF1FB] flex items-center justify-center shrink-0">
              <Link size={14} className="text-[#30578D]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[#9ca3af]">Shipping Instructions</p>
              <p className="text-[12.5px] font-semibold text-[#30578D] group-hover:underline">View shipping instructions</p>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
          <h3 className="text-[14px] font-bold text-[#111827]">Ship To</h3>
          <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">Products shipping address</p>
          <div className="flex items-start gap-3 rounded-[8px] bg-[#f7f8fa] px-3.5 py-3">
            <div className="size-[34px] rounded-[8px] bg-[#EAF1FB] flex items-center justify-center shrink-0">
              <MapPin size={16} className="text-[#30578D]" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#111827] truncate">{c.shipTo.company}</p>
              <p className="text-[12px] text-[#6b7280] mt-1 leading-[1.6]">
                {c.shipTo.address}<br />
                {c.shipTo.cityState}<br />
                {c.shipTo.country}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[8px] border border-[#ebebeb] px-5 py-4">
          <h3 className="text-[14px] font-bold text-[#111827]">Documents</h3>
          <p className="text-[12px] text-[#9ca3af] mt-0.5 mb-3">{c.documents.length} file{c.documents.length !== 1 ? "s" : ""} attached</p>
          <div className="flex flex-col gap-2">
            {c.documents.map(doc => (
              <button
                key={doc.name}
                onClick={() => toast.info(`Downloading ${doc.name}`)}
                className="group flex items-center gap-2.5 px-3 py-2 rounded-[8px] border border-[#ebebeb] hover:border-[#d1d5db] hover:bg-[#f8fafc] cursor-pointer transition-colors text-left w-full"
              >
                <div className="size-[32px] rounded-[8px] bg-[#FDECEA] flex items-center justify-center shrink-0">
                  <FileText size={15} className="text-[#DC2626]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-[#111827] truncate">{doc.name}</p>
                  <p className="text-[11px] text-[#9ca3af]">{doc.size}</p>
                </div>
                <Download size={14} className="text-[#9ca3af] group-hover:text-[#111827] transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {instructionsOpen && <ShippingInstructionsModal instructions={c.shippingInstructions} onClose={() => setInstructionsOpen(false)} />}
    </div>
  );
}
