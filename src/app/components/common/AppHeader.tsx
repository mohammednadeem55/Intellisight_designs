import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, LogOut, Menu, User, X } from "lucide-react";
import headerSvg from "@/imports/IntellisightHeader/svg-55fm8fp6rz";
import intellisightLogo from "@/imports/IntellisightHeader/intellisight_logo.png";
import { NotificationPanel } from "./NotificationPanel";

type NavChild = { label: string; onClick?: () => void };
type NavItem = { label: string; match: (activeNav: string) => boolean; onClick?: () => void; children?: NavChild[] };

const CURRENT_USER = { email: "jagdish.kumar@intellisight.io", role: "Sales Ops Admin" };

export function AppHeader({
  activeNav,
  onViewAllNotifications,
  onLogout,
  onNavigateHome,
  onNavigateNewOverview,
  onNavigateHoldManagementOverview,
  onNavigateOrderListing,
  onNavigateReleasedOrders,
  onNavigateCommunication,
  onNavigateEmailTemplate,
  onNavigateCmdCenterAdvFilter,
  onNavigateEmailWorkflow,
  onNavigateFeedbackCenter,
}: {
  activeNav: string;
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
  onNavigateEmailWorkflow?: () => void;
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
}) {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileOpenSection, setMobileOpenSection] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (navRef.current && !navRef.current.contains(target)) setOpenMenu(null);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
      if (
        mobileNavRef.current && !mobileNavRef.current.contains(target) &&
        mobileToggleRef.current && !mobileToggleRef.current.contains(target)
      ) setMobileNavOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navItems: NavItem[] = [
    { label: "Command Center", match: (n) => n.startsWith("Command Center"), onClick: onNavigateNewOverview },
    {
      label: "Hold Mgmt",
      match: (n) => n.startsWith("Hold"),
      children: [
        { label: "Overview", onClick: onNavigateHoldManagementOverview },
        { label: "Order Listing", onClick: onNavigateOrderListing },
      ],
    },
    { label: "Communication", match: (n) => n === "Communication", onClick: onNavigateCommunication },
    {
      label: "Admin",
      match: (n) => n === "Email Template" || n === "Cmd Center Adv. Filter" || n === "Email Reconciliation",
      children: [
        { label: "Email", onClick: onNavigateEmailTemplate },
        { label: "Cmd Center Adv. Filter", onClick: onNavigateCmdCenterAdvFilter },
        { label: "Email Reconciliation", onClick: () => navigate("/command-center/email-reconciliation") },
      ],
    },
    {
      label: "Feedback Center",
      match: (n) => n === "Feedback Center",
      children: [
        { label: "Trade Order", onClick: () => onNavigateFeedbackCenter?.("trade-order") },
        { label: "Service Agreement", onClick: () => onNavigateFeedbackCenter?.("service-agreement") },
        { label: "SOM", onClick: () => onNavigateFeedbackCenter?.("som") },
      ],
    },
  ];

  const runMobileNav = (fn?: () => void) => {
    setMobileNavOpen(false);
    setMobileOpenSection(null);
    fn?.();
  };

  return (
    <header className="shrink-0 relative z-50 bg-white border-b border-[#f2f2f2]">
      <div className="max-w-[1600px] mx-auto h-[56px] flex items-center px-4 sm:px-5 gap-1">
        {/* Mobile nav toggle — the horizontal nav collapses below lg into this + the panel below */}
        <button
          ref={mobileToggleRef}
          onClick={() => { setMobileNavOpen((v) => !v); setMobileOpenSection(null); }}
          aria-label="Toggle navigation"
          className="lg:hidden flex items-center justify-center size-[36px] -ml-1.5 mr-1 rounded-[8px] text-[#4D4D4D] hover:bg-[#f7f7f7] cursor-pointer transition-colors shrink-0"
        >
          {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Logo — doubles as the Home link now that Home isn't its own nav item */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 shrink-0 pr-2 sm:pr-4 cursor-pointer"
        >
          <img src={intellisightLogo} alt="IntelliSight" className="w-[34px] h-[20px] object-contain" />
          <span className="text-[16px] font-bold whitespace-nowrap bg-gradient-to-r from-[#E90029] via-[#823E81] to-[#30578D] bg-clip-text text-transparent">IntelliSight</span>
        </button>

        {/* Divider */}
        <div className="hidden lg:block w-px h-[24px] bg-[#EEF0F3] shrink-0 mr-3" />

        {/* Nav — desktop only; collapses into the mobile panel below lg */}
        <nav ref={navRef} className="hidden lg:flex items-center gap-1 h-full">
          {navItems.map((item) => {
            const active = item.match(activeNav);
            return (
              <div key={item.label} className="relative h-full">
                <button
                  onClick={() => {
                    if (item.children) {
                      setOpenMenu(openMenu === item.label ? null : item.label);
                    } else {
                      item.onClick?.();
                    }
                  }}
                  className={`flex items-center gap-1 px-3 h-full text-[14px] font-medium cursor-pointer transition-colors border-b-2 ${
                    active ? "text-[#CC0025] border-[#CC0025]" : "text-[#4D4D4D] border-transparent hover:text-[#262626]"
                  }`}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown size={14} className={`transition-transform duration-150 ${openMenu === item.label ? "rotate-180" : ""}`} />
                  )}
                </button>
                {item.children && openMenu === item.label && (
                  <div className="absolute top-full left-0 bg-white border border-[#f2f2f2] rounded-[8px] shadow-lg py-1.5 min-w-[180px] z-30">
                    {item.children.length === 0 ? (
                      <p className="px-4 py-2 text-[13px] text-[#97999B] whitespace-nowrap">No pages yet</p>
                    ) : (
                      item.children.map((child) => (
                        <button
                          key={child.label}
                          onClick={() => {
                            setOpenMenu(null);
                            child.onClick?.();
                          }}
                          className="w-full text-left px-4 py-2 text-[13px] text-[#4D4D4D] hover:bg-[#f7f7f7] hover:text-[#262626] cursor-pointer"
                        >
                          {child.label}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto pr-1 sm:pr-4">
          {/* Notification bell */}
          <div className="relative">
            <button
              className="flex cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => setNotifOpen((v) => !v)}
            >
              <svg fill="none" viewBox="0 0 20 20" className="size-[20px]">
                <path clipRule="evenodd" d={headerSvg.p36a4ea00} fill="#686868" fillRule="evenodd" />
                <path clipRule="evenodd" d={headerSvg.p30c2f600} fill="#686868" fillRule="evenodd" />
              </svg>
            </button>
            <div className="absolute -top-1 -right-1.5 bg-[#bf0000] rounded-[40px] px-[4px] flex items-center justify-center min-w-[16px] h-[16px] pointer-events-none">
              <span className="text-[10px] font-bold text-white leading-none">8</span>
            </div>
            {notifOpen && (
              <NotificationPanel
                onClose={() => setNotifOpen(false)}
                onViewAll={onViewAllNotifications}
              />
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-[24px] bg-[#EEF0F3] shrink-0" />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="size-[32px] rounded-full bg-[#F1F2F4] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="size-[18px]">
                  <path
                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    stroke="#686868"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="7" r="4" stroke="#686868" strokeWidth="1.7" />
                </svg>
              </div>
              <div className="hidden md:flex flex-col items-start leading-none">
                <span className="text-[12.5px] font-medium text-[#262626] max-w-[170px] truncate">{CURRENT_USER.email}</span>
                <span className="text-[11px] text-[#97999B] mt-0.5">{CURRENT_USER.role}</span>
              </div>
              <ChevronDown size={14} className={`hidden md:block text-[#686868] transition-transform duration-150 ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-[#f2f2f2] rounded-[8px] shadow-lg py-1.5 min-w-[200px] z-30">
                <div className="px-4 py-2 border-b border-[#f2f2f2] md:hidden">
                  <p className="text-[12.5px] font-medium text-[#262626] truncate">{CURRENT_USER.email}</p>
                  <p className="text-[11px] text-[#97999B] mt-0.5">{CURRENT_USER.role}</p>
                </div>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 text-left px-4 py-2 text-[13px] text-[#4D4D4D] hover:bg-[#f7f7f7] hover:text-[#262626] cursor-pointer"
                >
                  <User size={14} />
                  Profile
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout?.();
                  }}
                  className="w-full flex items-center gap-2.5 text-left px-4 py-2 text-[13px] text-[#4D4D4D] hover:bg-[#f7f7f7] hover:text-[#262626] cursor-pointer"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav panel — absolutely positioned so it overlays the page instead of pushing content down */}
      {mobileNavOpen && (
        <div
          ref={mobileNavRef}
          className="lg:hidden absolute top-full left-0 right-0 z-40 border-t border-[#f2f2f2] bg-white shadow-lg max-h-[calc(100vh-56px)] overflow-y-auto"
        >
          {navItems.map((item) => {
            const active = item.match(activeNav);
            const sectionOpen = mobileOpenSection === item.label;
            return (
              <div key={item.label} className="border-b border-[#f2f2f2] last:border-b-0">
                <button
                  onClick={() => {
                    if (item.children) setMobileOpenSection(sectionOpen ? null : item.label);
                    else runMobileNav(item.onClick);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-5 py-3 text-[14px] font-medium text-left cursor-pointer transition-colors ${
                    active ? "text-[#CC0025]" : "text-[#4D4D4D] hover:bg-[#f7f7f7]"
                  }`}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown size={14} className={`transition-transform duration-150 ${sectionOpen ? "rotate-180" : ""}`} />
                  )}
                </button>
                {item.children && sectionOpen && (
                  <div className="pb-1.5 bg-[#FAFAFA]">
                    {item.children.length === 0 ? (
                      <p className="px-7 py-2 text-[13px] text-[#97999B]">No pages yet</p>
                    ) : (
                      item.children.map((child) => (
                        <button
                          key={child.label}
                          onClick={() => runMobileNav(child.onClick)}
                          className="w-full text-left px-7 py-2.5 text-[13px] text-[#4D4D4D] hover:bg-[#f0f0f0] cursor-pointer"
                        >
                          {child.label}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}
