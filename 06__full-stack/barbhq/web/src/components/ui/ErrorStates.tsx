import React from "react";
import { AlertTriangle, ShieldAlert, FileQuestion } from "lucide-react";
import { Button } from "./button";
import { Link } from "@tanstack/react-router";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  description = "An unexpected error occurred while loading this page. Please try again.",
  onRetry,
}) => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h3 className="font-serif text-xl font-bold text-foreground mb-2">
        {title}
      </h3>
      <p className="max-w-md text-sm text-muted-foreground leading-relaxed mb-6">
        {description}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          size="sm"
          className="font-semibold cursor-pointer"
        >
          Retry Action
        </Button>
      )}
    </div>
  );
};

export const NoPermission: React.FC = () => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h3 className="font-serif text-xl font-bold text-foreground mb-2">
        Access Denied
      </h3>
      <p className="max-w-md text-sm text-muted-foreground leading-relaxed mb-6">
        You do not have the required permissions to view this content. Please
        contact your shop administrator.
      </p>
      <Link to="/dashboard">
        <Button size="sm" className="font-semibold cursor-pointer">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary mb-4">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h3 className="font-serif text-xl font-bold text-foreground mb-2">
        Page Not Found
      </h3>
      <p className="max-w-md text-sm text-muted-foreground leading-relaxed mb-6">
        We could not find the page you are looking for. It might have been moved
        or deleted.
      </p>
      <Link to="/dashboard">
        <Button size="sm" className="font-semibold cursor-pointer">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};
