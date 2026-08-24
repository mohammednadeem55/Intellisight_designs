import { useCallback, useEffect, useState } from "react";
import { type Email, ALL_EMAILS_WITH_CCC } from "./emailData";

// The one place that knows how to get a single email/CCC's detail. Swap the body below for the real call
// once the endpoint exists — every consumer goes through useWorkflowEmail(), so this is the only edit
// needed:
//
//   async function fetchEmailById(id: string, signal: AbortSignal): Promise<Email | null> {
//     const res = await fetch(`/api/emails/${encodeURIComponent(id)}`, { signal });
//     if (res.status === 404) return null;
//     if (!res.ok) {
//       throw new Error(`Failed to load ${id} (${res.status} ${res.statusText})`);
//     }
//     const body: unknown = await res.json();
//     // TODO: validate `body`'s shape once the response contract is final.
//     return body as Email;
//   }
async function fetchEmailById(id: string, _signal: AbortSignal): Promise<Email | null> {
  return ALL_EMAILS_WITH_CCC.find(e => e.id === id) ?? null;
}

// Loading/error/reload state around fetchEmailById, for the Email Details / workflow page. Re-fetches
// whenever `emailId` changes (navigating from one email's workflow straight to another's), and uses
// AbortController so a stale request is actually cancelled rather than just ignored.
export function useWorkflowEmail(emailId: string) {
  const [data, setData] = useState<Email | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    fetchEmailById(emailId, controller.signal)
      .then(row => {
        if (row) setData(row);
        else setError(`Email "${emailId}" was not found`);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return; // superseded by unmount/reload/emailId change
        setError(err instanceof Error ? err.message : "Failed to load this email");
      });
    return () => controller.abort();
  }, [emailId, reloadToken]);

  const reload = useCallback(() => setReloadToken(t => t + 1), []);

  return { data, loading: data === null && error === null, error, reload };
}
