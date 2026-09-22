import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from "react-router";
import { Toaster } from "sonner";
import { LoginScreen } from "./pages/auth/LoginScreen";
import { NewOverviewPage } from "./pages/command-center/NewOverviewPage";
import { HomePage } from "./pages/home/HomePage";
import { NotificationsPage } from "./pages/home/NotificationsPage";
import { EmailTemplatePage } from "./pages/email-templates/EmailTemplatePage";
import { EmailTemplateEditorPage } from "./pages/email-templates/EmailTemplateEditorPage";
import { ExceptionEditorPage } from "./pages/email-templates/ExceptionEditorPage";
import { CmdCenterAdvFilterPage } from "./pages/command-center/CmdCenterAdvFilterPage";
import { CmdCenterAdvFilterEditorPage } from "./pages/command-center/CmdCenterAdvFilterEditorPage";
import { WorkflowPage } from "./pages/command-center/WorkflowPage";
import { HoldManagementOverview } from "./pages/hold-management/HoldManagementOverview";
import { OrderListingPage } from "./pages/hold-management/OrderListingPage";
import { ReleasedOrdersPage } from "./pages/hold-management/ReleasedOrdersPage";
import { OrderDetailsPage } from "./pages/hold-management/OrderDetailsPage";
import { CommunicationPage } from "./pages/hold-management/CommunicationPage";
import { FeedbackCenterPage } from "./pages/feedback-center/FeedbackCenterPage";
import type { DocType } from "./pages/feedback-center/feedbackCenterData";
import { ALL_EMAILS_WITH_CCC } from "./pages/command-center/emailData";

// ─── Root ─────────────────────────────────────────────────────────────────────

// The nav callbacks every page accepts — built once per render from useNavigate() and spread into whichever
// page is on screen. Real URLs (via react-router) replace the old sessionStorage + manual pushState/popstate
// screen-persistence entirely: the browser's own history and reload behavior now do that job for free.
type NavCallbacks = {
  onViewAllNotifications: () => void;
  onLogout: () => void;
  onNavigateHome: () => void;
  onNavigateNewOverview: () => void;
  onNavigateHoldManagementOverview: () => void;
  onNavigateOrderListing: () => void;
  onNavigateReleasedOrders: () => void;
  onNavigateCommunication: (source?: { orderId?: string; emailId?: string }) => void;
  onNavigateEmailTemplate: () => void;
  onNavigateCmdCenterAdvFilter: () => void;
  onNavigateFeedbackCenter: (docType: DocType) => void;
  onNavigateEmailWorkflow: () => void;
};

