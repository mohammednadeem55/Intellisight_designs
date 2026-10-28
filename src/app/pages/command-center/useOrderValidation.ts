import { useCallback, useEffect, useState } from "react";

// Mock OA (Order Acknowledgement) validation results — a fixed set of automated checks run against the
// order. Every check belongs to exactly one category (AISO-658):
//   - "mandatory": must pass (or be bypassed with a reason) before the workflow can proceed.
//   - "redFlag": informational — the workflow can proceed even if it's failed, but it can still be bypassed
//     (documented) the same way, since a reviewer may want to record why it's being waved through.
export type CheckCategory = "mandatory" | "redFlag";
export type CheckStatus = "failed" | "passed";
// AISO-652 — set when a user bypasses a failed check; always carries a reason (the UI never allows an empty
// one through), plus who/when for the audit trail (AC7).
export type BypassInfo = { reason: string; by: string; at: string };
export type ValidationCheck = {
  id: string;
  label: string;
  category: CheckCategory;
  status: CheckStatus;
  reason: string;
  recommendedAction?: string;
  bypass?: BypassInfo;
};

export type OrderValidationData = {
  checks: ValidationCheck[];
  shipTo: { company: string; address: string; cityState: string; country: string };
  documents: { name: string; size: string }[];
  screeningStartedAt: string;
  screeningCompletedAt: string;
  /** Each category is screened on its own, so each has its own completion time. A rerun only re-stamps the
      categories it actually touched. */
  categoryScreeningCompletedAt: Record<CheckCategory, string>;
  poParsing: { matched: number; total: number; poNumber: string; lineItems: string; shipToAddress: string };
  salesForceQuote: { matched: number; total: number; quoteNumber: string; quoteOwner: string; approvalStatus: string };
};

