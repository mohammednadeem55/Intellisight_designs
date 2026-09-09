import { useCallback, useEffect, useState } from "react";

// Mock extraction-review data for the CCC Creation step — matched/review/missing per field, same shape
// regardless of section, so one field component can render all three states consistently. `resolvedFrom`
// is set when a review/missing field gets resolved (Use / Apply) so it can be reverted back to that state
// without losing the original extracted/systemValue/suggestions data.
export type CccFieldStatus = "matched" | "review" | "missing";
export type CccField = {
  label: string;
  status: CccFieldStatus;
  value: string; // matched — the current, editable value
  extracted?: string; // review — the extracted value
  systemValue?: string; // review — the trusted/system-of-record value; if absent, there's nothing to compare and the field is just editable
  suggestions?: string[]; // missing — AI-suggested values to pick from; omit/empty for no suggestions
  resolvedFrom?: "review" | "missing"; // set once Use/Apply is clicked — enables the revert icon
  edited?: boolean; // review — user has typed into the extracted value directly, without resolving via Use yet
  originalValue?: string; // matched, direct-edit case — the pre-edit value, so it can be reverted to
};

export type CccExtractionData = {
  accountFields: CccField[];
  numberFields: CccField[];
  orderFields: CccField[];
  productNumbers: string[];
  shipTo: { company: string; address: string; cityState: string; country: string };
  documents: { name: string; size: string }[];
};

const MOCK_EXTRACTION: CccExtractionData = {
  accountFields: [
    { label: "Account Name", status: "matched", value: "Keysight Technology Solutions Inc." },
    { label: "Contact Name", status: "matched", value: "Julie Magner" },
    { label: "Email", status: "review", value: "", extracted: "julie.magner@macom.com.invalid", systemValue: "julie.magner@keysight.com" },
    { label: "Phone", status: "review", value: "", extracted: "+1 978 656-2514", systemValue: "+1 (978) 656-2500" },
    { label: "Job Title", status: "review", value: "", extracted: "VP of Engineering" },
    { label: "Address", status: "matched", value: "100 Chelmsford St, Lowell, MA 01851" },
    { label: "Shipping Instructions", status: "missing", value: "", suggestions: ["10083C-001", "10083C-002", "10083C-003"] },
    { label: "Address", status: "matched", value: "100 Chelmsford St, Lowell, MA 01851" },
    { label: "Billing Instructions", status: "missing", value: "" },
  ],
  numberFields: [
    { label: "PO Number", status: "matched", value: "1514444" },
    { label: "Quote Number", status: "missing", value: "", suggestions: ["10083C-001", "Q-2026-441"] },
    { label: "Ship Number", status: "missing", value: "" },
    { label: "Sales Order", status: "missing", value: "" },
  ],
  orderFields: [
    { label: "PO Date", status: "matched", value: "03 Aug 2026" },
    { label: "Quote Expiry", status: "missing", value: "" },
    { label: "Payment Terms", status: "review", value: "", extracted: "Net 30" },
  ],
  productNumbers: ["10083C-001", "20094D-002", "30056E-003"],
  shipTo: {
    company: "MACOM Technology Solutions Inc.",
    address: "100 Chelmsford Street",
    cityState: "Lowell, MA 01851",
    country: "United States",
  },
  documents: [{ name: "Order_details.pdf", size: "1.2 MB" }],
};

// The one place that knows how to get a CCC's extraction-review data for a given email. Swap the body
// below for the real call once the endpoint exists — every consumer goes through useCccExtraction(), so
// this is the only edit needed:
//
//   async function fetchCccExtraction(emailId: string, signal: AbortSignal): Promise<CccExtractionData> {
//     const res = await fetch(`/api/emails/${encodeURIComponent(emailId)}/ccc-extraction`, { signal });
//     if (!res.ok) {
//       throw new Error(`Failed to load extraction data (${res.status} ${res.statusText})`);
//     }
//     const body: unknown = await res.json();
//     // TODO: validate `body`'s shape once the response contract is final.
//     return body as CccExtractionData;
//   }
async function fetchCccExtraction(_emailId: string, _signal: AbortSignal): Promise<CccExtractionData> {
  return MOCK_EXTRACTION;
}

// Loading/error/reload state around fetchCccExtraction. Re-fetches whenever `emailId` changes, and uses
// AbortController so a stale request is actually cancelled rather than just ignored.
export function useCccExtraction(emailId: string) {
  const [data, setData] = useState<CccExtractionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    fetchCccExtraction(emailId, controller.signal)
      .then(rows => setData(rows))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return; // superseded by unmount/reload/emailId change
        setError(err instanceof Error ? err.message : "Failed to load extraction data");
      });
    return () => controller.abort();
  }, [emailId, reloadToken]);

  const reload = useCallback(() => setReloadToken(t => t + 1), []);

  return { data, loading: data === null && error === null, error, reload };
}