function WorkflowRoute({ nav }: { nav: NavCallbacks }) {
  const { emailId } = useParams<{ emailId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scope = searchParams.get("scope");
  return (
    <WorkflowPage
      emailId={emailId ?? ""}
      taskScope={scope === "all" ? "all" : "mine"}
      onBack={() => navigate("/command-center/overview")}
      {...nav}
    />
  );
}

function OrderDetailsRoute({ nav, onNavigateOverview }: { nav: NavCallbacks; onNavigateOverview: () => void }) {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const entrySource = from === "listing" || from === "released" ? from : undefined;
  return (
    <OrderDetailsPage
      orderId={orderId ?? ""}
      view={searchParams.get("view") ?? undefined}
      entrySource={entrySource}
      onNavigateOverview={onNavigateOverview}
      {...nav}
    />
  );
}

// Order Listing itself doesn't need to know about ?view= — it just needs to keep carrying it forward when a
// row is clicked, so Order Details on the other end still knows this order was reached via the Credit view.
// `from=listing` tells Order Details' breadcrumb it really did arrive via this page, as opposed to Released
// Orders or a direct "Go to Order #" jump from the Overview page.
function OrderListingRoute({ nav, onNavigateOverview }: { nav: NavCallbacks; onNavigateOverview: () => void }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");
  const sourceCardName = searchParams.get("card") ?? undefined;
  const onNavigateOrderDetails = (orderId: string) => {
    const params = new URLSearchParams({ from: "listing" });
    if (view) params.set("view", view);
    navigate(`/hold-management/orders/${orderId}?${params.toString()}`);
  };
  return <OrderListingPage {...nav} onNavigateOverview={onNavigateOverview} onNavigateOrderDetails={onNavigateOrderDetails} sourceCardName={sourceCardName} />;
}

// Communication's back arrow returns to wherever it was opened from — Order Details when reached via its
// "Open Communication" button/link (carries ?orderId=), the Command Center workflow when reached via a
// listing row's Send Email action (carries ?emailId=), the Hold Management Overview otherwise.
function CommunicationRoute({ nav, onNavigateOverview }: { nav: NavCallbacks; onNavigateOverview: () => void }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromOrderId = searchParams.get("orderId") ?? undefined;
  const fromEmailId = searchParams.get("emailId") ?? undefined;
  const onNavigateBack = fromOrderId
    ? () => navigate(`/hold-management/orders/${fromOrderId}`)
    : fromEmailId
      ? () => navigate(`/command-center/email/${fromEmailId}`)
      : onNavigateOverview;
  return (
    <CommunicationPage
      onNavigateOverview={onNavigateOverview}
      onNavigateBack={onNavigateBack}
      fromOrderId={fromOrderId}
      fromEmailId={fromEmailId}
      {...nav}
    />
  );
}

function AppRoutes() {
  const navigate = useNavigate();

  const nav: NavCallbacks = {
    onViewAllNotifications: () => navigate("/notifications"),
    onLogout: () => navigate("/login"),
    onNavigateHome: () => navigate("/home"),
    onNavigateNewOverview: () => navigate("/command-center/overview"),
    onNavigateHoldManagementOverview: () => navigate("/hold-management"),
    onNavigateOrderListing: () => navigate("/hold-management/orders"),
    onNavigateReleasedOrders: () => navigate("/hold-management/orders/released"),
    onNavigateCommunication: (source) => {
      const params = new URLSearchParams();
      if (source?.orderId) params.set("orderId", source.orderId);
      if (source?.emailId) params.set("emailId", source.emailId);
      const query = params.toString();
      navigate(query ? `/communication?${query}` : "/communication");
    },
    onNavigateEmailTemplate: () => navigate("/email-template"),
    onNavigateCmdCenterAdvFilter: () => navigate("/admin/cmd-center-filters"),
    onNavigateFeedbackCenter: (docType) => navigate(`/feedback-center/${docType}`),
    onNavigateEmailWorkflow: () => navigate(`/command-center/email/${ALL_EMAILS_WITH_CCC[0].id}`),
  };
  const onNavigateWorkflow = (emailId: string, scope?: "mine" | "all") =>
    navigate(scope ? `/command-center/email/${emailId}?scope=${scope}` : `/command-center/email/${emailId}`);
  const onNavigateOverview = () => navigate("/hold-management");
  const onNavigateOrderDetails = (orderId: string) => navigate(`/hold-management/orders/${orderId}`);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginScreen onLogin={() => navigate("/home")} />} />
      <Route path="/home" element={<HomePage {...nav} />} />
      <Route path="/notifications" element={<NotificationsPage onBack={() => navigate("/home")} {...nav} />} />

      <Route path="/command-center/overview" element={<NewOverviewPage {...nav} onNavigateWorkflow={onNavigateWorkflow} />} />
      <Route path="/command-center/email/:emailId" element={<WorkflowRoute nav={nav} />} />

      <Route
        path="/hold-management"
        element={
          <HoldManagementOverview
            {...nav}
            onViewAllOrders={(view, cardName) => {
              const params = new URLSearchParams();
              if (view) params.set("view", view);
              if (cardName) params.set("card", cardName);
              const query = params.toString();
              navigate(query ? `/hold-management/orders?${query}` : "/hold-management/orders");
            }}
            onNavigateOrderDetails={onNavigateOrderDetails}
          />
        }
      />
      <Route path="/hold-management/orders" element={<OrderListingRoute nav={nav} onNavigateOverview={onNavigateOverview} />} />
      <Route
        path="/hold-management/orders/released"
        element={
          <ReleasedOrdersPage
            {...nav}
            onNavigateOverview={onNavigateOverview}
            onNavigateOrderDetails={(orderId) => navigate(`/hold-management/orders/${orderId}?from=released`)}
          />
        }
      />
      <Route path="/hold-management/orders/:orderId" element={<OrderDetailsRoute nav={nav} onNavigateOverview={onNavigateOverview} />} />
      <Route path="/communication" element={<CommunicationRoute nav={nav} onNavigateOverview={onNavigateOverview} />} />

      <Route
        path="/email-template"
        element={
          <EmailTemplatePage
            {...nav}
            onNavigateCreateEmailTemplate={() => navigate("/email-template/new")}
            onNavigateEditEmailTemplate={(template) => navigate("/email-template/new", { state: template })}
            onNavigateCreateException={() => navigate("/email-template/exceptions/new")}
            onNavigateEditException={(exception) => navigate("/email-template/exceptions/new", { state: exception })}
          />
        }
      />
      <Route path="/email-template/new" element={<EmailTemplateEditorPage {...nav} onBack={() => navigate("/email-template")} />} />
      <Route
        path="/email-template/exceptions/new"
        element={<ExceptionEditorPage {...nav} onBack={() => navigate("/email-template?tab=exceptions")} />}
      />

      <Route
        path="/admin/cmd-center-filters"
        element={
          <CmdCenterAdvFilterPage
            {...nav}
            onNavigateCreateCmdCenterFilter={() => navigate("/admin/cmd-center-filters/new")}
            onNavigateEditCmdCenterFilter={(filter) => navigate("/admin/cmd-center-filters/new", { state: filter })}
          />
        }
      />
      <Route
        path="/admin/cmd-center-filters/new"
        element={<CmdCenterAdvFilterEditorPage {...nav} onBack={() => navigate("/admin/cmd-center-filters")} />}
      />

      <Route path="/feedback-center/trade-order" element={<FeedbackCenterPage docType="trade-order" {...nav} />} />
      <Route path="/feedback-center/service-agreement" element={<FeedbackCenterPage docType="service-agreement" {...nav} />} />
      <Route path="/feedback-center/som" element={<FeedbackCenterPage docType="som" {...nav} />} />

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
