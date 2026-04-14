import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { QueryProvider } from "@/components/QueryProvider";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  return (
    <QueryProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </QueryProvider>
  );
}
