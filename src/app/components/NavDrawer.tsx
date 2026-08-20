import { useState } from "react";
import { House, LogOut, X } from "lucide-react";
import menuSvg from "@/imports/NestedMenuExample/svg-bciw7c0072";

const menuItems = [
  {
    label: "Home",
    color: "#686868",
    icon: <House size={17} color="#686868" strokeWidth={1.7} />,
  },
  {
    label: "Dashboard",
    color: "#686868",
    icon: (
      <svg fill="none" viewBox="0 0 16.6667 16.6667" className="size-[17px]">
        <path d={menuSvg.p319ac000} fill="#686868" />
      </svg>
    ),
  },
  {
    label: "Command Center",
    color: "#686868",
    icon: (
      <svg fill="none" viewBox="0 0 16.667 16.667" className="size-[17px]">
        <path d={menuSvg.p694ec70} fill="#686868" />
      </svg>
    ),
    children: ["Overview", "Email View", "New Overview"],
  },
  {
    label: "Hold Management",
    color: "#686868",
    icon: (
      <svg fill="none" viewBox="0 0 17.5 17.5001" className="size-[17px]">
        <path clipRule="evenodd" d={menuSvg.p21508700} fill="#686868" fillRule="evenodd" />
      </svg>
    ),
    children: ["Overview", "Order Listing", "Released Orders"],
  },
];

export function NavDrawer({
  open,
  onClose,
  onLogout,
  onNavigateHome,
  onNavigateDashboard,
  onNavigateCommandCenterOverview,
  onNavigateCommandCenterEmailView,
  onNavigateNewOverview,
  onNavigateHoldManagementOverview,
  onNavigateOrderListing,
  onNavigateReleasedOrders,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  onNavigateHome?: () => void;
  onNavigateDashboard?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white shadow-[2px_0_8px_rgba(0,0,0,0.12)] flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: 260 }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-[64px] border-b border-[#f2f2f2] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative size-[32px]">
              <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 40 40">
                <circle cx="20" cy="20" fill="#BA1C1C" r="20" />
                <circle cx="20" cy="20" fill="white" r="8.88889" />
              </svg>
            </div>
            <span className="font-semibold text-[15px] text-[#333]" style={{ fontFamily: "Inter, sans-serif" }}>
              IntelliSight
            </span>
          </div>
          <button onClick={onClose} className="text-[#686868] hover:text-[#333] cursor-pointer p-1">
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item) => (
            <div key={item.label}>
              <button
                onClick={() => {
                  if (item.children) {
                    setExpanded(expanded === item.label ? null : item.label);
                  } else if (item.label === "Home" && onNavigateHome) {
                    onClose();
                    onNavigateHome();
                  } else if (item.label === "Dashboard" && onNavigateDashboard) {
                    onClose();
                    onNavigateDashboard();
                  } else {
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-between px-4 h-[44px] text-left transition-colors cursor-pointer hover:bg-[#f7f7f7]"
              >
                <div className="flex items-center gap-[10px]">
                  <span className="shrink-0 flex items-center justify-center size-[20px]">
                    {item.icon}
                  </span>
                  <span
                    className="text-[14px] font-normal leading-[21px]"
                    style={{ fontFamily: "Inter, sans-serif", color: item.color }}
                  >
                    {item.label}
                  </span>
                </div>
                {item.children && (
                  <svg
                    fill="none"
                    viewBox="0 0 12 12"
                    className={`size-[12px] shrink-0 transition-transform duration-200 ${
                      expanded === item.label ? "rotate-90" : "rotate-180"
                    }`}
                  >
                    <path
                      clipRule="evenodd"
                      d={menuSvg.p250d4e00}
                      fill="#90003B"
                      fillRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* Sub-items */}
              {item.children && expanded === item.label && (
                <div className="flex flex-col">
                  {item.children.map((child) => (
                    <button
                      key={child}
                      onClick={() => {
                        if (item.label === "Command Center" && child === "Overview" && onNavigateCommandCenterOverview) {
                          onClose();
                          onNavigateCommandCenterOverview();
                        } else if (item.label === "Command Center" && child === "Email View" && onNavigateCommandCenterEmailView) {
                          onClose();
                          onNavigateCommandCenterEmailView();
                        } else if (item.label === "Command Center" && child === "New Overview" && onNavigateNewOverview) {
                          onClose();
                          onNavigateNewOverview();
                        } else if (item.label === "Hold Management" && child === "Overview" && onNavigateHoldManagementOverview) {
                          onClose();
                          onNavigateHoldManagementOverview();
                        } else if (item.label === "Hold Management" && child === "Order Listing" && onNavigateOrderListing) {
                          onClose();
                          onNavigateOrderListing();
                        } else if (item.label === "Hold Management" && child === "Released Orders" && onNavigateReleasedOrders) {
                          onClose();
                          onNavigateReleasedOrders();
                        } else {
                          onClose();
                        }
                      }}
                      className="w-full flex items-center gap-[10px] pl-[44px] pr-4 h-[44px] text-left hover:bg-[#f7f7f7] cursor-pointer transition-colors"
                    >
                      <svg fill="none" viewBox="0 0 17.5 15" className="size-[16px] shrink-0">
                        <path d={menuSvg.p39a94f80} fill="#686868" />
                      </svg>
                      <span
                        className="text-[14px] font-normal text-[#686868] leading-[21px]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {child}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-4 py-4 border-t border-[#f2f2f2] shrink-0">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[#686868] hover:bg-[#f7f7f7] transition-colors w-full cursor-pointer"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
