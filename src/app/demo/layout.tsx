import ClientGate from "@/components/ClientGate";
import DemoShell from "@/components/admin/DemoShell";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientGate>
      <DemoShell>{children}</DemoShell>
    </ClientGate>
  );
}
