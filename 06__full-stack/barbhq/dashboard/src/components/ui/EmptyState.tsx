import React from "react";
import { Inbox } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <Inbox className="h-10 w-10 text-muted-foreground" />,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/80 mb-4 text-primary">
        {icon}
      </div>
      <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
        {title}
      </h3>
      <p className="max-w-xs text-sm text-muted-foreground leading-normal mb-5">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};
