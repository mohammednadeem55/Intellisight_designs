import { useState } from "react";
import notifSvg from "@/imports/Notification/svg-ysaztztd8j";
import { AppHeader } from "../../components/common/AppHeader";

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

export function NotificationsPage({
  onBack,
  onViewAllNotifications,
  onNavigateHome,
  onNavigateCommandCenterOverview,
  onNavigateCommandCenterEmailView,
  onNavigateNewOverview,
  onNavigateHoldManagementOverview,
  onNavigateOrderListing,
  onNavigateReleasedOrders,
  onNavigateEmailTemplate,
  onNavigateReview,
  onNavigateEmailWorkflow,
}: {
  onBack: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateReview?: () => void;
  onNavigateEmailWorkflow?: () => void;
}) {
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
      <AppHeader
        activeNav="Notifications"
        onViewAllNotifications={onViewAllNotifications}
        onLogout={onBack}
        onNavigateHome={onNavigateHome}
        onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
        onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
        onNavigateNewOverview={onNavigateNewOverview}
        onNavigateHoldManagementOverview={onNavigateHoldManagementOverview}
        onNavigateOrderListing={onNavigateOrderListing}
        onNavigateReleasedOrders={onNavigateReleasedOrders}
        onNavigateEmailTemplate={onNavigateEmailTemplate}
        onNavigateReview={onNavigateReview}
        onNavigateEmailWorkflow={onNavigateEmailWorkflow}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left sidebar ── */}
        <div className="bg-white border-r border-[#ebebeb] flex flex-col w-[420px] shrink-0 overflow-hidden">

          {/* Sidebar header */}
          <div className="px-5 pt-5 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="font-semibold text-[15px] text-[#111827]">Notifications</h2>
                <span className="bg-[#ba1c1c] text-white text-[10px] font-bold px-[7px] py-[2px] rounded-[8px] leading-none">
                  {tabCount("All")}
                </span>
              </div>
              <button className="text-[12px] font-medium text-[#ba1c1c] hover:opacity-75 transition-opacity cursor-pointer">
                Mark all read
              </button>
            </div>

            {/* Category select */}
            <div className="relative">
              <select className="w-full bg-[#f9f9fb] border border-[#e5e7eb] rounded-[8px] pl-3 pr-8 py-2.5 text-[13px] text-[#374151] appearance-none cursor-pointer outline-none focus:border-[#ba1c1c] transition-colors">
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer ${
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
                    <path d={notifSvg.p1227180} stroke="#111827" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
                    <div className={`shrink-0 size-[34px] rounded-[8px] flex items-center justify-center mt-0.5 ${
                      n.status === "Breached" ? "bg-rose-50" : n.status === "At Risk" ? "bg-amber-50" : "bg-emerald-50"
                    }`}>
                      <svg fill="none" viewBox="0 0 16 16" className="size-[15px]">
                        <path
                          d={notifSvg.p1227180}
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[8px] text-[10.5px] font-medium ${statusBadge[n.status]}`}>
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
            <div className="bg-white rounded-[8px] border border-[#ebebeb] overflow-hidden mb-5 shadow-sm">
              {/* Card header */}
              <div className="px-7 py-6 border-b border-[#f3f4f6]">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-[18px] font-bold text-[#111827] leading-[1.35]">
                    {selectedDetail.title}
                  </h1>
                  <span className={`shrink-0 inline-flex items-center px-3 py-1 rounded-[8px] text-[12px] font-semibold mt-0.5 ${statusBadge[selectedDetail.status]}`}>
                    {selectedDetail.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[12px] text-[#9ca3af]">Received: <span className="text-[#374151] font-medium">{selectedDetail.received}</span></span>
                  <span className="w-px h-3 bg-[#e5e7eb]" />
                  <span className="bg-[#f3f4f6] text-[#374151] text-[11px] font-semibold px-2.5 py-1 rounded-[8px] tracking-wide uppercase">{selectedDetail.category}</span>
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
            <div className="bg-white rounded-[8px] border border-[#ebebeb] px-7 py-6 mb-5 shadow-sm">
              <h3 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Alert Summary</h3>
              <p className="text-[13.5px] text-[#374151] leading-[1.7]">{selectedDetail.summary}</p>
            </div>

            {/* Affected Records card */}
            <div className="bg-white rounded-[8px] border border-[#ebebeb] overflow-hidden mb-5 shadow-sm">
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
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold ${statusBadge[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recommended Actions card */}
            <div className="bg-white rounded-[8px] border border-[#ebebeb] px-7 py-6 shadow-sm">
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
              <button className="px-5 py-2.5 border border-[#e5e7eb] rounded-[8px] text-[13px] font-medium text-[#374151] hover:bg-[#f9f9fb] cursor-pointer transition-colors">
                Dismiss Alert
              </button>
              <button className="px-5 py-2.5 bg-[#ba1c1c] rounded-[8px] text-[13px] font-semibold text-white hover:opacity-90 cursor-pointer transition-opacity shadow-sm">
                Accept &amp; Resolve
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
