import svgPaths from "./svg-1y37p0f7c6";
import imgBlockImage from "./87b552f8867f96fa4d2ca833ef943c5aa1ab172b.png";

function Group2() {
  return (
    <div className="absolute left-[16px] size-[40px] top-[12px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
        <g id="Group 7237">
          <circle cx="20" cy="20" fill="var(--fill-0, #BA1C1C)" id="Ellipse" r="20" />
          <circle cx="19.9989" cy="19.9989" fill="var(--fill-0, white)" id="Ellipse_2" r="8.88889" />
        </g>
      </svg>
    </div>
  );
}

function Menu() {
  return (
    <div className="absolute left-0 size-[24px] top-[8px]" data-name="Menu">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Menu">
          <path clipRule="evenodd" d="M3 6H21V4.5H3V6Z" fill="var(--fill-0, #686868)" fillRule="evenodd" id="Fill 1" />
          <path clipRule="evenodd" d="M3 12.75H21V11.25H3V12.75Z" fill="var(--fill-0, #686868)" fillRule="evenodd" id="Fill 2" />
          <path clipRule="evenodd" d="M3 19.5H21V18H3V19.5Z" fill="var(--fill-0, #686868)" fillRule="evenodd" id="Fill 3" />
        </g>
      </svg>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex gap-[5px] items-center relative shrink-0 w-[42px]">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#c53e6c] text-[12px] whitespace-nowrap">
        <p className="leading-[12px]">Notifications</p>
      </div>
    </div>
  );
}

function Frame15() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[40px] right-0 top-px">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#333] text-[16px] whitespace-nowrap">
        <p className="leading-[21px]">Dashboard</p>
      </div>
      <Frame7 />
    </div>
  );
}

function Frame16() {
  return (
    <div className="-translate-y-1/2 absolute h-[40px] left-[80px] right-[1002px] top-1/2">
      <Menu />
      <Frame15 />
    </div>
  );
}

function ChatOutline() {
  return (
    <div className="content-stretch flex gap-[7px] items-center overflow-clip py-px relative shrink-0" data-name="Chat / Outline">
      <div className="h-[17.502px] relative shrink-0 w-[17.5px]" data-name="Union">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.5 17.5021">
          <path clipRule="evenodd" d={svgPaths.p7bbbb0} fill="var(--fill-0, #BA1C1C)" fillRule="evenodd" id="Union" />
        </svg>
      </div>
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#bf0000] text-[14px] whitespace-nowrap">
        <p className="leading-[16px]">AI Chat</p>
      </div>
    </div>
  );
}

function NoticeGenericOutline() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Notice Generic Outline">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Notice Generic Outline">
          <path clipRule="evenodd" d={svgPaths.p36a4ea00} fill="var(--fill-0, #686868)" fillRule="evenodd" id="Fill 1" />
          <path clipRule="evenodd" d={svgPaths.p30c2f600} fill="var(--fill-0, #686868)" fillRule="evenodd" id="Fill 3" />
        </g>
      </svg>
    </div>
  );
}

function Frame5() {
  return (
    <div className="-translate-y-1/2 absolute content-stretch flex gap-[24px] items-center right-[80px] top-1/2">
      <ChatOutline />
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Apps Icon/Lina">
        <div className="absolute inset-[6.25%_9.39%_6.25%_9.38%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.2475 17.5">
            <path d={svgPaths.p1ab4280} fill="var(--fill-0, #686868)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="flex h-[20px] items-center justify-center relative shrink-0 w-0">
        <div className="flex-none rotate-90">
          <div className="h-0 relative w-[20px]">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 1">
                <line id="Line 9" opacity="0.5" stroke="var(--stroke-0, #D1D1D1)" x2="20" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <NoticeGenericOutline />
    </div>
  );
}

