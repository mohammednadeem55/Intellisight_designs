import { useCallback, useEffect, useState } from "react";

// Mock OA (Order Acknowledgement) validation results — a fixed set of automated checks run against the
// order, each either passed, failed, or flagged for manual review.
export type CheckStatus = "failed" | "warning" | "passed";
export type ValidationCheck = { label: string; status: CheckStatus; reason: string; recommendedAction?: string };

export type OrderValidationData = {
  failedAndReviewChecks: ValidationCheck[];
  passedChecks: ValidationCheck[];
  shipTo: { company: string; address: string; cityState: string; country: string };
  documents: { name: string; size: string }[];
  screeningStartedAt: string;
  screeningCompletedAt: string;
  poParsing: { matched: number; total: number; poNumber: string; lineItems: string; shipToAddress: string };
  salesForceQuote: { matched: number; total: number; quoteNumber: string; quoteOwner: string; approvalStatus: string };
};

// Counts kept internally consistent (5 failed/review + 18 passed = 23 total) so the column headers,
// sidebar stats, and "View More" counts all agree with each other.
const MOCK_VALIDATION: OrderValidationData = {
  failedAndReviewChecks: [
    {
      label: "Embassy and Sanctioned Country",
      status: "failed",
      reason: "Customer is located in a sanctioned country. Manual review and compliance officer approval required before proceeding.",
      recommendedAction: "Escalate to compliance team for review",
    },
    {
      label: "Customer Export Screening",
      status: "failed",
      reason: "Customer name partially matches an entry on the denied parties list. Requires manual clearance before booking.",
      recommendedAction: "Run a manual denied-party screening and attach clearance evidence",
    },
    {
      label: "Quote Validity",
      status: "warning",
      reason: "Quote QT-5000 expired 4 days ago. Pricing may no longer be valid.",
      recommendedAction: "Request an updated quote from the account manager",
    },
    {
      label: "Customer Name - PII vs Quote",
      status: "warning",
      reason: "Customer name on the PO differs slightly from the name on the quote (\"MACOM Technology Solutions Inc.\" vs \"MACOM Technology Solutions\").",
      recommendedAction: "Confirm the legal entity name matches before proceeding",
    },
    {
      label: "Currency Mismatch",
      status: "warning",
      reason: "PO currency (EUR) does not match the account's default currency (USD).",
      recommendedAction: "Confirm the correct currency with the customer",
    },
  ],
  passedChecks: [
    { label: "Non-English Language Check", status: "passed", reason: "All language checks passed successfully." },
    { label: "Purchase Order (PO) Format Check", status: "passed", reason: "PO format matches the expected schema for this account." },
    { label: "Country Comparison - PII vs Quote", status: "passed", reason: "Shipping country on the PO matches the country on the quote." },
    { label: "Typologies / Export Language", status: "passed", reason: "No restricted export terminology detected in the order description." },
    { label: "Accepting Legal Entity", status: "passed", reason: "The accepting legal entity is active and in good standing." },
    { label: "Duplicate Order Check", status: "passed", reason: "No duplicate orders found for this PO number in the last 90 days." },
    { label: "Credit Hold Status", status: "passed", reason: "Account has no active credit holds." },
    { label: "Product Export Classification (ECCN)", status: "passed", reason: "All line items have a valid export classification on file." },
    { label: "Bill-To vs Ship-To Match", status: "passed", reason: "Bill-to and ship-to accounts are both verified and linked." },
    { label: "Tax Exemption Certificate", status: "passed", reason: "A valid tax exemption certificate is on file for this account." },
    { label: "Denied Party Screening", status: "passed", reason: "No matches found against restricted or denied party lists." },
    { label: "Contract Terms Alignment", status: "passed", reason: "Order terms are consistent with the active master agreement." },
    { label: "Currency Conversion Accuracy", status: "passed", reason: "Converted amounts match the daily exchange rate within tolerance." },
    { label: "Payment Terms Validation", status: "passed", reason: "Payment terms on the PO match the account's approved terms." },
    { label: "Incoterms Consistency", status: "passed", reason: "Incoterms on the PO match the quote." },
    { label: "Order Quantity vs Quote", status: "passed", reason: "Ordered quantities match the quoted quantities for every line item." },
    { label: "Unit Price vs Quote", status: "passed", reason: "Unit prices match the quoted prices for every line item." },
    { label: "Restricted End-Use Check", status: "passed", reason: "No restricted end-use or end-user flags detected." },
  ],
  shipTo: {
    company: "MACOM Technology Solutions Inc.",
    address: "100 Chelmsford Street",
    cityState: "Lowell, MA 01851",
    country: "United States",
  },
  documents: [
    { name: "Quotation.pdf", size: "1.2 MB" },
    { name: "Purchase_Order.docs", size: "1.2 MB" },
    { name: "LoremIpsum.CSV", size: "1.2 MB" },
  ],
  screeningStartedAt: "31 Jul 2026, 10:52 PM",
  screeningCompletedAt: "31 Jul 2026, 10:52 PM",
  poParsing: { matched: 14, total: 18, poNumber: "1514444", lineItems: "8 line items parsed", shipToAddress: "100 Chelmsford St, Lowell, MA 01851" },
  salesForceQuote: { matched: 7, total: 8, quoteNumber: "QT-5000", quoteOwner: "Jagdish K.", approvalStatus: "Manager Approved" },
};

// The one place that knows how to get an order's AI validation results for a given email. Swap the body
// below for the real call once the endpoint exists — every consumer goes through useOrderValidation(), so
// this is the only edit needed:
//
//   async function fetchOrderValidation(emailId: string, signal: AbortSignal): Promise<OrderValidationData> {
//     const res = await fetch(`/api/emails/${encodeURIComponent(emailId)}/order-validation`, { signal });
//     if (!res.ok) {
//       throw new Error(`Failed to load validation results (${res.status} ${res.statusText})`);
//     }
//     const body: unknown = await res.json();
//     // TODO: validate `body`'s shape once the response contract is final.
//     return body as OrderValidationData;
//   }
async function fetchOrderValidation(_emailId: string, _signal: AbortSignal): Promise<OrderValidationData> {
  return MOCK_VALIDATION;
}

// Loading/error/reload state around fetchOrderValidation. Re-fetches whenever `emailId` changes, and uses
// AbortController so a stale request is actually cancelled rather than just ignored.
export function useOrderValidation(emailId: string) {
  const [data, setData] = useState<OrderValidationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    fetchOrderValidation(emailId, controller.signal)
      .then(rows => setData(rows))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return; // superseded by unmount/reload/emailId change
        setError(err instanceof Error ? err.message : "Failed to load validation results");
      });
    return () => controller.abort();
  }, [emailId, reloadToken]);

  const reload = useCallback(() => setReloadToken(t => t + 1), []);

  return { data, loading: data === null && error === null, error, reload };
}
