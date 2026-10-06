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
  description: string; // the AI's reasoning & evidence for this run
  verifies: string; // what the check verifies in general (shown in the info tooltip)
};

export type ReviewItem = {
  id: string; // "CCC-2815086"
  version: number;
  company: string;
  runBy: string;
  poNumber: string;
  quoteNumber: string;
  requestor: string; // who raised the CCC request (runBy is the AI agent that executed it)
  timestamp: string;
  checks: ReviewCheck[];
};

// The checks the AI runs on every transaction, in the order the Checks filter lists them. The same set is
// used for all three doc types, so each mock transaction below carries exactly these 18 — overrides mark
// the ones that flagged or failed, everything else is a pass with the default explanation.
export const FEEDBACK_CHECK_NAMES = [
  "Customer Export Screening",
  "Egregious Language",
  "Embargo and Sanctioned Country",
  "Keysight Sales Office",
  "Non Firm Language Check",
  "Non-Standard Acceptance Language",
  "Payment Terms",
  "Payment Terms Non-Standard Language",
  "Period of Performance",
  "PO File Check",
  "Purchase Agreement Check",
  "Quote Validity Check",
  "RPL Check",
  "Service Description, Pricing, Quantity, Discount",
  "Ship-To and Bill-To Addresses",
  "Ship-To and Bill-To Service Account",
  "Tax Special Language",
  "Terms and Conditions (T&Cs)",
] as const;

const DEFAULT_PASS_DESCRIPTION: Record<(typeof FEEDBACK_CHECK_NAMES)[number], string> = {
  "Customer Export Screening": "No restricted party or denied-persons matches found for any customer company on the order.",
  "Egregious Language": "No prohibited or boycott-related language found in the order wording.",
  "Embargo and Sanctioned Country": "No embargoed or sanctioned country or party found on the PO or quote.",
  "Keysight Sales Office": "Keysight sales office on the PO matches the quote.",
  "Non Firm Language Check": "No wording found suggesting the order is not a firm commitment.",
  "Non-Standard Acceptance Language": "No customer acceptance conditions that differ from Keysight's standard terms.",
  "Payment Terms": "PO payment terms match the quote.",
  "Payment Terms Non-Standard Language": "No uncertain or non-standard payment-timing language found.",
  "Period of Performance": "Period of performance on the PO matches the quote.",
  "PO File Check": "PO is a valid order document carrying all required identifiers.",
  "Purchase Agreement Check": "Purchase Agreement found on the quote and still valid on the validation date.",
  "Quote Validity Check": "PO date and received date are within the quote's validity window.",
  "RPL Check": "No Restricted Party List matches for any party on the PO.",
  "Service Description, Pricing, Quantity, Discount": "All line items match the quote on description, quantity, unit price, currency and totals.",
  "Ship-To and Bill-To Addresses": "Bill-To and Ship-To parties each resolved to a name and a usable address.",
  "Ship-To and Bill-To Service Account": "Bill-To and Ship-To resolved to known service accounts.",
  "Tax Special Language": "No special tax wording found; no tax exemption claim needing review.",
  "Terms and Conditions (T&Cs)": "No unacceptable terms and conditions wording found.",
};

