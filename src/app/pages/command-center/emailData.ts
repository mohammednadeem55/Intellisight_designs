// Mock email/CCC data shared across pages (Command Center Overview, Email View, New Overview, Workflow).
// Kept separate from App.tsx so pages that live in their own files (e.g. NewOverviewPage) can import this
// without creating a circular dependency on App.tsx.

export type Email = {
  id: string;
  subject: string;
  sender: string;
  category: string;
  status: string;
  received: string;
  size: string;
  body?: string;
  /** Nested correspondence — under a CCC row this is that CCC's own thread (level 2); under a reply this is its further replies (level 3+, surfaced via a "+N more" link rather than a 3rd inline row tier). */
  replies?: Email[];
  /** CCC requests linked to this email (level 1 nested rows). Only ever set on root email rows. */
  linkedCccs?: Email[];
  /** Set on CCC/reply rows so clicking through navigates to the root email's detail/thread view rather than a synthetic nested id. */
  rootEmailId?: string;
  // CCC request fields (Command Center listing columns)
  cccId?: string;
  csrOwner?: string;
  businessGroup?: string;
  opportunityNumber?: string;
  accountManager?: string;
  accountName?: string;
  cccRequestType?: string;
  cccRequestSubtype?: string;
  cccRequestStatus?: string;
  awaitingReason?: string;
  cccRequestReceivedDate?: string;
  slaTimeRemaining?: string;
  poNumber?: string;
  quoteNumber?: string;
  orderNumber?: string;
  operatingUnit?: string;
  poAmount?: string;
  currentMonthBookableAmount?: string;
  currency?: string;
  statusNotes?: string;
  currentStatusDate?: string;
  currentAutomationStatus?: string;
  currentAutomationResult?: string;
  automationDetailsLink?: string;
  previousStatus?: string;
  previousStatusDate?: string;
  previousStage?: string;
  previousAutomationStatus?: string;
  oaStatus?: string;
  oaSummary?: string;
  oaValidationRecords?: string;
  // Listing-grid fields (root emails only)
  classification?: string;
  confidencePct?: number;
  reviewStatus?: string;
  assignedTo?: string;
  assignedInitials?: string;
  attachments?: { name: string; size: string }[];
  // New Overview filter panel fields
  sensitivity?: string;
  languageDetected?: string;
  source?: string;
};

