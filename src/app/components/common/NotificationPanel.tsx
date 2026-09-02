import { useEffect, useRef, useState } from "react";
import notifSvg from "@/imports/Notification/svg-ysaztztd8j";

const initialNotifications = [
  { id: 1, title: "Compliance Breach Detected", body: "Invoice #INV-2024-0892 exceeds the mandated spending limit for Department: R&D.", time: "10 mins ago", highlighted: false, status: "Breached" },
  { id: 2, title: "Risk Level Increase", body: "Project 'Stellar' has missing security documentation for the past two quarters.", time: "45 mins ago", highlighted: true, status: "At Risk" },
  { id: 3, title: "Vendor Audit Complete", body: "Global Logistics Inc has successfully submitted all required tax compliance forms.", time: "2 hours ago", highlighted: false, status: "Resolved" },
  { id: 4, title: "Policy Update Alert", body: "New GDPR guidelines require immediate update to customer data handling procedures.", time: "3 hours ago", highlighted: false, status: "At Risk" },
  { id: 5, title: "System Outage Notification", body: "The compliance engine was down for maintenance but is now fully operational.", time: "5 hours ago", highlighted: false, status: "Resolved" },
];

const statusPillColor: Record<string, string> = {
  Breached: "bg-[#fdecea] text-[#ba1c1c]",
  "At Risk": "bg-[#fff8e1] text-[#b45309]",
  Resolved: "bg-[#e8f5e9] text-[#2e7d32]",
};

const unreadBorderColor: Record<string, string> = {
  Breached: "border-l-[#ba1c1c]",
  "At Risk": "border-l-amber-400",
  Resolved: "border-l-emerald-500",
};

export function NotificationPanel({
  onClose,
  onViewAll,
}: {
  onClose: () => void;
  onViewAll: () => void;
}) {
  const [items, setItems] = useState(initialNotifications);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const dismiss = (id: number) => setItems((prev) => prev.filter((n) => n.id !== id));
  const accept = (id: number) => setItems((prev) => prev.map((n) => n.id === id ? { ...n, highlighted: false, status: "Resolved" } : n));

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-[calc(100%+10px)] w-[360px] bg-white rounded-[8px] border border-black/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col z-50 overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f2f2]">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[14px] text-[#111827]">Notifications</p>
          <span className="bg-[#ba1c1c] text-white text-[11px] font-bold px-[6px] py-[1px] rounded-[8px] leading-[16px]">
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-[11px] font-medium text-[#6b7380] hover:text-[#111827] transition-colors cursor-pointer whitespace-nowrap">
            Mark all read
          </button>
          <button onClick={onClose} className="size-[24px] flex items-center justify-center rounded-[8px] hover:bg-[#f3f3f5] transition-colors cursor-pointer">
            <svg fill="none" viewBox="0 0 12 12" className="size-[10px]">
              <path d={notifSvg.p25e81000} fill="#6b7380" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <svg fill="none" viewBox="0 0 20 20" className="size-[32px] opacity-20">
              <path d={notifSvg.p1227180} stroke="#111827" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <p className="text-[13px] text-[#9ca3b0]">All caught up</p>
          </div>
        )}
        {items.map((n, i) => (
          <div
            key={n.id}
            className={`group relative flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[#f7f8fa] ${i < items.length - 1 ? "border-b border-b-[#f2f2f2]" : ""}`}
          >
            {/* Unread dot */}
            {n.highlighted && (
              <span className="absolute top-4 right-4 size-[6px] rounded-full bg-[#ba1c1c]" />
            )}

            {/* Icon */}
            <div className="shrink-0 size-[32px] rounded-[8px] bg-[#f3f3f5] flex items-center justify-center mt-0.5">
              <svg fill="none" viewBox="0 0 20 20" className="size-[16px]">
                <path d={notifSvg.p1227180} stroke={n.status === "Breached" ? "#ba1c1c" : n.status === "At Risk" ? "#b45309" : "#2e7d32"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-[13px] leading-[1.4] truncate ${n.highlighted ? "font-semibold text-[#111827]" : "font-medium text-[#374151]"}`}>
                  {n.title}
                </p>
                <p className="text-[10px] text-[#9ca3b0] shrink-0 whitespace-nowrap mt-0.5">{n.time}</p>
              </div>
              <p className="text-[11.5px] text-[#6b7380] leading-[1.5] line-clamp-2">{n.body}</p>
              <div className="flex items-center justify-between mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-[8px] text-[10px] font-medium ${statusPillColor[n.status]}`}>
                  {n.status}
                </span>
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                    className="text-[11px] text-[#6b7380] hover:text-[#111827] cursor-pointer transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); accept(n.id); }}
                    className="text-[11px] font-semibold text-[#cd1453] hover:text-[#a01040] cursor-pointer transition-colors"
                  >
                    Accept/View
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer — full width clickable */}
      <button
        onClick={() => { onClose(); onViewAll(); }}
        className="w-full flex items-center justify-center gap-1.5 py-3 border-t border-[#f2f2f2] text-[12px] font-semibold text-[#cd1453] hover:bg-[#fff0f5] transition-colors cursor-pointer"
      >
        View All Notifications
        <svg fill="none" viewBox="0 0 12 12" className="size-[10px]">
          <path clipRule="evenodd" d="M3.90525 1.125L3.375 1.65525L7.71975 6L3.375 10.3448L3.90525 10.875L8.78025 6L3.90525 1.125Z" fill="#cd1453" fillRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