function BadgePillBadgeComponent() {
  return (
    <div className="-translate-y-1/2 absolute bg-[#bf0000] content-stretch flex flex-col items-center px-[4px] right-[75px] rounded-[40px] top-[calc(50%-8px)]" data-name="Badge Pill/Badge Component">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap">
        <p className="leading-[16px]">8</p>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="-translate-y-1/2 absolute contents right-[16px] top-1/2">
      <div className="-translate-y-1/2 absolute right-[16px] size-[40px] top-1/2" data-name="Block / Image">
        <img alt="" className="absolute block inset-0 max-w-none size-full" height="40" src={imgBlockImage} width="40" />
      </div>
      <Frame5 />
      <BadgePillBadgeComponent />
    </div>
  );
}

function ChevronDown() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Chevron Down">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="Chevron Down" opacity="0.5">
          <path clipRule="evenodd" d={svgPaths.p31a26f00} fill="var(--fill-0, #686868)" fillRule="evenodd" id="icon" />
        </g>
      </svg>
    </div>
  );
}

function Frame13() {
  return (
    <div className="absolute content-stretch flex h-[40px] items-center justify-between left-[-0.11px] overflow-clip px-[16px] py-[11px] top-0 w-[165px]">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#686868] text-[12px] whitespace-nowrap">
        <p className="leading-[16px]">{`Emails & Products`}</p>
      </div>
      <ChevronDown />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[-0.11px] top-0">
      <div className="absolute bg-[#f2f2f2] inset-0 rounded-bl-[4px] rounded-tl-[4px]" />
      <Frame13 />
    </div>
  );
}

function Frame17() {
  return (
    <div className="h-[40px] relative shrink-0 w-[165px]">
      <Group />
    </div>
  );
}

function Frame14() {
  return (
    <div className="bg-[#f7f7f7] content-stretch flex items-center justify-between p-[12px] relative rounded-br-[3px] rounded-tr-[3px] shrink-0 w-[350px]">
      <div aria-hidden className="absolute border border-[#f7f7f7] border-solid inset-[-0.5px] pointer-events-none rounded-br-[3.5px] rounded-tr-[3.5px]" />
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9c9c9c] text-[10px] whitespace-nowrap">
        <p className="leading-[14px]">Search by email, category etc...</p>
      </div>
      <div className="relative shrink-0 size-[16px]" data-name="Search">
        <div className="absolute inset-[6.25%]" data-name="Union">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
            <path d={svgPaths.pe1e7a70} fill="var(--fill-0, #9C9C9C)" id="Union" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function SearchBarDefault() {
  return (
    <div className="absolute content-stretch flex items-center left-[462px] rounded-[4px] top-[11.71px] w-[515px]" data-name="Search Bar/Default">
      <Frame17 />
      <Frame14 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-[#f2f2f2] content-stretch flex items-start px-[6px] py-[2px] relative rounded-[4px] shrink-0" data-name="Frame">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#686868] text-[10px] whitespace-nowrap">48</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[#333] text-[13px] whitespace-nowrap">All Notifications</p>
      <Frame1 />
    </div>
  );
}

function PanelHeader() {
  return (
    <div className="relative shrink-0 w-full" data-name="Panel-Header">
      <div aria-hidden className="absolute border-[#f2f2f2] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[16px] relative size-full">
          <Frame />
          <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#bf0000] text-[11px] whitespace-nowrap">Mark all as read</p>
        </div>
      </div>
    </div>
  );
}

function ChevronDown1() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="chevron-down">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="chevron-down">
          <path d="M3 4.5L6 7.5L9 4.5" id="Vector" stroke="var(--stroke-0, #9C9C9C)" strokeLinecap="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Dropdown() {
  return (
    <div className="relative rounded-[4px] shrink-0 w-full" data-name="Dropdown">
      <div aria-hidden className="absolute border border-[#dadada] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[12px] py-[8px] relative size-full">
          <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#333] text-[12px] whitespace-nowrap">All Categories</p>
          <ChevronDown1 />
        </div>
      </div>
    </div>
  );
}

function TabAll() {
  return (
    <div className="bg-[#f2f2f2] content-stretch flex items-start px-[12px] py-[6px] relative rounded-[100px] shrink-0" data-name="tab-All">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#686868] text-[11px] whitespace-nowrap">All</p>
    </div>
  );
}

function TabBreached() {
  return (
    <div className="bg-[#bf0000] content-stretch flex items-start px-[12px] py-[6px] relative rounded-[100px] shrink-0" data-name="tab-Breached">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[11px] text-white whitespace-nowrap">Breached</p>
    </div>
  );
}

function TabAtRisk() {
  return (
    <div className="bg-[#f2f2f2] content-stretch flex items-start px-[12px] py-[6px] relative rounded-[100px] shrink-0" data-name="tab-At Risk">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#686868] text-[11px] whitespace-nowrap">At Risk</p>
    </div>
  );
}

function TabResolved() {
  return (
    <div className="bg-[#f2f2f2] content-stretch flex items-start px-[12px] py-[6px] relative rounded-[100px] shrink-0" data-name="tab-Resolved">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#686868] text-[11px] whitespace-nowrap">Resolved</p>
    </div>
  );
}

function Tabs() {
  return (
    <div className="content-start flex flex-wrap gap-[8px] items-start relative shrink-0 w-full" data-name="Tabs">
      <TabAll />
      <TabBreached />
      <TabAtRisk />
      <TabResolved />
    </div>
  );
}

function FilterRow() {
  return (
    <div className="relative shrink-0 w-full" data-name="Filter-Row">
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[16px] relative size-full">
        <Dropdown />
        <Tabs />
      </div>
    </div>
  );
}

function Bell() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="bell">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="bell">
          <path d={svgPaths.p1033e080} id="Vector" stroke="var(--stroke-0, #BF0000)" strokeLinecap="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function TitleTime() {
  return (
    <div className="content-stretch flex items-center justify-between leading-[normal] relative shrink-0 w-full whitespace-nowrap" data-name="title-time">
      <p className="font-['Inter:Bold',sans-serif] font-bold relative shrink-0 text-[#333] text-[12px]">Compliance Breach Detected</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#9c9c9c] text-[10px]">10 mins ago</p>
    </div>
  );
}

