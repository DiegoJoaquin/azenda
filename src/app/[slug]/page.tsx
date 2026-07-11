import BookingSite from "@/components/booking/BookingSite";
import ClientGate from "@/components/ClientGate";

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ClientGate>
      <BookingSite slug={slug} />
    </ClientGate>
  );
}