// The real check inventory from AISO-658 — 11 Mandatory + 10 Red Flag = 21 checks, matching "21 checks by
// Oracle" in the original design reference. 6 are seeded failed (2 Mandatory, 4 Red Flag) so both the
// blocking (Mandatory) and non-blocking (Red Flag) paths are visible without any setup.
const MOCK_VALIDATION: OrderValidationData = {
  checks: [
    // ── Mandatory — Verification Required (2) ──
    {
      id: "m-ppqd", label: "Product, Pricing, Quantity, Discount", category: "mandatory", status: "failed",
      reason: "Unit price on line 3 (N5766A) is 12% below the quoted price with no discount approval on file.",
      recommendedAction: "Confirm discount approval with the account manager or correct the unit price",
    },
    {
      id: "m-incoterms", label: "Incoterms Check", category: "mandatory", status: "failed",
      reason: "PO specifies EXW, but the quote was issued under DDP terms.",
      recommendedAction: "Confirm the correct Incoterm with the customer before proceeding",
    },
    // ── Mandatory — Verified (9) ──
    { id: "m-crd", label: "Customer Requested Date (CRD)", category: "mandatory", status: "passed", reason: "Requested date on the PO matches the quote's committed date." },
    { id: "m-address", label: "Bill To/ Ship To Address", category: "mandatory", status: "passed", reason: "Bill-to and ship-to addresses are both verified and active in Oracle." },
    { id: "m-country", label: "Country Comparison Purchase Order Vs Quote", category: "mandatory", status: "passed", reason: "Shipping country on the PO matches the country on the quote." },
    { id: "m-custname", label: "Customer Name Purchase Order Vs Quote", category: "mandatory", status: "passed", reason: "Customer legal name on the PO matches the quote exactly." },
    { id: "m-embargo", label: "Embargo and Sanctioned Country", category: "mandatory", status: "passed", reason: "Ship-to country is not on any embargoed or sanctioned list." },
    { id: "m-legal", label: "Keysight Legal Entity", category: "mandatory", status: "passed", reason: "The accepting Keysight legal entity is active and in good standing." },
    { id: "m-payterm", label: "Payment Term Check", category: "mandatory", status: "passed", reason: "Payment terms on the PO match the account's approved terms." },
    { id: "m-quote", label: "Quote Validity", category: "mandatory", status: "passed", reason: "Quote QT-5000 is within its validity window." },
    { id: "m-pa", label: "Purchase Agreement (PA)", category: "mandatory", status: "passed", reason: "An active purchase agreement covers this order." },

    // ── Red Flag — Review Required (4) ──
    {
      id: "rf-egregious", label: "Egregious/boycott Language", category: "redFlag", status: "failed",
      reason: "PO terms and conditions contain boycott-related language in clause 14.",
      recommendedAction: "Route to legal/compliance for review before booking",
    },
    {
      id: "rf-payterm-lang", label: "Payment Term Non-Standard Language", category: "redFlag", status: "failed",
      reason: "PO includes a non-standard early-payment discount clause not present in the quote.",
      recommendedAction: "Confirm with finance whether the clause is acceptable",
    },
    {
      id: "rf-nonstd-accept", label: "Non-Standard Acceptance Language", category: "redFlag", status: "failed",
      reason: "PO acceptance clause deviates from Keysight's standard acceptance language.",
      recommendedAction: "Have the deviation reviewed before order booking",
    },
    {
      id: "rf-export-screen", label: "Customer Export Screening", category: "redFlag", status: "failed",
      reason: "Customer name partially matches an entry on the denied parties list.",
      recommendedAction: "Run a manual denied-party screening and attach clearance evidence",
    },
    // ── Red Flag — Passed (6) ──
    { id: "rf-rpl", label: "Restricted Party List (RPL)", category: "redFlag", status: "passed", reason: "No matches found against the restricted party list." },
    { id: "rf-nonfirm", label: "Non-firm Language check", category: "redFlag", status: "passed", reason: "No non-firm/contingent order language detected." },
    { id: "rf-tax", label: "Tax Special Language", category: "redFlag", status: "passed", reason: "No unusual tax clauses detected on the PO." },
    { id: "rf-lowrisk", label: "Low Risk and T&C", category: "redFlag", status: "passed", reason: "Order qualifies as low-risk under standard terms and conditions." },
    { id: "rf-poformat", label: "Purchase Order (PO) Format check", category: "redFlag", status: "passed", reason: "PO format matches the expected schema for this account." },
    { id: "rf-compare-name", label: "Compare Quote to and Bill to Customer Name", category: "redFlag", status: "passed", reason: "Bill-to customer name matches the name on the quote." },
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
  screeningCompletedAt: "31 Jul 2026, 11:04 PM",
  categoryScreeningCompletedAt: { mandatory: "31 Jul 2026, 10:52 PM", redFlag: "31 Jul 2026, 11:04 PM" },
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

// AISO-603 — every rerun scope (All / Failed Only / Selected / Individual) reduces to the same operation:
// resolve a specific list of currently-failed check ids to passed, and stamp fresh screening timestamps.
// Resolving a check also clears any bypass on it (AISO-652 AC6: a bypass doesn't carry forward once the
// check actually passes). Real re-validation would instead be an API call telling the backend which checks
// to rerun.
export function regenerateValidation(base: OrderValidationData, targetIds: string[]): OrderValidationData {
  const idSet = new Set(targetIds);
  const now = new Date().toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  return {
    ...base,
    checks: base.checks.map(c =>
      c.status === "failed" && idSet.has(c.id)
        ? { ...c, status: "passed" as const, reason: `Resolved on re-validation: ${c.reason}`, recommendedAction: undefined, bypass: undefined }
        : c
    ),
    screeningStartedAt: base.screeningCompletedAt,
    screeningCompletedAt: now,
    categoryScreeningCompletedAt: {
      mandatory: base.checks.some(c => c.category === "mandatory" && idSet.has(c.id)) ? now : base.categoryScreeningCompletedAt.mandatory,
      redFlag: base.checks.some(c => c.category === "redFlag" && idSet.has(c.id)) ? now : base.categoryScreeningCompletedAt.redFlag,
    },
  };
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
