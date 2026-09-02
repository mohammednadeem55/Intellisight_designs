import svgPaths from "@/imports/IntelliSightEmailLogin/svg-ghyavcwom4";
import imgLeftPanel from "@/imports/IntelliSightEmailLogin/17e78b7b41621dd481ed133d49944eb83c5f8836.png";

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

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="bg-white flex items-stretch size-full min-h-screen">
      {/* Left panel — hidden below md, and given a floor width past lg so it never gets squeezed */}
      <div className="hidden md:block h-full relative shrink-0 w-[40%] lg:w-[45%] max-w-[520px]">
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
        <div className="flex flex-col items-start justify-between p-8 lg:p-14 relative size-full">
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

      {/* Right panel — scrolls internally so short viewports never clip the form */}
      <div className="flex-1 min-w-0 flex items-center justify-center px-5 py-8 sm:px-6 sm:py-12 md:px-12 overflow-y-auto">
        <div className="flex flex-col items-start w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 sm:mb-10 md:hidden">
            <LogoMark />
            <p className="font-bold text-[22px] text-[#111827] tracking-[0.4px]">IntelliSight</p>
          </div>

          <p className="font-bold text-[26px] sm:text-[32px] text-[#111827] leading-tight sm:leading-10">Sign in</p>
          <p className="font-normal text-[15px] text-[#6b7380] mt-1">
            Welcome back to IntelliSight
          </p>

          <div className="h-7 sm:h-9" />

          <button
            onClick={onLogin}
            className="bg-[#ba1c1c] flex h-[52px] items-center justify-center w-full rounded-[8px] shadow-[0px_4px_14px_0px_rgba(186,28,28,0.25)] cursor-pointer transition-opacity hover:opacity-90 active:opacity-80"
          >
            <p className="font-semibold text-[15px] text-white">Continue with SSO</p>
          </button>

          <div className="h-6 sm:h-7" />

          <div className="flex gap-1 items-center flex-wrap">
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
