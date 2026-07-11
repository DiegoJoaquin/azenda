import AdminNav from "@/components/admin/AdminNav";
import ClientGate from "@/components/ClientGate";
import CloudGate from "@/components/admin/CloudGate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientGate>
      <CloudGate>
        <div className="flex min-h-screen">
          <AdminNav />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </CloudGate>
    </ClientGate>
  );
}
