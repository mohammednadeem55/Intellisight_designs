import { toast } from "sonner";
import releasedSvg from "@/imports/HoldManagementListingColumn-2/svg-j76i53zjwx";
import { AppHeader } from "../../components/common/AppHeader";
import {
  OrderListingTable,
  type OrderListingColumn,
  type OrderListingFilterSection,
  type OrderListingDropdownFilter,
} from "../../components/common/OrderListingTable";
import { ALL_RELEASED } from "./holdManagementData";

const RELEASED_ROWS_PER_PAGE = 17;

export function ReleasedOrdersPage({ onLogout, onViewAllNotifications, onNavigateHome, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateNewOverview, onNavigateOverview, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateEmailTemplate, onNavigateReview, onNavigateEmailWorkflow }: {
  onLogout: () => void;
  onViewAllNotifications: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
  onNavigateOverview: () => void;
  onNavigateOrderListing?: () => void;
  onNavigateReleasedOrders?: () => void;
  onNavigateEmailTemplate?: () => void;
  onNavigateReview?: () => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  const columns: OrderListingColumn[] = [
    { key: "releasedDays", label: "Status" },
    { key: "id",           label: "Order Id" },
    { key: "holdType",     label: "Hold Type" },
    { key: "customer",     label: "Customer Name" },
    { key: "poId",         label: "Customer PO ID" },
    { key: "value",        label: "Value" },
    { key: "title",        label: "Title" },
  ];

  const fixedColumns = ["Status", "Order Id", "Hold Type", "Customer Name"];
  const scrollableColumns = ["Customer PO ID", "Value", "Title"];

  const filterSections: OrderListingFilterSection<typeof ALL_RELEASED[0]>[] = [
    { key: "HoldType", label: "Hold Type", getValue: (r) => r.holdType },
    { key: "Customer", label: "Customer",  getValue: (r) => r.customer },
    { key: "Title",    label: "Title",     getValue: (r) => r.title },
  ];

  const categoryDropdown: OrderListingDropdownFilter<typeof ALL_RELEASED[0]> = {
    placeholder: "Hold Category",
    allLabel: "All Categories",
    options: ["All Categories", ...Array.from(new Set(ALL_RELEASED.map(o => o.holdType)))],
    getValue: (r) => r.holdType,
  };

  const typeDropdown: OrderListingDropdownFilter<typeof ALL_RELEASED[0]> = {
    placeholder: "Hold Type",
    allLabel: "All Types",
    options: ["All Types", ...Array.from(new Set(ALL_RELEASED.map(o => o.title)))],
    getValue: (r) => r.title,
  };

  const renderCell = (label: string, row: typeof ALL_RELEASED[0]) => {
    switch (label) {
      case "Status":
        return (
          <span className="inline-flex items-center justify-center px-2 py-1 rounded-[8px] text-[11px] font-medium whitespace-nowrap"
            style={{ color: "#10a957", backgroundColor: "rgba(16,169,87,0.1)" }}>
            Released {row.releasedDays}
          </span>
        );
      case "Order Id":        return <span className="text-[#c53e6c] text-[14px] hover:underline cursor-pointer">{row.id}</span>;
      case "Hold Type":       return <span className="text-[#333] text-[14px]">{row.holdType}</span>;
      case "Customer Name":   return <span className="text-[#333] text-[14px]">{row.customer}</span>;
      case "Customer PO ID":  return <span className="text-[#333] text-[14px] block max-w-[160px] truncate">{row.poId}</span>;
      case "Value":           return <span className="text-[#333] text-[14px] font-semibold">{row.value}</span>;
      case "Title":           return <span className="text-[#333] text-[14px]">{row.title}</span>;
      default:                return null;
    }
  };

  const renderGridItem = (row: typeof ALL_RELEASED[0]) => (
    <div className="bg-white border border-[#f2f2f2] rounded-[8px] p-4 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer">
      {/* Row 1: icon + id + menu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="shrink-0 size-[18px]">
            <svg fill="none" viewBox="0 0 18 15" className="size-full">
              <path d={releasedSvg.p3924ac80} fill="#686868" />
            </svg>
          </div>
          <span className="text-[#c53e6c] text-[14px] font-semibold hover:underline">{row.id}</span>
        </div>
        <button className="flex flex-col items-center gap-[3px] p-1 rounded hover:bg-[#f5f5f5] cursor-pointer transition-colors"
          onClick={e => { e.stopPropagation(); toast.info("Order actions"); }}>
          {[0, 1, 2].map(i => (
            <svg key={i} fill="none" viewBox="0 0 4 4" className="size-[4px]">
              <path d={releasedSvg.p20a3a900} fill="#686868" />
            </svg>
          ))}
        </button>
      </div>

      {/* Row 2: company + value */}
      <div className="flex items-center justify-between">
        <span className="text-[#686868] text-[13px] truncate max-w-[65%]">{row.customer}</span>
        <span className="text-[#333] text-[14px] font-bold">{row.value}</span>
      </div>

      {/* Row 3: hold type + released badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[#686868] text-[12px] font-medium truncate">{row.holdType}</span>
        <span className="shrink-0 px-2 py-1 rounded-[8px] text-[11px] font-medium whitespace-nowrap"
          style={{ color: "#10a957", backgroundColor: "rgba(16,169,87,0.1)" }}>
          Released {row.releasedDays}
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f5f6fa] flex size-full min-h-screen">
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

        <main className="flex-1 w-full max-w-[1600px] mx-auto px-5 py-5 flex flex-col">
          {/* Page header */}
          <div className="flex items-center gap-3 mb-4">

          </div>

          {/* White card containing toolbar + content + pagination */}
          <div className="flex-1 bg-white mx-0 mb-0 rounded-[8px] border border-[#ebebeb] overflow-hidden flex flex-col">
            <OrderListingTable
              rows={ALL_RELEASED}
              columns={columns}
              fixedColumns={fixedColumns}
              scrollableColumns={scrollableColumns}
              filterSections={filterSections}
              categoryDropdown={categoryDropdown}
              typeDropdown={typeDropdown}
              renderCell={renderCell}
              getRowKey={(row) => row.id}
              rowsPerPage={RELEASED_ROWS_PER_PAGE}
              showSpacer={false}
              renderGridItem={renderGridItem}
              defaultView="grid"
              toolbarExtra={(
                <div className="content-stretch flex items-center relative shrink-0">
                  <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                    <button onClick={() => toast.success("Download started")}
                      className="bg-white border border-[#d1d1d1] border-solid col-start-1 ml-0 mt-0 relative rounded-[8px] row-start-1 size-[36px] cursor-pointer hover:bg-[#f8fafc] transition-colors" />
                    <div className="col-start-1 ml-[8px] mt-[8px] relative row-start-1 size-[20px] pointer-events-none">
                      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.5 15.625">
                        <path d={releasedSvg.p15e5a800} fill="#c53e6c" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              gridViewIcon={(active) => (
                <svg fill="none" viewBox="0 0 17 17" className="size-[18px]">
                  <path d={releasedSvg.p2868a700} fill={active ? "#90003b" : "#686868"} />
                </svg>
              )}
              listViewIcon={(active) => (
                <svg fill="none" viewBox="0 0 17 12" className="size-[18px]">
                  <path d={releasedSvg.p1baef080} fill={active ? "#90003b" : "#686868"} />
                </svg>
              )}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