const CSR_OWNERS = ["A. Sharma", "M. Chen", "R. Okafor", "L. Novak", "T. Reyes"];
export const BUSINESS_GROUPS = ["Enterprise", "Mid-Market", "Public Sector", "SMB"];
const ACCOUNT_MANAGERS = ["J. Patel (FE-2201)", "K. Summers (FE-1187)", "D. Alvarez (FE-3042)", "S. Kim (FE-0925)"];
const ACCOUNT_NAMES = ["GlobalTech Industries", "Acme Industries", "Nexus Corp", "Sterling & Co", "MetaSite Inc"];
const CCC_REQUEST_TYPES = ["New Order", "Amendment", "Renewal", "Cancellation"];
const CCC_REQUEST_SUBTYPES = ["Standard", "Expedite", "Credit Hold Release", "Price Correction"];
const CCC_REQUEST_STATUSES = ["Open", "In Progress", "Pending Info", "Completed"];
const AWAITING_REASONS = ["Awaiting Customer Response", "Awaiting Finance Approval", "Awaiting Legal Review", "—"];
const SLA_REMAINING = ["2d 4h remaining", "6h remaining", "Overdue by 1d", "4d remaining"];
const OPERATING_UNITS = ["US OU", "EMEA OU", "APAC OU", "LATAM OU"];
const CURRENCIES = ["USD", "EUR", "GBP", "INR"];
const AUTOMATION_STATUSES = ["Completed", "Running", "Failed", "Not Started"];
const AUTOMATION_RESULTS = ["Success", "Success", "Error – Retry", "N/A"];
const PREVIOUS_STATUSES = ["Flagged", "Under Review", "Cleared"];
const PREVIOUS_STAGES = ["Intake", "Validation", "Fulfillment", "Closed"];
const OA_STATUSES = ["Validated", "Pending", "Failed"];
const STATUS_NOTES = [
  "Reviewed by CSR, pending downstream sync.",
  "Escalated to secondary approver for sign-off.",
  "Customer confirmed details, proceeding with fulfillment.",
  "Awaiting updated documentation from requester.",
];
export const CLASSIFICATIONS = ["TRADE_ORDER", "SERVICE_CONTRACT", "WORK_ORDER", "QUOTE_REQUEST", "INFO_REQUIRED", "REVIEW_REQUIRED", "EXCLUDED"];
export const REVIEW_STATUSES = ["Pending", "Approved", "Rejected"];
export const SENSITIVITY_OPTIONS = ["GENERAL", "SENSITIVE"];
// Deliberately messy — mirrors the real (uncleaned) language-detection values from production.
export const LANGUAGE_DETECTED_OPTIONS = [
  "de", "en", "EN", "English", "ENGLISH", "es", "ja", "Japanese", "ko", "Korean",
  "Mixed (Chinese/English)", "mixed_korean_english", "Portuguese (pt)",
  "{'primary': 'en', 'confidence': 1.0, 'secondary': None}",
  "Spanish (es) and English (en)", "th",
];
export const SOURCE_OPTIONS = ["INTERNAL", "EXTERNAL"];
const ASSIGNEES: { name: string; initials: string }[] = [
  { name: "Jagdish K.", initials: "JK" },
  { name: "Gaurish", initials: "G" },
  { name: "Maria Chen", initials: "MC" },
  { name: "AI", initials: "AI" },
  { name: "Unassigned", initials: "?" },
];
const ATTACHMENT_POOL = [
  { name: "Order_details.pdf", size: "1.2 MB" },
  { name: "Purchase_order.pdf", size: "640 KB" },
  { name: "Signed_SOW.docx", size: "840 KB" },
  { name: "Invoice.pdf", size: "310 KB" },
];

// Listing-grid fields (classification, confidence, review status, assignee, etc.) — shared by root email
// rows AND their nested CCC/reply rows so expanded rows show real, varied data rather than blank fallbacks.
function deriveListingFields(seed: number, attachmentKeyPrefix: string) {
  const assignee = ASSIGNEES[seed % ASSIGNEES.length];
  const attachmentCount = seed % 3 === 0 ? 0 : (seed % 2) + 1;
  return {
    classification: CLASSIFICATIONS[seed % CLASSIFICATIONS.length],
    confidencePct: 70 + ((seed * 7) % 30),
    reviewStatus: REVIEW_STATUSES[seed % REVIEW_STATUSES.length],
    assignedTo: assignee.name,
    assignedInitials: assignee.initials,
    sensitivity: SENSITIVITY_OPTIONS[seed % SENSITIVITY_OPTIONS.length],
    languageDetected: LANGUAGE_DETECTED_OPTIONS[seed % LANGUAGE_DETECTED_OPTIONS.length],
    source: SOURCE_OPTIONS[seed % SOURCE_OPTIONS.length],
    attachments: ATTACHMENT_POOL.slice(0, attachmentCount).map((a, ai) => ({ ...a, name: ai === 0 ? a.name : `${attachmentKeyPrefix}_${a.name}` })),
  };
}

