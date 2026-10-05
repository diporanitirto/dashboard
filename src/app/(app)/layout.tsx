import Sidebar from "@/components/app-sidebar";
import Notifier from "@/components/notifier";
import MobileNav from "@/components/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <Notifier />
      <main className="flex-1 overflow-x-auto p-4 pb-24 md:p-6">{children}</main>
      <MobileNav />
    </div>
  );
}
