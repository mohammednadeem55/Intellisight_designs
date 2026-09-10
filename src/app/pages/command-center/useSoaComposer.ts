import { useCallback, useEffect, useState } from "react";

// Mock defaults for the SOA (Service Order Agreement) draft composer — the send-as addresses to choose
// from, the initial To/CC/BCC/Subject, and the list of email templates available to apply.
export type EmailTemplate = { label: string; country: string; language: string; recommended?: boolean; mostUsed?: boolean };
export type SoaComposerData = {
  fromOptions: string[];
  to: string[];
  subject: string;
  cc: string[];
  bcc: string[];
  templates: EmailTemplate[];
};

const MOCK_SOA_COMPOSER: SoaComposerData = {
  fromOptions: ["orders@intellisight.io", "trade-desk@intellisight.io", "support@intellisight.io", "no-reply@intellisight.io"],
  to: ["priya.shah@acme.com"],
  subject: "Service Order Agreement — Order ORD-88401732 (PO 304617)",
  cc: ["R. Nair - Order Desk", "trade.compliance@macom.com"],
  bcc: ["soa.archive@macom.com"],
  templates: [
    { label: "AP Standard SOA (EN)", country: "AP", language: "English", recommended: true },
    { label: "AP Summary SOA (EN)", country: "AP", language: "English", mostUsed: true },
    { label: "AP SOA with Export Conditions", country: "AP", language: "English" },
    { label: "AP SOA with Extended Warranty", country: "AP", language: "English" },
    { label: "AP SOA with Multi-Currency Terms", country: "AP", language: "English" },
    { label: "EMEA Standard SOA (EN)", country: "EMEA", language: "English" },
    { label: "EMEA SOA with Export Conditions", country: "EMEA", language: "English" },
    { label: "APAC Standard SOA (JP)", country: "APAC", language: "Japanese" },
    { label: "Service Renewal Agreement", country: "Global", language: "English" },
    { label: "Service Renewal with Extended Support", country: "Global", language: "English" },
    { label: "Custom Template — Legal Review", country: "Global", language: "English" },
  ],
};

// The one place that knows how to get the SOA composer defaults for a given email. Swap the body below
// for the real call once the endpoint exists — every consumer goes through useSoaComposer(), so this is
// the only edit needed:
//
//   async function fetchSoaComposer(emailId: string, signal: AbortSignal): Promise<SoaComposerData> {
//     const res = await fetch(`/api/emails/${encodeURIComponent(emailId)}/soa-composer`, { signal });
//     if (!res.ok) {
//       throw new Error(`Failed to load SOA composer data (${res.status} ${res.statusText})`);
//     }
//     const body: unknown = await res.json();
//     // TODO: validate `body`'s shape once the response contract is final.
//     return body as SoaComposerData;
//   }
async function fetchSoaComposer(_emailId: string, _signal: AbortSignal): Promise<SoaComposerData> {
  return MOCK_SOA_COMPOSER;
}

// Loading/error/reload state around fetchSoaComposer. Re-fetches whenever `emailId` changes, and uses
// AbortController so a stale request is actually cancelled rather than just ignored.
export function useSoaComposer(emailId: string) {
  const [data, setData] = useState<SoaComposerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    fetchSoaComposer(emailId, controller.signal)
      .then(rows => setData(rows))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return; // superseded by unmount/reload/emailId change
        setError(err instanceof Error ? err.message : "Failed to load SOA composer data");
      });
    return () => controller.abort();
  }, [emailId, reloadToken]);

  const reload = useCallback(() => setReloadToken(t => t + 1), []);

  return { data, loading: data === null && error === null, error, reload };
}
