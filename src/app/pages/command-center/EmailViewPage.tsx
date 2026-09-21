import { AppHeader } from "../../components/common/AppHeader";
import { EmailViewBody } from "./emailViewShared";

export function EmailViewPage({ onLogout, onViewAllNotifications, onNavigateHome, onNavigateCommandCenterOverview, onNavigateCommandCenterEmailView, onNavigateWorkflow, onNavigateNewOverview, onNavigateHoldManagementOverview, onNavigateOrderListing, onNavigateReleasedOrders, onNavigateCommunication, onNavigateEmailTemplate, onNavigateFeedbackCenter, onNavigateEmailWorkflow }: {
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
  onNavigateFeedbackCenter?: (docType: "trade-order" | "service-agreement" | "som") => void;
  onNavigateEmailWorkflow?: () => void;
}) {
  return (
    <div className="bg-[#f4f5f7] flex flex-col size-full min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <AppHeader
        activeNav="Command Center"
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
        onNavigateFeedbackCenter={onNavigateFeedbackCenter}
        onNavigateEmailWorkflow={onNavigateEmailWorkflow}
      />
      <EmailViewBody onOpenWorkflow={onNavigateWorkflow} />
    </div>
  );
}
