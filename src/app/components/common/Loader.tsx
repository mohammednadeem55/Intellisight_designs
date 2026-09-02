import intellisightLogo from "@/imports/IntellisightHeader/intellisight_logo.png";

// The Keysight wave mark itself, animated as a loader — it breathes in and out (scale + opacity) like a
// pulsing trace. See globals.css for the `ks-pulse` keyframes.
export function WaveLoader({ size = 32, className = "" }: { size?: number; className?: string }) {
  const width = (size * 104) / 80; // preserve the source PNG's aspect ratio (104x80)
  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`} style={{ width, height: size }} role="status" aria-label="Loading">
      <img src={intellisightLogo} alt="" className="size-full object-contain animate-ks-pulse" />
    </span>
  );
}

// Full-page loading state — same dark backdrop as the app's modals (bg-black/40), with the waveform
// centered over it. Used while an action (Proceed, Save, etc.) is "in flight" so the whole page reads as
// busy rather than just one button.
export function PageLoaderOverlay({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      <div className="flex flex-col items-center gap-4">
        <WaveLoader size={44} />
        <p className="text-[13px] font-medium text-white/90">{label}</p>
      </div>
    </div>
  );
}