// Fields shared by a CCC request and all of its thread replies — the request identity doesn't change reply to reply.
function deriveRequestFields(i: number) {
  return {
    cccId: `CCC-${20000 + i * 11}`,
    csrOwner: CSR_OWNERS[i % CSR_OWNERS.length],
    businessGroup: BUSINESS_GROUPS[i % BUSINESS_GROUPS.length],
    opportunityNumber: `OPP-${10500 + i * 7}`,
    accountManager: ACCOUNT_MANAGERS[i % ACCOUNT_MANAGERS.length],
    accountName: ACCOUNT_NAMES[i % ACCOUNT_NAMES.length],
    cccRequestType: CCC_REQUEST_TYPES[i % CCC_REQUEST_TYPES.length],
    cccRequestSubtype: CCC_REQUEST_SUBTYPES[i % CCC_REQUEST_SUBTYPES.length],
    poNumber: `PO-${88000 + i * 13}`,
    quoteNumber: `QT-${5000 + i * 3} v${1 + (i % 3)}`,
    orderNumber: i % 3 === 0 ? "—" : `ORD-${77000 + i * 9}`,
    operatingUnit: OPERATING_UNITS[i % OPERATING_UNITS.length],
    poAmount: `$${(12000 + i * 3540).toLocaleString()}.00`,
    currentMonthBookableAmount: `$${(8000 + i * 2110).toLocaleString()}.00`,
    currency: CURRENCIES[i % CURRENCIES.length],
  };
}

// Fields that evolve message to message within a thread — each reply gets its own seed so status/automation progress.
function deriveStatusFields(email: Email, seed: number) {
  return {
    cccRequestStatus: CCC_REQUEST_STATUSES[seed % CCC_REQUEST_STATUSES.length],
    awaitingReason: AWAITING_REASONS[seed % AWAITING_REASONS.length],
    cccRequestReceivedDate: email.received,
    slaTimeRemaining: SLA_REMAINING[seed % SLA_REMAINING.length],
    statusNotes: STATUS_NOTES[seed % STATUS_NOTES.length],
    currentStatusDate: email.received,
    currentAutomationStatus: AUTOMATION_STATUSES[seed % AUTOMATION_STATUSES.length],
    currentAutomationResult: AUTOMATION_RESULTS[seed % AUTOMATION_RESULTS.length],
    automationDetailsLink: "View Details",
    previousStatus: PREVIOUS_STATUSES[(seed + 1) % PREVIOUS_STATUSES.length],
    previousStatusDate: email.received,
    previousStage: PREVIOUS_STAGES[seed % PREVIOUS_STAGES.length],
    previousAutomationStatus: AUTOMATION_STATUSES[(seed + 1) % AUTOMATION_STATUSES.length],
    oaStatus: OA_STATUSES[seed % OA_STATUSES.length],
    oaSummary: `${2 + (seed % 3)}/${3 + (seed % 2)} checks passed`,
    oaValidationRecords: "View Records",
  };
}

// Builds one CCC row (level 1) linked to a root email, carrying its own request identity plus a thread of correspondence (level 2).
function makeCcc(rootEmail: Email, cccSeed: number, replyPool: Email[]): Email {
  const request = deriveRequestFields(cccSeed);
  return {
    id: request.cccId,
    subject: `${request.cccRequestType} — ${request.cccRequestSubtype}`,
    sender: rootEmail.sender,
    category: rootEmail.category,
    status: PREVIOUS_STATUSES[cccSeed % PREVIOUS_STATUSES.length],
    received: rootEmail.received,
    size: "",
    rootEmailId: rootEmail.id,
    ...request,
    ...deriveStatusFields(rootEmail, cccSeed),
    ...deriveListingFields(cccSeed, request.cccId),
    replies: replyPool.map((reply, ri) => enrichReply(reply, request, cccSeed, ri, rootEmail.id)),
  };
}

// Enriches a raw correspondence email with its parent CCC's request identity (unchanged thread to thread) plus its own
// evolving status/timeline fields. Recurses into any further nested replies so 3rd-level+ data still carries real values,
// even though the grid only renders 2 nested tiers — deeper data is reached via a "+N more" link, not another row tier.
function enrichReply(reply: Email, request: ReturnType<typeof deriveRequestFields>, parentSeed: number, ri: number, rootEmailId: string): Email {
  const seed = parentSeed * 10 + ri + 1;
  return {
    ...reply,
    ...request,
    ...deriveStatusFields(reply, seed),
    ...deriveListingFields(seed, request.cccId),
    rootEmailId,
    replies: reply.replies?.map((sub, si) => enrichReply(sub, request, seed, si, rootEmailId)),
  };
}

