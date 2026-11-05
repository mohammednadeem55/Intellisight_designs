// Mock data for the SSD / SOE workbench (Schedule Shipment Date changes and Sales Order Exceptions).
// Two intake channels feed one CSR workbench: Factory-initiated cases are native to this dashboard (a factory
// uploads a file and a case is created per unique order); Customer-initiated ones arrive from Salesforce.
// Both end in the same Oracle SSD / SAD update, and exceptions the customer won't accept go through P1 RME.

export type Persona = "csr" | "factory" | "rme";

export const PERSONA_LABELS: Record<Persona, { name: string; blurb: string }> = {
  csr: { name: "CSR Super User", blurb: "Works every SSD / SOE case, updates Oracle, raises P1 RME" },
  factory: { name: "Factory", blurb: "Uploads proposed SSD changes and follows their status" },
  rme: { name: "SPOC team", blurb: "Reviews P1 RME exceptions routed to your region" },
};

// Personas switched on for now; the rest show as "Coming soon" in the switcher.
export const ENABLED_PERSONAS: Persona[] = ["csr"];

export type CaseKind = "SOE" | "SSD";
export type CaseSource = "Factory" | "Customer"; // Factory = dashboard-native, Customer = Salesforce case
export type CaseStatus = "New" | "In Progress" | "Awaiting Approval" | "Approved" | "Rejected" | "Pending RME" | "Closed" | "Cancelled";
export type RequestType = "Improved Delivery" | "LQSM Request" | "Missed Ship Date" | "Year End Program" | "SSD Pull-in" | "SSD Push-out";

export const CASE_STATUSES: CaseStatus[] = ["New", "In Progress", "Awaiting Approval", "Approved", "Rejected", "Pending RME", "Closed", "Cancelled"];
export const REQUEST_TYPES: RequestType[] = ["Improved Delivery", "LQSM Request", "Missed Ship Date", "Year End Program", "SSD Pull-in", "SSD Push-out"];
// Request types the "Updated in Oracle" tick box is applicable to (shown next to it in Edit Multiple Lines).
export const ORACLE_UPDATE_REQUEST_TYPES: RequestType[] = ["Improved Delivery", "LQSM Request", "Missed Ship Date", "Year End Program"];
export const FACTORIES = ["F01", "F03", "F48"];

export type CaseComment = { at: string; by: string; text: string };

export type CaseLine = {
  line: string;
  partNumber: string;
  quantity: number;
  factory: string;
  bookedDate: string;
  ssd: string;
  crd: string;
  sad: string;
  srt: number;
  requestType: RequestType;
  status: CaseStatus;
  caseOwner: string;
  ownerEmail: string;
  planner: string;
  plannerCode: string;
  oracleLineStatus: string;
  planningPriority: number;
  extSellingPrice: number;
  pl: string;
  p1Rme: boolean;
  requireRme: boolean;
  factoryBestSsd: string;
  rescheduleSsd: string;
  followupDate: string;
  updatedInOracle: boolean;
  shipDate: string;
  reopenDate: string;
  lineHoldInfo: string;
  taaCompliance: string;
  comments: CaseComment[];
};

export type RmeRequest = {
  raisedBy: string;
  raisedAt: string;
  routedTo: "SPOC team" | "RME team";
  reason: string;
  status: "Open" | "Accepted" | "Declined";
  feedback?: string;
  feedbackBy?: string;
  feedbackAt?: string;
};

export type SsdSoeCase = {
  caseNo: string;
  kind: CaseKind;
  source: CaseSource;
  status: CaseStatus;
  orderNo: string;
  orderStatus: string;
  customerPo: string;
  customer: string;
  ou: string;
  region: string;
  destination: string;
  requester: string;
  csr: string;
  fieldEngineer: string;
  crddType: string;
  crddDate: string;
  dateSubmitted: string;
  dateClosed: string;
  originalRequest: string;
  totalPriceUsd: string;
  headerHold: string;
  linkedCase: string;
  ssdCaseNo: string;
  ssdCaseStatus: string;
  factory: string;
  lines: CaseLine[];
  rme?: RmeRequest;
};

