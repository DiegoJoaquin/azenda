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
        <div className="flex h-dvh">
          <AdminNav />
          <main className="min-w-0 flex-1 overflow-auto pb-14 md:pb-0">
            {children}
          </main>
        </div>
      </CloudGate>
    </ClientGate>
  );
}
