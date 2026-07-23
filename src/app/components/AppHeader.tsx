import { useState } from "react";
import headerSvg from "@/imports/IntellisightHeader/svg-55fm8fp6rz";
import imgAvatar from "@/imports/image.png";
import { NotificationPanel } from "./NotificationPanel";

export function AppHeader({
  onMenuClick,
  activeNav,
  activeSub,
  onViewAllNotifications,
  onNavigateDashboard,
}: {
  onMenuClick: () => void;
  activeNav: string;
  activeSub?: string;
  onViewAllNotifications: () => void;
  onNavigateDashboard?: () => void;
}) {
  const [searchCategory, setSearchCategory] = useState("Emails & Products");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const categories = ["Emails & Products", "Users", "Threat Intel", "Reports", "Analytics"];

  return (
    <header className="bg-white border-b border-[#f2f2f2] flex items-center h-[64px] shrink-0 px-0 relative z-20">
      {/* Logo */}
      <div className="flex items-center shrink-0 pl-4 pr-3">
        <div className="relative size-[40px]">
          <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 40 40">
            <circle cx="20" cy="20" fill="#BA1C1C" r="20" />
            <circle cx="20" cy="20" fill="white" r="8.88889" />
          </svg>
        </div>
      </div>

      {/* Hamburger + Page title — visible on mobile, also on desktop when sidebar present */}
      <div className="flex items-center gap-2 min-w-0 shrink-0 mr-4">
        <button
          className="p-0.5 cursor-pointer"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg fill="none" viewBox="0 0 24 24" className="size-[24px]">
            <path clipRule="evenodd" d="M3 6H21V4.5H3V6Z" fill="#686868" fillRule="evenodd" />
            <path clipRule="evenodd" d="M3 12.75H21V11.25H3V12.75Z" fill="#686868" fillRule="evenodd" />
            <path clipRule="evenodd" d="M3 19.5H21V18H3V19.5Z" fill="#686868" fillRule="evenodd" />
          </svg>
        </button>
        <div className="flex flex-col justify-center leading-none">
          <p className="text-[16px] font-normal text-[#333] whitespace-nowrap leading-[21px]">{activeNav}</p>
          {/* Breadcrumb */}
          <div className="flex items-center gap-[5px]">
            {/* Home icon */}
            <span
              className="flex items-center cursor-pointer text-[#c53e6c] hover:opacity-75 transition-opacity"
              onClick={onNavigateDashboard}
              title="Go to Dashboard"
            >
              <svg fill="none" viewBox="0 0 14 14" className="size-[12px]">
                <path d="M1 5.5L7 1l6 4.5V13a.5.5 0 01-.5.5H9v-4H5v4H1.5A.5.5 0 011 13V5.5z" stroke="#c53e6c" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </span>
            <svg fill="none" viewBox="0 0 12 12" className="size-[12px] shrink-0">
              <path clipRule="evenodd" d={headerSvg.p39b4900} fill="#C53E6C" fillRule="evenodd" />
            </svg>
            <span className="text-[12px] text-[#333] leading-[12px] whitespace-nowrap">{activeSub ?? activeNav}</span>
          </div>
        </div>
      </div>

      {/* Search bar — hidden on small screens */}
      <div className="hidden md:flex items-center rounded-[4px] flex-1 max-w-[515px] mx-auto">
        {/* Category dropdown */}
        <div className="relative">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="bg-[#f2f2f2] flex items-center justify-between px-3 h-[40px] w-[165px] rounded-tl-[4px] rounded-bl-[4px] cursor-pointer"
          >
            <span className="text-[12px] text-[#686868] truncate">{searchCategory}</span>
            <svg fill="none" viewBox="0 0 12 12" className="size-[12px] shrink-0 ml-1 opacity-50">
              <path clipRule="evenodd" d={headerSvg.p31a26f00} fill="#686868" fillRule="evenodd" />
            </svg>
          </button>
          {searchOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#f2f2f2] rounded-lg shadow-lg z-30 w-[165px]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSearchCategory(cat); setSearchOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#f7f7f7] cursor-pointer ${cat === searchCategory ? "text-[#ba1c1c] font-medium" : "text-[#686868]"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Search input */}
        <div className="bg-[#f7f7f7] flex items-center justify-between px-3 h-[40px] flex-1 rounded-tr-[3px] rounded-br-[3px] border border-[#f7f7f7]">
          <input
            className="bg-transparent text-[13px] text-[#9c9c9c] outline-none placeholder:text-[#9c9c9c] w-full"
            placeholder="Search by email, category etc..."
          />
          <svg fill="none" viewBox="0 0 14 14" className="size-[14px] shrink-0">
            <path d={headerSvg.pe1e7a70} fill="#9C9C9C" />
          </svg>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-5 ml-auto pr-4 sm:pr-6">
        {/* AI Chat */}
        <button className="hidden sm:flex items-center gap-[7px] cursor-pointer hover:opacity-80 transition-opacity">
          <svg fill="none" viewBox="0 0 17.5 17.5021" className="size-[17.5px] shrink-0">
            <path clipRule="evenodd" d={headerSvg.p7bbbb0} fill="#BA1C1C" fillRule="evenodd" />
          </svg>
          <span className="text-[14px] font-medium text-[#bf0000] whitespace-nowrap">AI Chat</span>
        </button>

        {/* Person / Lina icon */}
        <button className="hidden sm:flex cursor-pointer hover:opacity-70 transition-opacity">
          <svg fill="none" viewBox="0 0 16.2475 17.5" className="size-[18px]">
            <path d={headerSvg.p1ab4280} fill="#686868" />
          </svg>
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-[20px] bg-[#d1d1d1] opacity-50" />

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

        {/* Avatar */}
        <div className="size-[40px] rounded-full overflow-hidden shrink-0 cursor-pointer">
          <img
            src={imgAvatar}
            alt="User avatar"
            className="size-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