const CSR_EMAIL = "arman.singh@keysight.com";

function line(partial: Partial<CaseLine> & Pick<CaseLine, "line" | "partNumber" | "quantity">): CaseLine {
  return {
    factory: "F03",
    bookedDate: "22-Apr-26",
    ssd: "12-Sep-26",
    crd: "24-Sep-26",
    sad: "24-Sep-26",
    srt: 3,
    requestType: "Improved Delivery",
    status: "In Progress",
    caseOwner: "Samantha Lau",
    ownerEmail: "samantha-ew_lau@keysight.com",
    planner: "ji-tai.tan@keysight.com",
    plannerCode: "EPSG180CMB",
    oracleLineStatus: "AWAITING_FULFILLMENT",
    planningPriority: 100,
    extSellingPrice: 1041.65,
    pl: "1A",
    p1Rme: false,
    requireRme: false,
    factoryBestSsd: "",
    rescheduleSsd: "NA",
    followupDate: "",
    updatedInOracle: false,
    shipDate: "",
    reopenDate: "",
    lineHoldInfo: "",
    taaCompliance: "",
    comments: [],
    ...partial,
  };
}

export const INITIAL_CASES: SsdSoeCase[] = [
  {
    caseNo: "217652",
    kind: "SOE",
    source: "Customer",
    status: "In Progress",
    orderNo: "4701396",
    orderStatus: "BOOKED",
    customerPo: "4507506008",
    customer: "RS Components GmbH",
    ou: "DES-OU-0653",
    region: "EU",
    destination: "DE",
    requester: CSR_EMAIL,
    csr: CSR_EMAIL,
    fieldEngineer: "DIST CATALOGUES UK",
    crddType: "5 Multiple Dates Per Order",
    crddDate: "",
    dateSubmitted: "30-Jul-26",
    dateClosed: "",
    originalRequest: "Could you please expedite ?",
    totalPriceUsd: "4992.51",
    headerHold: "",
    linkedCase: "",
    ssdCaseNo: "",
    ssdCaseStatus: "",
    factory: "F03",
    lines: [
      line({
        line: "3.1",
        partNumber: "1852140",
        quantity: 4,
        comments: [
          { at: "31-Jul-26", by: "sam", text: "Case Line Status Changed from New to In Progress" },
          { at: "30-Jul-26", by: "AS", text: "Could you please expedite ?" },
        ],
      }),
    ],
  },
  {
    caseNo: "217906",
    kind: "SOE",
    source: "Customer",
    status: "New",
    orderNo: "4730593",
    orderStatus: "BOOKED",
    customerPo: "4507611203",
    customer: "MCS Test Equipment Ltd",
    ou: "GBS-OU-2613",
    region: "EU",
    destination: "GB",
    requester: CSR_EMAIL,
    csr: CSR_EMAIL,
    fieldEngineer: "MCS FIELD UK",
    crddType: "1 Single Date Per Order",
    crddDate: "20-Aug-26",
    dateSubmitted: "03-Aug-26",
    dateClosed: "",
    originalRequest: "Can we improve the delivery date ?",
    totalPriceUsd: "1180.00",
    headerHold: "",
    linkedCase: "",
    ssdCaseNo: "",
    ssdCaseStatus: "",
    factory: "F03",
    lines: [
      line({
        line: "1.1",
        partNumber: "DAQA190A",
        quantity: 1,
        status: "New",
        ssd: "20-Aug-26",
        crd: "02-Sep-26",
        sad: "02-Sep-26",
        srt: 2,
        extSellingPrice: 1180,
        comments: [{ at: "03-Aug-26", by: "AS", text: "Can we improve the delivery date ?" }],
      }),
    ],
  },
  {
    caseNo: "D-SDD-1042",
    kind: "SSD",
    source: "Factory",
    status: "Awaiting Approval",
    orderNo: "4688120",
    orderStatus: "BOOKED",
    customerPo: "PO-77120-A",
    customer: "Sterling & Co",
    ou: "USA-OU-1100",
    region: "NA",
    destination: "US",
    requester: "f01.planner@keysight.com",
    csr: CSR_EMAIL,
    fieldEngineer: "STERLING FIELD",
    crddType: "1 Single Date Per Order",
    crddDate: "01-Oct-26",
    dateSubmitted: "04-Aug-26",
    dateClosed: "",
    originalRequest: "Factory proposes SSD push-out on 2 lines (supply constraint)",
    totalPriceUsd: "18420.00",
    headerHold: "",
    linkedCase: "",
    ssdCaseNo: "D-SDD-1042",
    ssdCaseStatus: "Awaiting Approval",
    factory: "F01",
    lines: [
      line({ line: "1.1", partNumber: "N9020B-526", quantity: 1, factory: "F01", status: "Awaiting Approval", requestType: "SSD Push-out", ssd: "15-Sep-26", factoryBestSsd: "29-Sep-26", crd: "01-Oct-26", srt: 6, caseOwner: "Arman Singh", extSellingPrice: 9210, comments: [{ at: "04-Aug-26", by: "Factory F01", text: "Proposed SSD 29-Sep-26. Supply constraint on option 526." }] }),
      line({ line: "2.1", partNumber: "N9020B-544", quantity: 1, factory: "F01", status: "Awaiting Approval", requestType: "SSD Push-out", ssd: "15-Sep-26", factoryBestSsd: "29-Sep-26", crd: "01-Oct-26", srt: 6, caseOwner: "Arman Singh", extSellingPrice: 9210, comments: [] }),
    ],
  },
  {
    caseNo: "D-SDD-1043",
    kind: "SSD",
    source: "Factory",
    status: "Approved",
    orderNo: "4690211",
    orderStatus: "BOOKED",
    customerPo: "CT-88231",
    customer: "Nordlicht Messtechnik",
    ou: "DES-OU-0653",
    region: "EU",
    destination: "DE",
    requester: "f48.planner@keysight.com",
    csr: CSR_EMAIL,
    fieldEngineer: "NORDLICHT FIELD",
    crddType: "1 Single Date Per Order",
    crddDate: "12-Sep-26",
    dateSubmitted: "01-Aug-26",
    dateClosed: "",
    originalRequest: "Factory proposes SSD pull-in (stock available)",
    totalPriceUsd: "6400.00",
    headerHold: "",
    linkedCase: "",
    ssdCaseNo: "D-SDD-1043",
    ssdCaseStatus: "Approved",
    factory: "F48",
    lines: [
      line({ line: "1.1", partNumber: "E5071C-285", quantity: 1, factory: "F48", status: "Approved", requestType: "SSD Pull-in", ssd: "09-Sep-26", factoryBestSsd: "26-Aug-26", rescheduleSsd: "26-Aug-26", crd: "12-Sep-26", srt: 4, caseOwner: "Arman Singh", extSellingPrice: 6400, updatedInOracle: true, comments: [{ at: "02-Aug-26", by: "AS", text: "Approved. Oracle SSD / SAD updated." }] }),
    ],
  },
  {
    caseNo: "SF-5521",
    kind: "SSD",
    source: "Customer",
    status: "In Progress",
    orderNo: "4702288",
    orderStatus: "BOOKED",
    customerPo: "4508801120",
    customer: "Meridian Optics Pte Ltd",
    ou: "SGP-OU-3301",
    region: "AP",
    destination: "SG",
    requester: "claire.dubois@meridianoptics.sg",
    csr: CSR_EMAIL,
    fieldEngineer: "MERIDIAN FIELD",
    crddType: "5 Multiple Dates Per Order",
    crddDate: "",
    dateSubmitted: "02-Aug-26",
    dateClosed: "",
    originalRequest: "Customer asks to move SSD earlier for line 2.1 (email to FCNV)",
    totalPriceUsd: "12780.00",
    headerHold: "",
    linkedCase: "217652",
    ssdCaseNo: "SF-5521",
    ssdCaseStatus: "In Progress",
    factory: "F03",
    lines: [
      line({ line: "2.1", partNumber: "N6705C", quantity: 2, status: "In Progress", requestType: "SSD Pull-in", ssd: "30-Sep-26", crd: "15-Sep-26", srt: 5, caseOwner: "Arman Singh", extSellingPrice: 6390, comments: [{ at: "02-Aug-26", by: "FCNV", text: "Customer requests SSD on or before 15-Sep-26. Salesforce case SF-5521 created." }] }),
    ],
  },
  {
    caseNo: "218031",
    kind: "SOE",
    source: "Customer",
    status: "Pending RME",
    orderNo: "4709904",
    orderStatus: "BOOKED",
    customerPo: "4509012233",
    customer: "Nihon Dempa Kogyo",
    ou: "JPN-OU-2200",
    region: "AP",
    destination: "JP",
    requester: CSR_EMAIL,
    csr: CSR_EMAIL,
    fieldEngineer: "NDK FIELD JP",
    crddType: "1 Single Date Per Order",
    crddDate: "10-Sep-26",
    dateSubmitted: "05-Aug-26",
    dateClosed: "",
    originalRequest: "Customer does not accept the factory proposed date",
    totalPriceUsd: "22150.00",
    headerHold: "",
    linkedCase: "",
    ssdCaseNo: "",
    ssdCaseStatus: "",
    factory: "F03",
    lines: [
      line({ line: "4.1", partNumber: "M9484C", quantity: 1, status: "Pending RME", requestType: "Missed Ship Date", ssd: "28-Sep-26", crd: "10-Sep-26", srt: 8, requireRme: true, p1Rme: true, caseOwner: "Arman Singh", extSellingPrice: 22150, comments: [{ at: "05-Aug-26", by: "AS", text: "Customer cannot accept 28-Sep-26. Raised P1 RME." }] }),
    ],
    rme: {
      raisedBy: "Arman Singh",
      raisedAt: "05-Aug-26",
      routedTo: "SPOC team",
      reason: "Customer's production line is waiting on this instrument. Needs CRD 10-Sep-26, factory proposes 28-Sep-26.",
      status: "Open",
    },
  },
  {
    caseNo: "218044",
    kind: "SOE",
    source: "Customer",
    status: "Pending RME",
    orderNo: "4710120",
    orderStatus: "BOOKED",
    customerPo: "EU-PO-30021",
    customer: "Lumen Electronique",
    ou: "FRA-OU-0910",
    region: "EU",
    destination: "FR",
    requester: CSR_EMAIL,
    csr: CSR_EMAIL,
    fieldEngineer: "LUMEN FIELD",
    crddType: "1 Single Date Per Order",
    crddDate: "05-Sep-26",
    dateSubmitted: "06-Aug-26",
    dateClosed: "",
    originalRequest: "Year end program order needs earlier ship date",
    totalPriceUsd: "9830.40",
    headerHold: "",
    linkedCase: "",
    ssdCaseNo: "",
    ssdCaseStatus: "",
    factory: "F01",
    lines: [
      line({ line: "1.1", partNumber: "34465A", quantity: 6, factory: "F01", status: "Pending RME", requestType: "Year End Program", ssd: "22-Sep-26", crd: "05-Sep-26", srt: 5, requireRme: true, p1Rme: true, caseOwner: "Arman Singh", extSellingPrice: 1638.4, comments: [] }),
    ],
    rme: {
      raisedBy: "Arman Singh",
      raisedAt: "06-Aug-26",
      routedTo: "RME team",
      reason: "Year end program commitment. Customer needs 05-Sep-26, current SSD 22-Sep-26.",
      status: "Open",
    },
  },
  {
    caseNo: "217210",
    kind: "SOE",
    source: "Customer",
    status: "Closed",
    orderNo: "4668810",
    orderStatus: "SHIPPED",
    customerPo: "PO-5001",
    customer: "Acme Industries",
    ou: "USA-OU-1100",
    region: "NA",
    destination: "US",
    requester: CSR_EMAIL,
    csr: CSR_EMAIL,
    fieldEngineer: "ACME FIELD",
    crddType: "1 Single Date Per Order",
    crddDate: "10-Jul-26",
    dateSubmitted: "10-Jul-26",
    dateClosed: "21-Jul-26",
    originalRequest: "Please expedite",
    totalPriceUsd: "3300.00",
    headerHold: "",
    linkedCase: "",
    ssdCaseNo: "",
    ssdCaseStatus: "",
    factory: "F03",
    lines: [
      line({ line: "1.1", partNumber: "U2000A", quantity: 3, status: "Closed", requestType: "Improved Delivery", ssd: "15-Jul-26", crd: "18-Jul-26", srt: 2, updatedInOracle: true, extSellingPrice: 1100, comments: [{ at: "21-Jul-26", by: "AS", text: "Shipped. Closing case." }] }),
    ],
  },
];

