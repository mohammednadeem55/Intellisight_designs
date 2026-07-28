import { useState, useEffect, useRef, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import svgPaths from "@/imports/IntelliSightEmailLogin/svg-ghyavcwom4";
import notifSvg from "@/imports/Notification/svg-ysaztztd8j";
import holdSvg from "@/imports/HoldManagementDesktopV3/svg-5pa1ejxi9n";
import listingSvg from "@/imports/HoldManagementListing/svg-u1kc727ptr";
import filterSvg from "@/imports/HoldManagementListingFilter/svg-o1nvoo6krn";
import releasedSvg from "@/imports/HoldManagementListingColumn-2/svg-j76i53zjwx";
import detailsSvg from "@/imports/HoldManagementOrderDetailsV2/svg-wic8forngq";
import imgAvatar2 from "@/imports/HoldManagementOrderDetailsV2/046edf4ec7def23e149b10ee868f0a76f99ff441.png";
import imgLeftPanel from "@/imports/IntelliSightEmailLogin/17e78b7b41621dd481ed133d49944eb83c5f8836.png";
import {
  BarChart2,
  ChevronDown,
  CornerDownRight,
  FileText,
  Globe,
  LayoutDashboard,
  Mail,
  Menu,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { AppHeader } from "./components/AppHeader";
import { NavDrawer } from "./components/NavDrawer";
import {
  OrderListingTable,
  type OrderListingColumn,
  type OrderListingFilterSection,
  type OrderListingDropdownFilter,
} from "./components/OrderListingTable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

// ─── Shared ───────────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" fill="#BA1C1C" r="12" />
        <circle cx="12" cy="12" fill="white" r="5.33333" />
      </svg>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function Lock() {
  return (
    <div className="relative shrink-0 size-[12px]">
      <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 12 12">
        <g clipPath="url(#clip-lock)">
          <path
            d={svgPaths.p1e35b300}
            stroke="white"
            strokeLinecap="round"
            strokeOpacity="0.5"
            strokeWidth="2"
          />
        </g>
        <defs>
          <clipPath id="clip-lock">
            <rect fill="white" height="12" width="12" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="bg-white flex items-stretch size-full min-h-screen">
      {/* Left panel — hidden on mobile */}
      <div className="hidden md:block h-full relative shrink-0 w-[45%] max-w-[520px]">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <img alt="" className="absolute max-w-none object-cover size-full" src={imgLeftPanel} />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(5,10,31,0.08) 0%, rgba(5,10,31,0.25) 35%, rgba(5,10,36,0.65) 62%, rgba(3,8,26,0.88) 100%)",
            }}
          />
        </div>
        <div className="flex flex-col items-start justify-between p-14 relative size-full">
          {/* Wordmark */}
          <div className="flex gap-3 items-center shrink-0">
            <LogoMark />
            <p className="font-bold text-[26px] text-white tracking-[0.5px]">IntelliSight</p>
          </div>
          {/* Hero */}
          <div className="flex flex-col gap-2 items-start w-full">
            <div className="font-bold text-[clamp(36px,4vw,52px)] text-white leading-[1.1]">
              <p>Access your</p>
              <p>intelligence</p>
              <p>platform.</p>
            </div>
            <p className="font-normal text-[15px] text-white/70 max-w-[340px]">
              Secure, role-based access for your entire organization.
            </p>
          </div>
          {/* Security tagline */}
          <div className="flex gap-2 items-center shrink-0">
            <Lock />
            <p className="font-normal text-[12px] text-white whitespace-nowrap">
              Enterprise-grade security · SOC 2 compliant
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 min-w-0 flex items-center justify-center px-6 py-12 md:px-12">
        <div className="flex flex-col items-start w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-10 md:hidden">
            <LogoMark />
            <p className="font-bold text-[22px] text-[#111827] tracking-[0.4px]">IntelliSight</p>
          </div>

          <p className="font-bold text-[32px] text-[#111827] leading-10">Sign in</p>
          <p className="font-normal text-[15px] text-[#6b7380] mt-1">
            Welcome back to IntelliSight
          </p>

          <div className="h-9" />

          <button
            onClick={onLogin}
            className="bg-[#ba1c1c] flex h-[52px] items-center justify-center w-full rounded-[10px] shadow-[0px_4px_14px_0px_rgba(186,28,28,0.25)] cursor-pointer transition-opacity hover:opacity-90 active:opacity-80"
          >
            <p className="font-semibold text-[15px] text-white">Continue with SSO</p>
          </button>

          <div className="h-7" />

          <div className="flex gap-1 items-center">
            <p className="font-normal text-[14px] text-[#6b7380]">New here?</p>
            <p className="font-semibold text-[14px] text-[#ba1c1c] cursor-pointer hover:underline">
              Sign Up
            </p>
          </div>

          <div className="h-2" />

          <p className="font-normal text-[12px] text-[#9ca3b0] w-full">
            By signing in you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard data ───────────────────────────────────────────────────────────

const activityData = [
  { name: "Mon", queries: 420, alerts: 18 },
  { name: "Tue", queries: 680, alerts: 24 },
  { name: "Wed", queries: 540, alerts: 12 },
  { name: "Thu", queries: 820, alerts: 31 },
  { name: "Fri", queries: 760, alerts: 27 },
  { name: "Sat", queries: 310, alerts: 9 },
  { name: "Sun", queries: 290, alerts: 7 },
];

const trendData = [
  { name: "Jan", value: 40 },
  { name: "Feb", value: 55 },
  { name: "Mar", value: 48 },
  { name: "Apr", value: 72 },
  { name: "May", value: 65 },
  { name: "Jun", value: 88 },
  { name: "Jul", value: 94 },
];

const recentAlerts = [
  { id: 1, title: "Unusual login pattern detected", source: "IAM Monitor", time: "2 min ago", severity: "high" },
  { id: 2, title: "API rate limit approaching threshold", source: "API Gateway", time: "14 min ago", severity: "medium" },
  { id: 3, title: "New data exfiltration rule triggered", source: "DLP Engine", time: "1 hr ago", severity: "high" },
  { id: 4, title: "Scheduled report generated", source: "Reporting", time: "2 hr ago", severity: "low" },
  { id: 5, title: "User role assignment updated", source: "IAM Monitor", time: "3 hr ago", severity: "low" },
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: BarChart2, label: "Analytics" },
  { icon: Shield, label: "Threat Intel" },
  { icon: Users, label: "Users" },
  { icon: Globe, label: "Coverage" },
  { icon: FileText, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

// ─── Dashboard components ─────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  positive,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.08] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] sm:text-[13px] font-medium text-[#6b7380]">{label}</p>
        <div className="bg-[#fff0f0] rounded-lg p-2">
          <Icon size={15} className="text-[#ba1c1c]" />
        </div>
      </div>
      <p className="text-[22px] sm:text-[28px] font-bold text-[#111827] leading-none">{value}</p>
      <div
        className={`flex items-center gap-1 text-[11px] sm:text-[12px] font-medium ${
          positive ? "text-emerald-600" : "text-rose-500"
        }`}
      >
        <TrendingUp size={11} />
        <span>{delta} vs last week</span>
      </div>
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-400",
    low: "bg-emerald-500",
  };
  return (
    <span
      className={`inline-block size-2 rounded-full shrink-0 mt-[5px] ${colors[severity] ?? "bg-gray-400"}`}
    />
  );
}

// ─── Notifications Page ───────────────────────────────────────────────────────

const fullNotifications = [
  { id: 1, title: "Compliance Breach Detected", body: "Invoice #INV-2024-0892 exceeds the mandated spending limit for Department: R&D.", time: "10 mins ago", status: "Breached", category: "Finance" },
  { id: 2, title: "Risk Level Increase", body: "Project 'Stellar' has missing security documentation for the past two quarters.", time: "45 mins ago", status: "At Risk", category: "Security" },
  { id: 3, title: "Vendor Audit Complete", body: "Global Logistics Inc has successfully submitted all required tax compliance forms.", time: "2 hours ago", status: "Resolved", category: "Vendor" },
  { id: 4, title: "Policy Update Alert", body: "New GDPR guidelines require immediate update to customer data handling procedures.", time: "3 hours ago", status: "At Risk", category: "Policy" },
  { id: 5, title: "System Outage Notification", body: "The compliance engine was down for maintenance but is now fully operational.", time: "5 hours ago", status: "Resolved", category: "System" },
  { id: 6, title: "Missing Record Audit", body: "Transaction ID #TX-9920 has no associated proof of purchase or approval stamp.", time: "1 day ago", status: "Breached", category: "Audit" },
  { id: 7, title: "Data Privacy Concern", body: "User data from the last survey was shared without proper anonymization measures in place.", time: "2 days ago", status: "At Risk", category: "Privacy" },
];

const selectedDetail = {
  title: "Compliance Breach Detected — Invoice #INV-2024-0892",
  status: "Breached",
  received: "Oct 24, 2024 • 10:14 AM",
  category: "FINANCE",
  severity: "Critical",
  categoryTag: "Invoicing",
  source: "AI Engine",
  assignedTo: "John Smith",
  summary: "This invoice was flagged by the IntelliSight automated monitoring engine due to a deviation from established corporate spending limits. The transaction originated from the R&D department and involves an international software licensing fee. Per current policy, any single transaction exceeding $50,000 USD requires secondary VP-level approval, which was not detected in the current audit trail.",
  affectedRecords: [
    { id: "#INV-2024-0892", amount: "$124,500.00", status: "Breached" },
    { id: "#PO-8812-RD", amount: "$0.00", status: "At Risk" },
    { id: "#VEND-LOG-01", amount: "N/A", status: "Resolved" },
  ],
  actions: [
    "Verify secondary approval documentation with R&D project lead.",
    "Initiate manual override if VP approval was obtained via external channels.",
    "Escalate to Regional Compliance Officer for final transaction clearance.",
  ],
};

const statusColor: Record<string, string> = {
  Breached: "bg-[#fdecea] text-[#ba1c1c]",
  "At Risk": "bg-[#fff8e1] text-[#b45309]",
  Resolved: "bg-[#e8f5e9] text-[#2e7d32]",
};

const statusDot: Record<string, string> = {
  Breached: "bg-[#ba1c1c]",
  "At Risk": "bg-amber-400",
  Resolved: "bg-emerald-500",
};

