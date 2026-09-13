import { useState } from "react";
import { toast } from "sonner";
import { CornerDownRight, FileText, LayoutDashboard, Mail, TrendingUp } from "lucide-react";
import { AppHeader } from "../../components/common/AppHeader";
import {
  OrderListingTable,
  type OrderListingColumn,
  type OrderListingFilterSection,
  type OrderListingDropdownFilter,
} from "../../components/common/OrderListingTable";
import { type Email, ALL_EMAILS, ALL_EMAILS_WITH_CCC } from "./emailData";
import { EmailStatusBadge, EmailViewBody } from "./emailViewShared";

export function CommandCenterOverviewPage({ onLogout, onViewAllNotifications, onNavigateHome, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateWorkflow, onNavigateNewOverview, onNavigateHoldManagementOverview, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateCommunication, onNavigateEmailTemplate, onNavigateDefaultMapping, onNavigateFeedbackCenter, onNavigateReview, onNavigateEmailWorkflow }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateWorkflow: (emailId: string) => void;
  onNavigateHoldManagementOverview?: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateCommunication?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateDefaultMapping?: () => void;
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
  onNavigateReview?: () => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  const [viewMode, setViewMode] = useState<"table" | "email">("table");

  const kpis = [
    { label: "TOTAL EMAILS", value: String(ALL_EMAILS.length).padStart(2, "0"), delta: "↑ 4.2%", up: true, sparkColor: "#cbd5e1" },
    { label: "FLAGGED",      value: String(ALL_EMAILS.filter(e => e.status === "Flagged").length).padStart(2, "0"), delta: "↑ 2.1%", up: false, sparkColor: "#fecbcb" },
    { label: "UNDER REVIEW", value: String(ALL_EMAILS.filter(e => e.status === "Under Review").length).padStart(2, "0"), delta: "↓ 1.4%", up: true, sparkColor: "#fde7a0" },
    { label: "CLEARED",      value: String(ALL_EMAILS.filter(e => e.status === "Cleared").length).padStart(2, "0"), delta: "↑ 3.6%", up: true, sparkColor: "#bbf7d0" },
    { label: "CATEGORIES",   value: String(new Set(ALL_EMAILS.map(e => e.category)).size).padStart(2, "0"), delta: "↑ 0.8%", up: true, sparkColor: "#bfdafe" },
  ];
  const sparkHeights = [8, 14, 10, 18, 12, 20, 14, 16];

  const cccRows = ALL_EMAILS_WITH_CCC;

  // Lead columns — CCC ID first, Subject second. Visible by default.
  const leadColumns: OrderListingColumn[] = [
    { key: "cccId",  label: "CCC ID" },
    { key: "subject", label: "Subject" },
  ];
  // Main grid columns — visible by default.
  const mainGridIdentityColumns: OrderListingColumn[] = [
    { key: "csrOwner",         label: "CSR Owner (SOO)" },
    { key: "businessGroup",    label: "Business Group" },
    { key: "opportunityNumber", label: "Opportunity Number" },
    { key: "accountManager",   label: "Account Manager" },
    { key: "accountName",      label: "Account Name" },
  ];
  const mainGridRequestColumns: OrderListingColumn[] = [
    { key: "cccRequestType",    label: "CCC Request Type" },
    { key: "cccRequestSubtype", label: "CCC Request Subtype" },
    { key: "cccRequestStatus",  label: "CCC Request Status" },
    { key: "awaitingReason",    label: "Awaiting Reason" },
    { key: "cccRequestReceivedDate", label: "CCC Request Received Date" },
    { key: "slaTimeRemaining",  label: "Time Remaining / SLA" },
    { key: "poNumber",          label: "PO #" },
    { key: "quoteNumber",       label: "Quote # + Version / Revision" },
    { key: "orderNumber",       label: "Order #" },
    { key: "operatingUnit",     label: "Operating Unit" },
    { key: "poAmount",          label: "PO Amount" },
    { key: "currentMonthBookableAmount", label: "Current Month Bookable Amount" },
    { key: "currency",          label: "Currency" },
    { key: "status",            label: "Current Status" },
    { key: "statusNotes",       label: "Status Notes" },
    { key: "currentStatusDate", label: "Current Status Date" },
  ];
  // Listing-grid columns (Classification / Confidence / Assigned To / Review Status / Action) — visible by default.
  const listingColumns: OrderListingColumn[] = [
    { key: "classification", label: "Classification" },
    { key: "confidencePct",  label: "Confidence" },
    { key: "assignedTo",     label: "Assigned To" },
    { key: "reviewStatus",   label: "Review Status" },
    { key: "action",         label: "Action" },
  ];
  // On-expand columns — available in Column Mgmt, hidden until the user enables them.
  const onExpandColumns: OrderListingColumn[] = [
    { key: "currentAutomationStatus", label: "Current Automation Status" },
    { key: "currentAutomationResult", label: "Current Automation Result" },
    { key: "automationDetailsLink",   label: "Link to Automation Details" },
    { key: "previousStatus",          label: "Previous Status" },
    { key: "previousStatusDate",      label: "Previous Status Date" },
    { key: "previousStage",           label: "Previous Stage" },
    { key: "previousAutomationStatus", label: "Previous Automation Status" },
    { key: "oaStatus",                label: "OA Status" },
    { key: "oaSummary",               label: "OA Summary" },
    { key: "oaValidationRecords",     label: "OA Validation Records" },
  ];

  const columns: OrderListingColumn[] = [...leadColumns, ...mainGridIdentityColumns, ...mainGridRequestColumns, ...listingColumns, ...onExpandColumns];

  const fixedColumns = [...leadColumns.map(c => c.label), ...mainGridIdentityColumns.map(c => c.label)];
  const scrollableColumns = [...mainGridRequestColumns.map(c => c.label), ...listingColumns.map(c => c.label), ...onExpandColumns.map(c => c.label)];
  const defaultVisibleColumns = [...fixedColumns, ...mainGridRequestColumns.map(c => c.label), ...listingColumns.map(c => c.label)];

  const filterSections: OrderListingFilterSection<Email>[] = [
    { key: "Business Group",      label: "Business Group",      getValue: (r) => r.businessGroup ?? "" },
    { key: "CCC Request Type",    label: "CCC Request Type",    getValue: (r) => r.cccRequestType ?? "" },
  ];

  const categoryDropdown: OrderListingDropdownFilter<Email> = {
    placeholder: "Category",
    allLabel: "All Categories",
    options: ["All Categories", ...Array.from(new Set(ALL_EMAILS.map(e => e.category)))],
    getValue: (r) => r.category,
  };

  const typeDropdown: OrderListingDropdownFilter<Email> = {
    placeholder: "Status",
    allLabel: "All Statuses",
    options: ["All Statuses", "Flagged", "Under Review", "Cleared"],
    getValue: (r) => r.status,
  };

  const plainCell = (text?: string) => <span className="text-[#333] text-[14px]">{text ?? "—"}</span>;
  const linkCell = (text?: string) => <span className="text-[#c53e6c] text-[14px] cursor-pointer hover:underline">{text ?? "—"}</span>;
  const noteCell = (text?: string) => <span className="text-[#686868] text-[13px] block max-w-[220px] truncate">{text ?? "—"}</span>;

  const renderCell = (label: string, row: Email) => {
    switch (label) {
      case "CCC ID": {
        const extraCccs = (row.linkedCccs?.length ?? 1) - 1;
        return (
          <div className="flex items-center gap-1.5">
            {linkCell(row.cccId)}
            {extraCccs > 0 && (
              <span className="text-[10px] text-[#9a9a9a] bg-[#f3f4f6] rounded-full px-[6px] py-[1px] shrink-0 whitespace-nowrap">
                +{extraCccs} more
              </span>
            )}
          </div>
        );
      }
      case "CSR Owner (SOO)":               return plainCell(row.csrOwner);
      case "Business Group":                return plainCell(row.businessGroup);
      case "Opportunity Number":            return linkCell(row.opportunityNumber);
      case "Account Manager":               return plainCell(row.accountManager);
      case "Account Name":                  return plainCell(row.accountName);
      case "CCC Request Type":              return plainCell(row.cccRequestType);
      case "CCC Request Subtype":           return plainCell(row.cccRequestSubtype);
      case "Subject":                       return <span className="text-[#333] text-[14px] block max-w-[260px] truncate">{row.subject}</span>;
      case "CCC Request Status":            return plainCell(row.cccRequestStatus);
      case "Awaiting Reason":               return plainCell(row.awaitingReason);
      case "CCC Request Received Date":     return plainCell(row.cccRequestReceivedDate);
      case "Time Remaining / SLA":          return plainCell(row.slaTimeRemaining);
      case "PO #":                          return plainCell(row.poNumber);
      case "Quote # + Version / Revision":  return linkCell(row.quoteNumber);
      case "Order #":                       return plainCell(row.orderNumber);
      case "Operating Unit":                return plainCell(row.operatingUnit);
      case "PO Amount":                     return plainCell(row.poAmount);
      case "Current Month Bookable Amount": return plainCell(row.currentMonthBookableAmount);
      case "Currency":                      return plainCell(row.currency);
      case "Current Status":                return <EmailStatusBadge status={row.status} />;
      case "Status Notes":                  return noteCell(row.statusNotes);
      case "Current Status Date":           return plainCell(row.currentStatusDate);
      case "Current Automation Status":     return plainCell(row.currentAutomationStatus);
      case "Current Automation Result":     return plainCell(row.currentAutomationResult);
      case "Link to Automation Details":    return linkCell(row.automationDetailsLink);
      case "Previous Status":               return plainCell(row.previousStatus);
      case "Previous Status Date":          return plainCell(row.previousStatusDate);
      case "Previous Stage":                return plainCell(row.previousStage);
      case "Previous Automation Status":    return plainCell(row.previousAutomationStatus);
      case "OA Status":                     return plainCell(row.oaStatus);
      case "OA Summary":                    return noteCell(row.oaSummary);
      case "OA Validation Records":         return linkCell(row.oaValidationRecords);
      case "Classification":                return plainCell(row.classification);
      case "Confidence": {
        const pct = row.confidencePct ?? 0;
        return (
          <div className="flex items-center gap-2 w-[100px]">
            <div className="flex-1 h-[6px] rounded-full bg-[#f3f4f6] overflow-hidden">
              <div className="h-full rounded-full bg-[#16a34a]" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[12px] font-medium text-[#374151] shrink-0">{pct}%</span>
          </div>
        );
      }
      case "Assigned To":                   return (
        <div className="flex items-center gap-2 min-w-0">
          <div className={`size-[22px] rounded-full flex items-center justify-center shrink-0 text-[9.5px] font-bold text-white ${row.assignedTo === "AI" ? "bg-[#6b7280]" : "bg-[#1e3a5f]"}`}>
            {row.assignedInitials ?? "?"}
          </div>
          <span className="text-[13px] text-[#374151] truncate">{row.assignedTo ?? "Unassigned"}</span>
        </div>
      );
      case "Review Status": {
        const rs = row.reviewStatus ?? "Pending";
        const style = rs === "Approved" ? "text-[#16a34a] bg-[#dcfce7]" : rs === "Rejected" ? "text-[#dc2626] bg-[#fee2e2]" : "text-[#0d9488] bg-[#ccfbf1]";
        return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap ${style}`}>{rs}</span>;
      }
      case "Action":                        return (
        <button
          onClick={(e) => { e.stopPropagation(); toast.success(`Assigned ${row.id} to you`); }}
          className="px-4 py-1.5 rounded-full bg-[#1e3a5f] text-white text-[12px] font-semibold hover:bg-[#16304f] transition-colors cursor-pointer whitespace-nowrap"
        >
          Assign
        </button>
      );
      default:                              return null;
    }
  };

  // Level 1 rows — the CCC request(s) linked to an email.
  const renderCccCell = (label: string, ccc: Email) => {
    if (label === "Subject") {
      return (
        <span className="text-[#90003b] text-[14px] font-medium flex items-center gap-1.5 max-w-[260px] truncate">
          <FileText size={12} className="shrink-0 opacity-70" />
          {ccc.subject}
        </span>
      );
    }
    return renderCell(label, ccc);
  };

  // Level 2 rows — a CCC's own correspondence thread. Any further nesting (level 3+) shows as a "+N more" link
  // rather than a 3rd inline row tier, jumping into the full thread on the email detail page.
  const renderReplyCell = (label: string, reply: Email) => {
    if (label === "Subject") {
      const moreCount = reply.replies?.length ?? 0;
      return (
        <div className="flex items-center gap-2 max-w-[280px]">
          <span className="text-[#686868] text-[13px] flex items-center gap-1.5 truncate">
            <CornerDownRight size={12} className="shrink-0 opacity-60" />
            {reply.subject}
          </span>
          {moreCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigateWorkflow(reply.rootEmailId ?? reply.id); }}
              className="inline-flex items-center gap-1 shrink-0 px-[8px] py-[3px] rounded-full bg-[#f3f4f6] text-[#686868] hover:bg-[#e5e7eb] hover:text-[#333] text-[11px] font-medium cursor-pointer transition-colors"
              title={`Open the full thread to see ${moreCount} more ${moreCount === 1 ? "reply" : "replies"}`}
            >
              View {moreCount} more →
            </button>
          )}
        </div>
      );
    }
    return renderCell(label, reply);
  };

  return (
    <div className="bg-[#f5f6fa] flex size-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-auto">
        <AppHeader
          activeNav="Old Pages"
          onViewAllNotifications={onViewAllNotifications}
          onLogout={onLogout}
          onNavigateHome={onNavigateHome}
          onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
          onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
          onNavigateNewOverview={onNavigateNewOverview}
          onNavigateHoldManagementOverview={onNavigateHoldManagementOverview}
          onNavigateOrderListing={onNavigateOrderListing}
          onNavigateReleasedOrders={onNavigateReleasedOrders}
          onNavigateCommunication={onNavigateCommunication}
          onNavigateEmailTemplate={onNavigateEmailTemplate}
          onNavigateDefaultMapping={onNavigateDefaultMapping}
          onNavigateFeedbackCenter={onNavigateFeedbackCenter}
          onNavigateReview={onNavigateReview}
          onNavigateEmailWorkflow={onNavigateEmailWorkflow}
        />

        <main className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto">

          {/* KPI strip — stays visible in both Table and Email modes */}
          <div className="flex gap-4 px-5 py-4 bg-[#f5f6fa]">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white flex-1 min-w-0 rounded-[8px] border border-[#e5e7eb] p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10.5px] font-semibold text-[#6b7280] uppercase tracking-wide">{kpi.label}</p>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${kpi.up ? "text-[#16a34a] bg-[#dcfce7]" : "text-[#dc2626] bg-[#fee2e2]"}`}>
                      <TrendingUp size={10} className={kpi.up ? "" : "rotate-180"} />
                      {kpi.delta}
                    </span>
                    <div className="flex items-end gap-[2px] h-[11px]">
                      {sparkHeights.map((h, i) => (
                        <div key={i} className="w-[3px] rounded-[1px]" style={{ height: h * 0.55, backgroundColor: kpi.sparkColor }} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[24px] font-bold text-[#111827] leading-none">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* White content area: toolbar (incl. Table/Email toggle) + table-or-email body */}
          <div className="flex-1 bg-white mx-5 mb-5 rounded-[8px] border border-[#ebebeb] overflow-hidden flex flex-col">
            <OrderListingTable
              rows={cccRows}
              columns={columns}
              fixedColumns={fixedColumns}
              scrollableColumns={scrollableColumns}
              maxFixedColumns={7}
              defaultVisibleColumns={defaultVisibleColumns}
              filterSections={filterSections}
              categoryDropdown={categoryDropdown}
              typeDropdown={typeDropdown}
              renderCell={renderCell}
              getRowKey={(row) => row.id}
              onRowClick={(row) => onNavigateWorkflow(row.rootEmailId ?? row.id)}
              rowsPerPage={10}
              emptyMessage="No emails match your filters"
              search={{ placeholder: "Search Email", getText: (row) => `${row.subject} ${row.sender} ${row.classification ?? ""}` }}
              getChildren={(row) => row.linkedCccs}
              renderChildCell={renderCccCell}
              childIndentColumnLabel="Subject"
              getGrandchildren={(ccc) => ccc.replies}
              renderGrandchildCell={renderReplyCell}
              grandchildIndentColumnLabel="Subject"
              toolbarExtra={
                <div className="flex items-center border border-[#d1d1d1] rounded-[8px] overflow-hidden h-[36px]">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`flex items-center gap-1.5 px-3 h-full text-[13px] font-medium transition-colors cursor-pointer ${viewMode === "table" ? "bg-[#c53e6c] text-white" : "bg-white text-[#686868] hover:bg-[#f8fafc]"}`}
                  >
                    <LayoutDashboard size={14} />
                    Table
                  </button>
                  <div className="w-px h-5 bg-[#d1d1d1]" />
                  <button
                    onClick={() => setViewMode("email")}
                    className={`flex items-center gap-1.5 px-3 h-full text-[13px] font-medium transition-colors cursor-pointer ${viewMode === "email" ? "bg-[#c53e6c] text-white" : "bg-white text-[#686868] hover:bg-[#f8fafc]"}`}
                  >
                    <Mail size={14} />
                    Email
                  </button>
                </div>
              }
              bodyOverride={viewMode === "email" ? <EmailViewBody onOpenWorkflow={onNavigateWorkflow} /> : undefined}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