// Category shown under each check name, and the plain-language "what this check verifies" text from the info
// tooltip — both are properties of the check itself, not of any one transaction.
const CHECK_META: Record<(typeof FEEDBACK_CHECK_NAMES)[number], { category: string; verifies: string }> = {
  "Customer Export Screening": { category: "Trade Compliance", verifies: "Extract every non-Keysight customer company from the purchase order and check its export screening record in Salesforce against today's date." },
  "Egregious Language": { category: "Legal & Language", verifies: "Search the purchase order for prohibited, boycott-related, or other high-risk legal language." },
  "Embargo and Sanctioned Country": { category: "Trade Compliance", verifies: "Check every country and party on the purchase order and quote against the embargo and sanctions list." },
  "Keysight Sales Office": { category: "Commercial Terms", verifies: "Compare the Keysight sales office named on the purchase order against the quote." },
  "Non Firm Language Check": { category: "Legal & Language", verifies: "Search the purchase order for wording saying the order is not a firm commitment." },
  "Non-Standard Acceptance Language": { category: "Legal & Language", verifies: "Search the purchase order for customer acceptance conditions that differ from Keysight's standard terms." },
  "Payment Terms": { category: "Commercial Terms", verifies: "Compare the payment term on the purchase order against the quote, or against the email when that is the term used for the order." },
  "Payment Terms Non-Standard Language": { category: "Legal & Language", verifies: "Search the purchase order for uncertain payment-timing language where no Purchase Agreement applies." },
  "Period of Performance": { category: "Commercial Terms", verifies: "Compare the service period of performance on the purchase order against the quote." },
  "PO File Check": { category: "Document Validation", verifies: "Confirm the purchase order is a valid order document carrying the order details Keysight needs." },
  "Purchase Agreement Check": { category: "Commercial Terms", verifies: "Look for a Purchase Agreement on the quote and check it is still valid on the validation date." },
  "Quote Validity Check": { category: "Commercial Terms", verifies: "Compare the PO date and the date the PO was received against the quote's expiration date." },
  "RPL Check": { category: "Trade Compliance", verifies: "Screen every party named on the purchase order against the Restricted Party List." },
  "Service Description, Pricing, Quantity, Discount": { category: "Commercial Terms", verifies: "Match each purchase-order line item to the quote and compare description, quantity, price, currency, and totals." },
  "Ship-To and Bill-To Addresses": { category: "Commercial Terms", verifies: "Extract the Bill-To and Ship-To parties from the purchase order and confirm each one has a name and a usable address." },
  "Ship-To and Bill-To Service Account": { category: "Commercial Terms", verifies: "Confirm the Bill-To and Ship-To parties resolve to the correct service accounts." },
  "Tax Special Language": { category: "Legal & Language", verifies: "Search the purchase order for special tax wording and check any claimed tax exemption." },
  "Terms and Conditions (T&Cs)": { category: "Legal & Language", verifies: "Check the purchase order's terms and conditions wording against the business-provided rejection and deviation phrases." },
};

type CheckOverride = [CheckStatus, string];
function canonicalChecks(itemId: string, overrides: Partial<Record<(typeof FEEDBACK_CHECK_NAMES)[number], CheckOverride>> = {}): ReviewCheck[] {
  return FEEDBACK_CHECK_NAMES.map((name, i) => {
    const [status, description] = overrides[name] ?? (["pass", DEFAULT_PASS_DESCRIPTION[name]] as CheckOverride);
    return { id: `${itemId}-${i}`, name, category: CHECK_META[name].category, verifies: CHECK_META[name].verifies, status, description };
  });
}

