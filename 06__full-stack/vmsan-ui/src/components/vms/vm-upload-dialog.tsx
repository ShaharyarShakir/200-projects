"use client";

import * as React from "react";
import { Upload, Loader2, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatFileSize } from "@/lib/utils/formatters";
import { FILE_LIMITS } from "@/lib/vms/validation";
import { cn } from "@/lib/utils";

export interface VmUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
  onUpload: (destDir: string, fileName: string, contentBase64: string) => Promise<void>;
  isLoading?: boolean;
}

export function VmUploadDialog({
  open,
  onOpenChange,
  currentPath,
  onUpload,
  isLoading = false,
}: VmUploadDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isReading, setIsReading] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setSelectedFile(null);
      setError(null);
      setIsReading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    if (!isBusy) {
      onOpenChange(val);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Check file size (50 MiB limit)
    if (file.size > FILE_LIMITS.uploadMaxBytes) {
      setError(
        `File size (${formatFileSize(file.size)}) exceeds the maximum allowed upload limit of 50 MiB.`
      );
      setSelectedFile(null);
      return;
    }

    // Check filename constraints
    if (file.name.includes("/") || file.name.includes("\\") || file.name === ".." || file.name === ".") {
      setError("File name contains invalid path separators or traversal sequences.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isLoading || isReading) return;

    setIsReading(true);
    setError(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      // Convert ArrayBuffer to Base64 in browser safely
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const len = bytes.byteLength;
      const chunkSize = 8192;
      for (let i = 0; i < len; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binary);

      await onUpload(currentPath, selectedFile.name, base64);
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsReading(false);
    }
  };

  const isBusy = isLoading || isReading;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Upload className="size-5 shrink-0" aria-hidden="true" />
            <DialogTitle>Upload File to MicroVM</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Transfer a file directly from your machine into the microVM filesystem.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Destination Path Info */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Destination Directory
            </span>
            <span className="font-mono text-xs font-semibold text-foreground truncate">
              {currentPath}
            </span>
          </div>

          {/* File Picker */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="vm-file-input"
              className="text-xs font-medium text-foreground flex items-center justify-between"
            >
              <span>Select File</span>
              <span className="text-[11px] text-muted-foreground">Max 50 MiB</span>
            </label>
            <input
              ref={fileInputRef}
              id="vm-file-input"
              type="file"
              onChange={handleFileChange}
              disabled={isBusy}
              className={cn(
                "block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer border border-border rounded-lg p-2 bg-background",
                "focus:outline-none focus:ring-1 focus:ring-primary"
              )}
            />
          </div>

          {/* Selected File Details */}
          {selectedFile && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-muted/40 p-2.5 text-xs">
              <div className="flex items-center gap-2 truncate">
                <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="font-mono truncate font-medium">{selectedFile.name}</span>
              </div>
              <span className="font-mono text-muted-foreground shrink-0">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
          )}

          {/* Error Banner */}
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
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || isBusy}
              className="gap-1.5"
            >
              {isBusy ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="size-3.5" aria-hidden="true" />
                  <span>Upload File</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