function ContentStack() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic relative" data-name="content-stack">
      <TitleTime />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[14px] overflow-hidden relative shrink-0 text-[#686868] text-[10px] text-ellipsis w-full">{`Invoice #INV-2024-0892 exceeds the mandated spending limit for Department: R&D.`}</p>
    </div>
  );
}

function TopRow() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="top-row">
      <Bell />
      <ContentStack />
    </div>
  );
}

function StatusBadge() {
  return (
    <div className="bg-[rgba(191,0,0,0.08)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-name="status-badge">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#bf0000] text-[10px] whitespace-nowrap">Breached</p>
    </div>
  );
}

function Actions() {
  return (
    <div className="[word-break:break-word] content-stretch flex font-['Inter:Semi_Bold',sans-serif] font-semibold gap-[16px] items-start leading-[normal] not-italic relative shrink-0 text-[10px] whitespace-nowrap" data-name="actions">
      <p className="relative shrink-0 text-[#686868]">Dismiss</p>
      <p className="relative shrink-0 text-[#bf0000]">Accept/View</p>
    </div>
  );
}

function BottomRow() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="bottom-row">
      <StatusBadge />
      <Actions />
    </div>
  );
}

function NotificationItem() {
  return (
    <div className="bg-[rgba(205,20,83,0.08)] relative shrink-0 w-full" data-name="notification-item">
      <div aria-hidden className="absolute border-[#f2f2f2] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[16px] relative size-full">
        <TopRow />
        <BottomRow />
      </div>
    </div>
  );
}

function Bell1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="bell">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="bell">
          <path d={svgPaths.p1033e080} id="Vector" stroke="var(--stroke-0, #BF0000)" strokeLinecap="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function TitleTime1() {
  return (
    <div className="content-stretch flex items-center justify-between leading-[normal] relative shrink-0 w-full whitespace-nowrap" data-name="title-time">
      <p className="font-['Inter:Bold',sans-serif] font-bold relative shrink-0 text-[#333] text-[12px]">Risk Level Increase</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#9c9c9c] text-[10px]">45 mins ago</p>
    </div>
  );
}

function ContentStack1() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic relative" data-name="content-stack">
      <TitleTime1 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[14px] overflow-hidden relative shrink-0 text-[#686868] text-[10px] text-ellipsis w-full">{`Project 'Stellar' has missing security documentation for the past two quarters.`}</p>
    </div>
  );
}