// Other lines on an order that a CSR can pull into an open case ("Add New Line Item").
export type OrderLineOption = { line: string; partNumber: string; factory: string; bookedDate: string; ssd: string; crddType: string; crddDate: string; flowStatus: string; srt: number };
export function orderLinesFor(orderNo: string): OrderLineOption[] {
  const parts = ["501102", "7389486", "1852140", "6997351", "7600373", "1751803", "1953126", "1953206", "1368575", "501314", "2005279", "501291"];
  const srts = [4, 4, 3, 4, 4, 16, 4, 4, 6, 4, 14, 4];
  const closed = new Set([1, 3, 9, 10]);
  const seed = Number(orderNo.replace(/\D/g, "").slice(-2)) || 0;
  return parts.map((p, i) => ({
    line: `${i + 1}.1`,
    partNumber: p,
    factory: i % 5 === 4 ? "F01" : "F03",
    bookedDate: "22-Apr-26",
    ssd: i === 2 ? "12-Sep-26" : "04-Jul-26",
    crddType: "5 Multiple Dates Per Order",
    crddDate: "",
    flowStatus: closed.has((i + seed) % 12) ? "CLOSED" : "AWAITING_FULFILLMENT",
    srt: srts[i],
  }));
}

export function isBlockedLine(l: OrderLineOption): boolean {
  // "Line items with SRT <02-weeks for F01/F48 will not be available for selection"
  return (l.factory === "F01" || l.factory === "F48") && l.srt < 2;
}

