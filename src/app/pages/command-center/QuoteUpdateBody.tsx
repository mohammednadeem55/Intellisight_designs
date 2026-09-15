import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Archive, Check, ChevronDown, Download, FileImage, FileSpreadsheet, FileText, Info, MapPin, Search, User } from "lucide-react";
import { TextField } from "../../components/common/TextField";
import { WaveLoader } from "../../components/common/Loader";
import { Button } from "../../components/common/Button";
import { AttachmentPreviewModal } from "../../components/common/AttachmentPreviewModal";
import { useOrderCreation } from "./useOrderCreation";

// Mock account directory for the Bill To / Ship To Account search fields — a few "Abbott" variants so
// typing the pre-filled Account Name's prefix demonstrates multiple matches. Each account can carry more
// than one address (e.g. separate billing vs. manufacturing sites), which is what the Address dropdowns
// below filter down to once an account is picked.
type Account = { name: string; addresses: string[] };
const MOCK_ACCOUNTS: Account[] = [
  { name: "Abbott Laboratories", addresses: ["100 Abbott Park Road, Abbott Park, IL 60064, United States", "1401 Sheridan Road, North Chicago, IL 60064, United States"] },
  { name: "Abbott Vascular", addresses: ["3200 Lakeside Drive, Santa Clara, CA 95054, United States"] },
  { name: "Abbott Rapid Diagnostics", addresses: ["100 Northeast Drive, Jefferson Hills, PA 15025, United States"] },
  { name: "Acme Industries", addresses: ["45 Industrial Pkwy, Cleveland, OH 44101, United States"] },
  { name: "MACOM Technology Solutions Inc.", addresses: ["100 Chelmsford Street, Lowell, MA 01851, United States", "20 Elizabeth Drive, Chelmsford, MA 01824, United States"] },
  { name: "MetaSite Inc", addresses: ["500 Meta Blvd, San Jose, CA 95110, United States"] },
  { name: "Nexus Corp", addresses: ["88 Nexus Way, Austin, TX 78701, United States"] },
  { name: "Sterling & Co", addresses: ["12 Sterling Plaza, New York, NY 10001, United States"] },
  { name: "GlobalTech Industries", addresses: ["77 GlobalTech Drive, Seattle, WA 98101, United States"] },
];

// Shared label row (required asterisk + Manually Filled / Missing badges) — identical between
// AccountSearchField and AddressSelectField below, so both read like the same field family as TextField.
function FieldLabelRow({ label, required, manuallyFilled, missing }: { label: string; required?: boolean; manuallyFilled?: boolean; missing?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <p className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wide">
        {label}
        {required && <span className="text-[#BA1C1C]"> *</span>}
      </p>
      <div className="flex items-center gap-1.5 shrink-0">
        {manuallyFilled && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[1px]" style={{ color: "#30578D", backgroundColor: "#EAF1FB" }}>
            <User size={9} /> Manually Filled
          </span>
        )}
        {missing && (
          <span className="text-[10px] font-bold uppercase tracking-wide rounded-[8px] px-1.5 py-[1px]" style={{ color: "#BA1C1C", backgroundColor: "#FDECEA" }}>
            Missing
          </span>
        )}
      </div>
    </div>
  );
}

