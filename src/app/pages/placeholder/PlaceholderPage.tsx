import { AppHeader } from "../../components/common/AppHeader";

export function PlaceholderPage({
  title,
  description,
  activeNav,
  onViewAllNotifications,
  onLogout,
  onNavigateHome,
  onNavigateCommandCenterOverview,
  onNavigateCommandCenterEmailView,
  onNavigateNewOverview,
  onNavigateHoldManagementOverview,
  onNavigateOrderListing,
  onNavigateReleasedOrders,
  onNavigateCommunication,
  onNavigateEmailTemplate,
  onNavigateDefaultMapping,
  onNavigateFeedbackCenter,
  onNavigateReview,
  onNavigateEmailWorkflow,
}: {
  title: string;
  description: string;
  activeNav: string;
  onViewAllNotifications: () => void;
  onLogout?: () => void;
  onNavigateHome?: () => void;
  onNavigateCommandCenterOverview?: () => void;
  onNavigateCommandCenterEmailView?: () => void;
  onNavigateNewOverview?: () => void;
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
  return (
    <div className="bg-[#f5f6fa] flex flex-col size-full min-h-screen">
      <AppHeader
        activeNav={activeNav}
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
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-[420px]">
          <h1 className="text-[22px] font-bold text-[#111827]">{title}</h1>
          <p className="text-[14px] text-[#6b7380] mt-2">{description}</p>
          <div className="mt-6 inline-flex items-center px-3 py-1.5 rounded-full bg-[#F1F2F4] text-[12px] font-medium text-[#686868]">
            Coming soon
          </div>
        </div>
      </main>
    </div>
  );
}
