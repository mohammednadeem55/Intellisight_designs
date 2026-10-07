import { build } from "esbuild";
try {
  await build({
    entryPoints: ["src/app/pages/feedback-center/FeedbackAnalyticsPanel.tsx"],
    bundle: true,
    outfile: "./__analytics_panel_bundle.js",
    platform: "browser",
    jsx: "automatic",
    loader: { ".tsx": "tsx", ".ts": "ts" },
    external: ["react", "react-dom", "sonner", "lucide-react"],
    logLevel: "info",
  });
  console.log("BUILD OK");
} catch (e) {
  console.error("BUILD FAILED", e);
  process.exit(1);
}
