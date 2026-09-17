import { useCallback, useEffect, useState } from "react";

// Mock extraction-review data for the CCC Creation step — matched/review/missing per field, same shape
// regardless of section, so one field component can render all three states consistently. `resolvedFrom`
// is set when a review/missing field gets resolved (Use / Apply) so it can be reverted back to that state
// without losing the original extracted/systemValue/suggestions data. `readOnly` covers fields the CCC
// Request object itself populates (system/auto timestamps, ids) that were never editable here in the first
// place — no revert affordance, no "missing" red state, since there's nothing for a CSR to resolve.
export type CccFieldStatus = "matched" | "review" | "missing";
// Who originally populates this field on the real CCC Request object, per the BPA-provided field
// reference — shown as a small badge so a CSR can tell at a glance whether something is AI output to
// sanity-check vs. a field that's always been theirs (or Auto/System/JitterBit) to fill in.
export type CccFieldSource = "AI" | "Auto" | "System" | "CSR" | "JitterBit";
export type CccField = {
  label: string;
  status: CccFieldStatus;
  value: string; // matched — the current, editable value
  source?: CccFieldSource;
  extracted?: string; // review — the extracted value
  systemValue?: string; // review — the trusted/system-of-record value; if absent, there's nothing to compare and the field is just editable
  suggestions?: string[]; // missing — AI-suggested values to pick from; omit/empty for no suggestions
  resolvedFrom?: "review" | "missing"; // set once Use/Apply is clicked — enables the revert icon
  edited?: boolean; // review — user has typed into the extracted value directly, without resolving via Use yet
  originalValue?: string; // matched, direct-edit case — the pre-edit value, so it can be reverted to
  readOnly?: boolean; // system/auto-populated on the CCC Request object — display only, not part of the review workflow
};

// Type of Enquiry (AI classified) — the eligible values depend on which track the request falls under;
// Trade and Work Order each have their own fixed list, per the BPA-provided reference.
export type EnquiryTrack = "Trade" | "Work Order";
export const ENQUIRY_TYPE_OPTIONS: Record<EnquiryTrack, string[]> = {
  Trade: ["Order Status", "Shipment Status", "Pricing", "Invoicing", "Miscellaneous", "Credit Card Payment", "Direct Contact", "Export Information", "Service Availability", "CCR Team", "SSD Change"],
  "Work Order": ["Order", "Service", "Pickup", "Shipment", "Tracking", "Pricing", "Capability", "Cal Certification/ Documentation", "Invoice", "Miscellaneous", "Credit Card Payment"],
};

export type CccExtractionData = {
  owner: string;
  cccRequestNumber: string;
  enquiryTrack: EnquiryTrack;
  typeOfEnquiry: string;
  requestFields: CccField[];
  accountFields: CccField[];
  opportunityFields: CccField[];
  numberFields: CccField[];
  orderFields: CccField[];
  statusFields: CccField[];
  oaFields: CccField[];
  legacyFields: CccField[];
  additionalInfoFields: CccField[];
  productNumbers: string[];
  shipTo: { company: string; address: string; cityState: string; country: string };
  documents: { name: string; size: string }[];
};

