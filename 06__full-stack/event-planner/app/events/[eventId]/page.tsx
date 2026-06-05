import EventDetailContent from "@/components/event-detail-content";
import { getSession } from "@/lib/auth/server";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await getSession();
  if (!session.data) return <EventDetailContent userId="" eventId={eventId} />;
  return <EventDetailContent userId={session.data.user.id} eventId={eventId} />;
}