// Search-as-you-type account picker — type 3+ letters, pick a match from the dropdown. The results panel
// only mounts once there's an actual query (>= 3 chars) — showing a "keep typing" hint on mere focus was
// what caused it to float over the field directly below, since a fixed-position portal doesn't reserve
// layout space the way an inline element would. Mirrors TextField's label/required/badge/border chrome so
// it reads identically to the fields around it, but swaps the plain input for a filtered, portal-positioned
// results list (same fixed/getBoundingClientRect pattern used for every other dropdown in the app that
// can't risk being clipped by an ancestor's overflow).
function AccountSearchField({
  label,
  required,
  variant,
  manuallyFilled,
  value,
  onChange,
  onCommit,
  onSelectAccount,
}: {
  label: string;
  required?: boolean;
  variant: "matched" | "missing";
  manuallyFilled?: boolean;
  value: string;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
  onSelectAccount: (account: Account) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  // Anchored to the bordered input box itself, not the field's outer wrapper — that wrapper is a grid item
  // that gets stretched to match its taller row-sibling (Bill To Address / Ship To Address, which carry an
  // extra helper-text line), so measuring its bottom put the dropdown well below the actual visible input.
  const boxRef = useRef<HTMLDivElement>(null);

  // The results panel is a `position: fixed` portal, positioned once at open time — it has no way to know
  // the page (or any scrollable ancestor, e.g. this stage's own `overflow-y-auto` body) has scrolled since,
  // so it would otherwise drift away from the field instead of tracking it. Closing on scroll is simpler
  // and less error-prone than live-repositioning it on every scroll tick. `capture: true` is required since
  // scroll events don't bubble — this is the only way to hear scrolling on an arbitrary ancestor.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const query = value.trim().toLowerCase();
  const results = query.length >= 3 ? MOCK_ACCOUNTS.filter(a => a.name.toLowerCase().includes(query)) : [];

  // Only opens while actively typing (onChange), not on focus — a field that already holds a valid
  // selected account (3+ chars) would otherwise pop the results list open the instant you click in to view
  // or edit it, immediately covering the value you clicked in to see.
  const openIfSearchable = (q: string) => {
    if (q.trim().length < 3) {
      setOpen(false);
      return;
    }
    const r = boxRef.current?.getBoundingClientRect();
    if (r) setRect({ top: r.bottom + 2, left: r.left, width: r.width });
    setOpen(true);
  };

  const style = variant === "matched" ? { border: "border-[#468657]", bg: "bg-[#EFF6F1]" } : { border: "border-[#BA1C1C]", bg: "bg-white" };

  return (
    <div>
      <FieldLabelRow label={label} required={required} manuallyFilled={manuallyFilled} missing={variant === "missing"} />

      <div ref={boxRef} className={`rounded-[8px] border ${style.border} ${style.bg}`}>
        <div className="flex items-center gap-2 px-3.5 h-[42px]">
          <Search size={13} className="text-[#9ca3af] shrink-0" />
          <input
            value={value}
            onChange={(e) => { onChange(e.target.value); openIfSearchable(e.target.value); }}
            onBlur={() => { onCommit(value); setTimeout(() => setOpen(false), 150); }}
            placeholder="Type 3+ letters to search"
            className="flex-1 min-w-0 text-[13px] text-[#111827] placeholder:text-[#9ca3af] outline-none bg-transparent"
          />
          {variant === "matched" && <Check size={15} className="text-[#468657] shrink-0" strokeWidth={3} />}
        </div>
      </div>

      {open && rect && createPortal(
        <div
          className="fixed bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-[9999] py-1 max-h-[220px] overflow-y-auto"
          style={{ top: rect.top, left: rect.left, width: rect.width }}
        >
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-[12px] text-[#9ca3af]">No matching accounts</p>
          ) : (
            results.map(a => (
              <button
                key={a.name}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(a.name); onCommit(a.name); onSelectAccount(a); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-[#f8fafc] cursor-pointer transition-colors"
              >
                <p className="font-medium text-[#111827]">{a.name}</p>
                <p className="text-[11px] text-[#9ca3af] truncate">{a.addresses[0]}{a.addresses.length > 1 ? ` +${a.addresses.length - 1} more` : ""}</p>
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// Address dropdown — options come entirely from whichever account is currently selected in the paired
// Account field (per the "select an account name to show corresponding addresses" helper text), so it's
// disabled with no options until that account is chosen. Same select/portal pattern as DefaultMappingPage's
// SelectField.
function AddressSelectField({
  label,
  required,
  variant,
  manuallyFilled,
  value,
  options,
  onSelect,
}: {
  label: string;
  required?: boolean;
  variant: "matched" | "missing";
  manuallyFilled?: boolean;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const disabled = options.length === 0;
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Same "close on scroll" fix as AccountSearchField — this is also a `position: fixed` portal positioned
  // once at open time, so it would otherwise drift away from the field on scroll instead of tracking it.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!open) {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setRect({ top: r.bottom + 2, left: r.left, width: r.width });
    }
    setOpen(v => !v);
  };

  const style = disabled
    ? { border: "border-[#e5e7eb]", bg: "bg-[#f7f8fa]" }
    : variant === "matched"
      ? { border: "border-[#468657]", bg: "bg-[#EFF6F1]" }
      : { border: "border-[#BA1C1C]", bg: "bg-white" };

  return (
    <div>
      <FieldLabelRow label={label} required={required} manuallyFilled={manuallyFilled} missing={!disabled && variant === "missing"} />

      <button
        ref={btnRef}
        onClick={toggleOpen}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 rounded-[8px] border px-3.5 h-[42px] text-left text-[13px] transition-colors ${style.border} ${style.bg} ${disabled ? "text-[#9ca3af] cursor-not-allowed" : "text-[#111827] cursor-pointer"}`}
      >
        <span className="truncate">{value || (disabled ? "Select an account first" : "Select an address")}</span>
        <div className="flex items-center gap-2 shrink-0">
          {!disabled && variant === "matched" && <Check size={15} className="text-[#468657]" strokeWidth={3} />}
          <ChevronDown size={14} className={`text-[#9ca3af] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      <p className="flex items-center gap-1.5 text-[11px] mt-1 text-[#6b7280]">
        <Info size={12} className="shrink-0" />
        Select an account name to show corresponding addresses
      </p>

      {open && rect && !disabled && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-[9999] py-1 max-h-[220px] overflow-y-auto"
            style={{ top: rect.top, left: rect.left, width: rect.width }}
          >
            {options.map(addr => (
              <button
                key={addr}
                onClick={() => { onSelect(addr); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[12.5px] cursor-pointer transition-colors ${addr === value ? "font-semibold text-[#30578D] bg-[#EAF1FB]" : "text-[#4D4D4D] hover:bg-[#F7F7F7]"}`}
              >
                {addr}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// Icon + color per file type — matches the same ext-based helper duplicated across the order pages.
function docMeta(name: string): { icon: typeof FileText; bg: string; fg: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: FileText, bg: "#FDECEA", fg: "#DC2626" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: FileSpreadsheet, bg: "#E8F5E9", fg: "#2E7D32" };
  if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) return { icon: FileImage, bg: "#EAF1FB", fg: "#30578D" };
  if (["zip", "rar", "7z"].includes(ext)) return { icon: Archive, bg: "#FDF3E7", fg: "#92600B" };
  return { icon: FileText, bg: "#f3f4f6", fg: "#6b7280" };
}

// Same collapsible-section chrome as every other stage's field groups — chevron, title, optional
// "X/Y matched" badge, divider only while open — so every stage's cards read identically.
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
      {open && <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>}
    </div>
  );
}

export type QuoteUpdateAuditEntry = { action: string; icon?: typeof Check; detail?: string };

// Split out of what used to be the combined "Order Creation" screen — this is the quote-editing half,
// now its own step ahead of Order Creation. Same underlying data source (useOrderCreation's quoteFields)
// and the same field-level commit/revert/audit behavior as before the split.
export function QuoteUpdateBody({ emailId, onAudit }: { emailId: string; onAudit?: (entry: QuoteUpdateAuditEntry) => void }) {
  const { data: creation, loading, error, reload } = useOrderCreation(emailId);
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; size: string } | null>(null);
  const [poNumber, setPoNumber] = useState("");
  const [edeliveryEmail, setEdeliveryEmail] = useState("");
  const [billToAccount, setBillToAccount] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [shipToAccount, setShipToAccount] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [endUseAccount, setEndUseAccount] = useState("");
  const [endUseAddress, setEndUseAddress] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [quoteVersion, setQuoteVersion] = useState("");
  const [shipToCity, setShipToCity] = useState("");
  const [accountName, setAccountName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Last-committed value per field, so blurring a field that wasn't actually edited (e.g. tabbing through)
  // doesn't log a no-op "changed" entry — only a real before → after diff does.
  const [baseline, setBaseline] = useState<Record<string, string>>({});
  // Fields the user has actually typed a real change into — drives each field's "Manually Filled" pill.
  const [manuallyEdited, setManuallyEdited] = useState<Set<string>>(new Set());
  // Snapshot of each field's value as it first arrived (pre-edit), captured once and never mutated again —
  // separate from `baseline` (which advances with every commit) so a revert has something fixed to go back to.
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({});
  const fieldSetters: Record<string, (v: string) => void> = {
    poNumber: setPoNumber, edeliveryEmail: setEdeliveryEmail, billToAccount: setBillToAccount,
    billToAddress: setBillToAddress, shipToAccount: setShipToAccount, shipToAddress: setShipToAddress,
    endUseAccount: setEndUseAccount, endUseAddress: setEndUseAddress,
    quoteNumber: setQuoteNumber, quoteVersion: setQuoteVersion, shipToCity: setShipToCity,
    accountName: setAccountName, contactName: setContactName, email: setEmail, phone: setPhone,
  };

  useEffect(() => {
    if (!creation) return;
    const qf = creation.quoteFields;
    setPoNumber(qf.poNumber);
    setEdeliveryEmail(qf.edeliveryEmail);
    setBillToAccount(qf.billToAccount);
    setBillToAddress(qf.billToAddress);
    setShipToAccount(qf.shipToAccount);
    setShipToAddress(qf.shipToAddress);
    setEndUseAccount(qf.endUseAccount);
    setEndUseAddress(qf.endUseAddress);
    setQuoteNumber(qf.quoteNumber);
    setQuoteVersion(qf.quoteVersion);
    setShipToCity(qf.shipToCity);
    setAccountName(qf.accountName);
    setContactName(qf.contactName);
    setEmail(qf.email);
    setPhone(qf.phone);
    const seeded = {
      poNumber: qf.poNumber,
      edeliveryEmail: qf.edeliveryEmail,
      billToAccount: qf.billToAccount,
      billToAddress: qf.billToAddress,
      shipToAccount: qf.shipToAccount,
      shipToAddress: qf.shipToAddress,
      endUseAccount: qf.endUseAccount,
      endUseAddress: qf.endUseAddress,
      quoteNumber: qf.quoteNumber,
      quoteVersion: qf.quoteVersion,
      shipToCity: qf.shipToCity,
      accountName: qf.accountName,
      contactName: qf.contactName,
      email: qf.email,
      phone: qf.phone,
    };
    setBaseline(seeded);
    setOriginalValues(seeded);
    setManuallyEdited(new Set());
  }, [creation]);

  const commitField = (label: string, key: string, value: string) => {
    if (value === baseline[key]) return;
    onAudit?.({ action: "Field Updated", icon: Check, detail: `${label}: ${baseline[key] || "—"} → ${value}` });
    setBaseline(prev => ({ ...prev, [key]: value }));
    setManuallyEdited(prev => new Set(prev).add(key));
  };

  const revertField = (label: string, key: string) => {
    const previous = originalValues[key] ?? "";
    fieldSetters[key]?.(previous);
    setBaseline(prev => ({ ...prev, [key]: previous }));
    setManuallyEdited(prev => { const next = new Set(prev); next.delete(key); return next; });
    onAudit?.({ action: "Field Reverted", detail: `${label}: ${baseline[key] || "—"} → ${previous || "—"}` });
  };

  // Variant reflects the CURRENT value, not just whether the field was ever touched — otherwise clearing a
  // field out (e.g. deleting everything you typed) left it stuck showing "matched"/green + "Manually
  // Filled" with nothing actually in it. A field can only be "manually filled" if it's both been edited AND
  // still holds a value.
  const requiredVariant = (value: string): "matched" | "missing" => (value ? "matched" : "missing");
  const optionalVariant = (value: string): "matched" | "default" => (value ? "matched" : "default");
  const isManuallyFilled = (key: string, value: string) => manuallyEdited.has(key) && !!value;

  if (loading || error) {
    return (
      <div className="bg-white rounded-[8px] border border-[#ebebeb] flex items-center justify-center py-20">
        {error ? (
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <p className="text-[14px] font-semibold text-[#111827]">Couldn't load quote data</p>
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
      {/* Left: quote details */}
      <div className="flex flex-col gap-4">
        <Section title="Quote" badge="3/9 matched">
          <TextField
            label="PO Number"
            required
            variant={requiredVariant(poNumber)}
            manuallyFilled={isManuallyFilled("poNumber", poNumber)}
            revertible={manuallyEdited.has("poNumber")}
            onRevert={() => revertField("PO Number", "poNumber")}
            value={poNumber}
            onChange={setPoNumber}
            onBlur={() => commitField("PO Number", "poNumber", poNumber)}
          />
          <TextField
            label="Edelivery Email"
            required
            variant={requiredVariant(edeliveryEmail)}
            manuallyFilled={isManuallyFilled("edeliveryEmail", edeliveryEmail)}
            value={edeliveryEmail}
            onChange={setEdeliveryEmail}
            onBlur={() => commitField("Edelivery Email", "edeliveryEmail", edeliveryEmail)}
            placeholder="Required - enter value"
          />
          <AccountSearchField
            label="Bill To Account"
            required
            variant={requiredVariant(billToAccount)}
            manuallyFilled={isManuallyFilled("billToAccount", billToAccount)}
            value={billToAccount}
            onChange={setBillToAccount}
            onCommit={(v) => commitField("Bill To Account", "billToAccount", v)}
            onSelectAccount={(a) => {
              setBillToAccount(a.name);
              commitField("Bill To Account", "billToAccount", a.name);
              setBillToAddress(a.addresses[0]);
              commitField("Bill To Address", "billToAddress", a.addresses[0]);
            }}
          />
          <AddressSelectField
            label="Bill To Address"
            required
            variant={requiredVariant(billToAddress)}
            manuallyFilled={isManuallyFilled("billToAddress", billToAddress)}
            value={billToAddress}
            options={MOCK_ACCOUNTS.find(a => a.name === billToAccount)?.addresses ?? []}
            onSelect={(addr) => { setBillToAddress(addr); commitField("Bill To Address", "billToAddress", addr); }}
          />
          <AccountSearchField
            label="Ship To Account"
            required
            variant={requiredVariant(shipToAccount)}
            manuallyFilled={isManuallyFilled("shipToAccount", shipToAccount)}
            value={shipToAccount}
            onChange={setShipToAccount}
            onCommit={(v) => commitField("Ship To Account", "shipToAccount", v)}
            onSelectAccount={(a) => {
              setShipToAccount(a.name);
              commitField("Ship To Account", "shipToAccount", a.name);
              setShipToAddress(a.addresses[0]);
              commitField("Ship To Address", "shipToAddress", a.addresses[0]);
            }}
          />
          <AddressSelectField
            label="Ship To Address"
            required
            variant={requiredVariant(shipToAddress)}
            manuallyFilled={isManuallyFilled("shipToAddress", shipToAddress)}
            value={shipToAddress}
            options={MOCK_ACCOUNTS.find(a => a.name === shipToAccount)?.addresses ?? []}
            onSelect={(addr) => { setShipToAddress(addr); commitField("Ship To Address", "shipToAddress", addr); }}
          />
          <TextField
            label="End Use Account"
            variant={optionalVariant(endUseAccount)}
            manuallyFilled={isManuallyFilled("endUseAccount", endUseAccount)}
            value={endUseAccount}
            onChange={setEndUseAccount}
            onBlur={() => commitField("End Use Account", "endUseAccount", endUseAccount)}
          />
          <TextField
            label="End Use Address"
            variant={optionalVariant(endUseAddress)}
            manuallyFilled={isManuallyFilled("endUseAddress", endUseAddress)}
            value={endUseAddress}
            onChange={setEndUseAddress}
            onBlur={() => commitField("End Use Address", "endUseAddress", endUseAddress)}
            message={{ type: "info", text: "Select an account name to show corresponding addresses" }}
          />
          <TextField
            label="Quote Number"
            required
            variant={requiredVariant(quoteNumber)}
            manuallyFilled={isManuallyFilled("quoteNumber", quoteNumber)}
            value={quoteNumber}
            onChange={setQuoteNumber}
            onBlur={() => commitField("Quote Number", "quoteNumber", quoteNumber)}
            placeholder="Required - enter value"
          />
          <TextField label="Ship To City" required variant={requiredVariant(shipToCity)} manuallyFilled={isManuallyFilled("shipToCity", shipToCity)} revertible={manuallyEdited.has("shipToCity")} onRevert={() => revertField("Ship To City", "shipToCity")} value={shipToCity} onChange={setShipToCity} onBlur={() => commitField("Ship To City", "shipToCity", shipToCity)} />
          <TextField label="Quote Version" required variant={requiredVariant(quoteVersion)} manuallyFilled={isManuallyFilled("quoteVersion", quoteVersion)} revertible={manuallyEdited.has("quoteVersion")} onRevert={() => revertField("Quote Version", "quoteVersion")} value={quoteVersion} onChange={setQuoteVersion} onBlur={() => commitField("Quote Version", "quoteVersion", quoteVersion)} />
          <TextField label="Account Name" variant={optionalVariant(accountName)} manuallyFilled={isManuallyFilled("accountName", accountName)} revertible={manuallyEdited.has("accountName")} onRevert={() => revertField("Account Name", "accountName")} value={accountName} onChange={setAccountName} onBlur={() => commitField("Account Name", "accountName", accountName)} />
          <TextField label="Contact Name" variant={optionalVariant(contactName)} manuallyFilled={isManuallyFilled("contactName", contactName)} revertible={manuallyEdited.has("contactName")} onRevert={() => revertField("Contact Name", "contactName")} value={contactName} onChange={setContactName} onBlur={() => commitField("Contact Name", "contactName", contactName)} />
          <TextField label="Email" variant={optionalVariant(email)} manuallyFilled={isManuallyFilled("email", email)} revertible={manuallyEdited.has("email")} onRevert={() => revertField("Email", "email")} value={email} onChange={setEmail} onBlur={() => commitField("Email", "email", email)} />
          <TextField label="Phone" variant={optionalVariant(phone)} manuallyFilled={isManuallyFilled("phone", phone)} revertible={manuallyEdited.has("phone")} onRevert={() => revertField("Phone", "phone")} value={phone} onChange={setPhone} onBlur={() => commitField("Phone", "phone", phone)} />
        </Section>
      </div>

      {/* Right: ship-to + documents — same reference context shown on the Order Creation step */}
      <div className="flex flex-col gap-4">
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
            {c.documents.map(doc => {
              const meta = docMeta(doc.name);
              return (
                <button
                  key={doc.name}
                  onClick={() => setPreviewAttachment(doc)}
                  className="group flex items-center gap-2.5 px-3 py-2 rounded-[8px] border border-[#ebebeb] hover:border-[#d1d5db] hover:bg-[#f8fafc] cursor-pointer transition-colors text-left w-full"
                >
                  <div className="size-[32px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg }}>
                    <meta.icon size={15} style={{ color: meta.fg }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-[#111827] truncate">{doc.name}</p>
                    <p className="text-[11px] text-[#9ca3af]">{doc.size}</p>
                  </div>
                  <Download
                    size={14}
                    className="text-[#9ca3af] group-hover:text-[#111827] cursor-pointer transition-colors shrink-0"
                    onClick={(e) => { e.stopPropagation(); toast.info(`Downloading ${doc.name}`); }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AttachmentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </div>
  );
}
