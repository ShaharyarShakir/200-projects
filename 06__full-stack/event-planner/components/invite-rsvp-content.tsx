import Link from "next/link";
import { Button } from "./ui/button";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { notFound } from "next/navigation";
import { Field } from "./ui/field";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { submitOrUpdateRsvpAction } from "@/lib/actions/events";

export default async function InviteRsvpContent({
  token,
  submitted
}: {
  token: string;
  submitted: boolean
}) {
  const row = await prisma.eventInvite.findFirst({
    where: {token},
    include: {
      event: {
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          eventDate: true
        }
      }
    }
  })
  if (!row){
    notFound()
  }
  const e = row.event
  const event = {
    title: e.title,
    description: e.description,
    location: e.location,
    eventDate: e.eventDate ? e.eventDate.toISOString() : null
  }
  const submitRsvpForToken = submitOrUpdateRsvpAction.bind(null,token)
  return (
    <div className="mx-auto w-full max-w-2xl">
<Card>
  <CardHeader className="space-y-3">
<Badge variant={'secondary'} className="w-fit">
  RSVP
</Badge>
<CardTitle>{event.title}</CardTitle>
<p className="text-sm text-muted-foreground">{event.eventDate ? new Date(event.eventDate).toLocaleDateString(): "no date selected"} {
event.location ? `- ${event.location}` : ""} </p>
{event.description ? (
  <p className="text-sm text-muted-foreground">{event.description} </p>
): null}

  </CardHeader>
  <CardContent>
    {submitted ? (
      <p className="mb-4 rounded-md border border-accent/50  ">
        Thank you for submitting your RSVP
      </p>
    ): null}
    <form action={submitRsvpForToken} className="space-y-4">
      <Field>
        <Label>Name</Label>
        <Input id="name" name="name" required placeholder="Enter your name" />
      </Field>
       <Field>
        <Label>Email</Label>
        <Input
        type="email"
         id="email"
          name="email"
           required placeholder="Enter your email" />
      </Field>
      <Field>
        <Label htmlFor="status">Status</Label>
        <select id="status" name="status" required defaultValue={"going"} className="flex- h-10 w-full rounded-md border border-border bg-surface">
          <option value={"going"}>Going</option>
           <option value={'not_going'}>Not Going</option>
            <option value={'mqybe'}>Maybe</option>
        </select>
              </Field>
              <Button type="submit">Submit RSVP</Button>
    </form>
  </CardContent>
</Card>
    </div>
  );
}
