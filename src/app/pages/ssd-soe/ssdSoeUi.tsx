import { Check, ChevronDown, Factory, ShieldCheck, Users } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EMAIL_TABLE_NAVY } from "../../components/common/EmailTable";
import { ENABLED_PERSONAS, PERSONA_LABELS, type CaseKind, type CaseSource, type CaseStatus, type Persona } from "./ssdSoeData";
import { setPersona } from "./ssdSoeStore";

export const GREEN = "#468657";
export const RED = "#BA1C1C";
export const AMBER = "#92600B";
export const PURPLE = "#823E81";

const STATUS_STYLE: Record<CaseStatus, { fg: string; bg: string }> = {
  New: { fg: "#30578D", bg: "#EAF1FB" },
  "In Progress": { fg: "#30578D", bg: "#EAF1FB" },
  "Awaiting Approval": { fg: AMBER, bg: "#FDF3E7" },
  Approved: { fg: GREEN, bg: "#EFF6F1" },
  Rejected: { fg: RED, bg: "#FDECEA" },
  "Pending RME": { fg: PURPLE, bg: "#F4ECF4" },
  Closed: { fg: "#666666", bg: "#F1F2F4" },
  Cancelled: { fg: "#666666", bg: "#F1F2F4" },
};

export function StatusPill({ status }: { status: CaseStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ color: s.fg, backgroundColor: s.bg }}>
      {status}
    </span>
  );
}

// SOE vs SSD cases get their own colour (the legacy legend did the same: grey for SOE, blue for SSD).
export const KIND_STYLE: Record<CaseKind, { fg: string; bg: string; label: string }> = {
  SOE: { fg: "#4D4D4D", bg: "#ECEDEF", label: "SOE" },
  SSD: { fg: "#30578D", bg: "#DCE8F7", label: "SSD" },
};
export function KindPill({ kind }: { kind: CaseKind }) {
  const k = KIND_STYLE[kind];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10.5px] font-bold tracking-wide" style={{ color: k.fg, backgroundColor: k.bg }}>
      {k.label}
    </span>
  );
}

export function SourcePill({ source }: { source: CaseSource }) {
  return <span className="text-[12px] text-[#4D4D4D] whitespace-nowrap">{source === "Factory" ? "Factory upload" : "Salesforce"}</span>;
}

export function YesNoPill({ yes, label }: { yes: boolean; label?: string }) {
  return yes ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ color: PURPLE, backgroundColor: "#F4ECF4" }}>
      {label ?? "Yes"}
    </span>
  ) : (
    <span className="text-[12px] text-[#97999B]">No</span>
  );
}

const PERSONA_ICON: Record<Persona, typeof Users> = { csr: Users, factory: Factory, rme: ShieldCheck };

// Demo-only control for switching between the three personas, so one prototype can show all three views.
export function PersonaSwitcher({ persona }: { persona: Persona }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  const Current = PERSONA_ICON[persona];
  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
          open ? "border-[#30578D] text-[#30578D] bg-[#30578D]/5" : "border-[#E2E6E9] bg-white text-[#4D4D4D] hover:bg-[#F7F7F7]"
        }`}
      >
        <Current size={13} />
        {PERSONA_LABELS[persona].name}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-40 py-1 w-[240px]">
          {(Object.keys(PERSONA_LABELS) as Persona[]).map((p) => {
            const Icon = PERSONA_ICON[p];
            const enabled = ENABLED_PERSONAS.includes(p);
            return (
              <button
                key={p}
                disabled={!enabled}
                onClick={() => { setPersona(p); setOpen(false); }}
                title={PERSONA_LABELS[p].blurb}
                className={`w-full flex items-center gap-2 text-left px-3.5 py-2 text-[12.5px] transition-colors ${enabled ? "hover:bg-[#F7F7F7] cursor-pointer" : "cursor-not-allowed"}`}
                style={p === persona ? { color: EMAIL_TABLE_NAVY, fontWeight: 600 } : { color: enabled ? "#4D4D4D" : "#BFC1C4" }}
              >
                <Icon size={13} />
                {PERSONA_LABELS[p].name}
                {!enabled && <span className="ml-auto text-[10.5px] font-semibold text-[#97999B] bg-[#F1F2F4] rounded-full px-2 py-0.5">Coming soon</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StatTile({ label, value, sub, accent, icon }: { label: string; value: string | number; sub?: string; accent: string; icon: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[8px] border border-[#E2E6E9] p-4 flex items-center gap-3.5" style={{ background: `linear-gradient(135deg, ${accent}10, #ffffff 65%)` }}>
      <div className="size-[40px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}1A`, color: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold text-[#666666] uppercase tracking-wide truncate">{label}</p>
        <p className="text-[24px] font-bold text-[#262626] leading-none mt-1">{value}</p>
        {sub && <p className="text-[11px] text-[#97999B] mt-1 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-[#97999B]">{label}</p>
      <div className="text-[13px] text-[#262626] mt-0.5 break-words">{children || <span className="text-[#BFC1C4]">-</span>}</div>
    </div>
  );
}

export const OkIcon = Check;
