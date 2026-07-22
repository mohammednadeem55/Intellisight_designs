import svgPaths from "./svg-ghyavcwom4";
import imgLeftPanel from "./17e78b7b41621dd481ed133d49944eb83c5f8836.png";

function Group() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Group 7237">
          <circle cx="12" cy="12" fill="var(--fill-0, #BA1C1C)" id="Ellipse" r="12" />
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="Ellipse_2" r="5.33333" />
        </g>
      </svg>
    </div>
  );
}

function Wordmark() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Wordmark">
      <Group />
      <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[26px] text-white tracking-[0.5px] whitespace-nowrap">IntelliSight</p>
    </div>
  );
}

function Hero() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start not-italic relative shrink-0 w-full" data-name="Hero">
      <div className="font-['Inter:Bold',sans-serif] font-bold leading-[0] relative shrink-0 text-[52px] text-white w-full">
        <p className="leading-[1.1] mb-0">Access your</p>
        <p className="leading-[1.1] mb-0">intelligence</p>
        <p className="leading-[1.1]">platform.</p>
      </div>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.5] max-w-[340px] relative shrink-0 text-[15px] text-[rgba(255,255,255,0.7)] w-full">Secure, role-based access for your entire organization.</p>
    </div>
  );
}

function Lock() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="lock">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g clipPath="url(#clip0_1_36)" id="lock">
          <path d={svgPaths.p1e35b300} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeOpacity="0.501961" strokeWidth="2" />
        </g>
        <defs>
          <clipPath id="clip0_1_36">
            <rect fill="white" height="12" width="12" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function SecurityTagline() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Security Tagline">
      <Lock />
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap">Enterprise-grade security · SOC 2 compliant</p>
    </div>
  );
}

function LeftPanel() {
  return (
    <div className="h-full relative shrink-0 w-[520px]" data-name="Left Panel">
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <img alt="" className="absolute max-w-none object-cover size-full" src={imgLeftPanel} />
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(5, 10, 31, 0.08) 0%, rgba(5, 10, 31, 0.25) 35%, rgba(5, 10, 36, 0.65) 62%, rgba(3, 8, 26, 0.88) 100%)" }} />
      </div>
      <div className="content-stretch flex flex-col items-start justify-between p-[56px] relative size-full">
        <Wordmark />
        <Hero />
        <SecurityTagline />
      </div>
    </div>
  );
}

function SignInButton() {
  return (
    <div className="bg-[#ba1c1c] content-stretch flex h-[52px] items-center justify-center overflow-clip px-[24px] relative rounded-[10px] shadow-[0px_4px_14px_0px_rgba(186,28,28,0.25)] shrink-0 w-[400px]" data-name="Sign In Button">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[15px] text-white whitespace-nowrap">Continue with SSO</p>
    </div>
  );
}

function SignupRow() {
  return (
    <div className="[word-break:break-word] content-stretch flex gap-[4px] items-center leading-[normal] not-italic overflow-clip relative shrink-0 text-[14px] w-full whitespace-nowrap" data-name="Signup Row">
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#6b7380]">New here?</p>
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold relative shrink-0 text-[#ba1c1c]">Sign Up</p>
    </div>
  );
}

function FormArea() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[260px] overflow-clip top-[405px]" data-name="Form Area">
      <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[40px] not-italic relative shrink-0 text-[#111827] text-[32px] whitespace-nowrap">Sign in</p>
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#6b7380] text-[15px] whitespace-nowrap">Welcome back to IntelliSight</p>
      <div className="h-[36px] relative shrink-0 w-[400px]" data-name="Rectangle" />
      <SignInButton />
      <div className="h-[28px] relative shrink-0 w-[400px]" data-name="Rectangle" />
      <SignupRow />
      <div className="h-[8px] relative shrink-0 w-[400px]" data-name="Rectangle" />
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] min-w-full not-italic relative shrink-0 text-[#9ca3b0] text-[12px] w-[min-content]">By signing in you agree to our Terms of Service and Privacy Policy</p>
    </div>
  );
}

function RightPanel() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-w-px overflow-clip relative" data-name="Right Panel">
      <FormArea />
    </div>
  );
}

export default function IntelliSightEmailLogin() {
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-name="IntelliSight Email Login">
      <LeftPanel />
      <RightPanel />
    </div>
  );
}