function TopRow1() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="top-row">
      <Bell1 />
      <ContentStack1 />
    </div>
  );
}

function StatusBadge1() {
  return (
    <div className="bg-[rgba(224,123,0,0.08)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-name="status-badge">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#e07b00] text-[10px] whitespace-nowrap">At Risk</p>
    </div>
  );
}

function BottomRow1() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="bottom-row">
      <StatusBadge1 />
    </div>
  );
}

function NotificationItem1() {
  return (
    <div className="bg-[rgba(0,0,0,0)] relative shrink-0 w-full" data-name="notification-item">
      <div aria-hidden className="absolute border-[#f2f2f2] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[16px] relative size-full">
        <TopRow1 />
        <BottomRow1 />
      </div>
    </div>
  );
}

function Bell2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="bell">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="bell">
          <path d={svgPaths.p1033e080} id="Vector" stroke="var(--stroke-0, #BF0000)" strokeLinecap="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function TitleTime2() {
  return (
    <div className="content-stretch flex items-center justify-between leading-[normal] relative shrink-0 w-full whitespace-nowrap" data-name="title-time">
      <p className="font-['Inter:Bold',sans-serif] font-bold relative shrink-0 text-[#333] text-[12px]">Vendor Audit Complete</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#9c9c9c] text-[10px]">2 hours ago</p>
    </div>
  );
}

function ContentStack2() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic relative" data-name="content-stack">
      <TitleTime2 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[14px] overflow-hidden relative shrink-0 text-[#686868] text-[10px] text-ellipsis w-full">Global Logisitics Inc has successfully submitted all required tax compliance forms.</p>
    </div>
  );
}

function TopRow2() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="top-row">
      <Bell2 />
      <ContentStack2 />
    </div>
  );
}

function StatusBadge2() {
  return (
    <div className="bg-[rgba(21,128,61,0.08)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-name="status-badge">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#15803d] text-[10px] whitespace-nowrap">Resolved</p>
    </div>
  );
}

function BottomRow2() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="bottom-row">
      <StatusBadge2 />
    </div>
  );
}

function NotificationItem2() {
  return (
    <div className="bg-[rgba(0,0,0,0)] relative shrink-0 w-full" data-name="notification-item">
      <div aria-hidden className="absolute border-[#f2f2f2] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[16px] relative size-full">
        <TopRow2 />
        <BottomRow2 />
      </div>
    </div>
  );
}

function Bell3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="bell">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="bell">
          <path d={svgPaths.p1033e080} id="Vector" stroke="var(--stroke-0, #BF0000)" strokeLinecap="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function TitleTime3() {
  return (
    <div className="content-stretch flex items-center justify-between leading-[normal] relative shrink-0 w-full whitespace-nowrap" data-name="title-time">
      <p className="font-['Inter:Bold',sans-serif] font-bold relative shrink-0 text-[#333] text-[12px]">Policy Update Alert</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#9c9c9c] text-[10px]">3 hours ago</p>
    </div>
  );
}

function ContentStack3() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic relative" data-name="content-stack">
      <TitleTime3 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[14px] overflow-hidden relative shrink-0 text-[#686868] text-[10px] text-ellipsis w-full">New GDPR guidelines require immediate update to customer data handling procedures.</p>
    </div>
  );
}

function TopRow3() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="top-row">
      <Bell3 />
      <ContentStack3 />
    </div>
  );
}

function StatusBadge3() {
  return (
    <div className="bg-[rgba(224,123,0,0.08)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-name="status-badge">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#e07b00] text-[10px] whitespace-nowrap">At Risk</p>
    </div>
  );
}

function BottomRow3() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="bottom-row">
      <StatusBadge3 />
    </div>
  );
}

function NotificationItem3() {
  return (
    <div className="bg-[rgba(0,0,0,0)] relative shrink-0 w-full" data-name="notification-item">
      <div aria-hidden className="absolute border-[#f2f2f2] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[16px] relative size-full">
        <TopRow3 />
        <BottomRow3 />
      </div>
    </div>
  );
}