// Splits a root email's raw replies into 1 or 2 linked CCCs (an email can reference a single CCC or several), each owning
// its share of the correspondence as its own nested thread.
function withCccHierarchy(email: Email, i: number): Email {
  let rawReplies = email.replies ?? [];

  // Demonstrates a reply carrying its own further nested replies (3rd level) — surfaced via a "+N more" link.
  if (i === 1 && rawReplies.length > 1) {
    rawReplies = rawReplies.map((r, ri) => ri === 1 ? {
      ...r,
      replies: [
        { id: `${r.id}-N1`, subject: `Re: ${r.subject}`, sender: "legal@intellisight.io", category: r.category, status: "Cleared", received: r.received, size: "0.4 MB",
          body: "Confirmed the redlines are final — no further changes needed on our end." },
        { id: `${r.id}-N2`, subject: `Re: ${r.subject}`, sender: "legal@acmeindustries.com", category: r.category, status: "Cleared", received: r.received, size: "0.6 MB",
          body: "Great, signing today. Thanks for the quick turnaround." },
      ],
    } : r);
  }

  // Threads with 2+ raw replies plausibly touch more than one CCC — split them so several emails demonstrate the 1-to-many link.
  const multiCcc = rawReplies.length >= 2;
  const groups: Email[][] = multiCcc
    ? [rawReplies.slice(0, Math.ceil(rawReplies.length / 2)), rawReplies.slice(Math.ceil(rawReplies.length / 2))]
    : [rawReplies];

  const linkedCccs = groups.map((group, ci) => makeCcc(email, i * 2 + ci, group));
  const [primaryCcc] = linkedCccs;
  const derived = deriveListingFields(i, email.id);

  // The root row surfaces its primary (first) linked CCC's data directly, so the main grid is informative
  // without expanding — expanding still reveals every linked CCC (including this one) and their own threads.
  return {
    ...primaryCcc,
    id: email.id,
    subject: email.subject,
    sender: email.sender,
    category: email.category,
    status: email.status,
    received: email.received,
    size: email.size,
    body: email.body,
    linkedCccs,
    rootEmailId: undefined,
    replies: undefined,
    ...derived,
    // Respect explicit attachments/confidence on the raw email (e.g. EML-10234 below) instead of always
    // overwriting them with the seed-derived defaults.
    attachments: email.attachments ?? derived.attachments,
    confidencePct: email.confidencePct ?? derived.confidencePct,
  };
}

