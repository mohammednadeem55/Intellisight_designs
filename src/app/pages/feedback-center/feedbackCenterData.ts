// Mock data for the Feedback Center — the human-in-the-loop review queue for AI-executed CCC transactions.
// Every check the AI ran on a transaction shows up here so a reviewer can thumbs-down just the ones the AI
// got wrong; everything left unmarked on submit counts as confirmed correct.

export type DocType = "trade-order" | "service-agreement" | "som";

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  "trade-order": "Trade Order",
  "service-agreement": "Service Agreement",
  som: "SOM",
};

export type CheckStatus = "pass" | "fail" | "flag";

export type ReviewCheck = {
  id: string;
  name: string;
  category: string;
  status: CheckStatus;
  description: string;
};

export type ReviewItem = {
  id: string; // "CCC-2815086"
  version: number;
  company: string;
  runBy: string;
  poNumber: string;
  timestamp: string;
  checks: ReviewCheck[];
};

function checks(...entries: [string, string, CheckStatus, string][]): ReviewCheck[] {
  return entries.map(([id, name, status, description], i) => ({ id: `${id}-${i}`, name, category: "Trade Compliance", status, description }));
}

export const TRADE_ORDER_QUEUE: ReviewItem[] = [
  {
    id: "CCC-2815086",
    version: 1,
    company: "Excelitas Noblelight GmbH",
    runBy: "AI Agent",
    poNumber: "4001161077",
    timestamp: "Just now",
    checks: checks(
      ["incoterms", "Incoterms Check", "flag", "PO has Lieferbedingungen: EXW Böblingen while Quote has DDP Germany. Base Incoterms differ."],
      ["po-format", "Purchase Order (PO) Format Check", "pass", "All required elements found: purchaser (Excelitas Noblelight GmbH), supplier (Keysight Technologies)."],
      ["quote-validity", "Quote Validity", "pass", "Quote Number Found in PO: Yes. PO Date: 2026-09-10. PO Received Date: N/A. Quote still within validity window."],
      ["crd", "Customer Requested Date (CRD)", "pass", "Delivery Date (2026-09-14) is within the valid range."],
      ["bill-ship", "Clear Bill To/ Ship To Address", "pass", "Bill To and Ship To addresses both resolved to known account locations with no ambiguity."],
      ["currency", "Currency Match", "pass", "PO currency (EUR) matches Quote currency (EUR)."],
      ["tax-status", "Tax Status Check", "pass", "Tax exemption certificate on file and valid through 2027."],
      ["payment-terms", "Payment Terms Check", "pass", "PO payment terms (Net 30) match the account's standard terms."],
      ["line-items", "Line Item Match", "pass", "All 4 line items on the PO match the corresponding Quote line items by part number and quantity."],
      ["pricing", "Pricing Validation", "pass", "Unit prices on all line items match the approved Quote pricing within tolerance."],
      ["duplicate-po", "Duplicate PO Check", "pass", "No existing order found with the same PO number for this account."],
      ["credit-hold", "Credit Hold Check", "pass", "Account is not currently on credit hold."],
      ["export-control", "Export Control Screening", "pass", "No restricted party or denied-persons matches found for purchaser or ship-to."],
      ["contact-validation", "Contact Validation", "pass", "Requestor contact matches a known contact on the account."],
      ["freight-terms", "Freight Terms Check", "pass", "Freight terms consistent between PO and Quote."],
      ["quantity-check", "Quantity Reasonableness", "pass", "Ordered quantities fall within typical range for this account's order history."],
      ["signature", "Signature/Approval Check", "pass", "PO carries a valid authorized-signatory approval."],
      ["ship-to-country", "Ship-To Country Restriction", "pass", "Destination country is not subject to shipment restrictions."],
      ["order-type", "Order Type Classification", "pass", "Order correctly classified as a standard Trade Order."],
      ["attachment-check", "Attachment Completeness", "pass", "All required supporting documents attached to the request."],
      ["account-status", "Account Status Check", "pass", "Account is active and in good standing."],
      ["revision-check", "Quote Revision Check", "pass", "PO references the latest active Quote revision."],
      ["total-match", "Order Total Reconciliation", "pass", "Line item total reconciles with the PO grand total."],
    ),
  },
  {
    id: "CCC-2815091",
    version: 1,
    company: "Sterling & Co",
    runBy: "AI Agent",
    poNumber: "STR-POQ-8080812",
    timestamp: "12 mins ago",
    checks: checks(
      ["bill-ship", "Clear Bill To/ Ship To Address", "flag", "Ship To on PO does not match any address on file for this account — closest match is 82% similarity."],
      ["po-format", "Purchase Order (PO) Format Check", "pass", "All required elements found."],
      ["quote-validity", "Quote Validity", "pass", "Quote Number Found in PO: Yes."],
      ["currency", "Currency Match", "fail", "PO currency (GBP) does not match Quote currency (USD)."],
      ["credit-hold", "Credit Hold Check", "pass", "Account is not currently on credit hold."],
    ),
  },
  {
    id: "CCC-2815104",
    version: 2,
    company: "GlobalTech Industries",
    runBy: "AI Agent",
    poNumber: "GLB-POQ-5050512",
    timestamp: "48 mins ago",
    checks: checks(
      ["po-format", "Purchase Order (PO) Format Check", "pass", "All required elements found."],
      ["quote-validity", "Quote Validity", "pass", "Quote Number Found in PO: Yes."],
      ["crd", "Customer Requested Date (CRD)", "pass", "Delivery Date is within the valid range."],
      ["bill-ship", "Clear Bill To/ Ship To Address", "pass", "Bill To and Ship To addresses both resolved cleanly."],
      ["duplicate-po", "Duplicate PO Check", "pass", "No existing order found with the same PO number."],
    ),
  },
];

