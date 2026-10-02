"use client";

import * as React from "react";
import { FolderPlus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface VmCreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
  onCreateFolder: (folderName: string) => Promise<void>;
  isLoading?: boolean;
}

export function VmCreateFolderDialog({
  open,
  onOpenChange,
  currentPath,
  onCreateFolder,
  isLoading = false,
}: VmCreateFolderDialogProps) {
  const [folderName, setFolderName] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setFolderName("");
      setError(null);
    }
    if (!isLoading) {
      onOpenChange(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed || isLoading) return;

    // Client-side validation
    if (trimmed.includes("/") || trimmed.includes("\\") || trimmed === "." || trimmed === "..") {
      setError("Folder name cannot contain path separators ('/' or '\\') or traversal segments ('.' or '..').");
      return;
    }

    setError(null);
    try {
      await onCreateFolder(trimmed);
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <FolderPlus className="size-5 shrink-0" aria-hidden="true" />
            <DialogTitle>Create New Folder</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Create a new directory inside the current path on the microVM.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Parent Path Display */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Parent Directory
            </span>
            <span className="font-mono text-xs font-semibold text-foreground truncate">
              {currentPath}
            </span>
          </div>

          {/* Folder Name Input */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="vm-folder-name"
              className="text-xs font-medium text-foreground"
            >
              Folder Name
            </label>
            <Input
              id="vm-folder-name"
              type="text"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. projects, src, logs"
              disabled={isLoading}
              autoFocus
              className="font-mono text-xs"
            />
          </div>

          {/* Error Notice */}
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="mt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!folderName.trim() || isLoading}
              className="gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="size-3.5" aria-hidden="true" />
                  <span>Create Folder</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