export const ALL_EMAILS: Email[] = [
  { id: "EML-10234", subject: "Q3 Invoice Approval Request",        sender: "vendor@globaltech.com",    category: "Finance",    status: "Flagged",      received: "Jan 18", size: "1.2 MB",
    body: "Please find attached the Q3 invoice for licensing services totaling $124,500. This transaction exceeds the standard department spending threshold and requires secondary approval before processing.\n\nWe've also included the original purchase order and the signed SOW for reference — let us know if any additional documentation is needed to move this through approval before the end of the billing cycle.",
    confidencePct: 96,
    attachments: [
      { name: "Invoice.pdf", size: "310 KB" },
      { name: "Purchase_order.pdf", size: "640 KB" },
      { name: "Signed_SOW.docx", size: "840 KB" },
    ],
    replies: [
    { id: "EML-10234-R1", subject: "Re: Q3 Invoice Approval Request", sender: "finance@intellisight.io", category: "Finance", status: "Under Review", received: "Jan 18", size: "0.3 MB",
      body: "Flagged for review — this invoice amount exceeds the $50,000 auto-approval limit. Routing to VP Finance for secondary sign-off." },
    { id: "EML-10234-R2", subject: "Re: Q3 Invoice Approval Request", sender: "vendor@globaltech.com",    category: "Finance", status: "Flagged",      received: "Jan 18", size: "0.9 MB",
      body: "Following up — the original PO and signed SOW are attached to support the invoiced amount. Let us know if anything else is needed." },
  ] },
  { id: "EML-10235", subject: "Contract Renewal — Acme Industries", sender: "legal@acmeindustries.com", category: "Legal",      status: "Under Review", received: "Jan 18", size: "3.4 MB",
    body: "Attached is the renewal agreement for the annual services contract, effective next quarter. Please review the updated liability clause in Section 7 before countersigning.",
    replies: [
    { id: "EML-10235-R1", subject: "Re: Contract Renewal — Acme Industries", sender: "legal@intellisight.io",    category: "Legal", status: "Under Review", received: "Jan 18", size: "1.1 MB",
      body: "Reviewing the updated liability clause now — will circle back with redlines by end of week." },
    { id: "EML-10235-R2", subject: "Re: Contract Renewal — Acme Industries", sender: "legal@acmeindustries.com", category: "Legal", status: "Cleared",      received: "Jan 18", size: "2.0 MB",
      body: "Redlines accepted, updated version attached. Ready for signature." },
    { id: "EML-10235-R3", subject: "Fwd: Contract Renewal — Acme Industries", sender: "cfo@acmeindustries.com",  category: "Legal", status: "Cleared",      received: "Jan 18", size: "3.4 MB",
      body: "Forwarding for final visibility — approved on our end, no objections to the renewal terms." },
  ] },
  { id: "EML-10236", subject: "Shipment Delay Notification",        sender: "ops@nexuscorp.com",        category: "Logistics",  status: "Cleared",      received: "Jan 17", size: "0.4 MB",
    body: "Customs clearance for shipment #NX-88213 was delayed by two days but has now cleared. Updated delivery ETA is Thursday." },
  { id: "EML-10237", subject: "Vendor Tax Documentation",           sender: "finance@sterlingco.com",   category: "Finance",    status: "Cleared",      received: "Jan 17", size: "2.1 MB",
    body: "Attached are the completed W-9 and annual tax compliance forms as requested for our vendor file update." },
  { id: "EML-10238", subject: "Unusual Login Attempt Report",       sender: "security@intellisight.io", category: "Security",   status: "Flagged",      received: "Jan 17", size: "0.1 MB",
    body: "Automated monitoring detected a login attempt from an unrecognized device and IP range on an admin account. Account has been temporarily locked pending review.",
    replies: [
    { id: "EML-10238-R1", subject: "Re: Unusual Login Attempt Report", sender: "it-admin@intellisight.io", category: "Security", status: "Cleared", received: "Jan 17", size: "0.2 MB",
      body: "Confirmed with the account owner — attempt was from a new work laptop, expected. Account unlocked and device allowlisted." },
  ] },
  { id: "EML-10239", subject: "GDPR Data Request Follow-up",        sender: "privacy@metasiteinc.com",  category: "Privacy",    status: "Under Review", received: "Jan 16", size: "0.8 MB",
    body: "Following up on the data subject access request submitted last week. Please confirm the export is on track for the 30-day statutory deadline." },
  { id: "EML-10240", subject: "Purchase Order #PO-88213",           sender: "procurement@globaltech.com", category: "Finance",  status: "Cleared",      received: "Jan 16", size: "1.5 MB",
    body: "PO #PO-88213 has been fully executed and approved. Copy attached for your records." },
  { id: "EML-10241", subject: "Audit Trail Missing — TX-9920",      sender: "audit@intellisight.io",    category: "Audit",      status: "Flagged",      received: "Jan 16", size: "0.6 MB",
    body: "Transaction TX-9920 has no associated proof of purchase or approval record in the audit trail. Escalating for manual reconciliation." },
  { id: "EML-10242", subject: "Vendor Onboarding Checklist",        sender: "vendors@nexuscorp.com",    category: "Legal",      status: "Cleared",      received: "Jan 15", size: "2.8 MB",
    body: "All onboarding documentation — NDA, W-9, and banking details — has been submitted and verified. Vendor record is now active." },
  { id: "EML-10243", subject: "SLA Breach Escalation",              sender: "support@acmeindustries.com", category: "Support",  status: "Under Review", received: "Jan 15", size: "0.3 MB",
    body: "Ticket #4471 has exceeded the 24-hour SLA response window. Requesting immediate escalation to a senior CSR.",
    replies: [
    { id: "EML-10243-R1", subject: "Re: SLA Breach Escalation", sender: "csr@intellisight.io",           category: "Support", status: "Under Review", received: "Jan 15", size: "0.2 MB",
      body: "Apologies for the delay — picking this up now. Will have a resolution plan within the hour." },
    { id: "EML-10243-R2", subject: "Re: SLA Breach Escalation", sender: "support@acmeindustries.com",    category: "Support", status: "Cleared",      received: "Jan 15", size: "0.4 MB",
      body: "Issue resolved, thank you for the quick turnaround. Closing the ticket." },
  ] },
  { id: "EML-10244", subject: "Quarterly Compliance Summary",       sender: "compliance@intellisight.io", category: "Audit",    status: "Cleared",      received: "Jan 15", size: "4.2 MB",
    body: "Q3 compliance summary attached — 97% of flagged items resolved within SLA, no open critical findings." },
  { id: "EML-10245", subject: "Policy Update — Data Retention",     sender: "legal@sterlingco.com",     category: "Privacy",    status: "Under Review", received: "Jan 14", size: "0.9 MB",
    body: "New data retention policy requires customer records to be purged after 7 years unless under active litigation hold. Please confirm systems are updated accordingly." },
  { id: "EML-10246", subject: "Invoice Dispute — INV-2024-0892",    sender: "billing@globaltech.com",   category: "Finance",    status: "Flagged",      received: "Jan 14", size: "1.1 MB",
    body: "We're disputing invoice INV-2024-0892 — the billed amount does not match the agreed contract rate. Requesting a corrected invoice.",
    replies: [
    { id: "EML-10246-R1", subject: "Re: Invoice Dispute — INV-2024-0892", sender: "ap@intellisight.io",     category: "Finance", status: "Under Review", received: "Jan 14", size: "0.5 MB",
      body: "Reviewing the contract rate against the billed line items now — will confirm discrepancy within 2 business days." },
    { id: "EML-10246-R2", subject: "Re: Invoice Dispute — INV-2024-0892", sender: "billing@globaltech.com", category: "Finance", status: "Flagged",      received: "Jan 14", size: "0.6 MB",
      body: "Appreciate the quick response — attaching the original signed rate card for reference." },
  ] },
  { id: "EML-10247", subject: "Shipment Customs Clearance",         sender: "ops@metasiteinc.com",      category: "Logistics",  status: "Cleared",      received: "Jan 14", size: "0.5 MB",
    body: "Shipment cleared customs without incident. Delivery tracking updated, ETA unchanged." },
  { id: "EML-10248", subject: "Security Patch Notification",        sender: "security@intellisight.io", category: "Security",   status: "Cleared",      received: "Jan 13", size: "0.2 MB",
    body: "Critical security patch has been deployed across all production servers. No downtime reported." },
];

// Shared CCC-enriched view of ALL_EMAILS — computed once so the Command Center overview grid and the email detail
// page read the exact same linkedCccs/replies hierarchy instead of each re-deriving their own mock data.
export const ALL_EMAILS_WITH_CCC: Email[] = ALL_EMAILS.map((email, i) => withCccHierarchy(email, i));