function Bell4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="bell">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="bell">
          <path d={svgPaths.p1033e080} id="Vector" stroke="var(--stroke-0, #BF0000)" strokeLinecap="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function TitleTime4() {
  return (
    <div className="content-stretch flex items-center justify-between leading-[normal] relative shrink-0 w-full whitespace-nowrap" data-name="title-time">
      <p className="font-['Inter:Bold',sans-serif] font-bold relative shrink-0 text-[#333] text-[12px]">System Outage Notification</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#9c9c9c] text-[10px]">5 hours ago</p>
    </div>
  );
}

function ContentStack4() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic relative" data-name="content-stack">
      <TitleTime4 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[14px] overflow-hidden relative shrink-0 text-[#686868] text-[10px] text-ellipsis w-full">The compliance engine was down for maintenance but is now fully operational.</p>
    </div>
  );
}

function TopRow4() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="top-row">
      <Bell4 />
      <ContentStack4 />
    </div>
  );
}

function StatusBadge4() {
  return (
    <div className="bg-[rgba(21,128,61,0.08)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-name="status-badge">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#15803d] text-[10px] whitespace-nowrap">Resolved</p>
    </div>
  );
}

function BottomRow4() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="bottom-row">
      <StatusBadge4 />
    </div>
  );
}

function NotificationItem4() {
  return (
    <div className="bg-[rgba(0,0,0,0)] relative shrink-0 w-full" data-name="notification-item">
      <div aria-hidden className="absolute border-[#f2f2f2] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[16px] relative size-full">
        <TopRow4 />
        <BottomRow4 />
      </div>
    </div>
  );
}

function Bell5() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="bell">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="bell">
          <path d={svgPaths.p1033e080} id="Vector" stroke="var(--stroke-0, #BF0000)" strokeLinecap="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function TitleTime5() {
  return (
    <div className="content-stretch flex items-center justify-between leading-[normal] relative shrink-0 w-full whitespace-nowrap" data-name="title-time">
      <p className="font-['Inter:Bold',sans-serif] font-bold relative shrink-0 text-[#333] text-[12px]">Missing Record Audit</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#9c9c9c] text-[10px]">1 day ago</p>
    </div>
  );
}

function ContentStack5() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic relative" data-name="content-stack">
      <TitleTime5 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[14px] overflow-hidden relative shrink-0 text-[#686868] text-[10px] text-ellipsis w-full">Transaction ID #TX-9920 has no associated proof of purchase or approval stamp.</p>
    </div>
  );
}

function TopRow5() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="top-row">
      <Bell5 />
      <ContentStack5 />
    </div>
  );
}

function StatusBadge5() {
  return (
    <div className="bg-[rgba(191,0,0,0.08)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-name="status-badge">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#bf0000] text-[10px] whitespace-nowrap">Breached</p>
    </div>
  );
}

function BottomRow5() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="bottom-row">
      <StatusBadge5 />
    </div>
  );
}

function NotificationItem5() {
  return (
    <div className="bg-[rgba(0,0,0,0)] relative shrink-0 w-full" data-name="notification-item">
      <div aria-hidden className="absolute border-[#f2f2f2] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[16px] relative size-full">
        <TopRow5 />
        <BottomRow5 />
      </div>
    </div>
  );
}

function Bell6() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="bell">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="bell">
          <path d={svgPaths.p1033e080} id="Vector" stroke="var(--stroke-0, #BF0000)" strokeLinecap="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function TitleTime6() {
  return (
    <div className="content-stretch flex items-center justify-between leading-[normal] relative shrink-0 w-full whitespace-nowrap" data-name="title-time">
      <p className="font-['Inter:Bold',sans-serif] font-bold relative shrink-0 text-[#333] text-[12px]">Data Privacy Concern</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#9c9c9c] text-[10px]">2 days ago</p>
    </div>
  );
}

function ContentStack6() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic relative" data-name="content-stack">
      <TitleTime6 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[14px] overflow-hidden relative shrink-0 text-[#686868] text-[10px] text-ellipsis w-full">User data from the last survey was shared without proper anonymization measures in place.</p>
    </div>
  );
}

