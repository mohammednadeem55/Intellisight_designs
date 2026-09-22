import type { ReactNode } from "react";
import { ArrowRight, CirclePause, LayoutGrid } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";

function CommandCenterPreview() {
  const rows = [
    { color: "#30578D", w: "72%", pill: "Flagged", pillColor: "#d12e2e", pillBg: "rgba(209,46,46,0.12)" },
    { color: "#468657", w: "58%", pill: "Cleared", pillColor: "#1fa161", pillBg: "rgba(31,161,97,0.12)" },
    { color: "#E67919", w: "64%", pill: "Under Review", pillColor: "#e08c00", pillBg: "rgba(224,140,0,0.12)" },
    { color: "#823E81", w: "48%", pill: "Flagged", pillColor: "#d12e2e", pillBg: "rgba(209,46,46,0.12)" },
  ];
  return (
    <div className="relative rounded-[8px] overflow-hidden h-full" style={{ background: "linear-gradient(135deg, #0F2A4A 0%, #1B3F6E 55%, #30578D 100%)" }}>
      <div className="absolute inset-4 bg-white/95 rounded-[8px] p-4 flex flex-col gap-3 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-1.5 pb-2 border-b border-[#eef0f3]">
          <span className="size-[9px] rounded-full bg-[#ff5f57]" />
          <span className="size-[9px] rounded-full bg-[#febc2e]" />
          <span className="size-[9px] rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[11px] font-medium text-[#9aa3af]">Command Center</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="size-[20px] rounded-full shrink-0" style={{ backgroundColor: r.color, opacity: 0.85 }} />
            <span className="h-[7px] rounded-full bg-[#eceff3]" style={{ width: r.w }} />
            <span
              className="ml-auto shrink-0 text-[9px] font-semibold px-2 py-[3px] rounded-[8px] whitespace-nowrap"
              style={{ color: r.pillColor, backgroundColor: r.pillBg }}
            >
              {r.pill}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HoldManagementPreview() {
  const cards = [
    { label: "SLA Breached", value: "05", color: "#C83737", bg: "#FAEBEB" },
    { label: "At Risk", value: "12", color: "#E67919", bg: "#FDF3E7" },
    { label: "On Track", value: "48", color: "#468657", bg: "#EFF6F1" },
  ];
  return (
    <div className="relative rounded-[8px] overflow-hidden h-full" style={{ background: "linear-gradient(135deg, #4A0F16 0%, #871518 55%, #E90029 100%)" }}>
      <div className="absolute inset-4 bg-white/95 rounded-[8px] p-4 flex flex-col gap-3 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-1.5 pb-2 border-b border-[#eef0f3]">
          <span className="size-[9px] rounded-full bg-[#ff5f57]" />
          <span className="size-[9px] rounded-full bg-[#febc2e]" />
          <span className="size-[9px] rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[11px] font-medium text-[#9aa3af]">Hold Management</span>
        </div>
        <div className="flex items-center gap-2">
          {cards.map((c, i) => (
            <div key={i} className="flex-1 rounded-[8px] px-2.5 py-2 flex flex-col gap-1" style={{ backgroundColor: c.bg }}>
              <span className="text-[15px] font-bold leading-none" style={{ color: c.color }}>{c.value}</span>
              <span className="text-[8.5px] font-medium text-[#8a8f98] leading-none whitespace-nowrap">{c.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 mt-1">
          {[80, 55, 66].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="size-[6px] rounded-full bg-[#d9dde3] shrink-0" />
              <span className="h-[6px] rounded-full bg-[#eceff3]" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeCard({
  icon: Icon,
  accent,
  title,
  description,
  cta,
  preview,
  onClick,
}: {
  icon: typeof LayoutGrid;
  accent: string;
  title: string;
  description: string;
  cta: string;
  preview: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-white rounded-[8px] border-2 border-[#EEF0F3] p-7 sm:p-8 flex flex-col gap-5 w-full min-w-0 sm:flex-1 sm:max-w-[400px] cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
      style={{ ["--accent" as string]: accent }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.boxShadow = `0 20px 40px -12px ${accent}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#EEF0F3";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Icon size={26} className="shrink-0 text-[#8a8f98] transition-colors duration-300 group-hover:[color:var(--accent)]" />
          <h3 className="text-[22px] font-bold text-[#1a1a1a] leading-tight transition-colors duration-300 group-hover:[color:var(--accent)]">
            {title}
          </h3>
        </div>
        <p className="text-[14.5px] text-[#666666] leading-[22px] transition-colors duration-300 group-hover:text-[#1a1a1a]">
          {description}
        </p>
        <div
          className="flex items-center gap-1.5 text-[13px] font-semibold mt-0.5 transition-transform duration-300 group-hover:translate-x-1"
          style={{ color: accent }}
        >
          {cta}
          <ArrowRight size={14} />
        </div>
      </div>

      <div className="h-[240px] sm:h-[270px] transition-transform duration-300 group-hover:scale-[1.015]">{preview}</div>
    </button>
  );
}

export function HomePage({
  onLogout,
  onViewAllNotifications,
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
  onLogout: () => void;
  onViewAllNotifications: () => void;
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
  return (
    <div className="bg-[#f5f6fa] flex size-full min-h-screen">
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">
        <AppHeader
          activeNav="Home"
          onViewAllNotifications={onViewAllNotifications}
          onLogout={onLogout}
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

        <main className="relative flex-1 overflow-y-auto">
          {/* Decorative background glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-[62%] size-[420px] rounded-full bg-[#30578D] opacity-[0.07] blur-[110px]" />
            <div className="absolute -top-16 left-1/2 translate-x-[8%] size-[380px] rounded-full bg-[#E90029] opacity-[0.06] blur-[110px]" />
          </div>

          {/* min-h-full (not a centered flex item) so overflow grows the box downward from the top instead
              of pushing content above scroll position 0, which is what hid the heading on short viewports. */}
          <div className="relative min-h-full flex flex-col items-center justify-center gap-12 px-4 py-12">
            <div className="flex flex-col items-center text-center w-full max-w-[900px]">
              <h1 className="text-[26px] sm:text-[30px] font-semibold text-[#111827] tracking-tight">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-[#E90029] via-[#823E81] to-[#30578D] bg-clip-text text-transparent">
                  IntelliSight
                </span>
              </h1>
              <p className="text-[14.5px] text-[#6b7380] mt-2">Where would you like to start today?</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch justify-center gap-7 w-full max-w-[900px]">
              <HomeCard
                icon={LayoutGrid}
                accent="#30578D"
                title="Command Center"
                cta="Open Command Center"
                description="Monitor emails, threats, and take action from a unified command view."
                preview={<CommandCenterPreview />}
                onClick={onNavigateNewOverview}
              />
              <HomeCard
                icon={CirclePause}
                accent="#E90029"
                title="Hold Management"
                cta="Open Hold Management"
                description="Review, manage, and release held orders in one place."
                preview={<HoldManagementPreview />}
                onClick={onNavigateHoldManagementOverview}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
