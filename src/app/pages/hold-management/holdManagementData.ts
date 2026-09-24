// Mock hold/order data shared across the Hold Management page cluster (Order Listing, Released Orders,
// Order Details). Kept separate from the page files so it can be imported by whichever pages need it,
// same approach as emailData.ts for the Command Center pages.

export const ALL_ORDERS = [
  { id: "7822110", status: "On Track",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822111", status: "At Risk",   holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Japan"  },
  { id: "7822112", status: "Breached",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "USA"    },
  { id: "7822113", status: "On Track",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822114", status: "At Risk",   holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Manual" },
  { id: "7822115", status: "Breached",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822116", status: "On Track",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822117", status: "At Risk",   holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822118", status: "Breached",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822119", status: "On Track",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "234234234",         ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822120", status: "At Risk",   holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822121", status: "Breached",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "India"  },
  { id: "7822122", status: "On Track",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "9576809", ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Japan"  },
  { id: "7822123", status: "At Risk",   holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Japan"  },
  { id: "7822124", status: "Breached",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Japan"  },
  { id: "7822125", status: "At Risk",   holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Japan"  },
  { id: "7822126", status: "Breached",  holdType: "Bill Only Line Order", customer: "Metasite Inc", poId: "KTM-POQ-2342342",  ocn: "90044",   ou: "KRS-OU-4123", ssd: "Jan 18", ssdDelta: "+5D", country: "Japan"  },
  { id: "7822127", status: "On Track",  holdType: "Credit Check Order",   customer: "Acme Corp",    poId: "ACM-POQ-1001001",  ocn: "11223",   ou: "KRS-OU-5001", ssd: "Jan 20", ssdDelta: "+3D", country: "USA"    },
  { id: "7822128", status: "At Risk",   holdType: "Credit Check Order",   customer: "Acme Corp",    poId: "ACM-POQ-1001002",  ocn: "11224",   ou: "KRS-OU-5001", ssd: "Jan 20", ssdDelta: "+3D", country: "USA"    },
  { id: "7822129", status: "On Track",  holdType: "Credit Check Order",   customer: "GlobalTech",   poId: "GLB-POQ-5050505",  ocn: "33445",   ou: "KRS-OU-6002", ssd: "Jan 22", ssdDelta: "+2D", country: "UK"     },
  { id: "7822130", status: "Breached",  holdType: "Credit Check Order",   customer: "GlobalTech",   poId: "GLB-POQ-5050506",  ocn: "33446",   ou: "KRS-OU-6002", ssd: "Jan 22", ssdDelta: "+2D", country: "UK"     },
  { id: "7822131", status: "On Track",  holdType: "Invoice Hold",         customer: "Nexus Corp",   poId: "NXS-POQ-7070707",  ocn: "55667",   ou: "KRS-OU-7003", ssd: "Jan 25", ssdDelta: "+1D", country: "India"  },
  { id: "7822132", status: "At Risk",   holdType: "Invoice Hold",         customer: "Nexus Corp",   poId: "NXS-POQ-7070708",  ocn: "55668",   ou: "KRS-OU-7003", ssd: "Jan 25", ssdDelta: "+1D", country: "India"  },
  { id: "7822133", status: "Breached",  holdType: "Invoice Hold",         customer: "Sterling & Co", poId: "STR-POQ-8080808", ocn: "77889",   ou: "KRS-OU-8004", ssd: "Jan 28", ssdDelta: "+7D", country: "UAE"    },
  { id: "7822134", status: "On Track",  holdType: "Invoice Hold",         customer: "Sterling & Co", poId: "STR-POQ-8080809", ocn: "77890",   ou: "KRS-OU-8004", ssd: "Jan 28", ssdDelta: "+7D", country: "UAE"    },
  { id: "7822135", status: "At Risk",   holdType: "Invoice Hold",         customer: "Sterling & Co", poId: "STR-POQ-8080810", ocn: "77891",   ou: "KRS-OU-8004", ssd: "Jan 28", ssdDelta: "+7D", country: "UAE"    },
];

// Order Listing's "Customer Information" panel — keyed by the `customer` name on ALL_ORDERS, so clicking a
// customer name/credit-check icon in the table can look up its credit profile without a separate join table.
export type CustomerCreditInfo = {
  profileClass: string;
  creditLimit: number;
  exposure: number;
  wadlDays: number;
  gtmHold: "Clear" | "Hold";
  rplHold: "Clear" | "Hold";
  screening: "Pass" | "Fail" | "Review";
  payTerm: string;
  billCountry: string;
  shipCountry: string;
  currency: string;
  arCurrent: number;
  ar1to30: number;
  ar31to60: number;
  ar61to90: number;
  arOver90: number;
};

export const CUSTOMER_CREDIT_INFO: Record<string, CustomerCreditInfo> = {
  "Metasite Inc": {
    profileClass: "Standard", creditLimit: 500000, exposure: 210000, wadlDays: 5.2,
    gtmHold: "Clear", rplHold: "Clear", screening: "Pass", payTerm: "Net 30",
    billCountry: "IN", shipCountry: "IN", currency: "INR",
    arCurrent: 80000, ar1to30: 40000, ar31to60: 10000, ar61to90: 0, arOver90: 0,
  },
  "Acme Corp": {
    profileClass: "Preferred", creditLimit: 750000, exposure: 320000, wadlDays: 3.1,
    gtmHold: "Clear", rplHold: "Clear", screening: "Pass", payTerm: "Net 45",
    billCountry: "US", shipCountry: "US", currency: "USD",
    arCurrent: 150000, ar1to30: 60000, ar31to60: 20000, ar61to90: 5000, arOver90: 0,
  },
  GlobalTech: {
    profileClass: "Standard", creditLimit: 400000, exposure: 380000, wadlDays: 9.7,
    gtmHold: "Hold", rplHold: "Clear", screening: "Review", payTerm: "Net 30",
    billCountry: "GB", shipCountry: "GB", currency: "GBP",
    arCurrent: 40000, ar1to30: 35000, ar31to60: 25000, ar61to90: 15000, arOver90: 8000,
  },
  "Nexus Corp": {
    profileClass: "Standard", creditLimit: 300000, exposure: 95000, wadlDays: 4.4,
    gtmHold: "Clear", rplHold: "Clear", screening: "Pass", payTerm: "Net 60",
    billCountry: "IN", shipCountry: "IN", currency: "INR",
    arCurrent: 30000, ar1to30: 12000, ar31to60: 3000, ar61to90: 0, arOver90: 0,
  },
  "Sterling & Co": {
    profileClass: "High Risk", creditLimit: 600000, exposure: 590000, wadlDays: 14.2,
    gtmHold: "Hold", rplHold: "Hold", screening: "Fail", payTerm: "Net 15",
    billCountry: "AE", shipCountry: "AE", currency: "USD",
    arCurrent: 20000, ar1to30: 45000, ar31to60: 60000, ar61to90: 40000, arOver90: 25000,
  },
};

export const ALL_RELEASED = [
  { id: "7800028", customer: "Acme Industries Ltd",  holdType: "Credit Check Failure", value: "$210K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "ACM-POQ-9000001" },
  { id: "7800029", customer: "GlobalTech Corp",       holdType: "Invoice Hold",         value: "$85K",  title: "Standard Order",         releasedDays: "09 day's ago", poId: "GLB-POQ-9000002" },
  { id: "7800030", customer: "Metasite Inc",          holdType: "Bill Only Line Order", value: "$340K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "KTM-POQ-9000003" },
  { id: "7800031", customer: "Nexus Corp",            holdType: "Credit Check Failure", value: "$120K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "NXS-POQ-9000004" },
  { id: "7800032", customer: "Sterling & Co",         holdType: "Invoice Hold",         value: "$560K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "STR-POQ-9000005" },
  { id: "7800033", customer: "Acme Industries Ltd",  holdType: "Tax Hold",             value: "$75K",  title: "Standard Order",         releasedDays: "09 day's ago", poId: "ACM-POQ-9000006" },
  { id: "7800034", customer: "GlobalTech Corp",       holdType: "Credit Check Failure", value: "$180K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "GLB-POQ-9000007" },
  { id: "7800035", customer: "Metasite Inc",          holdType: "Invoice Hold",         value: "$95K",  title: "Standard Order",         releasedDays: "09 day's ago", poId: "KTM-POQ-9000008" },
  { id: "7800036", customer: "Nexus Corp",            holdType: "Tax Hold",             value: "$420K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "NXS-POQ-9000009" },
  { id: "7800037", customer: "Sterling & Co",         holdType: "Credit Check Failure", value: "$230K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "STR-POQ-9000010" },
  { id: "7800038", customer: "Acme Industries Ltd",  holdType: "Invoice Hold",         value: "$310K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "ACM-POQ-9000011" },
  { id: "7800039", customer: "GlobalTech Corp",       holdType: "Tax Hold",             value: "$145K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "GLB-POQ-9000012" },
  { id: "7800040", customer: "Metasite Inc",          holdType: "Credit Check Failure", value: "$670K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "KTM-POQ-9000013" },
  { id: "7800041", customer: "Nexus Corp",            holdType: "Invoice Hold",         value: "$52K",  title: "Standard Order",         releasedDays: "09 day's ago", poId: "NXS-POQ-9000014" },
  { id: "7800042", customer: "Sterling & Co",         holdType: "Tax Hold",             value: "$890K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "STR-POQ-9000015" },
  { id: "7800043", customer: "Acme Industries Ltd",  holdType: "Credit Check Failure", value: "$115K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "ACM-POQ-9000016" },
  { id: "7800044", customer: "GlobalTech Corp",       holdType: "Invoice Hold",         value: "$200K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "GLB-POQ-9000017" },
  { id: "7800045", customer: "Metasite Inc",          holdType: "Tax Hold",             value: "$330K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "KTM-POQ-9000018" },
  { id: "7800046", customer: "Nexus Corp",            holdType: "Credit Check Failure", value: "$480K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "NXS-POQ-9000019" },
  { id: "7800047", customer: "Sterling & Co",         holdType: "Invoice Hold",         value: "$160K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "STR-POQ-9000020" },
  { id: "7800048", customer: "Acme Industries Ltd",  holdType: "Tax Hold",             value: "$720K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "ACM-POQ-9000021" },
  { id: "7800049", customer: "GlobalTech Corp",       holdType: "Credit Check Failure", value: "$55K",  title: "Standard Order",         releasedDays: "09 day's ago", poId: "GLB-POQ-9000022" },
  { id: "7800050", customer: "Metasite Inc",          holdType: "Invoice Hold",         value: "$280K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "KTM-POQ-9000023" },
  { id: "7800051", customer: "Nexus Corp",            holdType: "Tax Hold",             value: "$100K", title: "Standard Order",         releasedDays: "09 day's ago", poId: "NXS-POQ-9000024" },
  { id: "7800052", customer: "Sterling & Co",         holdType: "Credit Check Failure", value: "$390K", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "STR-POQ-9000025" },
  { id: "7800053", customer: "Acme Industries Ltd",  holdType: "Invoice Hold",         value: "$240M", title: "Bill Only Line Order",  releasedDays: "09 day's ago", poId: "ACM-POQ-9000026" },
];

export const HOLD_ROWS = [
  { id: 1, name: "CIA Hold",            category: "Financial",  level: "Header", workflow: "Immediate", owner: "CSR",         impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: true },
  { id: 2, name: "CIA Hold",            category: "Factory",    level: "Header", workflow: "Pick",      owner: "Factory",     impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: false },
  { id: 3, name: "Lorem Ipsum",         category: "Forecast",   level: "Header", workflow: "Immediate", owner: "CSR",         impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: false },
  { id: 4, name: "Lorem Ipsum",         category: "Framework",  level: "Header", workflow: "Immediate", owner: "CSR",         impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: false },
  { id: 5, name: "Bill Only Line Order",category: "Folio",      level: "Metasite Inc", workflow: "Immediate", owner: "CSR",   impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: false },
  { id: 6, name: "Bill Only Line Order",category: "Fusion",     level: "Metasite Inc", workflow: "Immediate", owner: "CSR",   impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: false },
  { id: 7, name: "Bill Only Line Order",category: "Frontier",   level: "Metasite Inc", workflow: "Immediate", owner: "CSR",   impact: "Ship", erd: "",  notes: "Dual: CIA Outstanding", hasRelease: false },
];

export const AUDIT_NOTES = [
  {
    id: 1,
    date: "19/05/2026",
    ago: "1 day ago",
    agent: "CSR Agent 001",
    source: "oracle" as const,
    text: "BIZ: SI\nFE/AE/PM: Brenden Kirby /Jouni Lantto/\nSol.Sp: Sari Pellinen\nTarget Acceptance Date: May26\nServices A/W Approval: May26\nAcceptance Criteria: Acceptance of standard products upon delivery / Acceptance of custom HW items upon commissioning / Services upon completion. Where acceptance is delayed by Volvo by 30 days or more following notification by Keysight that the Solution is ready for acceptance test, then custom HW and SW items shall be deemed accepted on the 31st day following such notice.",
  },
  {
    id: 2,
    date: "19/05/2026",
    ago: "10 days ago",
    agent: "CSR Agent 001",
    source: "manual" as const,
    text: "Lines showing in RMT hold management as SSD < 5 days - all lines are IM1 - not taking any action.",
  },
  {
    id: 3,
    date: "02/02/2026",
    ago: "1 day ago",
    agent: "CSR Agent 002",
    source: "manual" as const,
    text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500sLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s",
  },
];

export const AUDIT_HISTORY_ENTRIES = [
  {
    id: 1,
    user: "Winstina",
    field: "Close Date",
    from: "1/26/2026",
    to: "3/26/2026",
    timestamp: "12/12/2025, 11:25 AM",
    details:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500sLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s",
  },
  {
    id: 2,
    user: "Winstina",
    field: "Close Date",
    from: "1/26/2026",
    to: "3/26/2026",
    timestamp: "12/12/2025, 11:25 AM",
    details:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
  },
  {
    id: 3,
    user: "Winstina",
    field: "Close Date",
    from: "1/26/2026",
    to: "3/26/2026",
    timestamp: "12/12/2025, 11:25 AM",
    details:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
  },
];

export type FollowUpEscalationEntry = {
  id: number;
  type: "followup" | "escalation";
  holdName: string;
  agent: string;
  date: string;
  ago: string;
  to: string;
  subject: string;
  message: string;
  priority?: "Critical" | "High" | "Low";
};

export const FOLLOWUP_ESCALATION_LOG: FollowUpEscalationEntry[] = [
  {
    id: 1,
    type: "escalation",
    holdName: "CIA Hold",
    agent: "CSR Agent 001",
    date: "18/05/2026",
    ago: "2 days ago",
    to: "compliance@keysight.com",
    subject: "Escalation: CIA Hold Aging",
    message: "This CIA hold has been open for 5 days without resolution. Escalating for visibility — please advise on next steps or approve an exception.",
    priority: "High",
  },
  {
    id: 2,
    type: "followup",
    holdName: "CIA Hold",
    agent: "CSR Agent 002",
    date: "16/05/2026",
    ago: "4 days ago",
    to: "finance@keysight.com",
    subject: "Follow-up: CIA Hold Status",
    message: "Following up on the outstanding CIA hold on this order — please confirm receipt of payment so the hold can be cleared.",
  },
];

// Credit-view-only: line-level detail for an order, so a credit user can apply a hold to one or several
// specific lines rather than only at the hold-type level (Hold Listings above).
export type LineListingRow = {
  id: number;
  lineNum: string;
  lineId: string;
  item: string;
  description: string;
  level: "Header" | "Line";
  holdStatus: string;
  status: "Entered" | "Booked" | "AWAITING_FULFILLMENT";
  response?: string;
  responseFailed?: boolean;
};

export const CREDIT_HOLD_TYPES = ["Credit Hold at Pick", "Credit Check Failure", "Manual Credit Hold"];

export const LINE_LISTING_ROWS: LineListingRow[] = [
  { id: 1, lineNum: "—", lineId: "—", item: "—", description: "—", level: "Header", holdStatus: "Credit Hold at Pick", status: "Entered" },
  { id: 2, lineNum: "—", lineId: "—", item: "—", description: "—", level: "Header", holdStatus: "Credit Check Failure", status: "Entered" },
  { id: 3, lineNum: "1.1", lineId: "181925072", item: "N5766A", description: "DC Power Supply 40V, 38A, 1520W; GPIB, LAN, USB, LXI", level: "Line", holdStatus: "Credit Hold at Pick", status: "Booked", response: "Applied" },
  { id: 4, lineNum: "1.1", lineId: "181925072", item: "N5766A", description: "DC Power Supply 40V, 38A, 1520W; GPIB, LAN, USB, LXI", level: "Line", holdStatus: "Credit Check Failure", status: "Booked", response: "Applied" },
  { id: 5, lineNum: "2.1", lineId: "181925073", item: "N5766A", description: "DC Power Supply 40V, 38A, 1520W; GPIB, LAN, USB, LXI", level: "Line", holdStatus: "Manual Credit Hold", status: "AWAITING_FULFILLMENT", response: "Applied" },
  { id: 6, lineNum: "2.1", lineId: "181925112", item: "—", description: "—", level: "Line", holdStatus: "Credit Hold at Pick", status: "Entered" },
  { id: 7, lineNum: "4.1", lineId: "181925075", item: "—", description: "Surcharge", level: "Line", holdStatus: "Credit Hold at Pick", status: "AWAITING_FULFILLMENT", response: "Applied" },
  {
    id: 8, lineNum: "6.1", lineId: "182049079", item: "E4368A", description: "Configured E4360A SAS Mainframe with 2 E4362A Modules", level: "Line", holdStatus: "Credit Check Failure", status: "Booked",
    response: "User does not have an active Order Management responsibility for operating unit [USO-OU-8213]. Cannot authorize apply of hold [Credit Check Failure].",
    responseFailed: true,
  },
];

// Credit view "My Holds / All Holds / teammate / group" picker — each record is one order sitting on a
// credit hold, assigned to a real team member, so switching scope in HoldManagementOverview.tsx actually
// changes which orders are counted/aggregated into the Credit Holds cards instead of just swapping a label.
export type CreditTeamUser = { id: string; name: string };
export const CREDIT_TEAM_USERS: CreditTeamUser[] = [
  { id: "me", name: "Jagdish Kumar" },
  { id: "u1", name: "Priya Shah" },
  { id: "u2", name: "Wasim Shaikh" },
  { id: "u3", name: "Pranjal Bailung" },
  { id: "u4", name: "Khaja Mohideen" },
  { id: "u5", name: "Winstina D'Souza" },
  { id: "u6", name: "Brenden Kirby" },
  { id: "u7", name: "Jouni Lantto" },
  { id: "u8", name: "Sari Pellinen" },
];
// "me" = the logged-in user (matches AppHeader's CURRENT_USER), so "My Holds" is just scope { type: "user", userId: CURRENT_CREDIT_USER_ID }.
export const CURRENT_CREDIT_USER_ID = "me";

export type CreditHoldRecord = {
  id: string;
  holdType: (typeof CREDIT_HOLD_TYPES)[number];
  assignedToId: string;
  value: number;
  status: "On Track" | "At Risk" | "Breached";
  agingDays: number;
  ssdProximityDays: number;
  ageHours: number;
};

export const CREDIT_HOLD_RECORDS: CreditHoldRecord[] = [
  // Credit Check Failure (12)
  { id: "ch1", holdType: "Credit Check Failure", assignedToId: "me", value: 220000, status: "Breached", agingDays: 9, ssdProximityDays: 4, ageHours: 70 },
  { id: "ch2", holdType: "Credit Check Failure", assignedToId: "u1", value: 180000, status: "On Track", agingDays: 4, ssdProximityDays: 9, ageHours: 30 },
  { id: "ch3", holdType: "Credit Check Failure", assignedToId: "u1", value: 95000, status: "At Risk", agingDays: 6, ssdProximityDays: 7, ageHours: 45 },
  { id: "ch4", holdType: "Credit Check Failure", assignedToId: "u2", value: 260000, status: "Breached", agingDays: 12, ssdProximityDays: 2, ageHours: 96 },
  { id: "ch5", holdType: "Credit Check Failure", assignedToId: "u2", value: 140000, status: "On Track", agingDays: 3, ssdProximityDays: 11, ageHours: 22 },
  { id: "ch6", holdType: "Credit Check Failure", assignedToId: "u3", value: 175000, status: "At Risk", agingDays: 7, ssdProximityDays: 6, ageHours: 50 },
  { id: "ch7", holdType: "Credit Check Failure", assignedToId: "u3", value: 110000, status: "Breached", agingDays: 15, ssdProximityDays: 1, ageHours: 130 },
  { id: "ch8", holdType: "Credit Check Failure", assignedToId: "u4", value: 130000, status: "On Track", agingDays: 2, ssdProximityDays: 12, ageHours: 16 },
  { id: "ch9", holdType: "Credit Check Failure", assignedToId: "u5", value: 165000, status: "At Risk", agingDays: 8, ssdProximityDays: 5, ageHours: 60 },
  { id: "ch10", holdType: "Credit Check Failure", assignedToId: "u6", value: 95000, status: "On Track", agingDays: 3, ssdProximityDays: 10, ageHours: 24 },
  { id: "ch11", holdType: "Credit Check Failure", assignedToId: "u7", value: 145000, status: "Breached", agingDays: 11, ssdProximityDays: 3, ageHours: 88 },
  { id: "ch12", holdType: "Credit Check Failure", assignedToId: "u8", value: 105000, status: "At Risk", agingDays: 5, ssdProximityDays: 8, ageHours: 40 },

  // Credit Hold at Pick (9)
  { id: "cp1", holdType: "Credit Hold at Pick", assignedToId: "me", value: 145000, status: "On Track", agingDays: 3, ssdProximityDays: 10, ageHours: 20 },
  { id: "cp2", holdType: "Credit Hold at Pick", assignedToId: "u1", value: 88000, status: "On Track", agingDays: 2, ssdProximityDays: 12, ageHours: 14 },
  { id: "cp3", holdType: "Credit Hold at Pick", assignedToId: "u2", value: 102000, status: "Breached", agingDays: 10, ssdProximityDays: 3, ageHours: 84 },
  { id: "cp4", holdType: "Credit Hold at Pick", assignedToId: "u3", value: 76000, status: "On Track", agingDays: 1, ssdProximityDays: 13, ageHours: 10 },
  { id: "cp5", holdType: "Credit Hold at Pick", assignedToId: "u4", value: 94000, status: "At Risk", agingDays: 6, ssdProximityDays: 6, ageHours: 48 },
  { id: "cp6", holdType: "Credit Hold at Pick", assignedToId: "u5", value: 68000, status: "On Track", agingDays: 2, ssdProximityDays: 11, ageHours: 18 },
  { id: "cp7", holdType: "Credit Hold at Pick", assignedToId: "u6", value: 112000, status: "At Risk", agingDays: 5, ssdProximityDays: 7, ageHours: 42 },
  { id: "cp8", holdType: "Credit Hold at Pick", assignedToId: "u7", value: 85000, status: "On Track", agingDays: 3, ssdProximityDays: 9, ageHours: 26 },
  { id: "cp9", holdType: "Credit Hold at Pick", assignedToId: "u8", value: 130000, status: "On Track", agingDays: 4, ssdProximityDays: 8, ageHours: 33 },

  // Manual Credit Hold (6)
  { id: "mc1", holdType: "Manual Credit Hold", assignedToId: "me", value: 118000, status: "Breached", agingDays: 18, ssdProximityDays: 2, ageHours: 200 },
  { id: "mc2", holdType: "Manual Credit Hold", assignedToId: "u1", value: 95000, status: "At Risk", agingDays: 9, ssdProximityDays: 5, ageHours: 72 },
  { id: "mc3", holdType: "Manual Credit Hold", assignedToId: "u2", value: 87000, status: "On Track", agingDays: 4, ssdProximityDays: 9, ageHours: 30 },
  { id: "mc4", holdType: "Manual Credit Hold", assignedToId: "u4", value: 76000, status: "Breached", agingDays: 14, ssdProximityDays: 3, ageHours: 150 },
  { id: "mc5", holdType: "Manual Credit Hold", assignedToId: "u6", value: 108000, status: "At Risk", agingDays: 7, ssdProximityDays: 6, ageHours: 55 },
  { id: "mc6", holdType: "Manual Credit Hold", assignedToId: "u8", value: 116000, status: "On Track", agingDays: 5, ssdProximityDays: 8, ageHours: 38 },
];

export const HOLD_COLUMNS = ["Hold Name", "Category", "Level/Line", "Workflow", "Owner", "Impact", "ERD", "Notes Preview", "Action"];
export const HOLD_FILTER_SECTIONS = [
  { key: "Category",  label: "Category",  options: { Financial: 2, Factory: 1, Forecast: 1, Framework: 1, Folio: 1, Fusion: 1 } },
  { key: "Level",     label: "Level/Line",options: { Header: 4, "Metasite Inc": 3 } },
  { key: "Workflow",  label: "Workflow",  options: { Immediate: 5, Pick: 1 } },
  { key: "Owner",     label: "Owner",     options: { CSR: 5, Factory: 1, "CSR Factory": 1 } },
  { key: "Impact",    label: "Impact",    options: { Ship: 7 } },
];

// Order Details' "Show More Order Info" modal — a wider set of order/shipping fields than the base
// ALL_ORDERS row carries (payment term, credit analyst, sales rep, net/tax/total amounts, ...). Derived
// deterministically per order id (rather than a 29-row hand-authored table) so every order still shows
// distinct, stable values on every render — same names pool (CREDIT_TEAM_USERS) as the rest of Hold Mgmt.
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const ORDER_TYPES = ["Standard", "Bill Only", "Sample", "RMA"];
const ORDER_STATUSES = ["Entered", "Booked", "AWAITING_FULFILLMENT"];
const PAYMENT_TERMS = ["Net 15", "Net 30", "Net 45", "Net 60"];
const SALES_REPS = ["Klaus Berg", "Meera Iyer", "Tom Becker", "Aiko Tanaka"];
const REGION_BY_COUNTRY: Record<string, { region: string; currency: string; fx: number }> = {
  India: { region: "APAC", currency: "INR", fx: 83 },
  Japan: { region: "APAC", currency: "JPY", fx: 150 },
  USA: { region: "AMER", currency: "USD", fx: 1 },
  Manual: { region: "APAC", currency: "USD", fx: 1 },
};

export type OrderShowMoreInfo = {
  directInquiriesTo: string;
  orderType: string;
  status: string;
  customerNumber: string;
  region: string;
  holdComment: string;
  holdRetriggerReason: string;
  holdAppliedBy: string;
  holdAppliedDate: string;
  paymentTerm: string;
  daysToSSD: string;
  orderValueUSD: number;
  creditAnalyst: string;
  salesRep: string;
  salesOrderOwner: string;
  endCustomer: string;
  currency: string;
  netAmountTRX: number;
  taxAmountTRX: number;
  taxAmountUSD: number;
  totalWithTaxTRX: number;
  totalWithTaxUSD: number;
};

export function getOrderShowMoreInfo(order: (typeof ALL_ORDERS)[number]): OrderShowMoreInfo {
  // hashStr returns an unsigned 32-bit value (up to ~4.29B). Clamped here into a small range so every `>>`
  // below stays a small positive int — `>>` coerces its operand to a *signed* 32-bit int first, so an
  // unclamped seed above 2^31 would go negative, and a negative `% length` in JS stays negative, producing
  // an out-of-bounds (undefined) array index.
  const seed = hashStr(order.id) % 1_000_003;
  const analyst = CREDIT_TEAM_USERS[seed % CREDIT_TEAM_USERS.length];
  const salesRep = SALES_REPS[(seed >> 2) % SALES_REPS.length];
  const emailOf = (name: string) => `${name.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, ".")}@keysight.com`;
  const { region, currency, fx } = REGION_BY_COUNTRY[order.country] ?? { region: "AMER", currency: "USD", fx: 1 };

  const orderValueUSD = 15000 + (seed % 40) * 3250;
  const netAmountTRX = Math.round(orderValueUSD * fx * 0.985);
  const taxAmountTRX = Math.round(netAmountTRX * 0.08);
  const taxAmountUSD = Math.round(orderValueUSD * 0.08);

  return {
    directInquiriesTo: emailOf(analyst.name),
    orderType: ORDER_TYPES[seed % ORDER_TYPES.length],
    status: ORDER_STATUSES[(seed >> 3) % ORDER_STATUSES.length],
    customerNumber: `CUST-${order.customer.slice(0, 3).toUpperCase()}-${100 + (seed % 900)}`,
    region,
    holdComment: seed % 3 === 0 ? "Awaiting customer response" : "—",
    holdRetriggerReason: seed % 5 === 0 ? "Manual re-evaluation" : "—",
    holdAppliedBy: analyst.name,
    holdAppliedDate: `${String(1 + (seed % 28)).padStart(2, "0")}-Jan-26`,
    paymentTerm: PAYMENT_TERMS[(seed >> 1) % PAYMENT_TERMS.length],
    daysToSSD: order.ssdDelta.replace("+", "+").replace("D", "d"),
    orderValueUSD,
    creditAnalyst: analyst.name,
    salesRep,
    salesOrderOwner: emailOf(salesRep),
    endCustomer: `${order.customer} Ship`,
    currency,
    netAmountTRX,
    taxAmountTRX,
    taxAmountUSD,
    totalWithTaxTRX: netAmountTRX + taxAmountTRX,
    totalWithTaxUSD: orderValueUSD + taxAmountUSD,
  };
}