function NotificationsPage({ onBack, onViewAllNotifications, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateHoldManagementOverview, onNavigateOrderListing, onNavigateReleasedOrders }: { onBack: () => void; onViewAllNotifications: () => void; onNavigateCommandCenterOverview?: () => void; onNavigateCommandCenterEmailView?: () => void; onNavigateHoldManagementOverview?: () => void; onNavigateOrderListing?: () => void; onNavigateReleasedOrders?: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedId, setSelectedId] = useState(1);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const tabs = ["All", "Breached", "At Risk", "Resolved"];

  const selected = fullNotifications.find((n) => n.id === selectedId) ?? fullNotifications[0];

  const filtered = fullNotifications.filter((n) => {
    if (dismissed.includes(n.id)) return false;
    return activeTab === "All" || n.status === activeTab;
  });

  const tabCount = (tab: string) =>
    tab === "All"
      ? fullNotifications.filter((n) => !dismissed.includes(n.id)).length
      : fullNotifications.filter((n) => !dismissed.includes(n.id) && n.status === tab).length;

  const statusBadge: Record<string, string> = {
    Breached: "bg-rose-50 text-rose-700 border border-rose-200",
    "At Risk": "bg-amber-50 text-amber-700 border border-amber-200",
    Resolved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };

  const leftBorder: Record<string, string> = {
    Breached: "border-l-rose-500",
    "At Risk": "border-l-amber-400",
    Resolved: "border-l-emerald-500",
  };

  return (
    <div className="bg-[#f4f5f7] flex flex-col size-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <NavDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onBack}
        onNavigateDashboard={onBack}
        onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
        onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
        onNavigateHoldManagementOverview={onNavigateHoldManagementOverview}
        onNavigateOrderListing={onNavigateOrderListing}
        onNavigateReleasedOrders={onNavigateReleasedOrders}
      />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} activeNav="Notifications" onViewAllNotifications={onViewAllNotifications} onNavigateDashboard={onBack} />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left sidebar ── */}
        <div className="bg-white border-r border-[#ebebeb] flex flex-col w-[420px] shrink-0 overflow-hidden">

          {/* Sidebar header */}
          <div className="px-5 pt-5 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="font-semibold text-[15px] text-[#111827]">Notifications</h2>
                <span className="bg-[#ba1c1c] text-white text-[10px] font-bold px-[7px] py-[2px] rounded-full leading-none">
                  {tabCount("All")}
                </span>
              </div>
              <button className="text-[12px] font-medium text-[#ba1c1c] hover:opacity-75 transition-opacity cursor-pointer">
                Mark all read
              </button>
            </div>

            {/* Category select */}
            <div className="relative">
              <select className="w-full bg-[#f9f9fb] border border-[#e5e7eb] rounded-lg pl-3 pr-8 py-2.5 text-[13px] text-[#374151] appearance-none cursor-pointer outline-none focus:border-[#ba1c1c] transition-colors">
                <option>All Categories</option>
                <option>Finance</option>
                <option>Security</option>
                <option>Vendor</option>
                <option>Policy</option>
                <option>System</option>
              </select>
              <svg fill="none" viewBox="0 0 12 12" className="absolute right-3 top-1/2 -translate-y-1/2 size-[11px] pointer-events-none opacity-50">
                <path clipRule="evenodd" d="M10.9526 3.82763L10.4224 3.29738L6.07763 7.64213L1.73288 3.29738L1.20263 3.82763L6.07763 8.70263L10.9526 3.82763Z" fill="#374151" fillRule="evenodd" />
              </svg>
            </div>

            {/* Status tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {tabs.map((tab) => {
                const count = tabCount(tab);
                const active = activeTab === tab;
                const activeColors: Record<string, string> = {
                  All: "bg-[#111827] text-white",
                  Breached: "bg-rose-600 text-white",
                  "At Risk": "bg-amber-500 text-white",
                  Resolved: "bg-emerald-600 text-white",
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                      active ? activeColors[tab] : "bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e9eaec]"
                    }`}
                  >
                    {tab}
                    <span className={`text-[10px] font-bold leading-none ${active ? "opacity-80" : "opacity-60"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#f0f0f0]" />

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-16 px-6">
                <div className="size-[48px] rounded-full bg-[#f3f4f6] flex items-center justify-center">
                  <svg fill="none" viewBox="0 0 16 16" className="size-[20px] opacity-30">
                    <path d={notifSvg.p1033e080} stroke="#111827" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <p className="text-[13px] text-[#9ca3af] text-center">No notifications in this category</p>
              </div>
            )}
            {filtered.map((n) => {
              const isActive = selectedId === n.id;
              return (
                <div
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  className={`group relative px-5 py-4 cursor-pointer transition-all ${
                    isActive
                      ? "bg-[#fff5f7] border-b border-b-[#f5e6ea]"
                      : "border-b border-b-[#f3f4f6] hover:bg-[#fafafa]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Bell icon */}
                    <div className={`shrink-0 size-[34px] rounded-xl flex items-center justify-center mt-0.5 ${
                      n.status === "Breached" ? "bg-rose-50" : n.status === "At Risk" ? "bg-amber-50" : "bg-emerald-50"
                    }`}>
                      <svg fill="none" viewBox="0 0 16 16" className="size-[15px]">
                        <path
                          d={notifSvg.p1033e080}
                          stroke={n.status === "Breached" ? "#e11d48" : n.status === "At Risk" ? "#d97706" : "#059669"}
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`text-[13px] leading-[1.3] truncate ${isActive ? "font-semibold text-[#111827]" : "font-medium text-[#1f2937]"}`}>
                          {n.title}
                        </p>
                        <p className="text-[10.5px] text-[#9ca3af] shrink-0 whitespace-nowrap">{n.time}</p>
                      </div>
                      <p className="text-[11.5px] text-[#6b7280] leading-[1.5] line-clamp-2 mb-2">{n.body}</p>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium ${statusBadge[n.status]}`}>
                          {n.status}
                        </span>
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDismissed((p) => [...p, n.id]); if (isActive && filtered.length > 1) setSelectedId(filtered.find((f) => f.id !== n.id)?.id ?? 1); }}
                            className="text-[11px] text-[#6b7280] hover:text-[#374151] transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedId(n.id); }}
                            className="text-[11px] font-semibold text-[#ba1c1c] hover:opacity-75 transition-opacity cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right detail panel ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f5f7]">
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">

            {/* Detail card */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] overflow-hidden mb-5 shadow-sm">
              {/* Card header */}
              <div className="px-7 py-6 border-b border-[#f3f4f6]">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-[18px] font-bold text-[#111827] leading-[1.35]">
                    {selectedDetail.title}
                  </h1>
                  <span className={`shrink-0 inline-flex items-center px-3 py-1 rounded-lg text-[12px] font-semibold mt-0.5 ${statusBadge[selectedDetail.status]}`}>
                    {selectedDetail.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[12px] text-[#9ca3af]">Received: <span className="text-[#374151] font-medium">{selectedDetail.received}</span></span>
                  <span className="w-px h-3 bg-[#e5e7eb]" />
                  <span className="bg-[#f3f4f6] text-[#374151] text-[11px] font-semibold px-2.5 py-1 rounded-md tracking-wide uppercase">{selectedDetail.category}</span>
                </div>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-[#f3f4f6]">
                {[
                  { label: "Severity", value: selectedDetail.severity },
                  { label: "Category", value: selectedDetail.categoryTag },
                  { label: "Source", value: selectedDetail.source },
                  { label: "Assigned To", value: selectedDetail.assignedTo },
                ].map(({ label, value }) => (
                  <div key={label} className="px-6 py-4">
                    <p className="text-[10.5px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-[13px] font-semibold text-[#111827]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert Summary card */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] px-7 py-6 mb-5 shadow-sm">
              <h3 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Alert Summary</h3>
              <p className="text-[13.5px] text-[#374151] leading-[1.7]">{selectedDetail.summary}</p>
            </div>

            {/* Affected Records card */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] overflow-hidden mb-5 shadow-sm">
              <div className="px-7 py-5 border-b border-[#f3f4f6]">
                <h3 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest">Affected Records</h3>
              </div>
              <table className="w-full">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="text-left px-7 py-3 text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wider">Record ID</th>
                    <th className="text-right px-7 py-3 text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wider">Amount</th>
                    <th className="text-right px-7 py-3 text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {selectedDetail.affectedRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-7 py-4 text-[13px] font-mono font-medium text-[#374151]">{r.id}</td>
                      <td className="px-7 py-4 text-[13px] text-[#374151] text-right font-medium">{r.amount}</td>
                      <td className="px-7 py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${statusBadge[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recommended Actions card */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] px-7 py-6 shadow-sm">
              <h3 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest mb-5">Recommended Actions</h3>
              <ol className="flex flex-col gap-4">
                {selectedDetail.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="shrink-0 size-[26px] rounded-full bg-[#ba1c1c] text-white text-[11px] font-bold flex items-center justify-center leading-none mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-[13.5px] text-[#374151] leading-[1.6] pt-0.5">{action}</p>
                  </li>
                ))}
              </ol>
            </div>

          </div>

          {/* Sticky footer */}
          <div className="bg-white border-t border-[#ebebeb] px-8 py-4 flex items-center justify-between shrink-0">
            <p className="text-[12px] text-[#9ca3af]">
              Last updated: <span className="text-[#374151] font-medium">{selectedDetail.received}</span>
            </p>
            <div className="flex items-center gap-3">
              <button className="px-5 py-2.5 border border-[#e5e7eb] rounded-xl text-[13px] font-medium text-[#374151] hover:bg-[#f9f9fb] cursor-pointer transition-colors">
                Dismiss Alert
              </button>
              <button className="px-5 py-2.5 bg-[#ba1c1c] rounded-xl text-[13px] font-semibold text-white hover:opacity-90 cursor-pointer transition-opacity shadow-sm">
                Accept &amp; Resolve
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Dashboard({ onLogout, onViewAllNotifications, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateHoldManagementOverview, onNavigateOrderListing, onNavigateReleasedOrders }: { onLogout: () => void; onViewAllNotifications: () => void; onNavigateCommandCenterOverview?: () => void; onNavigateCommandCenterEmailView?: () => void; onNavigateHoldManagementOverview?: () => void; onNavigateOrderListing?: () => void; onNavigateReleasedOrders?: () => void }) {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-[#f5f6fa] flex size-full min-h-screen">
      {/* Desktop sidebar */}

      {/* Nav drawer */}
      <NavDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
        onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
        onNavigateHoldManagementOverview={onNavigateHoldManagementOverview}
        onNavigateOrderListing={onNavigateOrderListing}
        onNavigateReleasedOrders={onNavigateReleasedOrders}
      />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-auto">
        {/* ── Header (from Figma import) ── */}
        <AppHeader onMenuClick={() => setSidebarOpen(true)} activeNav={activeNav} onViewAllNotifications={onViewAllNotifications} onNavigateDashboard={() => setActiveNav("Dashboard")} />

        {/* Page body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
          {/* Title */}
          <div>
            <h1 className="text-[18px] sm:text-[22px] font-bold text-[#111827]">
              Intelligence Dashboard
            </h1>
            <p className="text-[12.5px] sm:text-[13.5px] text-[#6b7380] mt-0.5">
              Real-time threat and activity overview
            </p>
          </div>

          {/* Stats — 2 cols on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={Zap} label="Active Queries" value="1,284" delta="+12%" positive />
            <StatCard icon={Shield} label="Threats Blocked" value="347" delta="+8%" positive />
            <StatCard icon={Users} label="Active Users" value="92" delta="-3%" positive={false} />
            <StatCard icon={Globe} label="Coverage Score" value="98.4%" delta="+0.6%" positive />
          </div>

          {/* Charts — stack on mobile, side-by-side on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-black/[0.08] p-4 sm:p-5">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-4">Weekly Activity</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={activityData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#9ca3b0" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3b0" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  />
                  <Bar dataKey="queries" fill="#ba1c1c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="alerts" fill="#fca5a5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-black/[0.08] p-4 sm:p-5">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-4">Coverage Trend</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#9ca3b0" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3b0" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#ba1c1c"
                    strokeWidth={2.5}
                    dot={{ fill: "#ba1c1c", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent alerts */}
          <div className="bg-white rounded-xl border border-black/[0.08] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13.5px] font-semibold text-[#111827]">Recent Alerts</p>
              <button className="text-[12px] font-medium text-[#ba1c1c] hover:underline cursor-pointer">
                View all
              </button>
            </div>
            <div className="flex flex-col divide-y divide-black/[0.06]">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <SeverityDot severity={alert.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#111827] truncate">
                      {alert.title}
                    </p>
                    <p className="text-[11.5px] text-[#9ca3b0] mt-0.5">{alert.source}</p>
                  </div>
                  <p className="text-[11.5px] text-[#9ca3b0] shrink-0 whitespace-nowrap">
                    {alert.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Command Center Overview ───────────────────────────────────────────────────

type Email = {
  id: string;
  subject: string;
  sender: string;
  category: string;
  status: string;
  received: string;
  size: string;
  body?: string;
  /** Nested correspondence — under a CCC row this is that CCC's own thread (level 2); under a reply this is its further replies (level 3+, surfaced via a "+N more" link rather than a 3rd inline row tier). */
  replies?: Email[];
  /** CCC requests linked to this email (level 1 nested rows). Only ever set on root email rows. */
  linkedCccs?: Email[];
  /** Set on CCC/reply rows so clicking through navigates to the root email's detail/thread view rather than a synthetic nested id. */
  rootEmailId?: string;
  // CCC request fields (Command Center listing columns)
  cccId?: string;
  csrOwner?: string;
  businessGroup?: string;
  opportunityNumber?: string;
  accountManager?: string;
  accountName?: string;
  cccRequestType?: string;
  cccRequestSubtype?: string;
  cccRequestStatus?: string;
  awaitingReason?: string;
  cccRequestReceivedDate?: string;
  slaTimeRemaining?: string;
  poNumber?: string;
  quoteNumber?: string;
  orderNumber?: string;
  operatingUnit?: string;
  poAmount?: string;
  currentMonthBookableAmount?: string;
  currency?: string;
  statusNotes?: string;
  currentStatusDate?: string;
  currentAutomationStatus?: string;
  currentAutomationResult?: string;
  automationDetailsLink?: string;
  previousStatus?: string;
  previousStatusDate?: string;
  previousStage?: string;
  previousAutomationStatus?: string;
  oaStatus?: string;
  oaSummary?: string;
  oaValidationRecords?: string;
};

const CSR_OWNERS = ["A. Sharma", "M. Chen", "R. Okafor", "L. Novak", "T. Reyes"];
const BUSINESS_GROUPS = ["Enterprise", "Mid-Market", "Public Sector", "SMB"];
const ACCOUNT_MANAGERS = ["J. Patel (FE-2201)", "K. Summers (FE-1187)", "D. Alvarez (FE-3042)", "S. Kim (FE-0925)"];
const ACCOUNT_NAMES = ["GlobalTech Industries", "Acme Industries", "Nexus Corp", "Sterling & Co", "MetaSite Inc"];
const CCC_REQUEST_TYPES = ["New Order", "Amendment", "Renewal", "Cancellation"];
const CCC_REQUEST_SUBTYPES = ["Standard", "Expedite", "Credit Hold Release", "Price Correction"];
const CCC_REQUEST_STATUSES = ["Open", "In Progress", "Pending Info", "Completed"];
const AWAITING_REASONS = ["Awaiting Customer Response", "Awaiting Finance Approval", "Awaiting Legal Review", "—"];
const SLA_REMAINING = ["2d 4h remaining", "6h remaining", "Overdue by 1d", "4d remaining"];
const OPERATING_UNITS = ["US OU", "EMEA OU", "APAC OU", "LATAM OU"];
const CURRENCIES = ["USD", "EUR", "GBP", "INR"];
const AUTOMATION_STATUSES = ["Completed", "Running", "Failed", "Not Started"];
const AUTOMATION_RESULTS = ["Success", "Success", "Error – Retry", "N/A"];
const PREVIOUS_STATUSES = ["Flagged", "Under Review", "Cleared"];
const PREVIOUS_STAGES = ["Intake", "Validation", "Fulfillment", "Closed"];
const OA_STATUSES = ["Validated", "Pending", "Failed"];
const STATUS_NOTES = [
  "Reviewed by CSR, pending downstream sync.",
  "Escalated to secondary approver for sign-off.",
  "Customer confirmed details, proceeding with fulfillment.",
  "Awaiting updated documentation from requester.",
];

// Fields shared by a CCC request and all of its thread replies — the request identity doesn't change reply to reply.
function deriveRequestFields(i: number) {
  return {
    cccId: `CCC-${20000 + i * 11}`,
    csrOwner: CSR_OWNERS[i % CSR_OWNERS.length],
    businessGroup: BUSINESS_GROUPS[i % BUSINESS_GROUPS.length],
    opportunityNumber: `OPP-${10500 + i * 7}`,
    accountManager: ACCOUNT_MANAGERS[i % ACCOUNT_MANAGERS.length],
    accountName: ACCOUNT_NAMES[i % ACCOUNT_NAMES.length],
    cccRequestType: CCC_REQUEST_TYPES[i % CCC_REQUEST_TYPES.length],
    cccRequestSubtype: CCC_REQUEST_SUBTYPES[i % CCC_REQUEST_SUBTYPES.length],
    poNumber: `PO-${88000 + i * 13}`,
    quoteNumber: `QT-${5000 + i * 3} v${1 + (i % 3)}`,
    orderNumber: i % 3 === 0 ? "—" : `ORD-${77000 + i * 9}`,
    operatingUnit: OPERATING_UNITS[i % OPERATING_UNITS.length],
    poAmount: `$${(12000 + i * 3540).toLocaleString()}.00`,
    currentMonthBookableAmount: `$${(8000 + i * 2110).toLocaleString()}.00`,
    currency: CURRENCIES[i % CURRENCIES.length],
  };
}

// Fields that evolve message to message within a thread — each reply gets its own seed so status/automation progress.
function deriveStatusFields(email: Email, seed: number) {
  return {
    cccRequestStatus: CCC_REQUEST_STATUSES[seed % CCC_REQUEST_STATUSES.length],
    awaitingReason: AWAITING_REASONS[seed % AWAITING_REASONS.length],
    cccRequestReceivedDate: email.received,
    slaTimeRemaining: SLA_REMAINING[seed % SLA_REMAINING.length],
    statusNotes: STATUS_NOTES[seed % STATUS_NOTES.length],
    currentStatusDate: email.received,
    currentAutomationStatus: AUTOMATION_STATUSES[seed % AUTOMATION_STATUSES.length],
    currentAutomationResult: AUTOMATION_RESULTS[seed % AUTOMATION_RESULTS.length],
    automationDetailsLink: "View Details",
    previousStatus: PREVIOUS_STATUSES[(seed + 1) % PREVIOUS_STATUSES.length],
    previousStatusDate: email.received,
    previousStage: PREVIOUS_STAGES[seed % PREVIOUS_STAGES.length],
    previousAutomationStatus: AUTOMATION_STATUSES[(seed + 1) % AUTOMATION_STATUSES.length],
    oaStatus: OA_STATUSES[seed % OA_STATUSES.length],
    oaSummary: `${2 + (seed % 3)}/${3 + (seed % 2)} checks passed`,
    oaValidationRecords: "View Records",
  };
}

// Builds one CCC row (level 1) linked to a root email, carrying its own request identity plus a thread of correspondence (level 2).
function makeCcc(rootEmail: Email, cccSeed: number, replyPool: Email[]): Email {
  const request = deriveRequestFields(cccSeed);
  return {
    id: request.cccId,
    subject: `${request.cccRequestType} — ${request.cccRequestSubtype}`,
    sender: "",
    category: rootEmail.category,
    status: PREVIOUS_STATUSES[cccSeed % PREVIOUS_STATUSES.length],
    received: rootEmail.received,
    size: "",
    rootEmailId: rootEmail.id,
    ...request,
    ...deriveStatusFields(rootEmail, cccSeed),
    replies: replyPool.map((reply, ri) => enrichReply(reply, request, cccSeed, ri, rootEmail.id)),
  };
}

// Enriches a raw correspondence email with its parent CCC's request identity (unchanged thread to thread) plus its own
// evolving status/timeline fields. Recurses into any further nested replies so 3rd-level+ data still carries real values,
// even though the grid only renders 2 nested tiers — deeper data is reached via a "+N more" link, not another row tier.
function enrichReply(reply: Email, request: ReturnType<typeof deriveRequestFields>, parentSeed: number, ri: number, rootEmailId: string): Email {
  const seed = parentSeed * 10 + ri + 1;
  return {
    ...reply,
    ...request,
    ...deriveStatusFields(reply, seed),
    rootEmailId,
    replies: reply.replies?.map((sub, si) => enrichReply(sub, request, seed, si, rootEmailId)),
  };
}

// Splits a root email's raw replies into 1 or 2 linked CCCs (an email can reference a single CCC or several), each owning
// its share of the correspondence as its own nested thread.
function withCccHierarchy(email: Email, i: number): Email {
  let rawReplies = email.replies ?? [];

  // Demonstrates a reply carrying its own further nested replies (3rd level) — surfaced via a "+N more" link.
  if (i === 1 && rawReplies.length > 1) {
    rawReplies = rawReplies.map((r, ri) => ri === 1 ? {
      ...r,
      replies: [
        { id: `${r.id}-N1`, subject: `Re: ${r.subject}`, sender: "legal@intellisight.io", category: r.category, status: "Cleared", received: r.received, size: "0.4 MB",
          body: "Confirmed the redlines are final — no further changes needed on our end." },
        { id: `${r.id}-N2`, subject: `Re: ${r.subject}`, sender: "legal@acmeindustries.com", category: r.category, status: "Cleared", received: r.received, size: "0.6 MB",
          body: "Great, signing today. Thanks for the quick turnaround." },
      ],
    } : r);
  }

  // Threads with 2+ raw replies plausibly touch more than one CCC — split them so several emails demonstrate the 1-to-many link.
  const multiCcc = rawReplies.length >= 2;
  const groups: Email[][] = multiCcc
    ? [rawReplies.slice(0, Math.ceil(rawReplies.length / 2)), rawReplies.slice(Math.ceil(rawReplies.length / 2))]
    : [rawReplies];

  const linkedCccs = groups.map((group, ci) => makeCcc(email, i * 2 + ci, group));
  const [primaryCcc] = linkedCccs;

  // The root row surfaces its primary (first) linked CCC's data directly, so the main grid is informative
  // without expanding — expanding still reveals every linked CCC (including this one) and their own threads.
  return {
    ...primaryCcc,
    id: email.id,
    subject: email.subject,
    sender: email.sender,
    category: email.category,
    status: email.status,
    received: email.received,
    size: email.size,
    body: email.body,
    linkedCccs,
    rootEmailId: undefined,
    replies: undefined,
  };
}

const ALL_EMAILS: Email[] = [
  { id: "EML-10234", subject: "Q3 Invoice Approval Request",        sender: "vendor@globaltech.com",    category: "Finance",    status: "Flagged",      received: "Jan 18", size: "1.2 MB",
    body: "Please find attached the Q3 invoice for licensing services totaling $124,500. This transaction exceeds the standard department spending threshold and requires secondary approval before processing.",
    replies: [
    { id: "EML-10234-R1", subject: "Re: Q3 Invoice Approval Request", sender: "finance@intellisight.io", category: "Finance", status: "Under Review", received: "Jan 18", size: "0.3 MB",
      body: "Flagged for review — this invoice amount exceeds the $50,000 auto-approval limit. Routing to VP Finance for secondary sign-off." },
    { id: "EML-10234-R2", subject: "Re: Q3 Invoice Approval Request", sender: "vendor@globaltech.com",    category: "Finance", status: "Flagged",      received: "Jan 18", size: "0.9 MB",
      body: "Following up — the original PO and signed SOW are attached to support the invoiced amount. Let us know if anything else is needed." },
  ] },
  { id: "EML-10235", subject: "Contract Renewal — Acme Industries", sender: "legal@acmeindustries.com", category: "Legal",      status: "Under Review", received: "Jan 18", size: "3.4 MB",
    body: "Attached is the renewal agreement for the annual services contract, effective next quarter. Please review the updated liability clause in Section 7 before countersigning.",
    replies: [
    { id: "EML-10235-R1", subject: "Re: Contract Renewal — Acme Industries", sender: "legal@intellisight.io",    category: "Legal", status: "Under Review", received: "Jan 18", size: "1.1 MB",
      body: "Reviewing the updated liability clause now — will circle back with redlines by end of week." },
    { id: "EML-10235-R2", subject: "Re: Contract Renewal — Acme Industries", sender: "legal@acmeindustries.com", category: "Legal", status: "Cleared",      received: "Jan 18", size: "2.0 MB",
      body: "Redlines accepted, updated version attached. Ready for signature." },
    { id: "EML-10235-R3", subject: "Fwd: Contract Renewal — Acme Industries", sender: "cfo@acmeindustries.com",  category: "Legal", status: "Cleared",      received: "Jan 18", size: "3.4 MB",
      body: "Forwarding for final visibility — approved on our end, no objections to the renewal terms." },
  ] },
  { id: "EML-10236", subject: "Shipment Delay Notification",        sender: "ops@nexuscorp.com",        category: "Logistics",  status: "Cleared",      received: "Jan 17", size: "0.4 MB",
    body: "Customs clearance for shipment #NX-88213 was delayed by two days but has now cleared. Updated delivery ETA is Thursday." },
  { id: "EML-10237", subject: "Vendor Tax Documentation",           sender: "finance@sterlingco.com",   category: "Finance",    status: "Cleared",      received: "Jan 17", size: "2.1 MB",
    body: "Attached are the completed W-9 and annual tax compliance forms as requested for our vendor file update." },
  { id: "EML-10238", subject: "Unusual Login Attempt Report",       sender: "security@intellisight.io", category: "Security",   status: "Flagged",      received: "Jan 17", size: "0.1 MB",
    body: "Automated monitoring detected a login attempt from an unrecognized device and IP range on an admin account. Account has been temporarily locked pending review.",
    replies: [
    { id: "EML-10238-R1", subject: "Re: Unusual Login Attempt Report", sender: "it-admin@intellisight.io", category: "Security", status: "Cleared", received: "Jan 17", size: "0.2 MB",
      body: "Confirmed with the account owner — attempt was from a new work laptop, expected. Account unlocked and device allowlisted." },
  ] },
  { id: "EML-10239", subject: "GDPR Data Request Follow-up",        sender: "privacy@metasiteinc.com",  category: "Privacy",    status: "Under Review", received: "Jan 16", size: "0.8 MB",
    body: "Following up on the data subject access request submitted last week. Please confirm the export is on track for the 30-day statutory deadline." },
  { id: "EML-10240", subject: "Purchase Order #PO-88213",           sender: "procurement@globaltech.com", category: "Finance",  status: "Cleared",      received: "Jan 16", size: "1.5 MB",
    body: "PO #PO-88213 has been fully executed and approved. Copy attached for your records." },
  { id: "EML-10241", subject: "Audit Trail Missing — TX-9920",      sender: "audit@intellisight.io",    category: "Audit",      status: "Flagged",      received: "Jan 16", size: "0.6 MB",
    body: "Transaction TX-9920 has no associated proof of purchase or approval record in the audit trail. Escalating for manual reconciliation." },
  { id: "EML-10242", subject: "Vendor Onboarding Checklist",        sender: "vendors@nexuscorp.com",    category: "Legal",      status: "Cleared",      received: "Jan 15", size: "2.8 MB",
    body: "All onboarding documentation — NDA, W-9, and banking details — has been submitted and verified. Vendor record is now active." },
  { id: "EML-10243", subject: "SLA Breach Escalation",              sender: "support@acmeindustries.com", category: "Support",  status: "Under Review", received: "Jan 15", size: "0.3 MB",
    body: "Ticket #4471 has exceeded the 24-hour SLA response window. Requesting immediate escalation to a senior CSR.",
    replies: [
    { id: "EML-10243-R1", subject: "Re: SLA Breach Escalation", sender: "csr@intellisight.io",           category: "Support", status: "Under Review", received: "Jan 15", size: "0.2 MB",
      body: "Apologies for the delay — picking this up now. Will have a resolution plan within the hour." },
    { id: "EML-10243-R2", subject: "Re: SLA Breach Escalation", sender: "support@acmeindustries.com",    category: "Support", status: "Cleared",      received: "Jan 15", size: "0.4 MB",
      body: "Issue resolved, thank you for the quick turnaround. Closing the ticket." },
  ] },
  { id: "EML-10244", subject: "Quarterly Compliance Summary",       sender: "compliance@intellisight.io", category: "Audit",    status: "Cleared",      received: "Jan 15", size: "4.2 MB",
    body: "Q3 compliance summary attached — 97% of flagged items resolved within SLA, no open critical findings." },
  { id: "EML-10245", subject: "Policy Update — Data Retention",     sender: "legal@sterlingco.com",     category: "Privacy",    status: "Under Review", received: "Jan 14", size: "0.9 MB",
    body: "New data retention policy requires customer records to be purged after 7 years unless under active litigation hold. Please confirm systems are updated accordingly." },
  { id: "EML-10246", subject: "Invoice Dispute — INV-2024-0892",    sender: "billing@globaltech.com",   category: "Finance",    status: "Flagged",      received: "Jan 14", size: "1.1 MB",
    body: "We're disputing invoice INV-2024-0892 — the billed amount does not match the agreed contract rate. Requesting a corrected invoice.",
    replies: [
    { id: "EML-10246-R1", subject: "Re: Invoice Dispute — INV-2024-0892", sender: "ap@intellisight.io",     category: "Finance", status: "Under Review", received: "Jan 14", size: "0.5 MB",
      body: "Reviewing the contract rate against the billed line items now — will confirm discrepancy within 2 business days." },
    { id: "EML-10246-R2", subject: "Re: Invoice Dispute — INV-2024-0892", sender: "billing@globaltech.com", category: "Finance", status: "Flagged",      received: "Jan 14", size: "0.6 MB",
      body: "Appreciate the quick response — attaching the original signed rate card for reference." },
  ] },
  { id: "EML-10247", subject: "Shipment Customs Clearance",         sender: "ops@metasiteinc.com",      category: "Logistics",  status: "Cleared",      received: "Jan 14", size: "0.5 MB",
    body: "Shipment cleared customs without incident. Delivery tracking updated, ETA unchanged." },
  { id: "EML-10248", subject: "Security Patch Notification",        sender: "security@intellisight.io", category: "Security",   status: "Cleared",      received: "Jan 13", size: "0.2 MB",
    body: "Critical security patch has been deployed across all production servers. No downtime reported." },
];

// Shared CCC-enriched view of ALL_EMAILS — computed once so the Command Center overview grid and the email detail
// page read the exact same linkedCccs/replies hierarchy instead of each re-deriving their own mock data.
const ALL_EMAILS_WITH_CCC: Email[] = ALL_EMAILS.map((email, i) => withCccHierarchy(email, i));

const EMAIL_STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  Flagged:      { label: "Flagged",      color: "#d12e2e", bg: "rgba(209,46,46,0.1)" },
  "Under Review": { label: "Under Review", color: "#e08c00", bg: "rgba(224,140,0,0.1)" },
  Cleared:      { label: "Cleared",      color: "#1fa161", bg: "rgba(31,161,97,0.1)" },
};

function EmailStatusBadge({ status }: { status: string }) {
  const s = EMAIL_STATUS_STYLE[status] ?? EMAIL_STATUS_STYLE.Cleared;
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 rounded-[4px] text-[12px] font-medium whitespace-nowrap" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

function CommandCenterOverviewPage({ onLogout, onViewAllNotifications, onNavigateDashboard, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateHoldManagementOverview, onNavigateOrderListing, onNavigateReleasedOrders }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateDashboard: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "email">("table");
  const [selectedEmailId, setSelectedEmailId] = useState<string>(ALL_EMAILS_WITH_CCC[0].id);

  const openInEmailView = (id: string) => {
    setSelectedEmailId(id);
    setViewMode("email");
  };

  const kpis = [
    { label: "TOTAL EMAILS", value: String(ALL_EMAILS.length).padStart(2, "0"), delta: "↑ 4.2%", up: true, sparkColor: "#cbd5e1" },
    { label: "FLAGGED",      value: String(ALL_EMAILS.filter(e => e.status === "Flagged").length).padStart(2, "0"), delta: "↑ 2.1%", up: false, sparkColor: "#fecbcb" },
    { label: "UNDER REVIEW", value: String(ALL_EMAILS.filter(e => e.status === "Under Review").length).padStart(2, "0"), delta: "↓ 1.4%", up: true, sparkColor: "#fde7a0" },
    { label: "CLEARED",      value: String(ALL_EMAILS.filter(e => e.status === "Cleared").length).padStart(2, "0"), delta: "↑ 3.6%", up: true, sparkColor: "#bbf7d0" },
    { label: "CATEGORIES",   value: String(new Set(ALL_EMAILS.map(e => e.category)).size).padStart(2, "0"), delta: "↑ 0.8%", up: true, sparkColor: "#bfdafe" },
  ];
  const sparkHeights = [8, 14, 10, 18, 12, 20, 14, 16];

  const cccRows = ALL_EMAILS_WITH_CCC;

  // Lead columns — CCC ID first, Subject second. Visible by default.
  const leadColumns: OrderListingColumn[] = [
    { key: "cccId",  label: "CCC ID" },
    { key: "subject", label: "Subject" },
  ];
  // Main grid columns — visible by default.
  const mainGridIdentityColumns: OrderListingColumn[] = [
    { key: "csrOwner",         label: "CSR Owner (SOO)" },
    { key: "businessGroup",    label: "Business Group" },
    { key: "opportunityNumber", label: "Opportunity Number" },
    { key: "accountManager",   label: "Account Manager" },
    { key: "accountName",      label: "Account Name" },
  ];
  const mainGridRequestColumns: OrderListingColumn[] = [
    { key: "cccRequestType",    label: "CCC Request Type" },
    { key: "cccRequestSubtype", label: "CCC Request Subtype" },
    { key: "cccRequestStatus",  label: "CCC Request Status" },
    { key: "awaitingReason",    label: "Awaiting Reason" },
    { key: "cccRequestReceivedDate", label: "CCC Request Received Date" },
    { key: "slaTimeRemaining",  label: "Time Remaining / SLA" },
    { key: "poNumber",          label: "PO #" },
    { key: "quoteNumber",       label: "Quote # + Version / Revision" },
    { key: "orderNumber",       label: "Order #" },
    { key: "operatingUnit",     label: "Operating Unit" },
    { key: "poAmount",          label: "PO Amount" },
    { key: "currentMonthBookableAmount", label: "Current Month Bookable Amount" },
    { key: "currency",          label: "Currency" },
    { key: "status",            label: "Current Status" },
    { key: "statusNotes",       label: "Status Notes" },
    { key: "currentStatusDate", label: "Current Status Date" },
  ];
  // On-expand columns — available in Column Mgmt, hidden until the user enables them.
  const onExpandColumns: OrderListingColumn[] = [
    { key: "currentAutomationStatus", label: "Current Automation Status" },
    { key: "currentAutomationResult", label: "Current Automation Result" },
    { key: "automationDetailsLink",   label: "Link to Automation Details" },
    { key: "previousStatus",          label: "Previous Status" },
    { key: "previousStatusDate",      label: "Previous Status Date" },
    { key: "previousStage",           label: "Previous Stage" },
    { key: "previousAutomationStatus", label: "Previous Automation Status" },
    { key: "oaStatus",                label: "OA Status" },
    { key: "oaSummary",               label: "OA Summary" },
    { key: "oaValidationRecords",     label: "OA Validation Records" },
  ];

  const columns: OrderListingColumn[] = [...leadColumns, ...mainGridIdentityColumns, ...mainGridRequestColumns, ...onExpandColumns];

  const fixedColumns = [...leadColumns.map(c => c.label), ...mainGridIdentityColumns.map(c => c.label)];
  const scrollableColumns = [...mainGridRequestColumns.map(c => c.label), ...onExpandColumns.map(c => c.label)];
  const defaultVisibleColumns = [...fixedColumns, ...mainGridRequestColumns.map(c => c.label)];

  const filterSections: OrderListingFilterSection<Email>[] = [
    { key: "Business Group",      label: "Business Group",      getValue: (r) => r.businessGroup ?? "" },
    { key: "CCC Request Type",    label: "CCC Request Type",    getValue: (r) => r.cccRequestType ?? "" },
  ];

  const categoryDropdown: OrderListingDropdownFilter<Email> = {
    placeholder: "Category",
    allLabel: "All Categories",
    options: ["All Categories", ...Array.from(new Set(ALL_EMAILS.map(e => e.category)))],
    getValue: (r) => r.category,
  };

  const typeDropdown: OrderListingDropdownFilter<Email> = {
    placeholder: "Status",
    allLabel: "All Statuses",
    options: ["All Statuses", "Flagged", "Under Review", "Cleared"],
    getValue: (r) => r.status,
  };

  const plainCell = (text?: string) => <span className="text-[#333] text-[14px]">{text ?? "—"}</span>;
  const linkCell = (text?: string) => <span className="text-[#c53e6c] text-[14px] cursor-pointer hover:underline">{text ?? "—"}</span>;
  const noteCell = (text?: string) => <span className="text-[#686868] text-[13px] block max-w-[220px] truncate">{text ?? "—"}</span>;

  const renderCell = (label: string, row: Email) => {
    switch (label) {
      case "CCC ID": {
        const extraCccs = (row.linkedCccs?.length ?? 1) - 1;
        return (
          <div className="flex items-center gap-1.5">
            {linkCell(row.cccId)}
            {extraCccs > 0 && (
              <span className="text-[10px] text-[#9a9a9a] bg-[#f3f4f6] rounded-full px-[6px] py-[1px] shrink-0 whitespace-nowrap">
                +{extraCccs} more
              </span>
            )}
          </div>
        );
      }
      case "CSR Owner (SOO)":               return plainCell(row.csrOwner);
      case "Business Group":                return plainCell(row.businessGroup);
      case "Opportunity Number":            return linkCell(row.opportunityNumber);
      case "Account Manager":               return plainCell(row.accountManager);
      case "Account Name":                  return plainCell(row.accountName);
      case "CCC Request Type":              return plainCell(row.cccRequestType);
      case "CCC Request Subtype":           return plainCell(row.cccRequestSubtype);
      case "Subject":                       return <span className="text-[#333] text-[14px] block max-w-[260px] truncate">{row.subject}</span>;
      case "CCC Request Status":            return plainCell(row.cccRequestStatus);
      case "Awaiting Reason":               return plainCell(row.awaitingReason);
      case "CCC Request Received Date":     return plainCell(row.cccRequestReceivedDate);
      case "Time Remaining / SLA":          return plainCell(row.slaTimeRemaining);
      case "PO #":                          return plainCell(row.poNumber);
      case "Quote # + Version / Revision":  return linkCell(row.quoteNumber);
      case "Order #":                       return plainCell(row.orderNumber);
      case "Operating Unit":                return plainCell(row.operatingUnit);
      case "PO Amount":                     return plainCell(row.poAmount);
      case "Current Month Bookable Amount": return plainCell(row.currentMonthBookableAmount);
      case "Currency":                      return plainCell(row.currency);
      case "Current Status":                return <EmailStatusBadge status={row.status} />;
      case "Status Notes":                  return noteCell(row.statusNotes);
      case "Current Status Date":           return plainCell(row.currentStatusDate);
      case "Current Automation Status":     return plainCell(row.currentAutomationStatus);
      case "Current Automation Result":     return plainCell(row.currentAutomationResult);
      case "Link to Automation Details":    return linkCell(row.automationDetailsLink);
      case "Previous Status":               return plainCell(row.previousStatus);
      case "Previous Status Date":          return plainCell(row.previousStatusDate);
      case "Previous Stage":                return plainCell(row.previousStage);
      case "Previous Automation Status":    return plainCell(row.previousAutomationStatus);
      case "OA Status":                     return plainCell(row.oaStatus);
      case "OA Summary":                    return noteCell(row.oaSummary);
      case "OA Validation Records":         return linkCell(row.oaValidationRecords);
      default:                              return null;
    }
  };

  // Level 1 rows — the CCC request(s) linked to an email.
  const renderCccCell = (label: string, ccc: Email) => {
    if (label === "Subject") {
      return (
        <span className="text-[#90003b] text-[14px] font-medium flex items-center gap-1.5 max-w-[260px] truncate">
          <FileText size={12} className="shrink-0 opacity-70" />
          {ccc.subject}
        </span>
      );
    }
    return renderCell(label, ccc);
  };

  // Level 2 rows — a CCC's own correspondence thread. Any further nesting (level 3+) shows as a "+N more" link
  // rather than a 3rd inline row tier, jumping into the full thread on the email detail page.
  const renderReplyCell = (label: string, reply: Email) => {
    if (label === "Subject") {
      const moreCount = reply.replies?.length ?? 0;
      return (
        <div className="flex items-center gap-2 max-w-[280px]">
          <span className="text-[#686868] text-[13px] flex items-center gap-1.5 truncate">
            <CornerDownRight size={12} className="shrink-0 opacity-60" />
            {reply.subject}
          </span>
          {moreCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); openInEmailView(reply.rootEmailId ?? reply.id); }}
              className="inline-flex items-center gap-1 shrink-0 px-[8px] py-[3px] rounded-full bg-[#f3f4f6] text-[#686868] hover:bg-[#e5e7eb] hover:text-[#333] text-[11px] font-medium cursor-pointer transition-colors"
              title={`Open the full thread to see ${moreCount} more ${moreCount === 1 ? "reply" : "replies"}`}
            >
              View {moreCount} more →
            </button>
          )}
        </div>
      );
    }
    return renderCell(label, reply);
  };

  return (
    <div className="bg-[#f5f6fa] flex size-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <NavDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
        onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
        onNavigateHoldManagementOverview={onNavigateHoldManagementOverview}
        onNavigateOrderListing={onNavigateOrderListing}
        onNavigateReleasedOrders={onNavigateReleasedOrders}
      />

      <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-auto">
        <AppHeader
          onMenuClick={() => setSidebarOpen(true)}
          activeNav="Command Center"
          activeSub="Overview"
          onViewAllNotifications={onViewAllNotifications}
          onNavigateDashboard={onNavigateDashboard}
        />

        <main className="flex-1 flex flex-col">

          {/* KPI strip — stays visible in both Table and Email modes */}
          <div className="flex gap-4 px-5 py-4 bg-[#f5f6fa]">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white flex-1 min-w-0 rounded-xl border border-black/[0.08] p-3 sm:p-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-[#6b7380]">{kpi.label}</p>
                  <div className="rounded-lg p-1 shrink-0">
                    <div className="flex items-end gap-[2px] h-[11px]">
                      {sparkHeights.map((h, i) => (
                        <div key={i} className="w-[3px] rounded-[1px]" style={{ height: h * 0.55, backgroundColor: kpi.sparkColor }} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[18px] sm:text-[22px] font-bold text-[#111827] leading-none">{kpi.value}</p>
                <div className={`flex items-center gap-1 text-[11px] font-medium ${kpi.up ? "text-emerald-600" : "text-rose-500"}`}>
                  <TrendingUp size={10} />
                  <span>{kpi.delta} vs last week</span>
                </div>
              </div>
            ))}
          </div>

          {/* White content area: toolbar (incl. Table/Email toggle) + table-or-email body */}
          <div className="flex-1 bg-white mx-5 mb-5 rounded-xl border border-[#ebebeb] overflow-hidden flex flex-col">
            <OrderListingTable
              rows={cccRows}
              columns={columns}
              fixedColumns={fixedColumns}
              scrollableColumns={scrollableColumns}
              maxFixedColumns={7}
              defaultVisibleColumns={defaultVisibleColumns}
              filterSections={filterSections}
              categoryDropdown={categoryDropdown}
              typeDropdown={typeDropdown}
              renderCell={renderCell}
              getRowKey={(row) => row.id}
              onRowClick={(row) => openInEmailView(row.rootEmailId ?? row.id)}
              rowsPerPage={10}
              emptyMessage="No emails match your filters"
              getChildren={(row) => row.linkedCccs}
              renderChildCell={renderCccCell}
              childIndentColumnLabel="Subject"
              getGrandchildren={(ccc) => ccc.replies}
              renderGrandchildCell={renderReplyCell}
              grandchildIndentColumnLabel="Subject"
              toolbarExtra={
                <div className="flex items-center border border-[#d1d1d1] rounded-[4px] overflow-hidden h-[36px]">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`flex items-center gap-1.5 px-3 h-full text-[13px] font-medium transition-colors cursor-pointer ${viewMode === "table" ? "bg-[#c53e6c] text-white" : "bg-white text-[#686868] hover:bg-[#f8fafc]"}`}
                  >
                    <LayoutDashboard size={14} />
                    Table
                  </button>
                  <div className="w-px h-5 bg-[#d1d1d1]" />
                  <button
                    onClick={() => setViewMode("email")}
                    className={`flex items-center gap-1.5 px-3 h-full text-[13px] font-medium transition-colors cursor-pointer ${viewMode === "email" ? "bg-[#c53e6c] text-white" : "bg-white text-[#686868] hover:bg-[#f8fafc]"}`}
                  >
                    <Mail size={14} />
                    Email
                  </button>
                </div>
              }
              bodyOverride={viewMode === "email" ? <EmailViewBody key={selectedEmailId} initialEmailId={selectedEmailId} /> : undefined}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Command Center Email View ─────────────────────────────────────────────────

// Three clearly distinct tiers: section heading (colored, larger) > field label (small, muted, this is a caption
// not a heading) > value (dark, bold — the actual data being read).
function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-[110px] max-w-[240px]">
      <p className="text-[9.5px] font-normal text-[#9ca3af] uppercase tracking-wide mb-1 whitespace-nowrap">{label}</p>
      <div className="text-[13.5px] font-semibold text-[#1f2937] truncate">{value || "—"}</div>
    </div>
  );
}

// Fields flow with whitespace rather than sitting in ruled grid cells — a "spec sheet" read instead of a table of boxes.
function DetailSection({ title, fields }: { title: string; fields: { label: string; value: ReactNode }[] }) {
  return (
    <div className="px-5 py-4 border-t border-[#f3f4f6] first:border-t-0">
      <h4 className="text-[12px] font-bold text-[#c53e6c] mb-3">{title}</h4>
      <div className="flex flex-wrap gap-x-6 gap-y-3.5">
        {fields.map(f => <DetailField key={f.label} label={f.label} value={f.value} />)}
      </div>
    </div>
  );
}

function DetailLink({ text, what }: { text?: string; what: string }) {
  if (!text || text === "—") return <>—</>;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toast.info(`Opening ${what}: ${text}`); }}
      className="text-[#c53e6c] hover:underline cursor-pointer text-left truncate"
    >
      {text}
    </button>
  );
}

// A CCC's own correspondence message. Recurses into any further nested replies (unlike the grid, the detail page
// isn't capped at 2 tiers — deeper threads are reachable here via an in-place "Show N more" toggle).
function ThreadMessage({ msg, depth = 0 }: { msg: Email; depth?: number }) {
  const [showMore, setShowMore] = useState(false);
  const subReplies = msg.replies ?? [];
  return (
    <div className={depth > 0 ? "mt-3 pl-4 border-l-2 border-[#f0d5dd]" : ""}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-[13px] font-semibold text-[#111827]">{msg.sender}</p>
        <p className="text-[11px] text-[#9ca3af] shrink-0">{msg.received}</p>
      </div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <p className="text-[12px] text-[#6b7280]">{msg.subject}</p>
        <EmailStatusBadge status={msg.status} />
      </div>
      <p className="text-[13px] text-[#374151] leading-[1.6]">{msg.body ?? "No content preview available."}</p>
      {subReplies.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowMore(s => !s)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#c53e6c] hover:underline cursor-pointer"
          >
            {showMore ? "Hide" : "Show"} {subReplies.length} more {subReplies.length === 1 ? "reply" : "replies"}
          </button>
          {showMore && (
            <div className="mt-3 space-y-3">
              {subReplies.map(sub => <ThreadMessage key={sub.id} msg={sub} depth={depth + 1} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// One linked CCC request. Collapsed by default to a single compact summary row (click to expand) — with several
// linked CCCs the old always-expanded layout turned into a wall of scrolling. Once expanded: Ownership / CCC Request
// Info / Order Info / Current Workflow Status show in a dense grid ("Main grid"); Automation Visibility / Previous
// State / OA sit behind their own nested toggle ("On Expand"), mirroring the overview grid's column split.
function CccDetailCard({ ccc, expanded, onToggleExpand }: { ccc: Email; expanded: boolean; onToggleExpand: () => void }) {
  const [showAutomation, setShowAutomation] = useState(false);
  const replies = ccc.replies ?? [];
  return (
    <div>
      {/* Header — click to expand/collapse the whole card */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#fafafa] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-[30px] rounded-lg bg-[#fdf0f4] flex items-center justify-center shrink-0">
            <FileText size={13} className="text-[#90003b]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-bold text-[#111827] truncate">{ccc.cccId}</p>
              <span className="text-[11.5px] text-[#6b7280] truncate">{ccc.cccRequestType} — {ccc.cccRequestSubtype}</span>
            </div>
            <p className="text-[11px] text-[#9ca3af] truncate mt-0.5">{ccc.accountName} · {ccc.csrOwner}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {ccc.slaTimeRemaining && (
            <span className="hidden sm:inline-block text-[10.5px] font-medium text-[#6b7280] bg-[#f3f4f6] px-2 py-1 rounded-md whitespace-nowrap">{ccc.slaTimeRemaining}</span>
          )}
          <EmailStatusBadge status={ccc.status} />
          <ChevronDown size={16} className={`text-[#9ca3af] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#f3f4f6]">
          <DetailSection title="Ownership" fields={[
            { label: "CSR Owner (SOO)", value: ccc.csrOwner },
            { label: "Business Group", value: ccc.businessGroup },
            { label: "Opportunity Number", value: <DetailLink text={ccc.opportunityNumber} what="Opportunity" /> },
            { label: "Account Manager", value: ccc.accountManager },
            { label: "Account Name", value: ccc.accountName },
          ]} />

          <DetailSection title="CCC Request Info" fields={[
            { label: "CCC Request Type", value: ccc.cccRequestType },
            { label: "CCC Request Subtype", value: ccc.cccRequestSubtype },
            { label: "CCC Request Status", value: ccc.cccRequestStatus },
            { label: "Awaiting Reason", value: ccc.awaitingReason },
            { label: "CCC Request Received Date", value: ccc.cccRequestReceivedDate },
            { label: "Time Remaining / SLA", value: ccc.slaTimeRemaining },
          ]} />

          <DetailSection title="Order Info" fields={[
            { label: "PO #", value: ccc.poNumber },
            { label: "Quote # + Version / Revision", value: <DetailLink text={ccc.quoteNumber} what="Sales Quote" /> },
            { label: "Order #", value: ccc.orderNumber },
            { label: "Operating Unit", value: ccc.operatingUnit },
            { label: "PO Amount", value: ccc.poAmount },
            { label: "Current Month Bookable Amount", value: ccc.currentMonthBookableAmount },
            { label: "Currency", value: ccc.currency },
          ]} />

          <DetailSection title="Current Workflow Status" fields={[
            { label: "Current Status", value: <EmailStatusBadge status={ccc.status} /> },
            { label: "Status Notes", value: ccc.statusNotes },
            { label: "Current Status Date", value: ccc.currentStatusDate },
          ]} />

          {/* On Expand */}
          <button
            onClick={() => setShowAutomation(s => !s)}
            className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 border-t border-[#f3f4f6] text-[11.5px] font-semibold text-[#c53e6c] hover:bg-[#fdf5f8] transition-colors cursor-pointer"
          >
            {showAutomation ? "Hide" : "Show"} automation & history details
            <ChevronDown size={13} className={`transition-transform duration-200 ${showAutomation ? "rotate-180" : ""}`} />
          </button>

          {showAutomation && (
            <div className="border-t border-[#f3f4f6]">
              <DetailSection title="Automation Visibility (Read-only)" fields={[
                { label: "Current Automation Status", value: ccc.currentAutomationStatus },
                { label: "Current Automation Result", value: ccc.currentAutomationResult },
                { label: "Link to Automation Details", value: <DetailLink text={ccc.automationDetailsLink} what="Automation Details" /> },
              ]} />
              <DetailSection title="Previous State" fields={[
                { label: "Previous Status", value: ccc.previousStatus },
                { label: "Previous Status Date", value: ccc.previousStatusDate },
                { label: "Previous Stage", value: ccc.previousStage },
                { label: "Previous Automation Status", value: ccc.previousAutomationStatus },
              ]} />
              <DetailSection title="OA" fields={[
                { label: "OA Status", value: ccc.oaStatus },
                { label: "OA Summary", value: ccc.oaSummary },
                { label: "OA Validation Records", value: <DetailLink text={ccc.oaValidationRecords} what="OA Records" /> },
              ]} />
            </div>
          )}

          {/* This CCC's own correspondence */}
          {replies.length > 0 && (
            <div className="border-t border-[#f3f4f6]">
              <div className="px-5 py-3 flex items-center gap-2">
                <h3 className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-widest">Correspondence</h3>
                <span className="bg-[#f3f4f6] text-[#6b7280] text-[10px] font-bold px-2 py-0.5 rounded-full">{replies.length}</span>
              </div>
              <div className="divide-y divide-[#f3f4f6]">
                {replies.map((msg, idx) => (
                  <div key={msg.id} className="px-5 py-3.5 flex gap-3">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center shrink-0 pt-1 w-[8px]">
                      <div className="size-[7px] rounded-full bg-[#c53e6c] shrink-0" />
                      {idx < replies.length - 1 && <div className="w-[1.5px] flex-1 bg-[#f0d5dd] mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <ThreadMessage msg={msg} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// The email sidebar + detail panel — shared by the standalone Email View page and the Table/Email toggle
// inside the Command Center Overview page, so the two never drift apart.
function EmailViewBody({ initialEmailId }: { initialEmailId?: string }) {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedId, setSelectedId] = useState(initialEmailId ?? ALL_EMAILS_WITH_CCC[0].id);
  const [expandedCccIds, setExpandedCccIds] = useState<Set<string>>(new Set());

  const selected = ALL_EMAILS_WITH_CCC.find((e) => e.id === selectedId) ?? ALL_EMAILS_WITH_CCC[0];
  const linkedCccs = selected.linkedCccs ?? [];

  const tabs = ["All", "Flagged", "Under Review", "Cleared"];
  const tabCount = (tab: string) => tab === "All" ? ALL_EMAILS_WITH_CCC.length : ALL_EMAILS_WITH_CCC.filter(e => e.status === tab).length;
  const filtered = ALL_EMAILS_WITH_CCC.filter((e) => activeTab === "All" || e.status === activeTab);

  const toggleCccExpanded = (cccId: string) => {
    setExpandedCccIds(prev => {
      const next = new Set(prev);
      if (next.has(cccId)) next.delete(cccId); else next.add(cccId);
      return next;
    });
  };

  // Separate expand state for the sidebar list's own 2-level nesting (email → CCCs → replies) — independent of
  // expandedCccIds above, which controls whether each CCC card's full body is expanded in the right panel.
  const [expandedSidebarEmailIds, setExpandedSidebarEmailIds] = useState<Set<string>>(new Set());
  const [expandedSidebarCccIds, setExpandedSidebarCccIds] = useState<Set<string>>(new Set());
  const toggleSidebarEmailExpanded = (id: string) => {
    setExpandedSidebarEmailIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSidebarCccExpanded = (id: string) => {
    setExpandedSidebarCccIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const statusIconColors: Record<string, string> = {
    Flagged: "text-rose-600",
    "Under Review": "text-amber-600",
    Cleared: "text-emerald-600",
  };
  const statusIconBg: Record<string, string> = {
    Flagged: "bg-rose-50",
    "Under Review": "bg-amber-50",
    Cleared: "bg-emerald-50",
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left sidebar ── */}
        <div className="bg-white border-r border-[#ebebeb] flex flex-col w-[420px] shrink-0 overflow-hidden">

          {/* Sidebar header */}
          <div className="px-5 pt-5 pb-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <h2 className="font-semibold text-[15px] text-[#111827]">Emails</h2>
              <span className="bg-[#c53e6c] text-white text-[10px] font-bold px-[7px] py-[2px] rounded-full leading-none">
                {tabCount("All")}
              </span>
            </div>

            {/* Status tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {tabs.map((tab) => {
                const count = tabCount(tab);
                const active = activeTab === tab;
                const activeColors: Record<string, string> = {
                  All: "bg-[#111827] text-white",
                  Flagged: "bg-rose-600 text-white",
                  "Under Review": "bg-amber-500 text-white",
                  Cleared: "bg-emerald-600 text-white",
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                      active ? activeColors[tab] : "bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e9eaec]"
                    }`}
                  >
                    {tab}
                    <span className={`text-[10px] font-bold leading-none ${active ? "opacity-80" : "opacity-60"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#f0f0f0]" />

          {/* Email list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-16 px-6">
                <div className="size-[48px] rounded-full bg-[#f3f4f6] flex items-center justify-center">
                  <Mail size={20} className="opacity-30" />
                </div>
                <p className="text-[13px] text-[#9ca3af] text-center">No emails in this category</p>
              </div>
            )}
            {filtered.map((e) => {
              const isActive = selectedId === e.id;
              const cccList = e.linkedCccs ?? [];
              const emailExpanded = expandedSidebarEmailIds.has(e.id);
              return (
                <div key={e.id} className="border-b border-b-[#f3f4f6]">
                  {/* Level 0 — the email itself */}
                  <div
                    onClick={() => setSelectedId(e.id)}
                    className={`group relative px-5 py-4 cursor-pointer transition-all ${isActive ? "bg-[#fff5f7]" : "hover:bg-[#fafafa]"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 size-[34px] rounded-xl flex items-center justify-center mt-0.5 ${statusIconBg[e.status] ?? "bg-emerald-50"}`}>
                        <Mail size={15} className={statusIconColors[e.status] ?? "text-emerald-600"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className={`text-[13px] leading-[1.3] truncate ${isActive ? "font-semibold text-[#111827]" : "font-medium text-[#1f2937]"}`}>
                            {e.subject}
                          </p>
                          <p className="text-[10.5px] text-[#9ca3af] shrink-0 whitespace-nowrap">{e.received}</p>
                        </div>
                        <p className="text-[11.5px] text-[#6b7280] leading-[1.5] truncate mb-2">{e.sender}</p>
                        <div className="flex items-center justify-between gap-2">
                          <EmailStatusBadge status={e.status} />
                          {cccList.length > 0 && (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); toggleSidebarEmailExpanded(e.id); }}
                              className="inline-flex items-center gap-1 shrink-0 px-2 py-[3px] rounded-full bg-[#fdf0f4] text-[#c53e6c] hover:bg-[#fbe1e9] text-[10.5px] font-medium cursor-pointer transition-colors"
                              aria-label={emailExpanded ? "Hide linked CCCs" : "Show linked CCCs"}
                            >
                              <ChevronDown size={10} className={`transition-transform duration-200 ${emailExpanded ? "rotate-180" : ""}`} />
                              {emailExpanded ? "Hide" : "Show"} {cccList.length} {cccList.length === 1 ? "CCC" : "CCCs"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Level 1 — CCC requests linked to this email */}
                  {emailExpanded && cccList.map((ccc) => {
                    const cccExpanded = expandedSidebarCccIds.has(ccc.id);
                    const cccReplies = ccc.replies ?? [];
                    return (
                      <div key={ccc.id}>
                        <div
                          onClick={() => setSelectedId(e.id)}
                          className="pl-[52px] pr-5 py-2.5 cursor-pointer hover:bg-[#faf5f7] border-t border-t-[#f5eef1] bg-[#fbf8f9] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={11} className="text-[#90003b] shrink-0" />
                            <p className="text-[12px] font-semibold text-[#333] truncate flex-1">{ccc.cccId}</p>
                            <EmailStatusBadge status={ccc.status} />
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1 pl-[19px]">
                            <p className="text-[11px] text-[#6b7280] truncate">{ccc.cccRequestType} — {ccc.cccRequestSubtype}</p>
                            {cccReplies.length > 0 && (
                              <button
                                onClick={(ev) => { ev.stopPropagation(); toggleSidebarCccExpanded(ccc.id); }}
                                className="inline-flex items-center gap-1 shrink-0 text-[10px] font-medium text-[#c53e6c] hover:underline cursor-pointer"
                                aria-label={cccExpanded ? "Hide replies" : "Show replies"}
                              >
                                <ChevronDown size={9} className={`transition-transform duration-200 ${cccExpanded ? "rotate-180" : ""}`} />
                                {cccExpanded ? "Hide" : "Show"} {cccReplies.length} {cccReplies.length === 1 ? "reply" : "replies"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Level 2 — this CCC's own correspondence */}
                        {cccExpanded && cccReplies.map((reply) => (
                          <div
                            key={reply.id}
                            onClick={() => setSelectedId(e.id)}
                            className="pl-[76px] pr-5 py-2.5 cursor-pointer hover:bg-[#f5eef1] border-t border-t-[#f5eef1] bg-[#f8f2f4] transition-colors"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CornerDownRight size={10} className="text-[#9ca3af] shrink-0" />
                              <p className="text-[11px] text-[#374151] truncate flex-1">{reply.subject}</p>
                              <EmailStatusBadge status={reply.status} />
                            </div>
                            {(reply.replies?.length ?? 0) > 0 && (
                              <p className="text-[10px] text-[#9ca3af] pl-[16px] mt-0.5">+{reply.replies!.length} more in thread</p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right detail panel ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f5f7]">
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">

            {/* Primary email card — the main content on this page; everything below is supplementary, on-demand detail */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] overflow-hidden mb-5 shadow-sm">
              <div className="px-7 py-6 border-b border-[#f3f4f6]">
                <p className="text-[10.5px] font-bold text-[#c53e6c] uppercase tracking-widest mb-2">Email</p>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-[19px] font-bold text-[#111827] leading-[1.35]">{selected.subject}</h1>
                  <span className="shrink-0 mt-0.5"><EmailStatusBadge status={selected.status} /></span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[12px] text-[#9ca3af]">From: <span className="text-[#374151] font-medium">{selected.sender}</span></span>
                  <span className="w-px h-3 bg-[#e5e7eb]" />
                  <span className="text-[12px] text-[#9ca3af]">Received: <span className="text-[#374151] font-medium">{selected.received}</span></span>
                  <span className="w-px h-3 bg-[#e5e7eb]" />
                  <span className="bg-[#f3f4f6] text-[#374151] text-[11px] font-semibold px-2.5 py-1 rounded-md tracking-wide uppercase">{selected.category}</span>
                </div>
              </div>

              {/* Body — the primary content the user came here to read */}
              <div className="px-7 py-6">
                <p className="text-[14px] text-[#374151] leading-[1.7]">{selected.body ?? "No content preview available."}</p>
              </div>

              {/* Meta strip */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 px-7 py-4 border-t border-[#f3f4f6] bg-[#fafafa]">
                {[
                  { label: "Email ID", value: selected.id },
                  { label: "Category", value: selected.category },
                  { label: "Size", value: selected.size },
                  { label: "Linked CCCs", value: String(linkedCccs.length) },
                ].map(({ label, value }) => (
                  <div key={label} className="min-w-[90px]">
                    <p className="text-[9.5px] font-normal text-[#9ca3af] uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-[12.5px] font-semibold text-[#374151]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked CCC requests — supplementary, on-demand detail: one flat panel, not cards competing with the email above */}
            {linkedCccs.length > 0 && (
              <div className="bg-white rounded-xl border border-[#ebebeb] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-[#fafafa] border-b border-[#f3f4f6]">
                  <h3 className="text-[10.5px] font-bold text-[#9ca3af] uppercase tracking-widest">Linked CCC Requests</h3>
                  <span className="bg-white border border-[#e5e7eb] text-[#6b7280] text-[10px] font-bold px-2 py-0.5 rounded-full">{linkedCccs.length}</span>
                </div>
                <div className="divide-y divide-[#f3f4f6]">
                  {linkedCccs.map((ccc) => (
                    <CccDetailCard
                      key={ccc.id}
                      ccc={ccc}
                      expanded={expandedCccIds.has(ccc.id)}
                      onToggleExpand={() => toggleCccExpanded(ccc.id)}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sticky footer */}
          <div className="bg-white border-t border-[#ebebeb] px-8 py-4 flex items-center justify-between shrink-0">
            <p className="text-[12px] text-[#9ca3af]">
              Last updated: <span className="text-[#374151] font-medium">{selected.received}</span>
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => toast.info(`Escalated ${selected.id}`)} className="px-5 py-2.5 border border-[#e5e7eb] rounded-xl text-[13px] font-medium text-[#374151] hover:bg-[#f9f9fb] cursor-pointer transition-colors">
                Escalate
              </button>
              <button onClick={() => toast.success(`Marked ${selected.id} as reviewed`)} className="px-5 py-2.5 bg-[#c53e6c] rounded-xl text-[13px] font-semibold text-white hover:opacity-90 cursor-pointer transition-opacity shadow-sm">
                Mark Reviewed
              </button>
            </div>
          </div>
        </div>

      </div>
  );
}

// ─── Command Center Email View ─────────────────────────────────────────────────

function EmailViewPage({ onLogout, onViewAllNotifications, onNavigateDashboard, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateHoldManagementOverview, onNavigateOrderListing, onNavigateReleasedOrders }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateDashboard: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="bg-[#f4f5f7] flex flex-col size-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <NavDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
        onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
        onNavigateHoldManagementOverview={onNavigateHoldManagementOverview}
        onNavigateOrderListing={onNavigateOrderListing}
        onNavigateReleasedOrders={onNavigateReleasedOrders}
      />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} activeNav="Command Center" activeSub="Email View" onViewAllNotifications={onViewAllNotifications} onNavigateDashboard={onNavigateDashboard} />
      <EmailViewBody />
    </div>
  );
}

// ─── Hold Management Overview ─────────────────────────────────────────────────

const CARDS_PER_PAGE = 4;

function HoldManagementOverview({ onLogout, onViewAllNotifications, onNavigateDashboard, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onViewAllOrders, onNavigateOrderListing, onNavigateReleasedOrders }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateDashboard: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onViewAllOrders?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timelineTab, setTimelineTab] = useState("7d");
  const [activeSort, setActiveSort] = useState("Aging");
  const [monthOpen, setMonthOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("Month");
  const monthRef = useRef<HTMLDivElement>(null);
  // per-panel slider state
  const [panelPage, setPanelPage] = useState<Record<string, number>>({});
  const [slideDir, setSlideDir] = useState<Record<string, "next" | "prev">>({});

  const navigatePanel = (title: string, dir: "next" | "prev") => {
    setSlideDir(d => ({ ...d, [title]: dir }));
    setPanelPage(p => ({ ...p, [title]: (p[title] ?? 0) + (dir === "next" ? 1 : -1) }));
  };
  const [todos, setTodos] = useState([
    { id: 1, label: "Review SLA Breached Holds", priority: "#dc2626", done: false },
    { id: 2, label: "Process Orders Batch", priority: "#d97706", done: false },
    { id: 3, label: "Update Invoicing Rules", priority: "#cbd5e1", done: false },
    { id: 4, label: "Escalate At-Risk Holds", priority: "#dc2626", done: false },
    { id: 5, label: "Weekly Hold Report", priority: "#cbd5e1", done: false },
  ]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) setMonthOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const kpis = [
    { label: "OPEN HOLDS", value: "1,300", delta: "↑ 4.2%", up: true, sparkColor: "#cbd5e1" },
    { label: "SLA BREACHED", value: "345", delta: "↓ 1.1%", up: false, sparkColor: "#fecbcb" },
    { label: "AT RISK", value: "120", delta: "↑ 0.8%", up: true, sparkColor: "#fde7a0" },
    { label: "TOTAL VALUE", value: "$ 5060M", delta: "↑ 4.2%", up: true, sparkColor: "#bbf7d0" },
    { label: "ON TRACK", value: "234", delta: "↑ 1.6%", up: true, sparkColor: "#bfdafe" },
  ];
  const sparkHeights = [8, 14, 10, 18, 12, 20, 14, 16];

  type Tag = { label: string; color: string; bg: string };
  type HoldCardData = { code: string; badge: string; badgeColor: string; orders: string; breached: string; value: string; tags: Tag[]; critical?: boolean; dividers?: boolean };
  type HoldPanelData = { title: string; count: number; critical: number; total: string; accentColor: string; cards: HoldCardData[] };

  const holdPanels: HoldPanelData[] = [
    {
      title: "Shipment Impacting Holds", count: 18, critical: 5, total: "$24.5M", accentColor: "#3b82f6",
      cards: [
        { code: "MFG", badge: "SHP", badgeColor: "#3b82f6", orders: "06", breached: "01", value: "$3.8M", critical: true, tags: [{ label: "Header", color: "#2664dc", bg: "rgba(56,130,246,0.1)" }, { label: "On track", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "LOG", badge: "SHP", badgeColor: "#3b82f6", orders: "08", breached: "02", value: "$4.1M", tags: [{ label: "Line", color: "#2664dc", bg: "rgba(56,130,246,0.1)" }, { label: "At Risk", color: "#d97706", bg: "rgba(217,119,6,0.1)" }] },
        { code: "WHS", badge: "SHP", badgeColor: "#3b82f6", orders: "05", breached: "00", value: "$2.9M", tags: [{ label: "Header", color: "#2664dc", bg: "rgba(56,130,246,0.1)" }, { label: "On track", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "DST", badge: "SHP", badgeColor: "#3b82f6", orders: "07", breached: "03", value: "$5.2M", tags: [{ label: "Line", color: "#2664dc", bg: "rgba(56,130,246,0.1)" }, { label: "Late", color: "#dc2626", bg: "rgba(220,38,38,0.1)" }] },
        { code: "FRT", badge: "SHP", badgeColor: "#3b82f6", orders: "04", breached: "01", value: "$2.1M", tags: [{ label: "Header", color: "#2664dc", bg: "rgba(56,130,246,0.1)" }, { label: "On track", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "EXP", badge: "SHP", badgeColor: "#3b82f6", orders: "03", breached: "00", value: "$1.7M", tags: [{ label: "Line", color: "#2664dc", bg: "rgba(56,130,246,0.1)" }, { label: "On track", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
      ],
    },
    {
      title: "Invoicing Only Holds", count: 20, critical: 3, total: "$18.2M", accentColor: "#7c3bf6",
      cards: [
        { code: "FIN", badge: "INV", badgeColor: "#7c3bf6", orders: "05", breached: "02", value: "$2.8M", dividers: true, tags: [{ label: "INV", color: "#7c3bf6", bg: "rgba(124,59,246,0.1)" }, { label: "Late", color: "#dc2626", bg: "rgba(220,38,38,0.1)" }] },
        { code: "ACC", badge: "INV", badgeColor: "#7c3bf6", orders: "03", breached: "03", value: "$1.6M", dividers: true, tags: [{ label: "INV", color: "#7c3bf6", bg: "rgba(124,59,246,0.1)" }, { label: "Header", color: "#637590", bg: "rgba(99,117,144,0.1)" }] },
        { code: "PAY", badge: "INV", badgeColor: "#7c3bf6", orders: "08", breached: "01", value: "$4.2M", dividers: true, tags: [{ label: "INV", color: "#7c3bf6", bg: "rgba(124,59,246,0.1)" }, { label: "On Track", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "BIL", badge: "INV", badgeColor: "#7c3bf6", orders: "04", breached: "02", value: "$3.1M", dividers: true, tags: [{ label: "INV", color: "#7c3bf6", bg: "rgba(124,59,246,0.1)" }, { label: "Late", color: "#dc2626", bg: "rgba(220,38,38,0.1)" }] },
        { code: "TAX", badge: "INV", badgeColor: "#7c3bf6", orders: "06", breached: "00", value: "$2.4M", dividers: true, tags: [{ label: "INV", color: "#7c3bf6", bg: "rgba(124,59,246,0.1)" }, { label: "On Track", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "CRD", badge: "INV", badgeColor: "#7c3bf6", orders: "02", breached: "01", value: "$0.9M", dividers: true, tags: [{ label: "INV", color: "#7c3bf6", bg: "rgba(124,59,246,0.1)" }, { label: "At Risk", color: "#d97706", bg: "rgba(217,119,6,0.1)" }] },
      ],
    },
    {
      title: "Non CC Holds", count: 30, critical: 4, total: "$31.0M", accentColor: "#0891b5",
      cards: [
        { code: "GLB", badge: "NCC", badgeColor: "#0891b5", orders: "06", breached: "02", value: "$5.2M", dividers: true, tags: [{ label: "GTL", color: "#0891b5", bg: "rgba(8,145,181,0.1)" }, { label: "Header", color: "#637590", bg: "rgba(99,117,144,0.1)" }] },
        { code: "TRD", badge: "NCC", badgeColor: "#0891b5", orders: "04", breached: "04", value: "$2.3M", dividers: true, tags: [{ label: "GTL", color: "#0891b5", bg: "rgba(8,145,181,0.1)" }, { label: "Escalate", color: "#dc2626", bg: "rgba(220,38,38,0.1)" }] },
        { code: "EXP", badge: "NCC", badgeColor: "#0891b5", orders: "09", breached: "01", value: "$6.8M", dividers: true, tags: [{ label: "GTL", color: "#0891b5", bg: "rgba(8,145,181,0.1)" }, { label: "On Fund", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "WHL", badge: "NCC", badgeColor: "#0891b5", orders: "05", breached: "03", value: "$3.7M", dividers: true, tags: [{ label: "GTL", color: "#0891b5", bg: "rgba(8,145,181,0.1)" }, { label: "Header", color: "#637590", bg: "rgba(99,117,144,0.1)" }] },
        { code: "REG", badge: "NCC", badgeColor: "#0891b5", orders: "07", breached: "02", value: "$4.5M", dividers: true, tags: [{ label: "GTL", color: "#0891b5", bg: "rgba(8,145,181,0.1)" }, { label: "On Fund", color: "#0c883c", bg: "rgba(22,177,81,0.1)" }] },
        { code: "CMP", badge: "NCC", badgeColor: "#0891b5", orders: "03", breached: "01", value: "$1.9M", dividers: true, tags: [{ label: "GTL", color: "#0891b5", bg: "rgba(8,145,181,0.1)" }, { label: "At Risk", color: "#d97706", bg: "rgba(217,119,6,0.1)" }] },
      ],
    },
  ];

  const releasedOrders = [
    { id: "#7800011", value: "$340K", company: "Acme Industries Ltd", reason: "Credit Check Failure", time: "Released 2d ago" },
    { id: "#7800042", value: "$215K", company: "GlobalTech Solutions", reason: "Credit Check Failure", time: "Released 1d ago" },
    { id: "#7800056", value: "$128K", company: "Nexus Corp", reason: "Payment Overdue", time: "Released 4h ago" },
    { id: "#7800078", value: "$492K", company: "Sterling & Co", reason: "Credit Check Failure", time: "Released 6h ago" },
  ];

  return (
    <div className="bg-[#f1f3f6] flex size-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .slide-next { animation: slideInFromRight 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        .slide-prev { animation: slideInFromLeft  0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
      `}</style>
      <NavDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
        onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
        onNavigateHoldManagementOverview={() => {}}
        onNavigateOrderListing={onNavigateOrderListing}
        onNavigateReleasedOrders={onNavigateReleasedOrders}
      />

      <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-auto">
        <AppHeader
          onMenuClick={() => setSidebarOpen(true)}
          activeNav="Hold Management"
          activeSub="Overview"
          onViewAllNotifications={onViewAllNotifications}
          onNavigateDashboard={onNavigateDashboard}
        />

        <main className="flex-1 p-5 flex flex-col gap-5">

          {/* ── Page header ── */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-[2px]">
              <p className="font-semibold text-[#0f172a] text-[20px] leading-tight">Holds Overview</p>
              <p className="text-[#94a3b8] text-[12px]">Monday, 6 July 2026</p>
            </div>
            <div className="flex items-center gap-[12px]">
              <div className="flex items-center gap-[6px]">
                <div className="size-[8px] rounded-full bg-[#16a34a] shrink-0" />
                <p className="text-[#94a3b8] text-[11px] whitespace-nowrap">Last synced 10:45 AM</p>
              </div>

              {/* Month dropdown */}
              <div className="relative" ref={monthRef}>
                <button
                  onClick={() => setMonthOpen(o => !o)}
                  className="bg-white h-[32px] px-[12px] pr-[10px] rounded-[4px] border border-[#e0e5ed] flex items-center gap-[6px] text-[#64748b] text-[12px] font-medium cursor-pointer hover:bg-[#f8fafc] transition-colors"
                >
                  {selectedMonth}
                  <svg fill="none" viewBox="0 0 10.5 6" className={`size-[10px] shrink-0 transition-transform duration-150 ${monthOpen ? "rotate-180" : ""}`}>
                    <path clipRule="evenodd" d={holdSvg.p99cbd00} fill="#64748b" fillRule="evenodd" />
                  </svg>
                </button>
                {monthOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] bg-white rounded-lg border border-[#e2e8f0] shadow-lg z-30 py-1 min-w-[130px]">
                    {["This Month", "Last Month", "Last 3 Months", "Last 6 Months", "This Year"].map((m) => (
                      <button
                        key={m}
                        onClick={() => { setSelectedMonth(m); setMonthOpen(false); toast.success(`Period set to ${m}`); }}
                        className={`w-full text-left px-3 py-[7px] text-[12px] cursor-pointer transition-colors ${selectedMonth === m ? "bg-[#f8f0f4] text-[#90003b] font-semibold" : "text-[#374151] hover:bg-[#f8fafc]"}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => toast.success("Report exported successfully", { description: "holds-overview.csv is ready to download" })}
                className="bg-white h-[32px] px-[10px] rounded-[4px] border border-[#e0e5ed] flex items-center gap-[6px] text-[#64748b] text-[12px] font-medium cursor-pointer hover:bg-[#f8fafc] transition-colors"
              >
                <svg fill="none" viewBox="0 0 12.25 10.9375" className="size-[13px] shrink-0">
                  <path clipRule="evenodd" d={holdSvg.p3615000} fill="#64748b" fillRule="evenodd" />
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* ── KPI strip ── */}
          <div className="flex gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white flex-1 min-w-0 rounded-xl border border-black/[0.08] p-3 sm:p-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-[#6b7380]">{kpi.label}</p>
                  <div className="rounded-lg p-1 shrink-0">
                    <div className="flex items-end gap-[2px] h-[11px]">
                      {sparkHeights.map((h, i) => (
                        <div key={i} className="w-[3px] rounded-[1px]" style={{ height: h * 0.55, backgroundColor: kpi.sparkColor }} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[18px] sm:text-[22px] font-bold text-[#111827] leading-none">{kpi.value}</p>
                <div className={`flex items-center gap-1 text-[11px] font-medium ${kpi.up ? "text-emerald-600" : "text-rose-500"}`}>
                  <TrendingUp size={10} />
                  <span>{kpi.delta} vs last week</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Body: panels + sidebar ── */}
          <div className="flex gap-5 items-start">

            {/* ── Left column ── */}
            <div className="flex-1 min-w-0 bg-white rounded-xl border border-[#e8ecef] overflow-hidden">

              {/* Filter bar */}
              <div className="bg-[#f1f5f9] flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-[10px] border-b border-[#e8ecef] shadow-[inset_0px_-1px_0px_#e8ecef]">
                {/* Timeline */}
                <div className="flex items-center gap-2">
                  <p className="text-[#637590] text-[10px] font-medium tracking-[0.4px] whitespace-nowrap">TIMELINE</p>
                  <div className="bg-[#e5e8ec] h-[16px] w-px" />
                  <div className="flex items-center">
                    {["7d", "14d", "20d", "30d"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimelineTab(t)}
                        className="flex flex-col items-center gap-[8px] px-3 pt-[10px] pb-0 cursor-pointer"
                      >
                        <span className={`text-[12px] whitespace-nowrap ${timelineTab === t ? "font-semibold text-[#90003b]" : "font-normal text-[#637590]"}`}>{t}</span>
                        <div className={`h-[2px] rounded-[2px] ${timelineTab === t ? "bg-[#90003b] w-5" : "bg-transparent w-[27px]"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#e5e8ec] h-[32px] w-px" />
                {/* Sort by */}
                <div className="flex items-center gap-2">
                  <p className="text-[#637590] text-[10px] font-medium tracking-[0.4px] whitespace-nowrap">SORT BY</p>
                  <div className="bg-[#e5e8ec] h-[16px] w-px" />
                  <div className="flex items-center gap-[6px] flex-wrap">
                    {["Aging", "SSD Proximity", "Value", "Order Volume"].map((s) => {
                      const isActive = activeSort === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setActiveSort(s)}
                          className={`flex items-center gap-[5px] px-[10px] py-[6px] rounded-[4px] text-[12px] border cursor-pointer transition-colors whitespace-nowrap ${
                            isActive ? "bg-[#90003b] text-white border-[#90003b] font-semibold" : "text-[#c53e6c] border-[#c53e6c] bg-transparent font-normal hover:bg-[#fff0f5]"
                          }`}
                        >
                          {s}
                          {isActive ? (
                            <svg fill="none" viewBox="0 0 10.5 6" className="size-[10px]">
                              <path clipRule="evenodd" d={holdSvg.p276a1b80} fill="white" fillRule="evenodd" />
                            </svg>
                          ) : (
                            <svg fill="none" viewBox="0 0 10 14" className="size-[8px]">
                              <path d={holdSvg.p2dd962c0} fill="#C53E6C" fillOpacity="0.7" />
                              <path d={holdSvg.p2aef46f0} fill="#C53E6C" fillOpacity="0.7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Panel sections */}
              {holdPanels.map((panel) => {
                const page = panelPage[panel.title] ?? 0;
                const totalPages = Math.ceil(panel.cards.length / CARDS_PER_PAGE);
                const visibleCards = panel.cards.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);
                const canPrev = page > 0;
                const canNext = page < totalPages - 1;
                return (
                  <div key={panel.title} className="border-t border-[#e8ecef]">
                    {/* Panel header with accent left border */}
                    <div className="relative bg-white pt-[18px] pb-[14px] px-5">
                      <div className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: panel.accentColor }} />
                      <div className="flex flex-col gap-[6px]">
                        <p className="text-[#0f1729] text-[14px] font-semibold">{panel.title}</p>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <p className="text-[#64748b] text-[12px] whitespace-nowrap">{panel.count} Holds</p>
                            <div className="bg-[#e2e8f0] h-[12px] w-px" />
                            <div className="flex items-center gap-[6px]">
                              <div className="size-[6px] rounded-full bg-[#dc2626] shrink-0" />
                              <p className="text-[#dc2626] text-[12px] whitespace-nowrap">{panel.critical} Critical</p>
                            </div>
                            <div className="bg-[#e2e8f0] h-[12px] w-px" />
                            <p className="text-[#64748b] text-[12px] whitespace-nowrap">{panel.total} Total value</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => onViewAllOrders ? onViewAllOrders() : toast.info(`Viewing all ${panel.count} holds for ${panel.title}`)}
                              className="text-[#3b82f6] text-[12px] font-medium cursor-pointer hover:underline whitespace-nowrap"
                            >
                              View all {panel.count} holds →
                            </button>
                            <div className="flex items-center gap-2">
                              {/* Page indicator dots */}
                              <div className="flex items-center gap-1 mr-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setPanelPage(p => ({ ...p, [panel.title]: i }))}
                                    className={`rounded-full transition-all cursor-pointer ${i === page ? "w-[16px] h-[5px] bg-[#90003b]" : "size-[5px] bg-[#e2e8f0] hover:bg-[#cbd5e1]"}`}
                                  />
                                ))}
                              </div>
                              <button
                                disabled={!canPrev}
                                onClick={() => navigatePanel(panel.title, "prev")}
                                className={`size-[28px] rounded-lg border flex items-center justify-center transition-colors ${canPrev ? "border-[#e2e8f0] hover:bg-[#f8fafc] cursor-pointer" : "border-[#f1f5f9] opacity-40 cursor-not-allowed"}`}
                              >
                                <svg fill="none" viewBox="0 0 16 16" className="size-[14px]"><path d="M10 12L6 8L10 4" stroke="#64748B" strokeLinecap="round" strokeWidth="2" /></svg>
                              </button>
                              <button
                                disabled={!canNext}
                                onClick={() => navigatePanel(panel.title, "next")}
                                className={`size-[28px] rounded-lg border flex items-center justify-center transition-colors ${canNext ? "border-[#e2e8f0] hover:bg-[#f8fafc] cursor-pointer" : "border-[#f1f5f9] opacity-40 cursor-not-allowed"}`}
                              >
                                <svg fill="none" viewBox="0 0 16 16" className="size-[14px]"><path d="M6 12L10 8L6 4" stroke="#64748B" strokeLinecap="round" strokeWidth="2" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#f5f7fa] h-px" />

                    {/* Cards row — 4 equal columns, paginated */}
                    <div className="overflow-hidden">
                    <div
                      key={`${panel.title}-${page}`}
                      className={`grid grid-cols-4 gap-4 px-5 py-4 ${slideDir[panel.title] === "prev" ? "slide-prev" : "slide-next"}`}
                    >
                      {visibleCards.map((card, ci) => (
                        <div
                          key={ci}
                          onClick={() => toast.info(`${card.code} — ${card.orders} orders, ${card.breached} breached`)}
                          className="flex flex-col gap-2 p-3 rounded-xl cursor-pointer transition-all border border-[#e8ecef] bg-[rgba(241,245,249,0.46)] hover:bg-white hover:border-[#a53159]"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[#0f172a] text-[13px] font-bold">{card.code}</p>
                            <div className="px-[7px] py-[3px] rounded-[4px]" style={{ backgroundColor: `${card.badgeColor}1f` }}>
                              <p className="text-[10px] font-semibold" style={{ color: card.badgeColor }}>{card.badge}</p>
                            </div>
                          </div>

                          <div className="h-px bg-[#f1f3f6]" />

                          <div className="flex items-center py-[2px]">
                            <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                              <p className="text-[#94a3b8] text-[10px] uppercase">ORDERS</p>
                              <p className="text-[#0f172a] text-[16px] font-bold leading-none">{card.orders}</p>
                            </div>
                            {card.dividers && <div className="bg-[#f1f5f9] h-[24px] w-px shrink-0 mx-1" />}
                            <div className="flex flex-col gap-[2px] flex-1 min-w-0 text-[#dc2626]">
                              <p className="text-[10px] uppercase">BREACHED</p>
                              <p className="text-[16px] font-bold leading-none">{card.breached}</p>
                            </div>
                            {card.dividers && <div className="bg-[#f1f5f9] h-[24px] w-px shrink-0 mx-1" />}
                            <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                              <p className="text-[#94a3b8] text-[10px] uppercase">VALUE</p>
                              <p className="text-[#0f172a] text-[16px] font-bold leading-none">{card.value}</p>
                            </div>
                          </div>

                          <div className="h-px bg-[#f1f3f6]" />

                          <div className="flex items-center gap-[6px] flex-wrap">
                            {card.tags.map((tag, ti) => (
                              <div key={ti} className="px-[6px] py-[3px] rounded-[4px]" style={{ backgroundColor: tag.bg }}>
                                <p className="text-[10px] font-medium whitespace-nowrap" style={{ color: tag.color }}>{tag.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Right sidebar (296px) ── */}
            <div className="w-[296px] shrink-0 flex flex-col gap-4">

              {/* Attention Required */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-[0px_1px_2px_rgba(15,23,42,0.08)]">
                <div className="px-[14px] py-[14px] flex items-center gap-[10px] border-b border-[#f1f3f6]">
                  <p className="text-[#0f172a] text-[13px] font-semibold">Attention Required</p>
                  <div className="bg-[#fff1f2] px-[8px] py-[2px] rounded-full">
                    <p className="text-[#dc2626] text-[10px] font-bold">3</p>
                  </div>
                </div>
                <div className="px-[14px] divide-y divide-[#f1f3f6]">
                  {[
                    { dot: "#dc2626", text: "2 holds expiring today", action: "Act", actionColor: "#dc2626", toastMsg: "Actioning 2 expiring holds…", type: "error" as const },
                    { dot: "#d97706", text: "4 SLA breaches in 2h", action: "Review", actionColor: "#d97706", toastMsg: "Opening SLA breach review", type: "warning" as const },
                    { dot: "#d97706", text: "$5.2M at risk value", action: "View", actionColor: "#d97706", toastMsg: "Viewing at-risk value breakdown", type: "warning" as const },
                  ].map((alert, i) => (
                    <div key={i} className="flex items-center justify-between py-[13px]">
                      <div className="flex items-center gap-2">
                        <div className="size-[6px] rounded-full shrink-0" style={{ backgroundColor: alert.dot }} />
                        <p className="text-[#0f172a] text-[11px]">{alert.text}</p>
                      </div>
                      <button
                        onClick={() => alert.type === "error" ? toast.error(alert.toastMsg) : toast.warning(alert.toastMsg)}
                        className="text-[11px] font-bold cursor-pointer hover:opacity-70 transition-opacity ml-3 shrink-0"
                        style={{ color: alert.actionColor }}
                      >
                        {alert.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* To-Do */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-[0px_1px_2px_rgba(15,23,42,0.08)] p-[14px] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-[#0f172a] text-[13px] font-semibold">To-Do</p>
                    <div className="bg-[#f1f5f9] px-[8px] py-[2px] rounded-full">
                      <p className="text-[#64748b] text-[10px] font-bold">{todos.filter(t => !t.done).length}</p>
                    </div>
                  </div>
                  <button className="bg-[#f1f5f9] size-[22px] rounded-lg flex items-center justify-center hover:bg-[#e2e8f0] cursor-pointer transition-colors">
                    <svg fill="none" viewBox="0 0 14 14" className="size-[12px]">
                      <path d={holdSvg.p133cc000} stroke="#64748b" strokeLinecap="round" strokeWidth="2" />
                    </svg>
                  </button>
                </div>
                <div className="bg-[#f1f3f6] h-px" />
                <div className="flex flex-col divide-y divide-[#f1f3f6]">
                  {todos.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-[12px]">
                      <button
                        onClick={() => setTodos(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                        className={`size-[16px] rounded-[4px] border-[1.5px] shrink-0 flex items-center justify-center cursor-pointer transition-all ${
                          task.done ? "bg-[#90003b] border-[#90003b]" : "border-[#cbd5e1] bg-white hover:border-[#90003b]"
                        }`}
                      >
                        {task.done && (
                          <svg fill="none" viewBox="0 0 10 8" className="size-[9px]">
                            <path d="M1 4L4 7L9 1" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </svg>
                        )}
                      </button>
                      <p className={`flex-1 min-w-0 text-[11px] font-semibold leading-tight ${task.done ? "line-through text-[#94a3b8]" : "text-[#0f172a]"}`}>{task.label}</p>
                      <div className="size-[6px] rounded-full shrink-0" style={{ backgroundColor: task.priority }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Released Orders */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-[0px_1px_2px_rgba(15,23,42,0.08)] p-[16px] flex flex-col gap-3">
                <p className="text-[#0f172a] text-[13px] font-semibold">Released Orders</p>
                <div className="bg-[#f1f3f6] h-px" />
                <div className="flex flex-col gap-3">
                  {releasedOrders.map((order, i) => (
                    <div key={i}>
                      <div className="flex flex-col gap-[2px]">
                        <div className="flex items-center justify-between">
                          <p className="text-[#0f172a] text-[12px] font-semibold">{order.id}</p>
                          <p className="text-[#0f172a] text-[11px] font-semibold">{order.value}</p>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[#4b5563] text-[11px]">{order.company}</p>
                            <p className="text-[#4b5563] text-[11px]">{order.reason}</p>
                          </div>
                          <p className="text-[#219659] text-[10px] font-semibold whitespace-nowrap mt-px">{order.time}</p>
                        </div>
                      </div>
                      {i < releasedOrders.length - 1 && <div className="bg-[#f1f3f6] h-px mt-3" />}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center pt-1">
                  <button
                    onClick={() => toast.info("Opening full released orders list")}
                    className="text-[#3b82f6] text-[12px] font-medium cursor-pointer hover:underline"
                  >
                    View all →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Order Listing Page ───────────────────────────────────────────────────────

const ALL_ORDERS = [
  { id: "7822110", status: "On Track",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822111", status: "At Risk",   holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Japan"  },
  { id: "7822112", status: "Breached",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "USA"    },
  { id: "7822113", status: "On Track",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822114", status: "At Risk",   holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Manual" },
  { id: "7822115", status: "Breached",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822116", status: "On Track",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822117", status: "At Risk",   holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822118", status: "Breached",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822119", status: "On Track",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "234234234",         ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822120", status: "At Risk",   holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822121", status: "Breached",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822122", status: "On Track",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Japan"  },
  { id: "7822123", status: "At Risk",   holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Japan"  },
  { id: "7822124", status: "Breached",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Japan"  },
  { id: "7822125", status: "At Risk",   holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Japan"  },
  { id: "7822126", status: "Breached",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Japan"  },
  { id: "7822127", status: "On Track",  holdType: "Credit Check Order",   customer: "Acme Corp",    poId: "ACM-POQ-1001001",  ocn: "11223",   ou: "KRS-OU-5001", ssd: "Jan 20", ssdDelta: "+3D", country: "USA"    },
  { id: "7822128", status: "At Risk",   holdType: "Credit Check Order",   customer: "Acme Corp",    poId: "ACM-POQ-1001002",  ocn: "11224",   ou: "KRS-OU-5001", ssd: "Jan 20", ssdDelta: "+3D", country: "USA"    },
  { id: "7822129", status: "On Track",  holdType: "Credit Check Order",   customer: "GlobalTech",   poId: "GLB-POQ-5050505",  ocn: "33445",   ou: "KRS-OU-6002", ssd: "Jan 22", ssdDelta: "+2D", country: "UK"     },
  { id: "7822130", status: "Breached",  holdType: "Credit Check Order",   customer: "GlobalTech",   poId: "GLB-POQ-5050506",  ocn: "33446",   ou: "KRS-OU-6002", ssd: "Jan 22", ssdDelta: "+2D", country: "UK"     },
  { id: "7822131", status: "On Track",  holdType: "Invoice Hold",         customer: "Nexus Corp",   poId: "NXS-POQ-7070707",  ocn: "55667",   ou: "KRS-OU-7003", ssd: "Jan 25", ssdDelta: "+1D", country: "India"  },
  { id: "7822132", status: "At Risk",   holdType: "Invoice Hold",         customer: "Nexus Corp",   poId: "NXS-POQ-7070708",  ocn: "55668",   ou: "KRS-OU-7003", ssd: "Jan 25", ssdDelta: "+1D", country: "India"  },
  { id: "7822133", status: "Breached",  holdType: "Invoice Hold",         customer: "Sterling & Co", poId: "STR-POQ-8080808", ocn: "77889",   ou: "KRS-OU-8004", ssd: "Jan 28", ssdDelta: "+7D", country: "UAE"    },
  { id: "7822134", status: "On Track",  holdType: "Invoice Hold",         customer: "Sterling & Co", poId: "STR-POQ-8080809", ocn: "77890",   ou: "KRS-OU-8004", ssd: "Jan 28", ssdDelta: "+7D", country: "UAE"    },
  { id: "7822135", status: "At Risk",   holdType: "Invoice Hold",         customer: "Sterling & Co", poId: "STR-POQ-8080810", ocn: "77891",   ou: "KRS-OU-8004", ssd: "Jan 28", ssdDelta: "+7D", country: "UAE"    },
];

const ROWS_PER_PAGE = 17;

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  "On Track": { label: "On Track", color: "#1fa161", bg: "rgba(31,161,97,0.1)" },
  "At Risk":  { label: "At Risk",  color: "#e08c00", bg: "rgba(224,140,0,0.1)" },
  "Breached": { label: "Breached", color: "#d12e2e", bg: "rgba(209,46,46,0.1)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE["On Track"];
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 rounded-[4px] text-[12px] font-medium whitespace-nowrap" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

function SortIcon() {
  return (
    <svg fill="none" viewBox="0 0 20 20" className="size-[16px] shrink-0 opacity-40">
      <path d={listingSvg.p22cdbb20} fill="#686868" />
      <path d={listingSvg.p12f4dc00} fill="#686868" />
    </svg>
  );
}

function OrderListingPage({ onLogout, onViewAllNotifications, onNavigateDashboard, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateOverview, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateOrderDetails }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateDashboard: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateOverview: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateOrderDetails?: (orderId: string) => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const kpis = [
    { label: "Open Holds",   value: "05",         highlight: false },
    { label: "SLA Breached", value: "05",         highlight: true  },
    { label: "At Risk",      value: "05",         highlight: false },
    { label: "Total Value",  value: "$ 10540.6M", highlight: false },
    { label: "On Track",     value: "05",         highlight: false },
  ];

  const columns: OrderListingColumn[] = [
    { key: "status",   label: "Status" },
    { key: "id",       label: "Order Id" },
    { key: "holdType", label: "Hold Type" },
    { key: "customer", label: "Customer Name" },
    { key: "poId",     label: "Customer PO ID" },
    { key: "ocn",      label: "OCN" },
    { key: "ou",       label: "Operating Unit (OU)" },
    { key: "ssd",      label: "SSD" },
    { key: "country",  label: "Country" },
  ];

  const fixedColumns = ["Status", "Order Id", "Hold Type", "Customer Name"];
  const scrollableColumns = ["Customer PO ID", "OCN", "Operating Unit (OU)", "SSD", "Country"];

  const filterSections: OrderListingFilterSection<typeof ALL_ORDERS[0]>[] = [
    { key: "Status",    label: "Status",    total: 37, getValue: (r) => r.status },
    { key: "Country",   label: "Country",   total: 18, getValue: (r) => r.country },
    { key: "HoldType",  label: "Hold Type", total: 23, getValue: (r) => r.holdType },
    { key: "Customer",  label: "Customer",  total: 0 },
    { key: "OCN",       label: "OCN",       total: 5,  getValue: (r) => r.ocn },
    { key: "OU",        label: "Operating Unit", total: 7, getValue: (r) => r.ou },
  ];

  const categoryDropdown: OrderListingDropdownFilter<typeof ALL_ORDERS[0]> = {
    placeholder: "Hold Category",
    allLabel: "All Categories",
    options: ["All Categories", ...Array.from(new Set(ALL_ORDERS.map(o => o.holdType)))],
    getValue: (r) => r.holdType,
  };

  const typeDropdown: OrderListingDropdownFilter<typeof ALL_ORDERS[0]> = {
    placeholder: "Hold Type",
    allLabel: "All Types",
    options: ["All Types", "On Track", "At Risk", "Breached"],
    getValue: (r) => r.status,
  };

  const renderCell = (label: string, row: typeof ALL_ORDERS[0]) => {
    switch (label) {
      case "Status":               return <StatusBadge status={row.status} />;
      case "Order Id":             return <button onClick={() => onNavigateOrderDetails?.(row.id)} className="text-[#c53e6c] text-[14px] hover:underline cursor-pointer bg-transparent border-0 p-0 font-normal">{row.id}</button>;
      case "Hold Type":            return <span className="text-[#333] text-[14px]">{row.holdType}</span>;
      case "Customer Name":        return <span className="text-[#333] text-[14px]">{row.customer}</span>;
      case "Customer PO ID":       return <span className="text-[#333] text-[14px] block max-w-[160px] truncate">{row.poId}</span>;
      case "OCN":                  return <span className="text-[#333] text-[14px]">{row.ocn}</span>;
      case "Operating Unit (OU)":  return <span className="text-[#333] text-[14px]">{row.ou}</span>;
      case "SSD":                  return <span className="text-[14px] whitespace-nowrap"><span className="text-[#333]">{row.ssd} </span><span className="text-[#c53e6c] font-semibold">{row.ssdDelta}</span></span>;
      case "Country":              return <span className="text-[#333] text-[14px]">{row.country}</span>;
      default:                     return null;
    }
  };

  return (
    <div className="bg-[#f5f6fa] flex size-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <NavDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
        onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
        onNavigateHoldManagementOverview={onNavigateOverview}
        onNavigateOrderListing={onNavigateOrderListing}
        onNavigateReleasedOrders={onNavigateReleasedOrders}
      />

      <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-auto">
        <AppHeader
          onMenuClick={() => setSidebarOpen(true)}
          activeNav="Hold Management"
          activeSub="Order Listing"
          onViewAllNotifications={onViewAllNotifications}
          onNavigateDashboard={onNavigateDashboard}
        />

        <main className="flex-1 flex flex-col">

          {/* KPI strip */}
          <div className="flex gap-4 px-5 py-4 bg-[#f5f6fa]">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="flex-1 min-w-0 h-[78px] rounded-[10px] border border-[#f2f2f2] bg-white flex flex-col justify-start px-4 pt-[16px] cursor-pointer transition-all hover:bg-[#FFCFDB] hover:border-[#FFCFDB]"
              >
                <p className="text-[#333] text-[20px] font-semibold leading-[24px]">{k.value}</p>
                <p className="text-[#333] text-[12px] font-normal leading-[16px] mt-[2px]">{k.label}</p>
              </div>
            ))}
          </div>

          {/* White content area: toolbar + table + pagination */}
          <div className="flex-1 bg-white mx-5 mb-5 rounded-xl border border-[#ebebeb] overflow-hidden flex flex-col">
            <OrderListingTable
              rows={ALL_ORDERS}
              columns={columns}
              fixedColumns={fixedColumns}
              scrollableColumns={scrollableColumns}
              filterSections={filterSections}
              categoryDropdown={categoryDropdown}
              typeDropdown={typeDropdown}
              renderCell={renderCell}
              getRowKey={(row) => row.id}
              onRowClick={(row) => toast.info(`Order ${row.id} — ${row.holdType}`)}
              rowsPerPage={ROWS_PER_PAGE}
              emptyMessage="No orders match your filters"
            />
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Released Orders ──────────────────────────────────────────────────────────

const ALL_RELEASED = [
  { id: "7800028", customer: "Acme Industries Ltd",  holdType: "Credit Check Failure", value: "$210K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "ACM-POQ-9000001" },
  { id: "7800029", customer: "GlobalTech Corp",       holdType: "Invoice Hold",         value: "$85K",  title: "Standard Order",         releasedDays: "09 day's ago", poId: "GLB-POQ-9000002" },
  { id: "7800030", customer: "Metasite Inc",          holdType: "Bill Only Line Order", value: "$340K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "KTM-POQ-9000003" },
  { id: "7800031", customer: "Nexus Corp",            holdType: "Credit Check Failure", value: "$120K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "NXS-POQ-9000004" },
  { id: "7800032", customer: "Sterling & Co",         holdType: "Invoice Hold",         value: "$560K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "STR-POQ-9000005" },
  { id: "7800033", customer: "Acme Industries Ltd",  holdType: "Tax Hold",             value: "$75K",  title: "Standard Order",         releasedDays: "09 day's ago", poId: "ACM-POQ-9000006" },
  { id: "7800034", customer: "GlobalTech Corp",       holdType: "Credit Check Failure", value: "$180K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "GLB-POQ-9000007" },
  { id: "7800035", customer: "Metasite Inc",          holdType: "Invoice Hold",         value: "$95K",  title: "Standard Order",         releasedDays: "09 day's ago", poId: "KTM-POQ-9000008" },
  { id: "7800036", customer: "Nexus Corp",            holdType: "Tax Hold",             value: "$420K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "NXS-POQ-9000009" },
  { id: "7800037", customer: "Sterling & Co",         holdType: "Credit Check Failure", value: "$230K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "STR-POQ-9000010" },
  { id: "7800038", customer: "Acme Industries Ltd",  holdType: "Invoice Hold",         value: "$310K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "ACM-POQ-9000011" },
  { id: "7800039", customer: "GlobalTech Corp",       holdType: "Tax Hold",             value: "$145K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "GLB-POQ-9000012" },
  { id: "7800040", customer: "Metasite Inc",          holdType: "Credit Check Failure", value: "$670K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "KTM-POQ-9000013" },
  { id: "7800041", customer: "Nexus Corp",            holdType: "Invoice Hold",         value: "$52K",  title: "Standard Order",         releasedDays: "09 day's ago", poId: "NXS-POQ-9000014" },
  { id: "7800042", customer: "Sterling & Co",         holdType: "Tax Hold",             value: "$890K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "STR-POQ-9000015" },
  { id: "7800043", customer: "Acme Industries Ltd",  holdType: "Credit Check Failure", value: "$115K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "ACM-POQ-9000016" },
  { id: "7800044", customer: "GlobalTech Corp",       holdType: "Invoice Hold",         value: "$200K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "GLB-POQ-9000017" },
  { id: "7800045", customer: "Metasite Inc",          holdType: "Tax Hold",             value: "$330K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "KTM-POQ-9000018" },
  { id: "7800046", customer: "Nexus Corp",            holdType: "Credit Check Failure", value: "$480K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "NXS-POQ-9000019" },
  { id: "7800047", customer: "Sterling & Co",         holdType: "Invoice Hold",         value: "$160K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "STR-POQ-9000020" },
  { id: "7800048", customer: "Acme Industries Ltd",  holdType: "Tax Hold",             value: "$720K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "ACM-POQ-9000021" },
  { id: "7800049", customer: "GlobalTech Corp",       holdType: "Credit Check Failure", value: "$55K",  title: "Standard Order",         releasedDays: "09 day's ago", poId: "GLB-POQ-9000022" },
  { id: "7800050", customer: "Metasite Inc",          holdType: "Invoice Hold",         value: "$280K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "KTM-POQ-9000023" },
  { id: "7800051", customer: "Nexus Corp",            holdType: "Tax Hold",             value: "$100K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "NXS-POQ-9000024" },
  { id: "7800052", customer: "Sterling & Co",         holdType: "Credit Check Failure", value: "$390K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "STR-POQ-9000025" },
  { id: "7800053", customer: "Acme Industries Ltd",  holdType: "Invoice Hold",         value: "$240M", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "ACM-POQ-9000026" },
];

const RELEASED_ROWS_PER_PAGE = 17;

function ReleasedOrdersPage({ onLogout, onViewAllNotifications, onNavigateDashboard, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateOverview, onNavigateOrderListing, onNavigateReleasedOrders }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateDashboard: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateOverview: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const columns: OrderListingColumn[] = [
    { key: "releasedDays", label: "Status" },
    { key: "id",           label: "Order Id" },
    { key: "holdType",     label: "Hold Type" },
    { key: "customer",     label: "Customer Name" },
    { key: "poId",         label: "Customer PO ID" },
    { key: "value",        label: "Value" },
    { key: "title",        label: "Title" },
  ];

  const fixedColumns = ["Status", "Order Id", "Hold Type", "Customer Name"];
  const scrollableColumns = ["Customer PO ID", "Value", "Title"];

  const filterSections: OrderListingFilterSection<typeof ALL_RELEASED[0]>[] = [
    { key: "HoldType", label: "Hold Type", getValue: (r) => r.holdType },
    { key: "Customer", label: "Customer",  getValue: (r) => r.customer },
    { key: "Title",    label: "Title",     getValue: (r) => r.title },
  ];

  const categoryDropdown: OrderListingDropdownFilter<typeof ALL_RELEASED[0]> = {
    placeholder: "Hold Category",
    allLabel: "All Categories",
    options: ["All Categories", ...Array.from(new Set(ALL_RELEASED.map(o => o.holdType)))],
    getValue: (r) => r.holdType,
  };

  const typeDropdown: OrderListingDropdownFilter<typeof ALL_RELEASED[0]> = {
    placeholder: "Hold Type",
    allLabel: "All Types",
    options: ["All Types", ...Array.from(new Set(ALL_RELEASED.map(o => o.title)))],
    getValue: (r) => r.title,
  };

  const renderCell = (label: string, row: typeof ALL_RELEASED[0]) => {
    switch (label) {
      case "Status":
        return (
          <span className="inline-flex items-center justify-center px-2 py-1 rounded-[4px] text-[11px] font-medium whitespace-nowrap"
            style={{ color: "#10a957", backgroundColor: "rgba(16,169,87,0.1)" }}>
            Released {row.releasedDays}
          </span>
        );
      case "Order Id":        return <span className="text-[#c53e6c] text-[14px] hover:underline cursor-pointer">{row.id}</span>;
      case "Hold Type":       return <span className="text-[#333] text-[14px]">{row.holdType}</span>;
      case "Customer Name":   return <span className="text-[#333] text-[14px]">{row.customer}</span>;
      case "Customer PO ID":  return <span className="text-[#333] text-[14px] block max-w-[160px] truncate">{row.poId}</span>;
      case "Value":           return <span className="text-[#333] text-[14px] font-semibold">{row.value}</span>;
      case "Title":           return <span className="text-[#333] text-[14px]">{row.title}</span>;
      default:                return null;
    }
  };

  const renderGridItem = (row: typeof ALL_RELEASED[0]) => (
    <div className="bg-white border border-[#f2f2f2] rounded-[4px] p-4 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer">
      {/* Row 1: icon + id + menu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="shrink-0 size-[18px]">
            <svg fill="none" viewBox="0 0 18 15" className="size-full">
              <path d={releasedSvg.p3924ac80} fill="#686868" />
            </svg>
          </div>
          <span className="text-[#c53e6c] text-[14px] font-semibold hover:underline">{row.id}</span>
        </div>
        <button className="flex flex-col items-center gap-[3px] p-1 rounded hover:bg-[#f5f5f5] cursor-pointer transition-colors"
          onClick={e => { e.stopPropagation(); toast.info("Order actions"); }}>
          {[0, 1, 2].map(i => (
            <svg key={i} fill="none" viewBox="0 0 4 4" className="size-[4px]">
              <path d={releasedSvg.p20a3a900} fill="#686868" />
            </svg>
          ))}
        </button>
      </div>

      {/* Row 2: company + value */}
      <div className="flex items-center justify-between">
        <span className="text-[#686868] text-[13px] truncate max-w-[65%]">{row.customer}</span>
        <span className="text-[#333] text-[14px] font-bold">{row.value}</span>
      </div>

      {/* Row 3: hold type + released badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[#686868] text-[12px] font-medium truncate">{row.holdType}</span>
        <span className="shrink-0 px-2 py-1 rounded-[4px] text-[11px] font-medium whitespace-nowrap"
          style={{ color: "#10a957", backgroundColor: "rgba(16,169,87,0.1)" }}>
          Released {row.releasedDays}
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f5f6fa] flex size-full min-h-screen">
      <NavDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
        onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
        onNavigateHoldManagementOverview={onNavigateOverview}
        onNavigateOrderListing={onNavigateOrderListing}
        onNavigateReleasedOrders={onNavigateReleasedOrders}
      />

      <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-auto">
        <AppHeader
          onMenuClick={() => setSidebarOpen(true)}
          activeNav="Hold Management"
          activeSub="Released Orders"
          onViewAllNotifications={onViewAllNotifications}
          onNavigateDashboard={onNavigateDashboard}
        />

        <main className="flex-1 px-5 py-5 flex flex-col">
          {/* Page header */}
          <div className="flex items-center gap-3 mb-4">

          </div>

          {/* White card containing toolbar + content + pagination */}
          <div className="flex-1 bg-white mx-0 mb-0 rounded-xl border border-[#ebebeb] overflow-hidden flex flex-col">
            <OrderListingTable
              rows={ALL_RELEASED}
              columns={columns}
              fixedColumns={fixedColumns}
              scrollableColumns={scrollableColumns}
              filterSections={filterSections}
              categoryDropdown={categoryDropdown}
              typeDropdown={typeDropdown}
              renderCell={renderCell}
              getRowKey={(row) => row.id}
              rowsPerPage={RELEASED_ROWS_PER_PAGE}
              showSpacer={false}
              renderGridItem={renderGridItem}
              defaultView="grid"
              toolbarExtra={(
                <div className="content-stretch flex items-center relative shrink-0">
                  <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                    <button onClick={() => toast.success("Download started")}
                      className="bg-white border border-[#d1d1d1] border-solid col-start-1 ml-0 mt-0 relative rounded-[4px] row-start-1 size-[36px] cursor-pointer hover:bg-[#f8fafc] transition-colors" />
                    <div className="col-start-1 ml-[8px] mt-[8px] relative row-start-1 size-[20px] pointer-events-none">
                      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.5 15.625">
                        <path d={releasedSvg.p15e5a800} fill="#c53e6c" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              gridViewIcon={(active) => (
                <svg fill="none" viewBox="0 0 17 17" className="size-[18px]">
                  <path d={releasedSvg.p2868a700} fill={active ? "#90003b" : "#686868"} />
                </svg>
              )}
              listViewIcon={(active) => (
                <svg fill="none" viewBox="0 0 17 12" className="size-[18px]">
                  <path d={releasedSvg.p1baef080} fill={active ? "#90003b" : "#686868"} />
                </svg>
              )}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Order Details ────────────────────────────────────────────────────────────

const HOLD_ROWS = [
  { id: 1, name: "CIA Hold",            category: "Financial",  level: "Header", workflow: "Immediate", owner: "CSR",         impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: true },
  { id: 2, name: "Shipping Line Hold",  category: "Factory",    level: "Header", workflow: "Pick",      owner: "Factory",     impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: false },
  { id: 3, name: "Lorem Ipsum",         category: "Forecast",   level: "Header", workflow: "Immediate", owner: "CSR",         impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: false },
  { id: 4, name: "Lorem Ipsum",         category: "Framework",  level: "Header", workflow: "Immediate", owner: "CSR",         impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: false },
  { id: 5, name: "Bill Only Line Order",category: "Folio",      level: "Metasite Inc", workflow: "Immediate", owner: "CSR",   impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: false },
  { id: 6, name: "Bill Only Line Order",category: "Fusion",     level: "Metasite Inc", workflow: "Immediate", owner: "CSR",   impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: false },
  { id: 7, name: "Bill Only Line Order",category: "Frontier",   level: "Metasite Inc", workflow: "Immediate", owner: "CSR",   impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: false },
];

const AUDIT_NOTES = [
  {
    id: 1,
    date: "19/05/2026",
    ago: "1 day ago",
    agent: "CSR Agent 001",
    agentColor: "#c53e6c",
    dotColor: "#3b82f6",
    text: "BIZ: SI\nFE/AE/PM: Brenden Kirby /Jouni Lantto/\nSol.Sp: Sari Pellinen\nTarget Acceptance Date: May26\nServices A/W Approval: May26\nAcceptance Criteria: Acceptance of standard products upon delivery / Acceptance of custom HW items upon commissioning / Services upon completion. Where acceptance is delayed by Volvo by 30 days or more following notification by Keysight that the Solution is ready for acceptance test, then custom HW and SW items shall be deemed accepted on the 31st day following such notice.",
  },
  {
    id: 2,
    date: "19/05/2026",
    ago: "10 days ago",
    agent: "CSR Agent 001",
    agentColor: "#c53e6c",
    dotColor: "#3b82f6",
    text: "Lines showing in RMT hold management as SSD < 5 days - all lines are IM1 - not taking any action.",
  },
  {
    id: 3,
    date: "02/02/2026",
    ago: "1 day ago",
    agent: "CSR Agent 002",
    agentColor: "#c53e6c",
    dotColor: "#16a34a",
    text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500sLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s",
  },
];

const HOLD_COLUMNS = ["Hold Name", "Category", "Level/Line", "Workflow", "Owner", "Impact", "ERD", "Notes Preview", "Action"];
const HOLD_FILTER_SECTIONS = [
  { key: "Category",  label: "Category",  options: { Financial: 2, Factory: 1, Forecast: 1, Framework: 1, Folio: 1, Fusion: 1 } },
  { key: "Level",     label: "Level/Line",options: { Header: 4, "Metasite Inc": 3 } },
  { key: "Workflow",  label: "Workflow",  options: { Immediate: 5, Pick: 1 } },
  { key: "Owner",     label: "Owner",     options: { CSR: 5, Factory: 1, "CSR Factory": 1 } },
  { key: "Impact",    label: "Impact",    options: { Ship: 7 } },
];

function OrderDetailsPage({ orderId, onLogout, onViewAllNotifications, onNavigateDashboard, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateOverview, onNavigateOrderListing, onNavigateReleasedOrders }: {
  orderId: string;
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateDashboard: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateOverview: () => void;
  onNavigateOrderListing: () => void;
  onNavigateReleasedOrders?: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [activeTab, setActiveTab] = useState<"notes" | "audit" | "escalations">("notes");
  const [sortBy, setSortBy] = useState("Aging");
  const [erdValues, setErdValues] = useState<Record<number, string>>({});
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [colMgmtOpen, setColMgmtOpen] = useState(false);
  const [activeColTab, setActiveColTab] = useState<"fixed" | "scrollable" | "sort">("fixed");
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(HOLD_COLUMNS));
  const [tempVisibleCols, setTempVisibleCols] = useState<Set<string>>(new Set(HOLD_COLUMNS));
  const [colSortOrder, setColSortOrder] = useState<string[]>(HOLD_COLUMNS);
  const [tempColSortOrder, setTempColSortOrder] = useState<string[]>(HOLD_COLUMNS);
  const [dragColIdx, setDragColIdx] = useState<number | null>(null);
  const [dragOverColIdx, setDragOverColIdx] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("Category");
  const [checkedFilters, setCheckedFilters] = useState<Record<string, Set<string>>>({});
  const holdFixedCols = ["Hold Name", "Category", "Level/Line", "Workflow"];
  const holdScrollableCols = ["Owner", "Impact", "ERD", "Notes Preview", "Action"];

  const toggleHoldFilter = (section: string, value: string) => {
    setCheckedFilters(prev => {
      const next = { ...prev };
      const set = new Set(next[section] ?? []);
      if (set.has(value)) set.delete(value); else set.add(value);
      next[section] = set;
      return next;
    });
  };

  const resetHoldFilters = () => setCheckedFilters({});

  const filteredHoldRows = HOLD_ROWS.filter(r => {
    return HOLD_FILTER_SECTIONS.every(sec => {
      const sel = checkedFilters[sec.key];
      if (!sel || sel.size === 0) return true;
      const val = sec.key === "Category" ? r.category : sec.key === "Level" ? r.level : sec.key === "Workflow" ? r.workflow : sec.key === "Owner" ? r.owner : sec.key === "Impact" ? r.impact : null;
      return val ? sel.has(val) : true;
    });
  });

  const order = ALL_ORDERS.find(o => o.id === orderId) ?? ALL_ORDERS[0];

  return (
    <div className="bg-[#f5f6fa] flex size-full min-h-screen">
      <NavDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
        onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
        onNavigateHoldManagementOverview={onNavigateOverview}
        onNavigateOrderListing={onNavigateOrderListing}
        onNavigateReleasedOrders={onNavigateReleasedOrders}
      />

      <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-auto">
        {/* Header */}
        <AppHeader
          onMenuClick={() => setSidebarOpen(true)}
          activeNav="Hold Management"
          activeSub="Order Listing"
          onViewAllNotifications={onViewAllNotifications}
          onNavigateDashboard={onNavigateDashboard}
        />

        <main className="flex-1 flex flex-col">

          {/* Order Banner */}
          <div className="bg-[#f1f5f9] px-5 py-[10px] border-b border-[#e2e8f0] shrink-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-[5px] mb-[6px]">
              <button onClick={onNavigateOrderListing} className="text-[#cd1453] text-[12px] cursor-pointer hover:underline bg-transparent border-0 p-0">
                Order Listing
              </button>
              <svg fill="none" viewBox="0 0 12 12" className="size-[10px] shrink-0">
                <path clipRule="evenodd" d={detailsSvg.p39b4900} fill="#cd1453" fillRule="evenodd" />
              </svg>
              <span className="text-[#cd1453] text-[12px]">#{orderId}</span>
            </div>

            {/* Title row */}
            <div className="flex items-center gap-[8px] mb-[4px]">
              <span className="font-bold text-[#333] text-[24px] leading-[28px]">Order #{orderId}</span>
              <span className="inline-flex items-center px-[6px] py-[3px] rounded-[4px] text-[9px] font-medium"
                style={{ color: "#dc2626", backgroundColor: "rgba(220,38,38,0.1)" }}>
                {order.status === "Breached" ? "Breached" : order.status === "At Risk" ? "At Risk" : "On Track"}
              </span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-[8px] flex-wrap">
              {["DataCorp APAC", "Shipment-impacting", "High Priority", "Waiting for Cash in Advance"].map((tag, i) => (
                <div key={i} className="flex items-center gap-[8px]">
                  <span className="text-[#637590] text-[12px] font-medium tracking-[0.48px]">{tag}</span>
                  {i < 3 && <div className="bg-[#e5e8ec] h-[16px] w-px" />}
                </div>
              ))}
            </div>
          </div>

          {/* Metrics bar */}
          <div className="bg-white border-b border-[#f2f2f2] shrink-0">
            <div className="flex items-center gap-0 px-5 py-[16px] flex-wrap">
              {[
                { label: "ACCOUNT",         value: "Test Solutions OOD" },
                { label: "OU",              value: "ROC EUROPE" },
                { label: "ORDER LINES",     value: "05" },
                { label: "EARLIEST SSD",    value: "Jan 16 (+1d)" },
                { label: "AGING",           value: "7 days" },
                { label: "ORDER VALUE (USD)", value: "$890K" },
              ].map((item, i) => (
                <div key={i} className="flex items-start pr-[20px] mr-[20px] border-r border-[#e5e8ec] last:border-r-0 last:mr-0">
                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[#94a3b8] text-[9px] font-normal uppercase">{item.label}</span>
                    <span className="text-[#0f172a] text-[18px] font-bold whitespace-nowrap">{item.value}</span>
                  </div>
                </div>
              ))}
              {/* Follow-Up Date dropdown */}
              <div className="ml-auto">
                <div className="h-[36px] relative w-[204px]">
                  <div className="absolute bg-white border border-[#d1d1d1] h-[36px] left-0 right-0 rounded-[4px] top-0" />
                  <div className="absolute flex items-center justify-between left-[9px] right-[8px] top-[8px] pointer-events-none">
                    <span className="text-[#333] text-[14px]">Follow-Up Date</span>
                    <div className="relative shrink-0 size-[16px]">
                      <div className="absolute bottom-1/4 flex items-center justify-center left-[18.75%] right-[18.75%] top-[12.5%]" style={{ containerType: "size" }}>
                        <div className="-rotate-180 -scale-x-100 flex-none h-[100cqh] w-[100cqw]">
                          <div className="relative size-full">
                            <div className="absolute bottom-1/4 left-[6.7%] right-[6.7%] top-0">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.66026 7.5">
                                <path d={detailsSvg.p2c884700} fill="#686868" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 px-5 py-5 flex flex-col gap-5">

            {/* Hold Listings card */}
            <div className="bg-white rounded-xl border border-[#ebebeb] overflow-hidden flex flex-col">

              {/* Page header */}
              <div className="flex items-center justify-between px-5 h-[56px] border-b border-[#f2f2f2] shrink-0">
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[#0f172a] text-[20px] font-semibold">Hold Listings</span>
                  <div className="flex items-center gap-[7px]">
                    <span className="text-[#64748b] text-[12px]">04 Holds</span>
                    <div className="bg-[#e2e8f0] h-[12px] w-px" />
                    <div className="flex items-center gap-[6px]">
                      <svg fill="none" viewBox="0 0 6 6" className="size-[6px] shrink-0">
                        <circle cx="3" cy="3" fill="#DC2626" r="3" />
                      </svg>
                      <span className="text-[#dc2626] text-[12px]">0 Escalations</span>
                    </div>
                    <div className="bg-[#e2e8f0] h-[12px] w-px" />
                    <span className="text-[#64748b] text-[12px]">0 Follow-ups</span>
                    <div className="bg-[#e2e8f0] h-[12px] w-px" />
                    <span className="text-[#64748b] text-[12px]">Lorem Epsum</span>
                  </div>
                </div>
                <div className="flex items-center gap-[12px]">
                  <div className="flex items-center gap-[6px]">
                    <div className="size-[8px] rounded-full bg-[#16a34a]" />
                    <span className="text-[#94a3b8] text-[11px]">Last synced 10:45 AM</span>
                  </div>
                  <button onClick={() => toast.success("Exporting...")}
                    className="flex items-center gap-[6px] h-[32px] px-[10px] bg-white border border-[#e0e5ed] rounded-[4px] text-[#64748b] text-[12px] font-medium hover:bg-[#f8fafc] cursor-pointer transition-colors">
                    <svg fill="none" viewBox="0 0 13 11" className="size-[14px] shrink-0">
                      <path clipRule="evenodd" d={detailsSvg.p3615000} fill="#64748B" fillRule="evenodd" />
                    </svg>
                    Export
                  </button>
                </div>
              </div>

              {/* Summary stat cards */}
              <div className="grid grid-cols-4 gap-4 px-5 py-4 border-b border-[#f2f2f2] shrink-0">
                {[
                  { value: "02", label: "Holds Summary",   bg: "white",    border: true },
                  { value: "02", label: "Actionability",   bg: "#FFCFDB",  border: false },
                  { value: "-",  label: "ERD / NEXT DATE", bg: "white",    border: true },
                  { value: "CSR Factory", label: "OWNERS INVOLVED", bg: "white", border: true },
                ].map((card, i) => (
                  <div key={i} className="rounded-[10px] h-[78px] relative"
                    style={{ background: card.bg, border: card.border ? "1px solid #F2F2F2" : "none" }}>
                    <div className="absolute left-[16px] top-[16px] flex flex-col gap-0">
                      <span className="text-[#333] text-[24px] font-bold leading-[28px]">{card.value}</span>
                      <span className="text-[#333] text-[14px]">{card.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table toolbar */}
              <div className="flex items-center justify-between px-5 py-[10px] border-b border-[#f2f2f2] shrink-0">
                <span className="text-[#686868] text-[14px]">
                  Displaying {filteredHoldRows.length} of {HOLD_ROWS.length} (Holds)
                </span>
                <div className="flex items-center gap-[16px]">
                  {/* Filter */}
                  <div className="content-stretch flex items-center relative shrink-0">
                    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                      <button onClick={() => { setFilterPanelOpen(o => !o); if (colMgmtOpen) setColMgmtOpen(false); }}
                        className={`border border-solid col-start-1 ml-0 mt-0 relative rounded-[4px] row-start-1 size-[36px] cursor-pointer transition-colors ${filterPanelOpen ? "bg-[#c53e6c] border-[#c53e6c] hover:bg-[#a0334f]" : "bg-white border-[#d1d1d1] hover:bg-[#f8fafc]"}`} />
                      <div className="col-start-1 ml-[8px] mt-[8px] relative row-start-1 size-[20px] pointer-events-none">
                        <div className="absolute inset-[9.38%_6.17%]">
                          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.5332 16.25">
                            <path d={detailsSvg.pa7c72c0} fill={filterPanelOpen ? "white" : "#686868"} />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Columns */}
                  <div className="content-stretch flex items-center relative shrink-0">
                    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                      <button onClick={() => { const opening = !colMgmtOpen; setColMgmtOpen(opening); if (opening) { setTempVisibleCols(new Set(visibleCols)); setTempColSortOrder([...colSortOrder]); if (filterPanelOpen) setFilterPanelOpen(false); } }}
                        className={`border border-solid col-start-1 ml-0 mt-0 relative rounded-[4px] row-start-1 size-[36px] cursor-pointer transition-colors ${colMgmtOpen ? "bg-[#c53e6c] border-[#c53e6c] hover:bg-[#a0334f]" : "bg-white border-[#d1d1d1] hover:bg-[#f8fafc]"}`} />
                      <div className="col-start-1 ml-[8px] mt-[8px] relative row-start-1 size-[20px] pointer-events-none">
                        <div className="absolute inset-[12.5%_9.38%_68.75%_9.38%]">
                          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.25 3.75">
                            <path clipRule="evenodd" d={detailsSvg.p3a37c600} fill={colMgmtOpen ? "white" : "#686868"} fillRule="evenodd" />
                          </svg>
                        </div>
                        <div className="absolute inset-[68.75%_9.38%_12.5%_9.38%]">
                          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.25 3.75">
                            <path clipRule="evenodd" d={detailsSvg.p1f91c200} fill={colMgmtOpen ? "white" : "#686868"} fillRule="evenodd" />
                          </svg>
                        </div>
                        <div className="absolute inset-[40.63%_9.38%]">
                          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.25 3.75">
                            <path clipRule="evenodd" d={detailsSvg.p1cea6fc0} fill={colMgmtOpen ? "white" : "#686868"} fillRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table + slide-in panels — same pattern as Order Listing */}
              <div className="flex-1 relative overflow-hidden" style={{ minHeight: 320 }}>
                <div className="absolute inset-0 overflow-x-auto overflow-y-auto">
                  <table className="w-full border-collapse" style={{ minWidth: 1000 }}>
                    <thead>
                      <tr className="bg-[#fafafa] border-b border-[#f2f2f2]">
                        <th className="w-[42px] px-4 py-3">
                          <button
                            onClick={() => {
                              const allIds = filteredHoldRows.map(r => r.id);
                              const allChecked = allIds.every(id => checkedRows.has(id));
                              setCheckedRows(allChecked ? new Set() : new Set(allIds));
                            }}
                            className="relative size-[18px] cursor-pointer bg-transparent border-0 p-0 block">
                            <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                              <path d={detailsSvg.p20ccab72}
                                fill={filteredHoldRows.length > 0 && filteredHoldRows.every(r => checkedRows.has(r.id)) ? "#90003B" : "white"}
                                stroke={filteredHoldRows.length > 0 && filteredHoldRows.every(r => checkedRows.has(r.id)) ? "#90003B" : "#686868"}
                                strokeWidth="2" />
                            </svg>
                            {filteredHoldRows.length > 0 && filteredHoldRows.every(r => checkedRows.has(r.id)) && (
                              <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                                <path d={filterSvg.p19f1000} fill="white" transform="translate(5.6, 6.8)" />
                              </svg>
                            )}
                          </button>
                        </th>
                        {HOLD_COLUMNS.filter(c => visibleCols.has(c)).map(col => (
                          <th key={col} className="text-left px-3 py-3 text-[14px] font-semibold text-[#333] whitespace-nowrap">
                            <div className="flex items-center gap-[6px]">
                              {col}
                              {(col === "Hold Name" || col === "Category") && (
                                <div className="flex items-center">
                                  <svg fill="none" viewBox="0 0 20 20" className="size-[20px]">
                                    <path d={detailsSvg.p2036a600} fill="#C53E6C" fillRule="evenodd" clipRule="evenodd" />
                                    <path d={detailsSvg.p3877f700} fill="#C53E6C" fillRule="evenodd" clipRule="evenodd" />
                                    <path d={detailsSvg.p16855600} fill="#C53E6C" fillRule="evenodd" clipRule="evenodd" />
                                    <path d={detailsSvg.p47c540} fill="#C53E6C" fillRule="evenodd" clipRule="evenodd" />
                                    <circle cx="10" cy="10" fill="#C53E6C" r="4.16667" />
                                  </svg>
                                  <svg fill="none" viewBox="0 0 20 20" className="size-[20px]">
                                    <path d={detailsSvg.p22cdbb20} fill="#EBEBEB" />
                                    <path d={detailsSvg.p12f4dc00} fill="#EBEBEB" />
                                  </svg>
                                </div>
                              )}
                              {col === "Action" && <div className="size-[6px] rounded-full bg-[#c53e6c]" />}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHoldRows.length === 0 ? (
                        <tr><td colSpan={visibleCols.size + 1} className="text-center py-12 text-[#9ca3af] text-[14px]">No holds match your filters</td></tr>
                      ) : filteredHoldRows.map((row, idx) => (
                        <tr key={row.id} className={`border-b border-[#f8f8f8] hover:bg-[#fdf5f8] transition-colors ${idx % 2 === 1 ? "bg-[#fafcff]" : "bg-white"}`}>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => setCheckedRows(prev => { const n = new Set(prev); n.has(row.id) ? n.delete(row.id) : n.add(row.id); return n; })}
                              className="relative size-[18px] cursor-pointer bg-transparent border-0 p-0 block">
                              <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                                <path d={detailsSvg.p20ccab72} fill={checkedRows.has(row.id) ? "#90003B" : "white"} stroke={checkedRows.has(row.id) ? "#90003B" : "#686868"} strokeWidth="2" />
                              </svg>
                              {checkedRows.has(row.id) && (
                                <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                                  <path d={filterSvg.p19f1000} fill="white" transform="translate(5.6, 6.8)" />
                                </svg>
                              )}
                            </button>
                          </td>
                          {visibleCols.has("Hold Name")     && <td className="px-3 py-2 text-[#686868] text-[14px] whitespace-nowrap">{row.name}</td>}
                          {visibleCols.has("Category")      && <td className="px-3 py-2 text-[#c53e6c] text-[14px] whitespace-nowrap cursor-pointer hover:underline">{row.category}</td>}
                          {visibleCols.has("Level/Line")    && <td className="px-3 py-2 text-[#686868] text-[14px] whitespace-nowrap">{row.level}</td>}
                          {visibleCols.has("Workflow")      && <td className="px-3 py-2 text-[#686868] text-[14px] whitespace-nowrap">{row.workflow}</td>}
                          {visibleCols.has("Owner")         && <td className="px-3 py-2 text-[#686868] text-[14px] whitespace-nowrap">{row.owner}</td>}
                          {visibleCols.has("Impact")        && <td className="px-3 py-2 text-[#686868] text-[14px] whitespace-nowrap">{row.impact}</td>}
                          {visibleCols.has("ERD")           && (
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1 h-[36px] w-[140px] bg-white border border-[#d1d1d1] rounded-[4px] px-2">
                                <input
                                  type="text"
                                  placeholder="dd-mm-yyyy"
                                  value={erdValues[row.id] ?? ""}
                                  onChange={e => setErdValues(prev => ({ ...prev, [row.id]: e.target.value }))}
                                  className="flex-1 text-[12px] text-[#686868] outline-none border-0 bg-transparent placeholder-[#b0b0b0]"
                                />
                                <svg fill="none" viewBox="0 0 13 13" className="size-[13px] shrink-0 opacity-50">
                                  <path d={detailsSvg.p5ec9770} fill="#686868" />
                                </svg>
                              </div>
                            </td>
                          )}
                          {visibleCols.has("Notes Preview") && <td className="px-3 py-2 text-[#686868] text-[14px] max-w-[180px] truncate">{row.notes}</td>}
                          {visibleCols.has("Action")        && (
                            <td className="px-3 py-2">
                              {row.hasRelease ? (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => toast.success(`Hold "${row.name}" released`)}
                                    className="flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 hover:opacity-80 transition-opacity">
                                    <svg fill="none" viewBox="0 0 14 11" className="size-[14px] shrink-0">
                                      <path d={detailsSvg.p3c34800} fill="#16a34a" />
                                    </svg>
                                    <span className="text-[#16a34a] text-[12px] font-medium">Release</span>
                                  </button>
                                  <button onClick={() => toast.info("Saving hold...")}
                                    className="size-[28px] flex items-center justify-center rounded border border-[#e0e5ed] bg-white hover:bg-[#f8fafc] cursor-pointer transition-colors">
                                    <svg fill="none" viewBox="0 0 13 11" className="size-[13px]">
                                      <path d={detailsSvg.p3371a100} fill="#64748b" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => toast.info("Saving hold...")}
                                  className="size-[28px] flex items-center justify-center rounded border border-[#e0e5ed] bg-white hover:bg-[#f8fafc] cursor-pointer transition-colors">
                                  <svg fill="none" viewBox="0 0 13 11" className="size-[13px]">
                                    <path d={detailsSvg.p3371a100} fill="#64748b" />
                                  </svg>
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Filter Panel */}
                <div className={`absolute top-0 right-0 bottom-0 w-[340px] bg-white border-l border-[#f2f2f2] z-20 flex flex-col transition-transform duration-300 ease-in-out ${filterPanelOpen ? "translate-x-0" : "translate-x-full"}`}>
                  <div className="h-[48px] relative shrink-0 border-b border-[#f2f2f2] flex items-center">
                    <p className="absolute font-bold leading-[21px] left-[16px] text-[#333] text-[16px]">Filters</p>
                    <div className="absolute flex gap-[12px] items-center right-[16px]">
                      <button onClick={resetHoldFilters} className="relative shrink-0 size-[20px] cursor-pointer hover:opacity-70 transition-opacity" title="Reset filters">
                        <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 16.25 16.25">
                          <path d={filterSvg.p27f29300} fill="#686868" />
                        </svg>
                      </button>
                      <div className="w-px h-[16px] bg-[#d1d1d1] shrink-0" />
                      <button onClick={() => setFilterPanelOpen(false)} className="relative shrink-0 size-[20px] cursor-pointer hover:opacity-70 transition-opacity">
                        <div className="absolute inset-[15.63%]">
                          <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 13.75 13.75">
                            <path d={filterSvg.p34eead00} fill="#686868" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {HOLD_FILTER_SECTIONS.map(sec => {
                      const isOpen = expandedSection === sec.key;
                      const selected = checkedFilters[sec.key];
                      const selCount = selected?.size ?? 0;
                      const opts = Object.entries(sec.options).sort((a, b) => b[1] - a[1]);
                      const hasSelections = selCount > 0;
                      return (
                        <div key={sec.key}>
                          <div
                            className={`h-[48px] overflow-clip relative shrink-0 w-full border-b border-[#f2f2f2] cursor-pointer flex items-center px-[16px] ${hasSelections ? "bg-[#fff0f3]" : "bg-white"}`}
                            onClick={() => setExpandedSection(isOpen ? null : sec.key)}>
                            <div className="flex-1 overflow-hidden pr-[8px]">
                              {hasSelections ? (
                                <p className="text-[14px] leading-[20px] whitespace-nowrap overflow-hidden text-ellipsis">
                                  <span className="text-[#90003b]">{sec.label} (</span>
                                  <span className="text-[#90003b] font-bold">{selCount}</span>
                                  <span className="text-[#686868]">/{opts.length})</span>
                                </p>
                              ) : (
                                <p className="text-[14px] leading-[20px] whitespace-nowrap overflow-hidden text-ellipsis">
                                  <span className={isOpen ? "text-[#90003b]" : "text-[#333]"}>{sec.label} </span>
                                  <span className="text-[#686868]">({opts.length})</span>
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 size-[16px] flex items-center justify-center">
                              <svg className={`transition-transform duration-200 ${isOpen ? "rotate-90" : "rotate-0"}`} width="7" height="13" viewBox="0 0 7.207 13" fill="none">
                                <path d={filterSvg.p374d42f0} fill={hasSelections || isOpen ? "#90003B" : "#686868"} />
                              </svg>
                            </div>
                          </div>
                          {isOpen && (
                            <div>
                              {selCount > 0 && (
                                <div className="flex items-center justify-between px-[16px] py-[7px] border-b border-[#f2f2f2] min-h-[32px]">
                                  <div className="bg-[#f2f2f2] flex gap-[4px] items-center px-[6px] py-[3px] rounded-[4px] shrink-0">
                                    <p className="font-normal leading-[16px] text-[#686868] text-[10px] whitespace-nowrap">{String(selCount).padStart(2, "0")} Selected</p>
                                    <button onClick={e => { e.stopPropagation(); setCheckedFilters(p => ({ ...p, [sec.key]: new Set() })); }}
                                      className="relative size-[12px] shrink-0 cursor-pointer flex items-center justify-center">
                                      <svg width="8.25" height="8.25" viewBox="0 0 8.25 8.25" fill="none">
                                        <path d={filterSvg.p1ac2d400} fill="#686868" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-[8px] px-[16px] py-[10px] border-b border-[#f2f2f2] cursor-pointer bg-white hover:bg-[#f8fafc]"
                                onClick={() => {
                                  const allKeys = opts.map(([k]) => k);
                                  const allSelected = allKeys.every(k => selected?.has(k));
                                  setCheckedFilters(p => ({ ...p, [sec.key]: allSelected ? new Set() : new Set(allKeys) }));
                                }}>
                                <div className="relative shrink-0 size-[20px]">
                                  <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                                    <path d={filterSvg.p20ccab72} fill="white" stroke="#686868" strokeWidth="2" />
                                  </svg>
                                </div>
                                <p className="font-normal leading-[20px] text-[#686868] text-[14px]">Select All</p>
                              </div>
                              {opts.map(([optVal, count]) => {
                                const checked = selected?.has(optVal) ?? false;
                                return (
                                  <div key={optVal}
                                    className={`flex items-center justify-between px-[16px] py-[10px] border-b border-[#f2f2f2] cursor-pointer ${checked ? "bg-[#ffe8e8]" : "bg-white hover:bg-[#f8fafc]"}`}
                                    onClick={() => toggleHoldFilter(sec.key, optVal)}>
                                    <div className="flex gap-[8px] items-center min-w-0">
                                      <div className="inline-grid place-items-start relative shrink-0 size-[20px]">
                                        <div className="col-start-1 row-start-1 relative size-[20px]">
                                          <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                                            <path d={filterSvg.p20ccab72} fill={checked ? "#90003B" : "white"} stroke={checked ? "#90003B" : "#686868"} strokeWidth="2" />
                                          </svg>
                                        </div>
                                        {checked && (
                                          <div className="col-start-1 row-start-1 ml-[5px] mt-[6px] relative size-[10px]">
                                            <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 8.75 6.37937">
                                              <path clipRule="evenodd" d={filterSvg.p19f1000} fill="white" fillRule="evenodd" />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                      <p className={`font-normal leading-[20px] text-[14px] truncate ${checked ? "text-[#333]" : "text-[#686868]"}`}>{optVal}</p>
                                    </div>
                                    <div className="bg-[#ebebeb] flex h-[18px] items-center px-[8px] rounded-[40px] shrink-0 ml-[8px]">
                                      <p className="font-normal leading-[18px] text-[#686868] text-[12px]">{String(count).padStart(2, "0")}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column Management Panel */}
                <div className={`absolute top-0 right-0 bottom-0 w-[420px] bg-white border-l border-[#f2f2f2] z-30 flex flex-col transition-transform duration-300 ease-in-out ${colMgmtOpen ? "translate-x-0" : "translate-x-full"}`}>
                  <div className="h-[48px] shrink-0 border-b border-[#f2f2f2] flex items-center px-[16px]">
                    <p className="font-bold leading-[21px] text-[#333] text-[16px] flex-1">Column Mgmt</p>
                    <button onClick={() => setColMgmtOpen(false)} className="relative shrink-0 size-[20px] cursor-pointer hover:opacity-70 transition-opacity">
                      <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 13.75 13.75">
                        <path d={filterSvg.p34eead00} fill="#686868" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex shrink-0 border-b border-[#f2f2f2]">
                    {(["fixed", "scrollable", "sort"] as const).map(tab => {
                      const labels = { fixed: "Fixed Columns", scrollable: "Scrollable Columns", sort: "Sort Columns" };
                      const active = activeColTab === tab;
                      return (
                        <button key={tab} onClick={() => setActiveColTab(tab)}
                          className="flex-1 flex flex-col items-center pt-[10px] pb-0 cursor-pointer transition-colors">
                          <span className={`text-[12px] font-medium pb-[8px] whitespace-nowrap ${active ? "text-[#90003b]" : "text-[#686868]"}`}>{labels[tab]}</span>
                          <div className={`h-[2px] w-full ${active ? "bg-[#90003b]" : "bg-transparent"}`} />
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {activeColTab !== "sort" && (
                      <div className="w-full">
                        {activeColTab === "fixed" && (
                          <div className="px-[16px] py-[8px] border-b border-[#f2f2f2] bg-[#fdf5f8]">
                            <p className="text-[11px] text-[#90003b]">
                              {holdFixedCols.filter(c => tempVisibleCols.has(c)).length}/4 fixed columns selected (max 4)
                            </p>
                          </div>
                        )}
                        {(activeColTab === "fixed" ? holdFixedCols : holdScrollableCols).map(col => {
                          const checked = tempVisibleCols.has(col);
                          const fixedCheckedCount = holdFixedCols.filter(c => tempVisibleCols.has(c)).length;
                          const atMax = activeColTab === "fixed" && !checked && fixedCheckedCount >= 4;
                          return (
                            <button key={col} onClick={() => {
                              if (atMax) { toast.warning("Maximum 4 fixed columns allowed"); return; }
                              setTempVisibleCols(prev => { const next = new Set(prev); checked ? next.delete(col) : next.add(col); return next; });
                            }} className={`flex gap-[12px] items-center w-full px-[16px] py-[10px] transition-colors cursor-pointer text-left border-b border-[#f2f2f2] ${atMax ? "opacity-50" : "hover:bg-[#faf5f7]"}`}>
                              <div className="relative shrink-0 size-[18px]">
                                <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                                  <path d={filterSvg.p20ccab72} fill={checked ? "#90003B" : "white"} stroke={checked ? "#90003B" : "#686868"} strokeWidth="1.5" />
                                </svg>
                                {checked && (
                                  <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 20 20">
                                    <path d={filterSvg.p19f1000} fill="white" transform="translate(5.6, 6.8)" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-[14px] leading-[20px] ${checked ? "text-[#333] font-medium" : "text-[#686868]"}`}>{col}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {activeColTab === "sort" && (
                      <div className="w-full">
                        <div className="px-[16px] py-[8px] border-b border-[#f2f2f2] bg-[#fdf5f8]">
                          <p className="text-[11px] text-[#686868]">Drag rows to reorder columns in the table</p>
                        </div>
                        {tempColSortOrder.map((col, idx) => (
                          <div key={col}
                            draggable
                            onDragStart={() => setDragColIdx(idx)}
                            onDragOver={e => { e.preventDefault(); setDragOverColIdx(idx); }}
                            onDrop={() => {
                              if (dragColIdx === null || dragColIdx === idx) return;
                              const next = [...tempColSortOrder];
                              const [moved] = next.splice(dragColIdx, 1);
                              next.splice(idx, 0, moved);
                              setTempColSortOrder(next);
                              setDragColIdx(null); setDragOverColIdx(null);
                            }}
                            onDragEnd={() => { setDragColIdx(null); setDragOverColIdx(null); }}
                            className={`flex gap-[11px] items-center px-[16px] py-[10px] cursor-grab active:cursor-grabbing transition-colors border-b border-[#f2f2f2] ${dragOverColIdx === idx && dragColIdx !== idx ? "bg-[#faf5f7] border-t-2 border-t-[#c53e6c]" : "hover:bg-[#faf5f7]"}`}>
                            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                              <div className="bg-[#d9d9d9] col-start-1 ml-0 mt-0 relative rounded-[2px] row-start-1 size-[3px]" />
                              <div className="bg-[#d9d9d9] col-start-1 ml-0 mt-[5px] relative rounded-[2px] row-start-1 size-[3px]" />
                              <div className="bg-[#d9d9d9] col-start-1 ml-0 mt-[10px] relative rounded-[2px] row-start-1 size-[3px]" />
                              <div className="bg-[#d9d9d9] col-start-1 ml-[5px] mt-[10px] relative rounded-[2px] row-start-1 size-[3px]" />
                              <div className="bg-[#d9d9d9] col-start-1 ml-[5px] mt-[5px] relative rounded-[2px] row-start-1 size-[3px]" />
                              <div className="bg-[#d9d9d9] col-start-1 ml-[5px] mt-0 relative rounded-[2px] row-start-1 size-[3px]" />
                            </div>
                            <span className="text-[14px] text-[#333] leading-[20px] flex-1">{col}</span>
                            <span className="text-[11px] text-[#aaa]">{idx + 1}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 border-t border-[#f2f2f2] flex justify-end gap-[8px] px-[16px] py-[12px]">
                    <button onClick={() => { setTempVisibleCols(new Set(visibleCols)); setTempColSortOrder([...colSortOrder]); setColMgmtOpen(false); }}
                      className="px-[14px] py-[6px] rounded-[4px] border border-[#c53e6c] text-[#c53e6c] text-[13px] font-medium cursor-pointer hover:bg-[#fdf2f6] transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => { setVisibleCols(new Set(tempVisibleCols)); setColSortOrder([...tempColSortOrder]); setColMgmtOpen(false); toast.success("Column settings saved"); }}
                      className="px-[14px] py-[6px] rounded-[4px] bg-[#c53e6c] text-white text-[13px] font-medium cursor-pointer hover:bg-[#a0334f] transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Audit Logs card */}
            <div className="bg-white rounded-xl border border-[#ebebeb] overflow-hidden flex flex-col">
              <div className="px-5 pt-5 pb-0 border-b border-[#f2f2f2]">
                <h2 className="text-[#0f172a] text-[20px] font-semibold mb-4">Notes &amp; Audit Logs</h2>
                {/* Tabs */}
                <div className="flex items-center gap-0 border-b border-[#f2f2f2]">
                  {(["notes", "audit", "escalations"] as const).map(tab => {
                    const label = tab === "notes" ? "Notes" : tab === "audit" ? "Audit History" : "Escalations";
                    return (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-4 pb-3 text-[14px] font-medium cursor-pointer border-b-2 transition-colors ${activeTab === tab ? "text-[#c53e6c] border-[#c53e6c]" : "text-[#686868] border-transparent hover:text-[#333]"}`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeTab === "notes" && (
                <div className="px-5 py-4 flex flex-col gap-5">
                  {/* Sort row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[#686868] text-[12px] font-medium uppercase">SORT BY</span>
                    {["Aging", "SSD Proximity", "Value", "Order Volume"].map(s => (
                      <button key={s} onClick={() => setSortBy(s)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium border cursor-pointer transition-colors ${sortBy === s ? "bg-[#c53e6c] border-[#c53e6c] text-white" : "bg-white border-[#d1d1d1] text-[#686868] hover:bg-[#f8fafc]"}`}>
                        {s}
                        {sortBy === s ? (
                          <svg fill="none" viewBox="0 0 11 6" className="size-[10px]">
                            <path d={detailsSvg.p276a1b80} fill="white" />
                          </svg>
                        ) : (
                          <div className="flex flex-col gap-[1px]">
                            <svg fill="none" viewBox="0 0 6 4" className="size-[6px]">
                              <path d={detailsSvg.p2dd962c0} fill="#686868" />
                            </svg>
                            <svg fill="none" viewBox="0 0 6 4" className="size-[6px]">
                              <path d={detailsSvg.p2aef46f0} fill="#686868" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Timeline */}
                  <div className="flex flex-col gap-0">
                    {AUDIT_NOTES.map((note, i) => (
                      <div key={note.id} className="flex gap-4 pb-6 relative">
                        {/* Left timeline */}
                        <div className="flex flex-col items-center shrink-0 w-[80px]">
                          <span className="text-[#64748b] text-[11px] text-right w-full">{note.date}</span>
                          <span className="text-[#94a3b8] text-[10px] text-right w-full">{note.ago}</span>
                        </div>
                        {/* Dot + line */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className="size-[20px] rounded-full flex items-center justify-center shrink-0 mt-1"
                            style={{ backgroundColor: note.dotColor }}>
                            {note.dotColor === "#16a34a" ? (
                              <svg fill="none" viewBox="0 0 14 11" className="size-[10px]">
                                <path d={detailsSvg.p3c34800} fill="white" />
                              </svg>
                            ) : (
                              <svg fill="none" viewBox="0 0 20 20" className="size-[12px]">
                                <path clipRule="evenodd" d={detailsSvg.p1c834100} fill="white" fillRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          {i < AUDIT_NOTES.length - 1 && <div className="w-px flex-1 bg-[#e2e8f0] mt-1" />}
                        </div>
                        {/* Content */}
                        <div className="flex flex-col gap-1 flex-1 min-w-0 mt-1">
                          <div className="flex items-center gap-1 text-[13px]">
                            <span className="text-[#64748b]">{note.dotColor === "#16a34a" ? "Info by" : "Created by"}</span>
                            <span className="font-medium cursor-pointer hover:underline" style={{ color: note.agentColor }}>{note.agent}</span>
                          </div>
                          <p className="text-[#374151] text-[13px] leading-[1.5] whitespace-pre-wrap">{note.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Notes */}
                  <div className="border border-[#e2e8f0] rounded-[8px] overflow-hidden">
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Add Notes"
                      className="w-full px-4 py-3 text-[14px] text-[#333] placeholder-[#94a3b8] outline-none resize-none border-0 bg-transparent min-h-[80px]"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setNoteText("")}
                      className="h-[36px] px-5 rounded-[4px] border border-[#d1d1d1] bg-white text-[#686868] text-[14px] hover:bg-[#f8fafc] cursor-pointer transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => { if (noteText.trim()) { toast.success("Note saved"); setNoteText(""); } }}
                      className="h-[36px] px-5 rounded-[4px] bg-[#90003b] border border-[#90003b] text-white text-[14px] hover:bg-[#750030] cursor-pointer transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "audit" && (
                <div className="px-5 py-8 text-center text-[#94a3b8] text-[14px]">No audit history available.</div>
              )}
              {activeTab === "escalations" && (
                <div className="px-5 py-8 text-center text-[#94a3b8] text-[14px]">No escalations found.</div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<"login" | "dashboard" | "notifications" | "command-center-overview" | "command-center-email-view" | "hold-management" | "order-listing" | "released-orders" | "order-details">("login");
  const [detailOrderId, setDetailOrderId] = useState<string>("7822110");

  return (
    <div className="size-full">
      <Toaster position="bottom-right" richColors />
      {screen === "login" && <LoginScreen onLogin={() => setScreen("dashboard")} />}
      {screen === "dashboard" && (
        <Dashboard
          onLogout={() => setScreen("login")}
          onViewAllNotifications={() => setScreen("notifications")}
          onNavigateCommandCenterOverview={() => setScreen("command-center-overview")}
          onNavigateHoldManagementOverview={() => setScreen("hold-management")}
          onNavigateOrderListing={() => setScreen("order-listing")}
          onNavigateReleasedOrders={() => setScreen("released-orders")}
        />
      )}
      {screen === "notifications" && (
        <NotificationsPage
          onBack={() => setScreen("dashboard")}
          onViewAllNotifications={() => setScreen("notifications")}
          onNavigateCommandCenterOverview={() => setScreen("command-center-overview")}
          onNavigateHoldManagementOverview={() => setScreen("hold-management")}
          onNavigateOrderListing={() => setScreen("order-listing")}
          onNavigateReleasedOrders={() => setScreen("released-orders")}
        />
      )}
      {screen === "command-center-overview" && (
        <CommandCenterOverviewPage
          onLogout={() => setScreen("login")}
          onViewAllNotifications={() => setScreen("notifications")}
          onNavigateDashboard={() => setScreen("dashboard")}
          onNavigateCommandCenterOverview={() => setScreen("command-center-overview")}
          onNavigateCommandCenterEmailView={() => setScreen("command-center-email-view")}
          onNavigateHoldManagementOverview={() => setScreen("hold-management")}
          onNavigateOrderListing={() => setScreen("order-listing")}
          onNavigateReleasedOrders={() => setScreen("released-orders")}
        />
      )}
      {screen === "command-center-email-view" && (
        <EmailViewPage
          onLogout={() => setScreen("login")}
          onViewAllNotifications={() => setScreen("notifications")}
          onNavigateDashboard={() => setScreen("dashboard")}
          onNavigateCommandCenterOverview={() => setScreen("command-center-overview")}
          onNavigateCommandCenterEmailView={() => setScreen("command-center-email-view")}
          onNavigateHoldManagementOverview={() => setScreen("hold-management")}
          onNavigateOrderListing={() => setScreen("order-listing")}
          onNavigateReleasedOrders={() => setScreen("released-orders")}
        />
      )}
      {screen === "hold-management" && (
        <HoldManagementOverview
          onLogout={() => setScreen("login")}
          onViewAllNotifications={() => setScreen("notifications")}
          onNavigateDashboard={() => setScreen("dashboard")}
          onNavigateCommandCenterOverview={() => setScreen("command-center-overview")}
          onViewAllOrders={() => setScreen("order-listing")}
          onNavigateOrderListing={() => setScreen("order-listing")}
          onNavigateReleasedOrders={() => setScreen("released-orders")}
        />
      )}
      {screen === "order-listing" && (
        <OrderListingPage
          onLogout={() => setScreen("login")}
          onViewAllNotifications={() => setScreen("notifications")}
          onNavigateDashboard={() => setScreen("dashboard")}
          onNavigateCommandCenterOverview={() => setScreen("command-center-overview")}
          onNavigateOverview={() => setScreen("hold-management")}
          onNavigateOrderListing={() => setScreen("order-listing")}
          onNavigateReleasedOrders={() => setScreen("released-orders")}
          onNavigateOrderDetails={(id) => { setDetailOrderId(id); setScreen("order-details"); }}
        />
      )}
      {screen === "order-details" && (
        <OrderDetailsPage
          orderId={detailOrderId}
          onLogout={() => setScreen("login")}
          onViewAllNotifications={() => setScreen("notifications")}
          onNavigateDashboard={() => setScreen("dashboard")}
          onNavigateCommandCenterOverview={() => setScreen("command-center-overview")}
          onNavigateOverview={() => setScreen("hold-management")}
          onNavigateOrderListing={() => setScreen("order-listing")}
          onNavigateReleasedOrders={() => setScreen("released-orders")}
        />
      )}
      {screen === "released-orders" && (
        <ReleasedOrdersPage
          onLogout={() => setScreen("login")}
          onViewAllNotifications={() => setScreen("notifications")}
          onNavigateDashboard={() => setScreen("dashboard")}
          onNavigateCommandCenterOverview={() => setScreen("command-center-overview")}
          onNavigateOverview={() => setScreen("hold-management")}
          onNavigateOrderListing={() => setScreen("order-listing")}
          onNavigateReleasedOrders={() => setScreen("released-orders")}
        />
      )}
    </div>
  );
}
