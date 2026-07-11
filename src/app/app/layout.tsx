import AdminNav from "@/components/admin/AdminNav";
import ClientGate from "@/components/ClientGate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientGate>
      <div className="flex min-h-screen">
        <AdminNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </ClientGate>
  );
}
