import Link from "next/link";
import { Button } from "./ui/button";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import type { RsvpStatus as PrismaRsvpsStatus } from "@/generated/prisma/enums";
export function countByStatus(rsvps: { status: PrismaRsvpsStatus }[]) {
  let goingCount = 0;
  let notGoingCount = 0;
  let mayBeCount = 0;
  for (const r of rsvps) {
    if (r.status === "going") goingCount++;
    else if (r.status === "not_going") notGoingCount++;
    else if (r.status === "maybe") mayBeCount++;
  }
  return {
    goingCount,
    notGoingCount,
    mayBeCount,
  };
}
export default async function DashboardContent({ userId }: { userId: string | undefined }) {
  const rows = await prisma.event.findMany({
    where: { ownerUserId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      eventDate: true,
      location: true,
      rsvps: { select: { status: true } },
    },
  });
  const events = rows.map((e) => ({
    id: e.id,
    title: e.title,
    eventDate: e.eventDate ? e.eventDate.toLocaleDateString() : null,
    location: e.location,
    ...countByStatus(e.rsvps),
  }));
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Event Planner</h1>
          <p className="text-sm text-muted-foreground">
            Track attendee responses and manage invite link
          </p>
        </div>
        <Button asChild>
          <Link href={"/events/new"}>Create Event</Link>
        </Button>
      </div>
      {events.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No events yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create Your first event to start collecting RSVPS
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-4 mid:grid-cols-2 gap-4 ">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{event.title.toLocaleUpperCase()}</CardTitle>
                  <Button size={"sm"} asChild>
                    <Link href={`/events/${event.id}`}>Open Event</Link>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge>Going: {event.goingCount} </Badge>
                  <Badge variant={"secondary"}>Maybe: {event.mayBeCount}</Badge>
                  <Badge variant={"outline"}>Not Going: {event.notGoingCount} </Badge>
                </div>
                <p>
                  {event.eventDate ? new Date(event.eventDate).toLocaleString() : "No date set"}
                  {event.location ? ` - ${event.location}` : ""}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
