import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Topbar";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">

      {/* Sidebar */}
      <Sidebar />

      {/* Right side */}
      <div className="flex-1 ml-64">

        {/* Topbar */}
        <Topbar title="Dashboard" />

        {/* Page Content */}
        <div className="p-6 min-h-screen">
          {children}
        </div>

      </div>

    </div>
  );
}