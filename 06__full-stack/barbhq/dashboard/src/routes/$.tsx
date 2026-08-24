import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { Scissors } from "lucide-react";

export const Route = createFileRoute("/$")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6 select-none animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary mb-6 animate-bounce">
        <Scissors className="h-7 w-7 -rotate-45" />
      </div>

      <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
        404
      </h1>

      <h2 className="font-serif text-xl font-semibold text-muted-foreground mt-3">
        Style Cut Not Found
      </h2>

      <p className="max-w-md text-sm text-muted-foreground mt-2 leading-relaxed">
        The grooming chair you are looking for does not exist or has been
        relocated to another barbershop section.
      </p>

      <div className="mt-8">
        <Link to="/dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