// Seeded from a real CCC Request reference screen (Thales Deutschland GmbH / CCC-2685812) so the mock data
// reads as an honest example rather than placeholder lorem ipsum.
const MOCK_EXTRACTION: CccExtractionData = {
  owner: "Jitterbit User",
  cccRequestNumber: "CCC-2685812",
  enquiryTrack: "Trade",
  typeOfEnquiry: "Order Status",
  requestFields: [
    { label: "Type", status: "matched", value: "Order Request", source: "AI" },
    { label: "Subtype", status: "matched", value: "TRADE_SALES", source: "AI" },
    { label: "Status", status: "matched", value: "New", source: "AI" },
    { label: "Awaiting Reason", status: "missing", value: "", source: "CSR" },
    { label: "Priority", status: "matched", value: "1 Business Day", readOnly: true, source: "Auto" },
    { label: "Received Date and Time", status: "matched", value: "07/09/2026, 1:30 PM", readOnly: true, source: "AI" },
    { label: "Due Date and Time", status: "missing", value: "", readOnly: true, source: "Auto" },
    { label: "Time Remaining", status: "matched", value: "", readOnly: true, source: "Auto" },
    { label: "Business Group", status: "missing", value: "", readOnly: true, source: "Auto" },
    { label: "Origin", status: "missing", value: "", source: "AI" },
  ],
  accountFields: [
    { label: "Account Name", status: "matched", value: "Thales Deutschland GmbH", source: "AI" },
    { label: "Account Address", status: "matched", value: "Thalesplatz 1; DITZINGEN DE", source: "AI" },
    { label: "Account Address Details", status: "matched", value: "Thalesplatz 1, DITZINGEN, 71254 Germany", source: "AI" },
    { label: "Account Address OU", status: "matched", value: "DES-OU-0653", readOnly: true, source: "Auto" },
    { label: "Contact", status: "missing", value: "", source: "AI" },
    { label: "Contact Phone", status: "missing", value: "", source: "AI" },
    { label: "Contact Email", status: "missing", value: "", source: "AI" },
    { label: "FE Code", status: "matched", value: "83AZMT", readOnly: true, source: "Auto" },
  ],
  opportunityFields: [
    { label: "Opportunity", status: "matched", value: "OPP-01505189_Thales DZ_Meintis NFA PXA + Distri (DUPLICATE WITH OPP-01473514 !!!) Keep this, kill the other /rb", source: "AI" },
    { label: "Opportunity Id", status: "matched", value: "OPP-01505189", readOnly: true, source: "Auto" },
    { label: "Bill to Account", status: "missing", value: "", source: "AI" },
    { label: "Bill to Account Address", status: "missing", value: "", source: "AI" },
  ],
  numberFields: [
    { label: "PO Number", status: "matched", value: "1514444", source: "AI" },
    { label: "Quote Number", status: "missing", value: "", suggestions: ["10083C-001", "Q-2026-441"], source: "AI" },
    { label: "Ship Number", status: "missing", value: "", source: "AI" },
    { label: "Sales Order", status: "missing", value: "", source: "AI" },
    { label: "Order #", status: "missing", value: "", source: "AI" },
    { label: "Web Order #", status: "missing", value: "", source: "JitterBit" },
    { label: "Asset #", status: "missing", value: "", source: "AI" },
    { label: "Quantity", status: "missing", value: "", source: "AI" },
  ],
  orderFields: [
    { label: "Customer Request Date on PO", status: "matched", value: "03 Aug 2026", source: "System" },
    { label: "Quote Expiry", status: "missing", value: "", source: "AI" },
    { label: "Payment Terms", status: "review", value: "", extracted: "Net 30", source: "AI" },
    { label: "PO Amount", status: "missing", value: "", source: "AI" },
    { label: "Currency", status: "missing", value: "", source: "AI" },
    { label: "Final Destination Country", status: "missing", value: "", source: "AI" },
    { label: "Current Month Bookable Amount", status: "missing", value: "", source: "AI" },
    { label: "Sending Instruction", status: "missing", value: "", source: "AI" },
  ],
  statusFields: [
    { label: "Status Notes", status: "missing", value: "", source: "CSR" },
    { label: "FE Comments", status: "missing", value: "", source: "CSR" },
  ],
  oaFields: [
    { label: "OA Status", status: "matched", value: "Completed", readOnly: true, source: "System" },
    { label: "OA Summary", status: "matched", value: "17/21 Passed", readOnly: true, source: "System" },
  ],
  legacyFields: [
    { label: "Legacy Case ID", status: "missing", value: "", source: "CSR" },
    { label: "Legacy Case #", status: "missing", value: "", source: "CSR" },
  ],
  additionalInfoFields: [
    { label: "Created By", status: "matched", value: "Jitterbit User", readOnly: true, source: "System" },
    { label: "Assigned TAT", status: "matched", value: "07/10/2026, 1:30 PM", readOnly: true, source: "System" },
    { label: "Last Modified By", status: "matched", value: "Jitterbit User", readOnly: true, source: "System" },
    { label: "Date/Time Closed", status: "matched", value: "", readOnly: true, source: "System" },
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
