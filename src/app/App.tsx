import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router";
import { Toaster } from "sonner";
import { LoginScreen } from "./pages/auth/LoginScreen";
import { NewOverviewPage } from "./pages/command-center/NewOverviewPage";
import { CommandCenterOverviewPage } from "./pages/command-center/CommandCenterOverviewPage";
import { EmailViewPage } from "./pages/command-center/EmailViewPage";
import { HomePage } from "./pages/home/HomePage";
import { NotificationsPage } from "./pages/home/NotificationsPage";
import { PlaceholderPage } from "./pages/placeholder/PlaceholderPage";
import { EmailTemplatePage } from "./pages/email-templates/EmailTemplatePage";
import { EmailTemplateEditorPage } from "./pages/email-templates/EmailTemplateEditorPage";
import { WorkflowPage } from "./pages/command-center/WorkflowPage";
import { HoldManagementOverview } from "./pages/hold-management/HoldManagementOverview";
import { OrderListingPage } from "./pages/hold-management/OrderListingPage";
import { ReleasedOrdersPage } from "./pages/hold-management/ReleasedOrdersPage";
import { OrderDetailsPage } from "./pages/hold-management/OrderDetailsPage";
import { CommunicationPage } from "./pages/hold-management/CommunicationPage";
import { ALL_EMAILS_WITH_CCC } from "./pages/command-center/emailData";

// ─── Root ─────────────────────────────────────────────────────────────────────

// The nav callbacks every page accepts — built once per render from useNavigate() and spread into whichever
// page is on screen. Real URLs (via react-router) replace the old sessionStorage + manual pushState/popstate
// screen-persistence entirely: the browser's own history and reload behavior now do that job for free.
type NavCallbacks = {
  onViewAllNotifications: () => void;
  onLogout: () => void;
  onNavigateHome: () => void;
  onNavigateCommandCenterOverview: () => void;
  onNavigateCommandCenterEmailView: () => void;
  onNavigateNewOverview: () => void;
  onNavigateHoldManagementOverview: () => void;
  onNavigateOrderListing: () => void;
  onNavigateReleasedOrders: () => void;
  onNavigateCommunication: () => void;
  onNavigateEmailTemplate: () => void;
  onNavigateReview: () => void;
  onNavigateEmailWorkflow: () => void;
};

function WorkflowRoute({ nav }: { nav: NavCallbacks }) {
  const { emailId } = useParams<{ emailId: string }>();
  const navigate = useNavigate();
  return <WorkflowPage emailId={emailId ?? ""} onBack={() => navigate("/command-center/overview")} {...nav} />;
}

function OrderDetailsRoute({ nav, onNavigateOverview }: { nav: NavCallbacks; onNavigateOverview: () => void }) {
  const { orderId } = useParams<{ orderId: string }>();
  return <OrderDetailsPage orderId={orderId ?? ""} onNavigateOverview={onNavigateOverview} {...nav} />;
}

function AppRoutes() {
  const navigate = useNavigate();

  const nav: NavCallbacks = {
    onViewAllNotifications: () => navigate("/notifications"),
    onLogout: () => navigate("/login"),
    onNavigateHome: () => navigate("/home"),
    onNavigateCommandCenterOverview: () => navigate("/command-center/overview-v1"),
    onNavigateCommandCenterEmailView: () => navigate("/command-center/email-view"),
    onNavigateNewOverview: () => navigate("/command-center/overview"),
    onNavigateHoldManagementOverview: () => navigate("/hold-management"),
    onNavigateOrderListing: () => navigate("/hold-management/orders"),
    onNavigateReleasedOrders: () => navigate("/hold-management/orders/released"),
    onNavigateCommunication: () => navigate("/hold-management/communication"),
    onNavigateEmailTemplate: () => navigate("/email-template"),
    onNavigateReview: () => navigate("/review"),
    onNavigateEmailWorkflow: () => navigate(`/command-center/email/${ALL_EMAILS_WITH_CCC[0].id}`),
  };
  const onNavigateWorkflow = (emailId: string) => navigate(`/command-center/email/${emailId}`);
  const onNavigateOverview = () => navigate("/hold-management");
  const onNavigateOrderDetails = (orderId: string) => navigate(`/hold-management/orders/${orderId}`);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginScreen onLogin={() => navigate("/home")} />} />
      <Route path="/home" element={<HomePage {...nav} />} />
      <Route path="/notifications" element={<NotificationsPage onBack={() => navigate("/home")} {...nav} />} />

      <Route path="/command-center/overview" element={<NewOverviewPage {...nav} onNavigateWorkflow={onNavigateWorkflow} />} />
      <Route path="/command-center/overview-v1" element={<CommandCenterOverviewPage {...nav} onNavigateWorkflow={onNavigateWorkflow} />} />
      <Route path="/command-center/email-view" element={<EmailViewPage {...nav} onNavigateWorkflow={onNavigateWorkflow} />} />
      <Route path="/command-center/email/:emailId" element={<WorkflowRoute nav={nav} />} />

      <Route path="/hold-management" element={<HoldManagementOverview {...nav} onViewAllOrders={() => navigate("/hold-management/orders")} />} />
      <Route path="/hold-management/orders" element={<OrderListingPage {...nav} onNavigateOverview={onNavigateOverview} onNavigateOrderDetails={onNavigateOrderDetails} />} />
      <Route path="/hold-management/orders/released" element={<ReleasedOrdersPage {...nav} onNavigateOverview={onNavigateOverview} onNavigateOrderDetails={onNavigateOrderDetails} />} />
      <Route path="/hold-management/orders/:orderId" element={<OrderDetailsRoute nav={nav} onNavigateOverview={onNavigateOverview} />} />
      <Route path="/hold-management/communication" element={<CommunicationPage {...nav} onNavigateOverview={onNavigateOverview} />} />

      <Route
        path="/email-template"
        element={
          <EmailTemplatePage
            {...nav}
            onNavigateCreateEmailTemplate={() => navigate("/email-template/new")}
            onNavigateEditEmailTemplate={(template) => navigate("/email-template/new", { state: template })}
          />
        }
      />
      <Route path="/email-template/new" element={<EmailTemplateEditorPage {...nav} onBack={() => navigate("/email-template")} />} />
      <Route
        path="/review"
        element={
          <PlaceholderPage
            title="Review"
            description="Review flagged items and approve or reject pending actions in one place."
            activeNav="Review"
            {...nav}
          />
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="size-full">
        <Toaster
          position="top-right"
          closeButton
          toastOptions={{
            classNames: {
              toast: "!bg-white !border !border-[#e5e7eb] !shadow-[0_10px_30px_-6px_rgba(15,23,42,0.15)] !rounded-[10px]",
              title: "!text-[#111827] !font-semibold !text-[13px]",
              description: "!text-[#6b7280] !text-[12.5px]",
              closeButton: "!bg-white !border !border-[#e5e7eb] !text-[#9ca3af] hover:!text-[#111827] hover:!bg-[#f8fafc]",
              success: "[&_[data-icon]_svg]:!fill-[#468657]",
              error: "[&_[data-icon]_svg]:!fill-[#BA1C1C]",
              warning: "[&_[data-icon]_svg]:!fill-[#E67919]",
              info: "[&_[data-icon]_svg]:!fill-[#30578D]",
            },
          }}
        />
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
