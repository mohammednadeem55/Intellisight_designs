import { toast } from "sonner";
import { AppHeader } from "../../components/common/AppHeader";
import {
  OrderListingTable,
  type OrderListingColumn,
  type OrderListingFilterSection,
  type OrderListingDropdownFilter,
} from "../../components/common/OrderListingTable";
import { ALL_ORDERS } from "./holdManagementData";

const ROWS_PER_PAGE = 17;

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  "On Track": { label: "On Track", color: "#1fa161", bg: "rgba(31,161,97,0.1)" },
  "At Risk":  { label: "At Risk",  color: "#e08c00",  bg: "rgba(224,140,0,0.1)" },
  "Breached": { label: "Breached", color: "#d12e2e",  bg: "rgba(209,46,46,0.1)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE["On Track"];
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 rounded-[8px] text-[12px] font-medium whitespace-nowrap" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

export function OrderListingPage({ onLogout, onViewAllNotifications, onNavigateHome, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateNewOverview, onNavigateOverview, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateOrderDetails, onNavigateEmailTemplate, onNavigateReview, onNavigateEmailWorkflow }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateOverview: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateOrderDetails?: (orderId: string) => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateReview?: () => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  const kpis = [
    { label: "Open Holds",   value: "05",         highlight: false },
    { label: "SLA Breached", value: "05",         highlight: true  },
    { label: "At Risk",      value: "05",         highlight: false },
    { label: "Total Value",  value: "$ 10540.6M", highlight: false },
    { label: "On Track",     value: "05",         highlight: false },
  ];

  const columns: OrderListingColumn[] = [
    { key: "status",   label: "Status" },
    { key: "id",       label: "Order Id" },
    { key: "holdType", label: "Hold Type" },
    { key: "customer", label: "Customer Name" },
    { key: "poId",     label: "Customer PO ID" },
    { key: "ocn",      label: "OCN" },
    { key: "ou",       label: "Operating Unit (OU)" },
    { key: "ssd",      label: "SSD" },
    { key: "country",  label: "Country" },
  ];

  const fixedColumns = ["Status", "Order Id", "Hold Type", "Customer Name"];
  const scrollableColumns = ["Customer PO ID", "OCN", "Operating Unit (OU)", "SSD", "Country"];

  const filterSections: OrderListingFilterSection<typeof ALL_ORDERS[0]>[] = [
    { key: "Status",    label: "Status",    total: 37, getValue: (r) => r.status },
    { key: "Country",   label: "Country",   total: 18, getValue: (r) => r.country },
    { key: "HoldType",  label: "Hold Type", total: 23, getValue: (r) => r.holdType },
    { key: "Customer",  label: "Customer",  total: 0 },
    { key: "OCN",       label: "OCN",       total: 5,  getValue: (r) => r.ocn },
    { key: "OU",        label: "Operating Unit", total: 7, getValue: (r) => r.ou },
  ];

  const categoryDropdown: OrderListingDropdownFilter<typeof ALL_ORDERS[0]> = {
    placeholder: "Hold Category",
    allLabel: "All Categories",
    options: ["All Categories", ...Array.from(new Set(ALL_ORDERS.map(o => o.holdType)))],
    getValue: (r) => r.holdType,
  };

  const typeDropdown: OrderListingDropdownFilter<typeof ALL_ORDERS[0]> = {
    placeholder: "Hold Type",
    allLabel: "All Types",
    options: ["All Types", "On Track", "At Risk", "Breached"],
    getValue: (r) => r.status,
  };

  const renderCell = (label: string, row: typeof ALL_ORDERS[0]) => {
    switch (label) {
      case "Status":               return <StatusBadge status={row.status} />;
      case "Order Id":             return <button onClick={() => onNavigateOrderDetails?.(row.id)} className="text-[#c53e6c] text-[14px] hover:underline cursor-pointer bg-transparent border-0 p-0 font-normal">{row.id}</button>;
      case "Hold Type":            return <span className="text-[#333] text-[14px]">{row.holdType}</span>;
      case "Customer Name":        return <span className="text-[#333] text-[14px]">{row.customer}</span>;
      case "Customer PO ID":       return <span className="text-[#333] text-[14px] block max-w-[160px] truncate">{row.poId}</span>;
      case "OCN":                  return <span className="text-[#333] text-[14px]">{row.ocn}</span>;
      case "Operating Unit (OU)":  return <span className="text-[#333] text-[14px]">{row.ou}</span>;
      case "SSD":                  return <span className="text-[14px] whitespace-nowrap"><span className="text-[#333]">{row.ssd} </span><span className="text-[#c53e6c] font-semibold">{row.ssdDelta}</span></span>;
      case "Country":              return <span className="text-[#333] text-[14px]">{row.country}</span>;
      default:                     return null;
    }
  };

  return (
    <div className="bg-[#f5f6fa] flex size-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-auto">
        <AppHeader
          activeNav="Hold Management"
          onViewAllNotifications={onViewAllNotifications}
          onLogout={onLogout}
          onNavigateHome={onNavigateHome}
          onNavigateCommandCenterOverview={onNavigateCommandCenterOverview}
          onNavigateCommandCenterEmailView={onNavigateCommandCenterEmailView}
          onNavigateNewOverview={onNavigateNewOverview}
          onNavigateHoldManagementOverview={onNavigateOverview}
          onNavigateOrderListing={onNavigateOrderListing}
          onNavigateReleasedOrders={onNavigateReleasedOrders}
          onNavigateEmailTemplate={onNavigateEmailTemplate}
          onNavigateReview={onNavigateReview}
          onNavigateEmailWorkflow={onNavigateEmailWorkflow}
        />

        <main className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto">

          {/* KPI strip */}
          <div className="flex gap-4 px-5 py-4 bg-[#f5f6fa]">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="flex-1 min-w-0 h-[78px] rounded-[8px] border border-[#f2f2f2] bg-white flex flex-col justify-start px-4 pt-[16px] cursor-pointer transition-all hover:bg-[#FFCFDB] hover:border-[#FFCFDB]"
              >
                <p className="text-[#333] text-[20px] font-semibold leading-[24px]">{k.value}</p>
                <p className="text-[#333] text-[12px] font-normal leading-[16px] mt-[2px]">{k.label}</p>
              </div>
            ))}
          </div>

          {/* White content area: toolbar + table + pagination */}
          <div className="flex-1 bg-white mx-5 mb-5 rounded-[8px] border border-[#ebebeb] overflow-hidden flex flex-col">
            <OrderListingTable
              rows={ALL_ORDERS}
              columns={columns}
              fixedColumns={fixedColumns}
              scrollableColumns={scrollableColumns}
              filterSections={filterSections}
              categoryDropdown={categoryDropdown}
              typeDropdown={typeDropdown}
              renderCell={renderCell}
              getRowKey={(row) => row.id}
              onRowClick={(row) => toast.info(`Order ${row.id} — ${row.holdType}`)}
              rowsPerPage={ROWS_PER_PAGE}
              emptyMessage="No orders match your filters"
            />
          </div>
        </main>
      </div>
    </div>
  );
}

