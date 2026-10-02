"use client";

import * as React from "react";
import {
  FileText,
  Download,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatFileSize } from "@/lib/utils/formatters";
import type { VmFile } from "@/lib/api/types";

export interface VmFilePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: VmFile | null;
  content: string | null;
  isLoading?: boolean;
  error?: string | null;
  isTooLarge?: boolean;
  onDownload?: (file: VmFile) => void;
}

export function VmFilePreview({
  open,
  onOpenChange,
  file,
  content,
  isLoading = false,
  error = null,
  isTooLarge = false,
  onDownload,
}: VmFilePreviewProps) {
  if (!file) return null;

  const handleDownload = () => {
    onDownload?.(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl flex flex-col gap-3">
        <DialogHeader className="flex flex-col gap-1 border-b border-border/40 pb-3">
          <div className="flex items-center justify-between gap-2 pr-6">
            <div className="flex items-center gap-2 truncate">
              <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <DialogTitle className="truncate font-mono text-sm font-semibold">
                {file.name}
              </DialogTitle>
            </div>
            <Badge variant="outline" className="font-mono text-[11px] shrink-0">
              {formatFileSize(file.size)}
            </Badge>
          </div>
          <p className="font-mono text-xs text-muted-foreground truncate">
            {file.path}
          </p>
        </DialogHeader>

        {/* Content Body */}
        <div className="min-h-[220px] max-h-[440px] flex flex-col justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
              <p className="text-xs">Loading file preview...</p>
            </div>
          ) : isTooLarge ? (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500">
              <Info className="size-8" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-sm">File Too Large for In-Browser Preview</p>
                <p className="text-xs text-muted-foreground">
                  Text preview is limited to files ≤ 1 MiB. This file ({formatFileSize(file.size)}) can be downloaded directly.
                </p>
              </div>
              {onDownload && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="mt-2 gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  <span>Download File</span>
                </Button>
              )}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
              <AlertCircle className="size-8" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-sm">Unable to Preview File</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
              {onDownload && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="mt-2 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/20"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  <span>Download Instead</span>
                </Button>
              )}
            </div>
          ) : content !== null ? (
            <div className="relative overflow-hidden rounded-lg border border-border/60 bg-zinc-950 dark:bg-zinc-900/90 p-3.5">
              <pre
                data-testid="file-preview-content"
                className="max-h-[380px] overflow-auto font-mono text-xs text-zinc-100 whitespace-pre-wrap select-text leading-relaxed"
              >
                {content.length === 0 ? (
                  <span className="text-zinc-500 italic">(empty file)</span>
                ) : (
                  content
                )}
              </pre>
            </div>
          ) : null}
        </div>

        <DialogFooter className="mt-2 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
          <div className="text-[11px] text-muted-foreground">
            Read-only preview
          </div>
          <div className="flex items-center gap-2">
            {onDownload && !isLoading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-1.5"
              >
                <Download className="size-3.5" aria-hidden="true" />
                <span>Download</span>
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