function TopRow6() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="top-row">
      <Bell6 />
      <ContentStack6 />
    </div>
  );
}

function StatusBadge6() {
  return (
    <div className="bg-[rgba(191,0,0,0.08)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-name="status-badge">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#bf0000] text-[10px] whitespace-nowrap">At Risk</p>
    </div>
  );
}

function BottomRow6() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="bottom-row">
      <StatusBadge6 />
    </div>
  );
}

function NotificationItem6() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="notification-item">
      <div aria-hidden className="absolute border-[#f2f2f2] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[16px] relative size-full">
        <TopRow6 />
        <BottomRow6 />
      </div>
    </div>
  );
}

function NotificationList() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Notification-List">
      <NotificationItem />
      <NotificationItem1 />
      <NotificationItem2 />
      <NotificationItem3 />
      <NotificationItem4 />
      <NotificationItem5 />
      <NotificationItem6 />
    </div>
  );
}

function LeftPanel() {
  return (
    <div className="bg-white h-[909px] relative rounded-[8px] shrink-0 w-[380px]" data-name="Left-Panel">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <PanelHeader />
        <FilterRow />
        <NotificationList />
      </div>
      <div aria-hidden className="absolute border border-[#dadada] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function StatusBadge7() {
  return (
    <div className="bg-[rgba(191,0,0,0.08)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-name="status-badge">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#bf0000] text-[10px] whitespace-nowrap">Breached</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-[#f2f2f2] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Frame">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#686868] text-[10px] whitespace-nowrap">FINANCE</p>
    </div>
  );
}

function HeaderMeta() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="header-meta">
      <StatusBadge7 />
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#9c9c9c] text-[11px] whitespace-nowrap">Received: Oct 24, 2024 • 10:14 AM</p>
      <Frame2 />
    </div>
  );
}

function DetailHeader() {
  return (
    <div className="relative shrink-0 w-full" data-name="Detail-Header">
      <div aria-hidden className="absolute border-[#f2f2f2] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[24px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[24px] min-w-full not-italic relative shrink-0 text-[#333] text-[18px] w-[min-content]">Compliance Breach Detected — Invoice #INV-2024-0892</p>
        <HeaderMeta />
      </div>
    </div>
  );
}