export const TRADE_ORDER_QUEUE: ReviewItem[] = [
  {
    id: "CCC-2820721",
    version: 2,
    company: "日本電波工業株式会社",
    runBy: "AI Agent",
    poNumber: "3300041386",
    quoteNumber: "QT-3300041",
    requestor: "Kenji Tanaka",
    timestamp: "Fri, 18/9, 6:38 PM",
    checks: canonicalChecks("CCC-2820721", {
      "Payment Terms": ["flag", "PO has no explicit payment term (only references separate guidance: \"支払方法等についての通り\"). QUOTE specifies non-standard term: \"15日締翌月15日振込\" (monthly closing on 15th; pay next month 15th). Terms do not match."],
      "Ship-To and Bill-To Addresses": ["flag", "Postal/ZIP mismatch: PO Ship-To address '埼玉県狭山市上広瀬' has no postal; Quote Install Site address contains '350-1321'."],
      "Quote Validity Check": ["flag", "PO date is 3 days after the quote's expiration date — quote may no longer be valid for this order."],
    }),
  },
  {
    id: "CCC-2815086",
    version: 1,
    company: "Excelitas Noblelight GmbH",
    runBy: "AI Agent",
    poNumber: "4001161077",
    quoteNumber: "QT-4510218",
    requestor: "Hans Mueller",
    timestamp: "Mon, 5/10, 4:12 PM",
    checks: canonicalChecks("CCC-2815086", {
      "Terms and Conditions (T&Cs)": ["flag", "PO has Lieferbedingungen: EXW Böblingen while Quote has DDP Germany. Base Incoterms differ."],
    }),
  },
  {
    id: "CCC-2815091",
    version: 1,
    company: "Sterling & Co",
    runBy: "AI Agent",
    poNumber: "STR-POQ-8080812",
    quoteNumber: "QT-8080812",
    requestor: "Priya Shah",
    timestamp: "Mon, 5/10, 3:48 PM",
    checks: canonicalChecks("CCC-2815091", {
      "Ship-To and Bill-To Addresses": ["flag", "Ship To on PO does not match any address on file for this account — closest match is 82% similarity."],
      "Service Description, Pricing, Quantity, Discount": ["fail", "PO currency (GBP) does not match Quote currency (USD)."],
    }),
  },
  {
    id: "CCC-2815104",
    version: 2,
    company: "GlobalTech Industries",
    runBy: "AI Agent",
    poNumber: "GLB-POQ-5050512",
    quoteNumber: "QT-5050512",
    requestor: "Wasim Shaikh",
    timestamp: "Mon, 5/10, 3:05 PM",
    checks: canonicalChecks("CCC-2815104"),
  },
  {
    id: "CCC-2821886",
    version: 1,
    company: "Intel Microelectronics (M) Sdn Bhd",
    runBy: "AI Agent",
    poNumber: "3500531872",
    quoteNumber: "QT-3500531",
    requestor: "Lim Wei Jian",
    timestamp: "Fri, 18/9, 4:29 PM",
    checks: canonicalChecks("CCC-2821886", {
      "Payment Terms": ["flag", "PO payment term 'Net 60' does not match Quote term 'Net 30'."],
      "Quote Validity Check": ["flag", "PO received 5 days after the quote's expiration date."],
      "Ship-To and Bill-To Service Account": ["fail", "Ship-To party does not resolve to a known service account for this customer."],
      "Tax Special Language": ["flag", "PO claims a sales-tax exemption not currently on file for this customer."],
    }),
  },
  {
    id: "CCC-2821900",
    version: 1,
    company: "FC Equipments",
    runBy: "AI Agent",
    poNumber: "C260903694",
    quoteNumber: "QT-2609036",
    requestor: "Dana Whitfield",
    timestamp: "Fri, 18/9, 4:13 PM",
    checks: canonicalChecks("CCC-2821900", {
      "Non-Standard Acceptance Language": ["flag", "PO includes a customer acceptance clause not in Keysight's standard terms."],
    }),
  },
];

export const SERVICE_AGREEMENT_QUEUE: ReviewItem[] = [
  {
    id: "CCC-2903312",
    version: 1,
    company: "Nexus Corp",
    runBy: "AI Agent",
    poNumber: "NXS-SVC-7070711",
    quoteNumber: "QT-7070711",
    requestor: "Sari Pellinen",
    timestamp: "Mon, 5/10, 4:02 PM",
    checks: canonicalChecks("CCC-2903312", {
      "Period of Performance": ["flag", "Auto-renewal clause present but renewal notice period (30 days) is shorter than the account's standard (60 days)."],
    }),
  },
];