export const SERVICE_AGREEMENT_QUEUE: ReviewItem[] = [
  {
    id: "CCC-2903312",
    version: 1,
    company: "Nexus Corp",
    runBy: "AI Agent",
    poNumber: "NXS-SVC-7070711",
    timestamp: "5 mins ago",
    checks: checks(
      ["term-length", "Contract Term Length Check", "pass", "Service term (12 months) matches the requested agreement length."],
      ["renewal-clause", "Auto-Renewal Clause Check", "flag", "Auto-renewal clause present but renewal notice period (30 days) is shorter than the account's standard (60 days)."],
      ["coverage-scope", "Coverage Scope Match", "pass", "Covered products match the assets on the account's install base."],
      ["pricing", "Pricing Validation", "pass", "Service pricing matches the approved rate card."],
    ),
  },
];

export const SOM_QUEUE: ReviewItem[] = [
  {
    id: "CCC-3011204",
    version: 1,
    company: "Acme Corp",
    runBy: "AI Agent",
    poNumber: "ACM-SOM-1001009",
    timestamp: "20 mins ago",
    checks: checks(
      ["scope-match", "Scope of Materials Match", "pass", "Materials listed match the corresponding Quote line items."],
      ["delivery-window", "Delivery Window Check", "pass", "Requested delivery window falls within standard lead time."],
      ["export-control", "Export Control Screening", "pass", "No restricted party matches found."],
    ),
  },
];

export const QUEUE_BY_DOC_TYPE: Record<DocType, ReviewItem[]> = {
  "trade-order": TRADE_ORDER_QUEUE,
  "service-agreement": SERVICE_AGREEMENT_QUEUE,
  som: SOM_QUEUE,
};

export function checkCounts(item: ReviewItem) {
  const total = item.checks.length;
  const passed = item.checks.filter((c) => c.status !== "fail").length; // AI flags still count as "passed" until a human disagrees
  const aiFlags = item.checks.filter((c) => c.status === "flag" || c.status === "fail").length;
  return { total, passed, aiFlags };
}
