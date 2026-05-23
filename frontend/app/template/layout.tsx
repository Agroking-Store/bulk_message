import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Topbar";

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activesection="Templates" />
      <div className="ml-[260px]">
        <Topbar title="Templates" />
        <main className="pt-[80px] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}