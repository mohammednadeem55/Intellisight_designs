import { useCallback, useEffect, useState } from "react";
import { type Email, ALL_EMAILS_WITH_CCC } from "./emailData";

// The one place that knows how to get the worklist. Swap the body below for the real call once the
// endpoint exists — every consumer goes through useWorklistEmails(), so this is the only edit needed:
//
//   async function fetchWorklistEmails(signal: AbortSignal): Promise<Email[]> {
//     const res = await fetch("/api/worklist", { signal });
//     if (!res.ok) {
//       throw new Error(`Failed to load worklist (${res.status} ${res.statusText})`);
//     }
//     const body: unknown = await res.json();
//     if (!Array.isArray(body)) {
//       throw new Error("Worklist response was not a list");
//     }
//     return body as Email[]; // TODO: validate each row's shape once the response contract is final.
//   }
//
// The mock version below never actually rejects, so the error path below is currently unexercised —
// worth a manual check (temporarily throw here) once the real endpoint is wired in.
async function fetchWorklistEmails(_signal: AbortSignal): Promise<Email[]> {
  return ALL_EMAILS_WITH_CCC;
}

// Loading/error/reload state around fetchWorklistEmails, so pages render a real loading state instead of
// assuming data is there synchronously (which only worked because it used to be a static in-memory array).
// Uses AbortController rather than a boolean "cancelled" flag so a stale request is actually cancelled —
// not just ignored — when the component unmounts or reload() fires again before the first one settles.
export function useWorklistEmails() {
  const [data, setData] = useState<Email[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    fetchWorklistEmails(controller.signal)
      .then(rows => setData(rows))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return; // superseded by unmount/reload — not a real failure
        setError(err instanceof Error ? err.message : "Failed to load worklist");
      });
    return () => controller.abort();
  }, [reloadToken]);

  const reload = useCallback(() => setReloadToken(t => t + 1), []);

  return { data, loading: data === null && error === null, error, reload };
}
