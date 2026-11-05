import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, CircleDot, MessageSquareText, ShieldCheck } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { EMAIL_TABLE_NAVY, InfoTile } from "../../components/common/EmailTable";
import { buildCaseActivity, type ActivityEvent, type ActivityKind } from "./ssdSoeData";
import { useSsdSoeCases } from "./ssdSoeStore";
import { KindPill, secondaryBtn, StatusPill } from "./ssdSoeUi";

type NavProps = {
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
};

const KIND_ICON: Record<ActivityKind, typeof CircleDot> = { case: CircleDot, comment: MessageSquareText, oracle: CheckCircle2, rme: ShieldCheck };
const FILTERS: { key: "all" | ActivityKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "comment", label: "Comments" },
  { key: "oracle", label: "Oracle" },
  { key: "rme", label: "RME" },
];

// Full-page Case Details: every header field on the left, the whole case history on the right.
export function SsdSoeCaseInfoPage(nav: NavProps) {
  const navigate = useNavigate();
  const { caseNo } = useParams<{ caseNo: string }>();
  const cases = useSsdSoeCases();
  const c = cases.find((x) => x.caseNo === caseNo);
  const [filter, setFilter] = useState<"all" | ActivityKind>("all");
  const events = useMemo(() => (c ? buildCaseActivity(c) : []), [c]);
  const shown = filter === "all" ? events : events.filter((e) => e.kind === filter);

  const shell = (body: React.ReactNode) => (
    <div className="bg-[#f5f6fa] flex size-full h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.06)] relative z-50">
          <AppHeader activeNav="SSD / SOE" {...nav} />
        </div>
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-[1600px] mx-auto px-5 pt-3 pb-6 flex flex-col gap-4">{body}</div>
        </main>
      </div>
    </div>
  );

  if (!c) {
    return shell(
      <div className="bg-white rounded-[8px] border border-[#E2E6E9] py-16 text-center">
        <p className="text-[14px] font-semibold text-[#374151]">Case {caseNo} was not found</p>
        <button onClick={() => navigate("/ssd-soe")} className="mt-3 text-[12.5px] font-semibold hover:underline cursor-pointer" style={{ color: EMAIL_TABLE_NAVY }}>Back to My Cases</button>
      </div>
    );
  }

  const sections: { title: string; tiles: [string, React.ReactNode][] }[] = [
    { title: "Case", tiles: [["Case number", c.caseNo], ["Type", c.kind], ["Status", c.status], ["Source", c.source === "Factory" ? "Factory upload" : "Salesforce"], ["SSD case number", c.ssdCaseNo], ["SSD case status", c.ssdCaseStatus], ["Linked case", c.linkedCase]] },
    { title: "Order", tiles: [["Order number", c.orderNo], ["Order status", c.orderStatus], ["Customer PO", c.customerPo], ["CRDD type", c.crddType], ["CRDD date", c.crddDate], ["Total unit selling price (USD)", c.totalPriceUsd], ["Header hold info", c.headerHold]] },
    { title: "Customer & Region", tiles: [["Customer", c.customer], ["Operating unit", c.ou], ["Region", c.region], ["Destination", c.destination], ["Field engineer", c.fieldEngineer], ["Original request", c.originalRequest]] },
    { title: "People & Dates", tiles: [["Requester", c.requester], ["CSR", c.csr], ["Date submitted", c.dateSubmitted], ["Date closed", c.dateClosed]] },
  ];

  return shell(
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Breadcrumbs items={[{ label: "SSD / SOE" }, { label: "My Cases", onClick: () => navigate("/ssd-soe") }, { label: `Case ${c.caseNo}`, onClick: () => navigate(`/ssd-soe/case/${c.caseNo}`) }, { label: "Details" }]} />
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[18px] font-semibold text-[#262626] leading-tight">Case {c.caseNo} details</h1>
            <KindPill kind={c.kind} />
            <StatusPill status={c.status} />
          </div>
          <p className="text-[12px] text-[#97999B] mt-0.5">{c.customer} · Order {c.orderNo} · {c.lines.length} line{c.lines.length === 1 ? "" : "s"}</p>
        </div>
        <button onClick={() => navigate(`/ssd-soe/case/${c.caseNo}`)} className={secondaryBtn}><ArrowLeft size={14} /> Back to case</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(380px,34%)] gap-4 items-start">
        <div className="flex flex-col gap-4">
          {sections.map((sec) => (
            <div key={sec.title} className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden">
              <div className="px-5 py-2.5 border-b border-[#E2E6E9] bg-[#F7F7F7]">
                <h2 className="text-[13px] font-bold text-[#262626]">{sec.title}</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5 px-5 py-4">
                {sec.tiles.map(([label, value]) => (
                  <InfoTile key={label} label={label} value={value || "-"} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[8px] border border-[#E2E6E9] overflow-hidden xl:sticky xl:top-3">
          <div className="px-5 py-2.5 border-b border-[#E2E6E9] bg-[#F7F7F7] flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-bold text-[#262626]">History <span className="font-medium text-[#97999B]">{events.length}</span></h2>
          </div>
          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-[#E2E6E9] flex-wrap">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const n = f.key === "all" ? events.length : events.filter((e) => e.kind === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="px-2.5 h-[26px] rounded-full border text-[12px] font-semibold cursor-pointer transition-colors"
                  style={active ? { borderColor: EMAIL_TABLE_NAVY, backgroundColor: "#EAF1FB", color: EMAIL_TABLE_NAVY } : { borderColor: "#E2E6E9", color: "#666666" }}
                >
                  {f.label} <span className="font-medium opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
          <div className="px-5 py-4 max-h-[calc(100vh-260px)] overflow-y-auto">
            {shown.length === 0 ? (
              <p className="text-[13px] text-[#97999B] text-center py-8">Nothing here yet.</p>
            ) : (
              <ol className="relative">
                {shown.map((e, i) => (
                  <TimelineItem key={i} e={e} last={i === shown.length - 1} />
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function TimelineItem({ e, last }: { e: ActivityEvent; last: boolean }) {
  const Icon = KIND_ICON[e.kind];
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && <span className="absolute left-[11px] top-[26px] bottom-0 w-px bg-[#E2E6E9]" />}
      <span className="relative z-[1] size-[24px] rounded-full bg-white border border-[#E2E6E9] flex items-center justify-center shrink-0">
        <Icon size={12} className="text-[#666666]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[12.5px] font-semibold text-[#262626] leading-[1.4]">
            {e.title}
            {e.line && <span className="ml-1.5 text-[11px] font-medium text-[#97999B]">line {e.line}</span>}
          </p>
          <span className="text-[11px] text-[#97999B] whitespace-nowrap shrink-0">{e.at}</span>
        </div>
        <p className="text-[11.5px] text-[#97999B] mt-0.5">{e.by}</p>
        {e.text && <p className="text-[12.5px] text-[#4D4D4D] leading-[1.55] mt-1.5 rounded-[8px] bg-[#F7F7F7] border border-[#E2E6E9] px-3 py-2">{e.text}</p>}
      </div>
    </li>
  );
}
