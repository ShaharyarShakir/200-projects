"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEventAction } from "@/lib/actions/events";
import Link from "next/link";
import { useActionState } from "react";

export default function NewEventPage() {
  const [state, formAction, isPending] = useActionState(createEventAction, { error: null });
  
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
        </CardHeader>

        <CardContent>
          <form action={formAction}>
            {state.error && (
              <div className="mb-4 rounded-md border border-red-500 bg-red-50 px-4 py-3 text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {state.error}
              </div>
            )}
            
            <div className="space-y-4">
              <Field>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="Team dinner..." />
              </Field>
              <Field>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Detail about the event (Optional)"
                />
              </Field>
              <Field>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Detail about the event (Optional)"
                />
              </Field>
              <Field>
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  name="eventDate"
                  type="datetime-local"
                  placeholder="Team dinner..."
                />
              </Field>
              <div className="flex items-center gap-4">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Event"}
                </Button>
                <Button type="button" asChild variant={"outline"}>
                  <Link href={"/dashboard"}>Cancel</Link>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