function MetaChip() {
  return (
    <div className="bg-[#f2f2f2] content-stretch flex gap-[4px] items-start px-[10px] py-[4px] relative rounded-[4px] shrink-0" data-name="meta-chip">
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#686868]">Severity:</p>
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold relative shrink-0 text-[#333]">Critical</p>
    </div>
  );
}

function MetaChip1() {
  return (
    <div className="bg-[#f2f2f2] content-stretch flex gap-[4px] items-start px-[10px] py-[4px] relative rounded-[4px] shrink-0" data-name="meta-chip">
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#686868]">Category:</p>
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold relative shrink-0 text-[#333]">Invoicing</p>
    </div>
  );
}

function MetaChip2() {
  return (
    <div className="bg-[#f2f2f2] content-stretch flex gap-[4px] items-start px-[10px] py-[4px] relative rounded-[4px] shrink-0" data-name="meta-chip">
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#686868]">Source:</p>
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold relative shrink-0 text-[#333]">AI Engine</p>
    </div>
  );
}

function MetaChip3() {
  return (
    <div className="bg-[#f2f2f2] content-stretch flex gap-[4px] items-start px-[10px] py-[4px] relative rounded-[4px] shrink-0" data-name="meta-chip">
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#686868]">Assigned To:</p>
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold relative shrink-0 text-[#333]">John Smith</p>
    </div>
  );
}

function MetaRow() {
  return (
    <div className="relative shrink-0 w-full" data-name="Meta-Row">
      <div className="[word-break:break-word] content-stretch flex gap-[12px] items-start leading-[normal] not-italic p-[16px] relative size-full text-[11px] whitespace-nowrap">
        <MetaChip />
        <MetaChip1 />
        <MetaChip2 />
        <MetaChip3 />
      </div>
    </div>
  );
}

function AlertSummary() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-start not-italic relative shrink-0 text-[13px] w-full" data-name="Alert-Summary">
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#333] uppercase whitespace-nowrap">Alert Summary</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] min-w-full relative shrink-0 text-[#686868] w-[min-content]">{`This invoice was flagged by the IntelliSight automated monitoring engine due to a deviation from established corporate spending limits. The transaction originated from the R&D department and involves an international software licensing fee. Per current policy, any single transaction exceeding $50,000 USD requires secondary VP-level approval, which was not detected in the current audit trail.`}</p>
    </div>
  );
}

function TableHead() {
  return (
    <div className="bg-[#f2f2f2] relative shrink-0 w-full" data-name="Table-Head">
      <div aria-hidden className="absolute border-[#dadada] border-b border-solid inset-0 pointer-events-none" />
      <div className="[word-break:break-word] content-stretch flex font-['Inter:Bold',sans-serif] font-bold items-start leading-[normal] not-italic px-[16px] py-[10px] relative size-full text-[#686868] text-[11px]">
        <p className="flex-[1_0_0] min-w-px relative">RECORD ID</p>
        <p className="relative shrink-0 w-[120px]">AMOUNT</p>
        <p className="relative shrink-0 w-[100px]">STATUS</p>
      </div>
    </div>
  );
}

function StatusBadge8() {
  return (
    <div className="bg-[rgba(191,0,0,0.08)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-name="status-badge">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#bf0000] text-[10px] whitespace-nowrap">Breached</p>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-[100px]" data-name="Frame">
      <StatusBadge8 />
    </div>
  );
}

function RecordRow() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="record-row">
      <div aria-hidden className="absolute border-[#dadada] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
          <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[normal] min-w-px not-italic relative text-[#333] text-[12px]">#INV-2024-0892</p>
          <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#333] text-[12px] w-[120px]">$124,500.00</p>
          <Frame3 />
        </div>
      </div>
    </div>
  );
}

function StatusBadge9() {
  return (
    <div className="bg-[rgba(224,123,0,0.08)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-name="status-badge">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#e07b00] text-[10px] whitespace-nowrap">At Risk</p>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-[100px]" data-name="Frame">
      <StatusBadge9 />
    </div>
  );
}

function RecordRow1() {
  return (
    <div className="bg-[#f9fafb] relative shrink-0 w-full" data-name="record-row">
      <div aria-hidden className="absolute border-[#dadada] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
          <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[normal] min-w-px not-italic relative text-[#333] text-[12px]">#PO-8812-RD</p>
          <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#333] text-[12px] w-[120px]">$0.00</p>
          <Frame4 />
        </div>
      </div>
    </div>
  );
}

function StatusBadge10() {
  return (
    <div className="bg-[rgba(21,128,61,0.08)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-name="status-badge">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#15803d] text-[10px] whitespace-nowrap">Resolved</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-[100px]" data-name="Frame">
      <StatusBadge10 />
    </div>
  );
}

function RecordRow2() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="record-row">
      <div aria-hidden className="absolute border-[#dadada] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
          <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[normal] min-w-px not-italic relative text-[#333] text-[12px]">#VEND-LOG-01</p>
          <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#333] text-[12px] w-[120px]">N/A</p>
          <Frame6 />
        </div>
      </div>
    </div>
  );
}

function Table() {
  return (
    <div className="relative rounded-[6px] shrink-0 w-full" data-name="Table">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <TableHead />
        <RecordRow />
        <RecordRow1 />
        <RecordRow2 />
      </div>
      <div aria-hidden className="absolute border border-[#dadada] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function AffectedRecords() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Affected-Records">
      <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[#333] text-[13px] uppercase whitespace-nowrap">Affected Records</p>
      <Table />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[3px] shrink-0 size-[18px]" data-name="Frame">
      <div aria-hidden className="absolute border border-[#dadada] border-solid inset-0 pointer-events-none rounded-[3px]" />
      <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[#bf0000] text-[10px] whitespace-nowrap">1</p>
    </div>
  );
}

function ActionItem() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="action-item">
      <Frame8 />
      <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[normal] min-w-px not-italic relative text-[#333] text-[12px]">{`Verify secondary approval documentation with R&D project lead.`}</p>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[3px] shrink-0 size-[18px]" data-name="Frame">
      <div aria-hidden className="absolute border border-[#dadada] border-solid inset-0 pointer-events-none rounded-[3px]" />
      <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[#bf0000] text-[10px] whitespace-nowrap">2</p>
    </div>
  );
}

function ActionItem1() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="action-item">
      <Frame9 />
      <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[normal] min-w-px not-italic relative text-[#333] text-[12px]">Initiate manual override if VP approval was obtained via external channels.</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[3px] shrink-0 size-[18px]" data-name="Frame">
      <div aria-hidden className="absolute border border-[#dadada] border-solid inset-0 pointer-events-none rounded-[3px]" />
      <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[#bf0000] text-[10px] whitespace-nowrap">3</p>
    </div>
  );
}

function ActionItem2() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="action-item">
      <Frame10 />
      <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[normal] min-w-px not-italic relative text-[#333] text-[12px]">Escalate to Regional Compliance Officer for final transaction clearance.</p>
    </div>
  );
}

function ActionList() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Action-List">
      <ActionItem />
      <ActionItem1 />
      <ActionItem2 />
    </div>
  );
}