// ---------------------------------------------------------------------------------------------------------
// Shared helpers

export const todayStr = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-");

export function parseCaseDate(d: string): Date | null {
  const m = /^(\d{2})-([A-Za-z]{3})-(\d{2})$/.exec(d);
  if (!m) return null;
  const date = new Date(`${m[1]} ${m[2]} 20${m[3]}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// ---------------------------------------------------------------------------------------------------------
// Oracle order lookup (mock). A CSR searches an order number; in the real tool this is a Jitterbit call.

export type OracleOrder = {
  orderNo: string;
  orderStatus: string;
  customerPo: string;
  customer: string;
  ou: string;
  region: string;
  destination: string;
  crddType: string;
  crddDate: string;
  totalPriceUsd: string;
  lines: OrderLineOption[];
};

const MOCK_CUSTOMERS: Pick<OracleOrder, "customer" | "ou" | "region" | "destination">[] = [
  { customer: "Acme Industries", ou: "USA-OU-1100", region: "NA", destination: "US" },
  { customer: "Lumen Electronique", ou: "FRA-OU-0910", region: "EU", destination: "FR" },
  { customer: "Hoshino Systems", ou: "JPN-OU-0420", region: "APAC", destination: "JP" },
  { customer: "Nordvik Telecom", ou: "SWE-OU-0305", region: "EU", destination: "SE" },
];

/** Returns null when Oracle has no such order. Seven-digit numbers resolve; known case orders return their own header. */
export function lookupOracleOrder(orderNo: string): OracleOrder | null {
  const no = orderNo.trim();
  if (!/^\d{7}$/.test(no)) return null;
  const known = INITIAL_CASES.find((c) => c.orderNo === no);
  const seed = Number(no.slice(-2));
  const base = known
    ? { customer: known.customer, ou: known.ou, region: known.region, destination: known.destination }
    : MOCK_CUSTOMERS[seed % MOCK_CUSTOMERS.length];
  return {
    orderNo: no,
    orderStatus: known?.orderStatus ?? "BOOKED",
    customerPo: known?.customerPo ?? `PO-${no.slice(-4)}`,
    ...base,
    crddType: known?.crddType ?? "5 Multiple Dates Per Order",
    crddDate: known?.crddDate ?? "",
    totalPriceUsd: known?.totalPriceUsd ?? (12000 + seed * 137.5).toFixed(2),
    lines: orderLinesFor(no),
  };
}

/** A fresh case line for an Oracle order line that is being brought into a case. */
export function newCaseLine(o: OrderLineOption, requestType: RequestType, comment: string, by: string, owner: string, ownerEmail: string): CaseLine {
  return {
    line: o.line,
    partNumber: o.partNumber,
    quantity: 1,
    factory: o.factory,
    bookedDate: o.bookedDate,
    ssd: o.ssd,
    crd: o.crddDate || o.ssd,
    sad: o.ssd,
    srt: o.srt,
    requestType,
    status: "New",
    caseOwner: owner,
    ownerEmail,
    planner: "ji-tai.tan@keysight.com",
    plannerCode: "EPSG180CMB",
    oracleLineStatus: o.flowStatus,
    planningPriority: 100,
    extSellingPrice: 0,
    pl: "1A",
    p1Rme: false,
    requireRme: false,
    factoryBestSsd: "",
    rescheduleSsd: "NA",
    followupDate: "",
    updatedInOracle: false,
    shipDate: "",
    reopenDate: "",
    lineHoldInfo: "",
    taaCompliance: "",
    comments: comment ? [{ at: todayStr(), by, text: comment }] : [],
  };
}

// ---------------------------------------------------------------------------------------------------------
// Case activity: one chronological history built from the case header, RME hand-offs and every line's comments.

export type ActivityKind = "case" | "comment" | "oracle" | "rme";
export type ActivityEvent = { at: string; kind: ActivityKind; title: string; by: string; text?: string; line?: string };

export function buildCaseActivity(c: SsdSoeCase): ActivityEvent[] {
  const events: (ActivityEvent & { order: number })[] = [];
  let order = 0;
  const add = (e: ActivityEvent) => events.push({ ...e, order: order++ });

  add({ at: c.dateSubmitted, kind: "case", title: c.source === "Factory" ? "Case created from factory upload" : "Case created from Salesforce", by: c.requester });
  if (c.rme) {
    add({ at: c.rme.raisedAt, kind: "rme", title: `P1 RME raised, routed to ${c.rme.routedTo}`, by: c.rme.raisedBy, text: c.rme.reason });
    if (c.rme.feedback && c.rme.feedbackAt) add({ at: c.rme.feedbackAt, kind: "rme", title: `RME feedback: ${c.rme.status.toLowerCase()}`, by: c.rme.feedbackBy ?? "SPOC", text: c.rme.feedback });
  }
  for (const l of c.lines) {
    for (const cm of l.comments) {
      add({ at: cm.at, kind: /oracle/i.test(cm.text) ? "oracle" : "comment", title: /oracle/i.test(cm.text) ? "Oracle update" : "Comment", by: cm.by, text: cm.text, line: l.line });
    }
  }
  if (c.dateClosed) add({ at: c.dateClosed, kind: "case", title: "Case closed", by: c.csr });

  const t = (e: ActivityEvent) => parseCaseDate(e.at)?.getTime() ?? 0;
  // Newest first; on the same day, closing sits on top and creation at the bottom.
  return events
    .sort((a, b) => {
      const d = t(b) - t(a);
      if (d !== 0) return d;
      const closeA = a.title === "Case closed" ? -1 : 0;
      const closeB = b.title === "Case closed" ? -1 : 0;
      if (closeA !== closeB) return closeA - closeB;
      const createdA = a.title.startsWith("Case created") ? 1 : 0;
      const createdB = b.title.startsWith("Case created") ? 1 : 0;
      if (createdA !== createdB) return createdA - createdB;
      return a.order - b.order;
    })
    .map(({ order: _o, ...e }) => e);
}
