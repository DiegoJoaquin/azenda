import PublicSite from "@/components/booking/PublicSite";
import ClientGate from "@/components/ClientGate";

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ClientGate>
      <PublicSite slug={slug} />
    </ClientGate>
  );
}
