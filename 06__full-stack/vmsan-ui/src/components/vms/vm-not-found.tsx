import * as React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HelpCircle, ArrowLeft } from "lucide-react";

export interface VmNotFoundProps extends React.ComponentProps<typeof Card> {
  vmId?: string;
}

export function VmNotFound({ vmId, className, ...props }: VmNotFoundProps) {
  return (
    <Card
      role="alert"
      className={cn("mx-auto max-w-lg text-center p-6 border-dashed", className)}
      {...props}
    >
      <CardHeader className="flex flex-col items-center gap-2 pb-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <HelpCircle className="size-6" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight">
          Virtual machine not found
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground max-w-sm">
          {vmId ? (
            <>
              The virtual machine <span className="font-mono font-medium text-foreground">{vmId}</span> may have been removed or may no longer exist.
            </>
          ) : (
            "The requested virtual machine may have been removed or may no longer exist."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 flex justify-center">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "default" }), "gap-2")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back to Virtual Machines</span>
        </Link>
      </CardContent>
    </Card>
  );
}