function RecommendedActions() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Recommended-Actions">
      <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[#333] text-[13px] uppercase whitespace-nowrap">Recommended Actions</p>
      <ActionList />
    </div>
  );
}

function DetailBody() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="Detail-Body">
      <div className="content-stretch flex flex-col gap-[32px] items-start p-[24px] relative size-full">
        <AlertSummary />
        <AffectedRecords />
        <RecommendedActions />
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex items-start px-[24px] py-[10px] relative rounded-[6px] shrink-0" data-name="Frame">
      <div aria-hidden className="absolute border border-[#dadada] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#686868] text-[13px] whitespace-nowrap">Dismiss Alert</p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="bg-[#bf0000] content-stretch flex items-start px-[24px] py-[10px] relative rounded-[6px] shrink-0" data-name="Frame">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[13px] text-white whitespace-nowrap">{`Accept & Resolve`}</p>
    </div>
  );
}

function DetailFooter() {
  return (
    <div className="relative shrink-0 w-full" data-name="Detail-Footer">
      <div aria-hidden className="absolute border-[#f2f2f2] border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-row justify-end size-full">
        <div className="content-stretch flex gap-[12px] items-start justify-end p-[20px] relative size-full">
          <Frame11 />
          <Frame12 />
        </div>
      </div>
    </div>
  );
}

function RightPanel() {
  return (
    <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[8px] self-stretch" data-name="Right-Panel">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <DetailHeader />
        <MetaRow />
        <DetailBody />
        <DetailFooter />
      </div>
      <div aria-hidden className="absolute border border-[#dadada] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function PanelsContainer() {
  return (
    <div className="content-stretch flex gap-[24px] items-start min-h-[800px] relative shrink-0 w-full" data-name="Panels-Container">
      <LeftPanel />
      <RightPanel />
    </div>
  );
}

function ContentWrapper() {
  return (
    <div className="relative shrink-0 w-full" data-name="Content-Wrapper">
      <div className="content-stretch flex flex-col gap-[24px] items-start p-[14px] relative size-full">
        <PanelsContainer />
      </div>
    </div>
  );
}

export default function NotificationPageDesktop() {
  return (
    <div className="bg-[#f9fafc] content-stretch flex flex-col items-start relative size-full" data-name="Notification-page-Desktop">
      <div className="h-[64px] relative shrink-0 w-[1440px]" data-name="Intellisight Header">
        <div className="absolute bg-white inset-0" />
        <Group2 />
        <Frame16 />
        <Group1 />
        <div className="absolute h-0 left-0 top-[64px] w-[1440px]">
          <div className="absolute inset-[-1px_0_0_0]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1440 1">
              <line id="Line 347" stroke="var(--stroke-0, #F2F2F2)" x2="1440" y1="0.5" y2="0.5" />
            </svg>
          </div>
        </div>
        <SearchBarDefault />
      </div>
      <ContentWrapper />
    </div>
  );
}