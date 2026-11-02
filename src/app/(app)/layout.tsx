import Sidebar from "@/components/app-sidebar";
import Notifier from "@/components/notifier";
import MobileNav from "@/components/mobile-nav";
import { archiveBulanLalu } from "@/lib/archive";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await archiveBulanLalu();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <Notifier />
      <main className="flex-1 overflow-x-auto p-4 pb-24 md:p-6">{children}</main>
      <MobileNav />
    </div>
  );
}
