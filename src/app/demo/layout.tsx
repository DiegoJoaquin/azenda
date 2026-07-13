import type { Metadata } from "next";
import ClientGate from "@/components/ClientGate";
import DemoShell from "@/components/admin/DemoShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
