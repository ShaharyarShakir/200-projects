"use server";
import { redirect } from "next/navigation";
import { getSession } from "../auth/server";
import { prisma } from "../prisma";
import { RsvpStatus } from "@/generated/prisma/enums";

type CreateEventState = { error: string | null };

type ParseCreateEventResult =
  | { error: string }
  | { data: {
      title: string;
      description: string | null;
      location: string | null;
      eventDate: string | null;
    } };

function parseCreateEvent(formData: FormData): ParseCreateEventResult {
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 3 || title.length > 120) {
    return { error: "Title must be between 3 and 120 characters" };
  }
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "");
  return {
    data: {
      title,
      description: description.length ? description.slice(0, 200) : null,
      location: location.length ? location.slice(0, 200) : null,
      eventDate: eventDate.length ? eventDate : null,
    },
  };
}
const RSVP_STATUSES = [  "going", "not_going", "maybe"] as const;
function isRsvpStatus(s:string): s is RsvpStatus{
  return (RSVP_STATUSES as readonly string[]).includes(s)
}
function parseRsvp(formData: FormData) {
const name = String(formData.get("name") ?? "").trim();
if(name.length <2 || name.length > 120){
  return { error: "Name must be between 2 and 120 characters" };
}
const email = String(formData.get("email")?? "").trim();
if (email.length < 3 || !email.includes("@") || email.length > 200){
  return { error: "Please provide a valid email address" };
}
const status = String(formData.get("status") ?? "").trim();
if(!isRsvpStatus(status)){
  return { error: "Invalid status" };
}
return {
  data: { name, email, status }
}
}
export async function createEventAction(
  prevState: CreateEventState,
  formData: FormData
): Promise<CreateEventState> {
  try {
    const session = await getSession();
    if (!session.data) return { error: "Unauthorized" };
    const userId = session.data.user.id!;
    const parseResult = parseCreateEvent(formData);
    if ("error" in parseResult) return { error: parseResult.error };
    const { data: input } = parseResult;
    const created = await prisma.event.create({
      data: {
        ownerUserId: userId,
        title: input.title,
        description: input.description,
        location: input.location,
        eventDate: input.eventDate ? new Date(input.eventDate) : null,
      },
    });
    redirect(`/events/${created.id}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An unexpected error occurred" };
  }
}

export async function createInviteLinkAction(eventId: string) {
  const session = await getSession();
  if (!session.data) throw new Error("Unauthorized");
  const userId = session.data.user.id!;
  const own = await prisma.event.findFirst({
    where: {  id: eventId,      ownerUserId: userId,  },
    select: { id: true },
  })
 if(!own){
  throw new Error("Event not found");
 }
 const token = crypto.randomUUID().replace(/-/g, '')
 await prisma.eventInvite.upsert({
  where: {eventId},
  create: {eventId, token},
  update: {token},
  
 })
}

export async function submitOrUpdateRsvpAction(token: string,formData: FormData) {
  const input = parseRsvp(formData);
  if ("error" in input) {
    throw new Error(input.error);
  }
  const { data } = input;
  const invite = await prisma.eventInvite.findFirst({
    where:{token},
    select:{
      id:true,
      event: {
        select: {id:true}
      }
    }
  })
  if(!invite) throw new Error("Invite not found");
  const eventId = invite.event.id
  const emailNormalized = data.email.toLowerCase()
  await prisma.eventRsvp.upsert({
    where: {eventId_emailNormalized:{eventId, emailNormalized}},
    create: {
      eventId,
      inviteId: invite.id,
      name: data.name,
      email: data.email,
      emailNormalized,
      status: data.status as RsvpStatus,
    },
    update: {
    name: data.name,
     status: data.status as RsvpStatus,
     respondedAt: new Date()
    },
  })
  redirect(`/invite/${token}?submitted=1`)
}
