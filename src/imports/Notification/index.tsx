import svgPaths from "./svg-ysaztztd8j";

function BadgePillBadgeComponent() {
  return (
    <div className="bg-[#bf0000] content-stretch flex flex-col items-center px-[4px] relative rounded-[40px] shrink-0" data-name="Badge Pill/Badge Component">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap">
        <p className="leading-[16px]">8</p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[5px] h-[21px] items-center py-px relative shrink-0">
      <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[21px] not-italic relative shrink-0 text-[#333] text-[14px] whitespace-nowrap">Notifications</p>
      <BadgePillBadgeComponent />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex items-center justify-between overflow-x-auto overflow-y-clip relative shrink-0 w-full">
      <Frame3 />
      <div className="content-stretch flex gap-[10px] items-center justify-center relative rounded-[12px] shrink-0 size-[18px]" data-name="IconBase">
        <div className="flex-[1_0_0] h-full min-w-px relative" data-name="Weight=Bold">
          <div className="absolute inset-[17.17%_17.18%_17.18%_17.18%]" data-name="Vector">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.8168 11.8175">
              <path d={svgPaths.p25e81000} fill="var(--fill-0, #525252)" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelHeader() {
  return (
    <div className="relative shrink-0 w-full" data-name="Model Header">
      <div className="flex flex-col items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[14px] items-center justify-center pt-[14px] px-[14px] relative size-full">
          <Frame />
          <div className="h-0 relative shrink-0 w-full">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 292 1">
                <line id="Line 3" stroke="var(--stroke-0, #F2F2F2)" x2="292" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="[word-break:break-word] content-stretch flex items-center justify-between not-italic relative shrink-0 w-full whitespace-nowrap">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-none relative shrink-0 text-[#292929] text-[13px]">Notification title</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#7c7c7c] text-[11px]">10 mins ago</p>
    </div>
  );
}

function TextBase() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="TextBase">
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[1.5] not-italic relative shrink-0 text-[#525252] text-[12px] w-full">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem</p>
    </div>
  );
}

function Button() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#292929] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[20px]">Dismiss</p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#cd1453] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[20px]">Accept/View</p>
      </div>
    </div>
  );
}

function TextBase1() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="TextBase">
      <Button />
      <Button1 />
    </div>
  );
}

function Column() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-name="column">
      <Frame2 />
      <TextBase />
      <TextBase1 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex gap-[10px] items-center justify-center relative rounded-[4px] shrink-0 w-[28px]" data-name="IconBase">
        <div className="flex-[1_0_0] h-[28px] min-w-px relative" data-name="Weight=Regular">
          <div className="absolute inset-[12.5%_12.5%_9.38%_9.37%]" data-name="Vector">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.8771 21.8736">
              <path d={svgPaths.p1227180} fill="var(--fill-0, #292929)" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
      <Column />
    </div>
  );
}

function Notification1() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="Notification">
      <div className="content-stretch flex flex-col gap-[12px] items-start pt-[14px] px-[14px] relative size-full">
        <Frame1 />
        <div className="h-0 relative shrink-0 w-full">
          <div className="absolute inset-[-1px_0_0_0]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 292 1">
              <line id="Line 3" stroke="var(--stroke-0, #F2F2F2)" x2="292" y1="0.5" y2="0.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="[word-break:break-word] content-stretch flex items-center justify-between not-italic relative shrink-0 w-full whitespace-nowrap">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-none relative shrink-0 text-[#292929] text-[13px]">Notification title</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#7c7c7c] text-[11px]">10 mins ago</p>
    </div>
  );
}

function TextBase2() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="TextBase">
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[1.5] not-italic relative shrink-0 text-[#525252] text-[12px] w-full">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem</p>
    </div>
  );
}

function Button2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#292929] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[20px]">Dismiss</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#cd1453] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[20px]">Accept/View</p>
      </div>
    </div>
  );
}

