import Sidebar from "../../components/sidebar";
import Topbar from "../../components/Topbar";
import NotificationPanel from "../../components/Notifications/NotificationPanel";


export default function NotificationsPage() {
  return (
    <div className="flex">

      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 ml-64">

        {/* Topbar */}
        <Topbar title="Notifications" />

        <div className="pt-26 px-6 space-y-5">

          <h1 className="text-2xl font-semibold">
            Notifications & System Status
          </h1>

          {/* Notifications */}
          <NotificationPanel />

          

        </div>

      </div>

    </div>
  );
}