export const SOM_QUEUE: ReviewItem[] = [
  {
    id: "CCC-3011204",
    version: 1,
    company: "Acme Corp",
    runBy: "AI Agent",
    poNumber: "ACM-SOM-1001009",
    quoteNumber: "QT-1001009",
    requestor: "Brenden Kirby",
    timestamp: "Mon, 5/10, 3:40 PM",
    checks: canonicalChecks("CCC-3011204"),
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

// "Check guide" narrative — the reference doc a reviewer opens to see exactly what each AI check verifies
// (its source data, what it's compared against, and the matching logic), independent of any specific
// transaction. Only Trade Order's content exists today; Service Agreement/SOM aren't written yet, so the
// "Check guide" button falls back to a toast for those docTypes until their narratives are provided.
export type CheckGuideRow = { label: string; source: string; target: string; logic: string };
export type CheckGuideEntry = { title: string; description: string; rows: CheckGuideRow[] };

export const TRADE_ORDER_CHECK_GUIDE: CheckGuideEntry[] = [
  {
    title: "Clear Bill To/ Ship To Address",
    description: "Extract the Bill-To and Ship-To parties from the purchase order and confirm each one has a name and a usable address.",
    rows: [
      {
        label: "Bill to",
        source: "PO attached in Salesforce — Bill-To or Invoice-To section; failing that, the PO header and nearby address blocks",
        target: "—",
        logic: "Extract the Bill-To name and address. Labelled sections are used first; without a label, use header or nearby wording that shows the address is for billing. An End User address or contact name alone is never used as Bill-To. Found only when both a name and a usable address are present, otherwise Not Found. Report the value used and where in the PO it was found.",
      },
      {
        label: "Ship to",
        source: "PO attached in Salesforce — Ship-To, Deliver-To, or Delivery Address section; failing that, the PO header and nearby address blocks",
        target: "—",
        logic: "Extract the Ship-To name and address. Labelled sections are used first; without a label, use header or nearby wording that shows the address is for delivery. An End User address or contact name alone is never used as Ship-To. Found only when both a name and a usable address are present, otherwise Not Found. Report the value used and where in the PO it was found.",
      },
    ],
  },
  {
    title: "Compare Quote to and Bill to Customer Name",
    description: "Extract the Bill-To customer name from the purchase order and compare it against the Quote-To customer on the quote.",
    rows: [
      {
        label: "Bill-To customer",
        source: "PO attached in Salesforce — Bill-To, Invoice-To, Sold-To, Buyer, or Purchaser field; failing that, the PO header and nearby billing text that clearly names the company responsible for payment",
        target: "Quote document from docuNet — Quote-To or Direct-To customer name",
        logic: "Match the two customer names. Case, extra spaces, dots, commas, hyphens, ampersand versus and, and company endings such as Ltd and Limited are ignored. A different company name, or a missing required customer name, is a Mismatch. Report both names and the reason.",
      },
    ],
  },
  {
    title: "Country Comparison Purchase Order Vs Quote",
    description: "Compare the country of each business entity between the purchase order and the quote.",
    rows: [
      {
        label: "Quote-To / Bill-To",
        source: "PO attached in Salesforce — Quote-To or Bill-To country",
        target: "Quote document from docuNet — Direct-To country",
        logic: "Match the two countries. Where the country is not written out, it may be worked out from city, state, region, or postal code. If it stays unclear, or more than one country is possible, return Not Found rather than guessing.",
      },
      {
        label: "Ship to",
        source: "PO attached in Salesforce — Ship-To country",
        target: "Quote document from docuNet — Equipment Location country",
        logic: "Match the two countries, using city, state, region, or postal code where the country is not written out. Unclear or ambiguous returns Not Found.",
      },
      {
        label: "End use",
        source: "PO attached in Salesforce — End-Use country",
        target: "Quote document from docuNet — Equipment Location country",
        logic: "Match the two countries, using city, state, region, or postal code where the country is not written out. Unclear or ambiguous returns Not Found.",
      },
    ],
  },
  {
    title: "Customer Export Screening",
    description: "Extract every non-Keysight customer company from the purchase order and check its export screening record in Salesforce against today's date.",
    rows: [
      {
        label: "Customer companies",
        source: "PO attached in Salesforce — Sold-To, Bill-To, Ship-To, End User, Partner, Reseller, Consignee, Pickup, Care Of, and any unlabelled customer company",
        target: "Salesforce — the customer account matched for each company",
        logic: "Extract every non-Keysight customer company and send it, with its business entity, to the Customer Export Screening lookup. Where the account lookup returns Multiple OCNs found, that message is kept as the reason.",
      },
      {
        label: "Screening validity",
        source: "Salesforce — Customer Screening field on the matched account",
        target: "Workflow — current date",
        logic: "An expiry date counts only when explicitly marked by wording such as Exp., Expire, Expiry, or Exp Date. An expiry after today is Valid; before today is Expired. A screening date with no marked expiry is Available - No expiry date. A blank field, or one with no usable date, is Missing. A standalone date without expiry wording is not treated as an expiry date. Report the business entity, company name, and the field used.",
      },
    ],
  },
  {
    title: "Customer Name Purchase Order Vs Quote",
    description: "Extract the customer name from the purchase order's customer section and compare it against the matching customer on the quote.",
    rows: [
      {
        label: "Customer name",
        source: "PO attached in Salesforce — the customer section identified by its label: Bill-To, Ship-To, Sold-To, Buyer, or Purchaser; failing that, the header or nearby text",
        target: "Quote document from docuNet — the matching customer name",
        logic: "The section label decides which customer is being checked. Without a label, header or nearby text is used only when it clearly names the customer business entity. Match the two names, ignoring case, spaces, dots, commas, hyphens, ampersand versus and, and endings such as Ltd and Limited. A different company name, or a missing required name, is a Mismatch.",
      },
    ],
  },
  {
    title: "Customer Requested Date (CRD)",
    description: "Extract the customer's requested delivery date from the purchase order and check it falls within the next six months.",
    rows: [
      {
        label: "Requested delivery date",
        source: "PO attached in Salesforce — delivery and requested-date fields, including relative wording such as ASAP or a stated number of days or weeks",
        target: "Workflow — current date, and the date six months from it",
        logic: "Today through the six-month limit is Within 6 months. Before today is Past Due. After the limit is Not within 6 months. No date found at all is Not found. Report each date with its result and the reason.",
      },
    ],
  },
  {
    title: "Egregious/boycott Language",
    description: "Search the purchase order for prohibited, boycott-related, or other high-risk legal language.",
    rows: [
      {
        label: "Prohibited / boycott language",
        source: "PO attached in Salesforce — order wording, notes, terms, and any order text included with it",
        target: "Business-maintained prohibited, boycott-related, and high-risk language list",
        logic: "Flag any listed or equivalent wording. Found returns the exact sentence or phrase and the reason it requires attention. Nothing found is Not Found/None.",
      },
    ],
  },
  {
    title: "Embargo and Sanctioned Country",
    description: "Check every country and party on the purchase order and quote against the embargo and sanctions list.",
    rows: [
      {
        label: "Countries and parties",
        source: "PO attached in Salesforce and Quote document from docuNet — every relevant country and party",
        target: "Embargo and sanctions list",
        logic: "Screen each country and party against the list. Yes when any appears on it; No when none does. Name every country checked and any embargoed or sanctioned country found.",
      },
    ],
  },
  {
    title: "Incoterms Check",
    description: "Compare the delivery and shipping terms on the purchase order against the Incoterms on the quote.",
    rows: [
      {
        label: "Incoterms",
        source: "PO attached in Salesforce — delivery and shipping terms",
        target: "Quote document from docuNet — Incoterms",
        logic: "Match the PO terms against the quote's. Where the PO references the quote but states no Incoterms of its own, the quote's Incoterms are validly adopted and that counts as a Match. Report the PO value, the quote value, and each difference.",
      },
    ],
  },
  {
    title: "Keysight Legal Entity",
    description: "Compare the Keysight legal entity name and address on the purchase order against the quote.",
    rows: [
      {
        label: "Keysight name",
        source: "PO attached in Salesforce — Keysight company or sales-office name",
        target: "Quote document from docuNet — Keysight company name",
        logic: "The names must match exactly. Report the PO value and the quote value.",
      },
      {
        label: "Keysight address",
        source: "PO attached in Salesforce — Keysight address",
        target: "Quote document from docuNet — Keysight address",
        logic: "The required address details must match the quotation. Report the PO value and the quote value for every comparison and identify each difference.",
      },
    ],
  },
  {
    title: "Low Risk and T&C",
    description: "Check the purchase order's value, SKUs, brands, and terms wording against the Low Risk Criteria — Low Risk Met only when every one of them passes.",
    rows: [
      {
        label: "PO value",
        source: "PO attached in Salesforce — PO total and currency",
        target: "Low Risk Criteria — the USD 500,000 threshold, plus the supplied exchange rate when the PO is not in USD",
        logic: "Convert a non-USD total to USD using the supplied exchange rate, or the current standard rate when none is supplied. Compare only the converted USD total: under USD 500,000 passes, USD 500,000 or more fails. Report the original value, the converted value, and the comparison.",
      },
      {
        label: "SKU prefix",
        source: "PO attached in Salesforce — line-item SKU or part numbers",
        target: "Low Risk Criteria — the F, SL, EG, AV, and AD prefixes",
        logic: "Any SKU starting with F, SL, EG, AV, or AD fails the SKU check. Report the failing prefix.",
      },
      {
        label: "Brand / product",
        source: "PO attached in Salesforce — line items",
        target: "Low Risk Criteria — the excluded brands and products",
        logic: "Any excluded brand or product on a PO line fails. Report the failing brand or product.",
      },
      {
        label: "Terms and conditions",
        source: "PO attached in Salesforce — terms and conditions wording",
        target: "Business-provided T&C rejection and deviation phrases",
        logic: "Searched against the phrase list only — the T&C are never compared with the quotation. An unacceptable statement makes the T&C result Low Risk Not Met and quotes the wording; none found is Low Risk Met.",
      },
      {
        label: "Overall result",
        source: "The four rows above",
        target: "—",
        logic: "Low Risk Met only when the value, SKU, and brand/product checks all pass. Any one failure is Low Risk Not Met. None when the required PO value, currency, or line-item data cannot be used.",
      },
    ],
  },
  {
    title: "Non-firm Language Check",
    description: "Search the purchase order for wording saying the order is not a firm commitment.",
    rows: [
      {
        label: "Non-firm wording",
        source: "PO attached in Salesforce — order text, notes, terms, and other PO wording",
        target: "Business-maintained non-firm language rules",
        logic: "Non-firm means wording that says or suggests the order is not final, is for budget or planning only, needs approval, is conditional, may change, is a forecast, or creates no firm commitment. Found returns the exact sentence or phrase from the PO and why it is non-firm; nothing found is Not Found/None.",
      },
      {
        label: "Signed Keysight quotation",
        source: "PO attached in Salesforce — document type",
        target: "—",
        logic: "Where the PO is a customer-signed Keysight quotation the check is skipped: that document follows a separate acceptance process.",
      },
    ],
  },
  {
    title: "Non-Standard Acceptance Language",
    description: "Search the purchase order for customer acceptance conditions that differ from Keysight's standard terms.",
    rows: [
      {
        label: "Acceptance conditions",
        source: "PO attached in Salesforce — order wording, notes, terms, and any order text included with it",
        target: "Keysight standard delivery, installation, and testing acceptance terms",
        logic: "Flag any customer acceptance condition that conflicts with the standard terms. Found quotes the exact sentence or phrase and the reason it requires attention; no conflict is Not Found/None.",
      },
    ],
  },
  {
    title: "Payment Term Check",
    description: "Compare the payment terms on the purchase order against the quote.",
    rows: [
      {
        label: "Payment term",
        source: "PO attached in Salesforce — payment terms",
        target: "Quote document from docuNet — payment terms",
        logic: "The terms must match and the required terms must be present. Report the PO value, the quote value, and each difference.",
      },
      {
        label: "Prompt / split payment",
        source: "PO attached in Salesforce — payment terms",
        target: "—",
        logic: "Highlight any prompt-payment discount or split-payment arrangement stated on the PO.",
      },
    ],
  },
  {
    title: "Payment Term Non-Standard Language",
    description: "Search the purchase order for uncertain payment-timing language where no Purchase Agreement applies.",
    rows: [
      {
        label: "Payment timing wording",
        source: "PO attached in Salesforce — order wording, notes, terms, and any order text included with it",
        target: "Keysight standard payment-timing terms, and whether a Purchase Agreement applies",
        logic: "Flag vague, milestone-based, deferred, or otherwise uncertain payment timing where no Purchase Agreement applies. Found quotes the exact sentence or phrase and the reason it requires attention; nothing found is Not Found/None.",
      },
    ],
  },
  {
    title: "Product, Pricing, Quantity, Discount",
    description: "Match each purchase-order line item to the quote and compare description, quantity, price, currency, and totals.",
    rows: [
      {
        label: "Product match",
        source: "PO attached in Salesforce — line-item model number, part number, or SKU",
        target: "Quote document from docuNet — line-item product identifiers",
        logic: "Match on an exact model, part, or SKU first. Without those, the same manufacturer and a clearly matching product family are accepted only when the product names also clearly align. A generic service name does not match a specific project or SKU.",
      },
      {
        label: "Description",
        source: "PO attached in Salesforce — line-item description",
        target: "Quote document from docuNet — line-item description",
        logic: "Different word order, a shorter PO description that clearly refers to the same product, multilingual wording, and marketing versus technical wording are accepted when the model, price, quantity, and configuration are the same.",
      },
      {
        label: "Quantity",
        source: "PO attached in Salesforce — line-item quantity",
        target: "Quote document from docuNet — line-item quantity",
        logic: "The quantities must be equal.",
      },
      {
        label: "Unit price and currency",
        source: "PO attached in Salesforce — line-item unit price and currency",
        target: "Quote document from docuNet — line-item unit price and currency",
        logic: "Both the unit price and the currency must match.",
      },
      {
        label: "Product presence",
        source: "PO attached in Salesforce — the set of line items",
        target: "Quote document from docuNet — the set of line items",
        logic: "An extra or missing product is a Mismatch unless it is a zero-priced option. A zero-priced option is ignored for line count and product presence; a line with offsetting non-zero sub-lines is not ignored.",
      },
      {
        label: "Totals",
        source: "PO attached in Salesforce — line totals and order total",
        target: "Quote document from docuNet — line totals and order total",
        logic: "Compare the totals. Where the PO is a signed-back quotation giving only a total, compare the PO total and currency with the quotation's; missing unit-level fields are not a Mismatch in that situation.",
      },
      {
        label: "Discount",
        source: "PO attached in Salesforce — discount",
        target: "Quote document from docuNet — discount",
        logic: "Reported as present or absent. Discount does not by itself decide Match or Mismatch.",
      },
    ],
  },
  {
    title: "Purchase Agreement (PA)",
    description: "Look for a Purchase Agreement on the quote and check it is still valid on the validation date.",
    rows: [
      {
        label: "Purchase Agreement",
        source: "Quote document from docuNet — Purchase Agreement number",
        target: "—",
        logic: "No Purchase Agreement found on the quote returns No.",
      },
      {
        label: "PA expiry",
        source: "Quote document from docuNet — Purchase Agreement expiry date",
        target: "Workflow — validation date",
        logic: "Still valid on the validation date is Yes; an earlier expiry date is Expired. Missing or unreadable expiry data returns No with a not-enough-data reason. Report the PA number and expiry date.",
      },
    ],
  },
  {
    title: "Purchase Order (PO) Format Check",
    description: "Confirm the purchase order is a valid order document carrying the order details Keysight needs.",
    rows: [
      {
        label: "Order document",
        source: "PO attached in Salesforce",
        target: "—",
        logic: "The document must read as a valid order document. Fail lists what is missing in the reason.",
      },
      {
        label: "Order identifiers",
        source: "PO attached in Salesforce — PO number and other order identifiers",
        target: "—",
        logic: "The required identifiers must be present.",
      },
      {
        label: "Referenced quote / asset details",
        source: "PO attached in Salesforce — referenced quote and asset details",
        target: "Quote document from docuNet",
        logic: "Where referenced quote or asset details are used, they must match the quote.",
      },
      {
        label: "Signed Keysight quotation",
        source: "PO attached in Salesforce — signature or stamp",
        target: "Keysight signature and stamp rules",
        logic: "A customer-signed Keysight quotation counts as an order document only when the required signature or stamp rules are met.",
      },
    ],
  },
  {
    title: "Quote Validity",
    description: "Compare the PO date and the date the PO was received against the quote's expiration date.",
    rows: [
      {
        label: "PO date",
        source: "PO attached in Salesforce — PO date",
        target: "Quote document from docuNet — quote expiration date",
        logic: "On or before the quote expiry is Valid; later is Expired. Where the PO date is missing but the received date exists and is Valid, the PO date check is treated as Valid. More than one remaining PO date returns Multiple.",
      },
      {
        label: "PO received date",
        source: "Salesforce — date the PO was received",
        target: "Quote document from docuNet — quote expiration date",
        logic: "On or before the quote expiry is Valid; later is Expired. Where the received date is missing while the PO date check is Valid, it is treated as Valid with N/A recorded. A missing quote expiry date, or neither order date usable, returns Invalid - Need user verification.",
      },
    ],
  },
  {
    title: "Restricted Party List",
    description: "Screen every party named on the purchase order against the Restricted Party List.",
    rows: [
      {
        label: "Each party on the PO",
        source: "PO attached in Salesforce — every party name, address, and contact value",
        target: "Restricted Party List screening response and match score",
        logic: "Every party is screened on its own. A match score above 0 means the party needs review and returns Yes. A score of 0, no score, or no screening response returns No. The reason states the business entity type and the name, address, and contact values that were actually screened.",
      },
    ],
  },
  {
    title: "Screening Customer Profile Class",
    description: "Look up the Sold-To customer's Salesforce profile class and flag the restricted classifications.",
    rows: [
      {
        label: "Sold-To account",
        source: "PO attached in Salesforce — Sold-To customer name",
        target: "Salesforce — the matched customer account",
        logic: "Match the Sold-To name to its customer account before reading the profile class.",
      },
      {
        label: "Profile class",
        source: "Salesforce — Profile Class on the matched account",
        target: "The flagged classifications High Default, DEN, and NOC",
        logic: "High Default, DEN, or NOC is Flagged; anything else is Not High Default. Report the exact Salesforce profile class.",
      },
    ],
  },
  {
    title: "Tax Special Language",
    description: "Search the purchase order for special tax wording and check any claimed tax exemption.",
    rows: [
      {
        label: "Special tax wording",
        source: "PO attached in Salesforce — tax wording",
        target: "Business-maintained special tax language list",
        logic: "Return the wording found. Nothing found passes.",
      },
      {
        label: "Tax exemption claim",
        source: "PO attached in Salesforce — claimed tax-exemption status",
        target: "Quote document from docuNet — tax treatment",
        logic: "Check whether the claimed exemption makes sense. A tax condition that needs review passes only when it is routed for review the right way; report the reason it was sent.",
      },
    ],
  },
  {
    title: "Validating Ship-To Addresses",
    description: "Confirm the purchase order names a complete, deliverable Ship-To destination.",
    rows: [
      {
        label: "Ship-To customer",
        source: "PO attached in Salesforce — Ship-To customer name",
        target: "Quote document from docuNet — Ship-To or Equipment Location",
        logic: "The Ship-To must name the customer.",
      },
      {
        label: "Ship-To address",
        source: "PO attached in Salesforce — Ship-To address",
        target: "—",
        logic: "The address must be full and usable. A PO box, a courier-only destination, or an incomplete address does not pass. Report the Ship-To value used and the reason for the result.",
      },
    ],
  },
];

export const CHECK_GUIDE_BY_DOC_TYPE: Partial<Record<DocType, CheckGuideEntry[]>> = {
  "trade-order": TRADE_ORDER_CHECK_GUIDE,
};