function TextBase3() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="TextBase">
      <Button2 />
      <Button3 />
    </div>
  );
}

function Column1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-name="column">
      <Frame7 />
      <TextBase2 />
      <TextBase3 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex gap-[10px] items-center justify-center relative rounded-[4px] shrink-0 w-[28px]" data-name="IconBase">
        <div className="flex-[1_0_0] h-[28px] min-w-px relative" data-name="Weight=Regular">
          <div className="absolute inset-[12.5%_12.5%_9.38%_9.37%]" data-name="Vector">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.8771 21.8736">
              <path d={svgPaths.p1227180} fill="var(--fill-0, #292929)" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
      <Column1 />
    </div>
  );
}

function Notification2() {
  return (
    <div className="bg-[rgba(205,20,83,0.08)] relative shrink-0 w-full" data-name="Notification">
      <div className="content-stretch flex flex-col gap-[12px] items-start pt-[14px] px-[14px] relative size-full">
        <Frame6 />
        <div className="h-0 relative shrink-0 w-full">
          <div className="absolute inset-[-1px_0_0_0]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 292 1">
              <line id="Line 3" stroke="var(--stroke-0, #F2F2F2)" x2="292" y1="0.5" y2="0.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame9() {
  return (
    <div className="[word-break:break-word] content-stretch flex items-center justify-between not-italic relative shrink-0 w-full whitespace-nowrap">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-none relative shrink-0 text-[#292929] text-[13px]">Notification title</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#7c7c7c] text-[11px]">10 mins ago</p>
    </div>
  );
}

function TextBase4() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="TextBase">
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[1.5] not-italic relative shrink-0 text-[#525252] text-[12px] w-full">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem</p>
    </div>
  );
}

function Button4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#292929] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[20px]">Dismiss</p>
      </div>
    </div>
  );
}

function Button5() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#cd1453] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[20px]">Accept/View</p>
      </div>
    </div>
  );
}

function TextBase5() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="TextBase">
      <Button4 />
      <Button5 />
    </div>
  );
}

function Column2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-name="column">
      <Frame9 />
      <TextBase4 />
      <TextBase5 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex gap-[10px] items-center justify-center relative rounded-[4px] shrink-0 w-[28px]" data-name="IconBase">
        <div className="flex-[1_0_0] h-[28px] min-w-px relative" data-name="Weight=Regular">
          <div className="absolute inset-[12.5%_12.5%_9.38%_9.37%]" data-name="Vector">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.8771 21.8736">
              <path d={svgPaths.p1227180} fill="var(--fill-0, #292929)" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
      <Column2 />
    </div>
  );
}

function Notification3() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="Notification">
      <div className="content-stretch flex flex-col gap-[12px] items-start pt-[14px] px-[14px] relative size-full">
        <Frame8 />
        <div className="h-0 relative shrink-0 w-full">
          <div className="absolute inset-[-1px_0_0_0]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 292 1">
              <line id="Line 3" stroke="var(--stroke-0, #F2F2F2)" x2="292" y1="0.5" y2="0.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative">
      <Notification1 />
      <Notification2 />
      <Notification3 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
      <Frame5 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-[1_0_0] h-[21px] items-center justify-center min-w-px py-px relative">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[21px] not-italic relative shrink-0 text-[#cd1453] text-[12px] whitespace-nowrap">View All</p>
    </div>
  );
}

function ModalFooter() {
  return (
    <div className="content-stretch flex h-[41px] items-center justify-between overflow-x-auto overflow-y-clip py-[10px] relative shrink-0 w-full" data-name="Modal footer">
      <Frame10 />
    </div>
  );
}

export default function Notification() {
  return (
    <div className="bg-white content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.3),0px_1px_1.5px_rgba(0,0,0,0.15)] flex flex-col items-start relative rounded-[4px] size-full" data-name="Notification">
      <ModelHeader />
      <Frame4 />
      <ModalFooter />
    </div>
  );
}