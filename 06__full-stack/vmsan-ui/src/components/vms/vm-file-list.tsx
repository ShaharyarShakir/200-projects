"use client";

import * as React from "react";
import {
  Folder,
  FileText,
  FileSymlink,
  FileQuestion,
  Eye,
  Download,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, formatDate } from "@/lib/utils/formatters";
import type { VmFile } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export interface VmFileListProps extends React.ComponentProps<"div"> {
  entries: VmFile[];
  currentPath: string;
  isLoading?: boolean;
  disabled?: boolean;
  onNavigate?: (path: string) => void;
  onPreview?: (file: VmFile) => void;
  onDownload?: (file: VmFile) => void;
  onDelete?: (file: VmFile) => void;
}

export function VmFileList({
  entries,
  currentPath,
  isLoading = false,
  disabled = false,
  onNavigate,
  onPreview,
  onDownload,
  onDelete,
  className,
  ...props
}: VmFileListProps) {
  // Sort entries: directories first, then alphabetical by name
  const sortedEntries = React.useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.type === "directory" && b.type !== "directory") return -1;
      if (a.type !== "directory" && b.type === "directory") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [entries]);

  const getEntryIcon = (type: VmFile["type"]) => {
    switch (type) {
      case "directory":
        return <Folder className="size-4 shrink-0 text-amber-500" aria-hidden="true" />;
      case "symlink":
        return <FileSymlink className="size-4 shrink-0 text-cyan-500" aria-hidden="true" />;
      case "file":
        return <FileText className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />;
      default:
        return <FileQuestion className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />;
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border/60 bg-card", className)} {...props}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" data-testid="vm-file-list-table">
          <thead className="border-b border-border/60 bg-muted/40 font-medium text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Size</th>
              <th className="px-4 py-2.5 font-medium">Modified</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {sortedEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1.5 font-sans">
                    <FolderOpen className="size-8 text-muted-foreground/40" aria-hidden="true" />
                    <p className="font-medium text-sm text-foreground/80">Directory is empty</p>
                    <p className="text-xs text-muted-foreground">
                      No files or directories found in <code className="font-mono">{currentPath}</code>
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedEntries.map((entry) => {
                const isDir = entry.type === "directory";
                return (
                  <tr
                    key={entry.path}
                    className="hover:bg-muted/30 transition-colors group"
                    data-testid={`file-row-${entry.name}`}
                  >
                    {/* Name & Icon */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {getEntryIcon(entry.type)}
                        {isDir ? (
                          <button
                            type="button"
                            onClick={() => !disabled && onNavigate?.(entry.path)}
                            disabled={disabled}
                            className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 text-left disabled:cursor-not-allowed disabled:hover:no-underline truncate max-w-xs md:max-w-md"
                            aria-label={`Open folder ${entry.name}`}
                          >
                            {entry.name}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => !disabled && onPreview?.(entry)}
                            disabled={disabled}
                            className="text-foreground/90 hover:text-foreground hover:underline underline-offset-2 text-left disabled:cursor-not-allowed disabled:hover:no-underline truncate max-w-xs md:max-w-md"
                            aria-label={`Preview file ${entry.name}`}
                          >
                            {entry.name}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Entry Type */}
                    <td className="px-4 py-2 font-sans">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-1.5 py-0 text-[10px] font-normal capitalize",
                          isDir ? "border-amber-500/30 text-amber-600 dark:text-amber-400" : "border-border text-muted-foreground"
                        )}
                      >
                        {entry.type}
                      </Badge>
                    </td>

                    {/* Size */}
                    <td className="px-4 py-2 text-muted-foreground">
                      {isDir ? "—" : formatFileSize(entry.size)}
                    </td>

                    {/* Modified */}
                    <td className="px-4 py-2 text-muted-foreground font-sans text-[11px]">
                      {formatDate(entry.modifiedAt)}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isDir && onPreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onPreview(entry)}
                            disabled={disabled || isLoading}
                            title="Preview file"
                            aria-label={`Preview ${entry.name}`}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="size-3.5" aria-hidden="true" />
                          </Button>
                        )}

                        {!isDir && onDownload && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onDownload(entry)}
                            disabled={disabled || isLoading}
                            title="Download file"
                            aria-label={`Download ${entry.name}`}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Download className="size-3.5" aria-hidden="true" />
                          </Button>
                        )}

                        {onDelete && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onDelete(entry)}
                            disabled={disabled || isLoading}
                            title={isDir ? "Delete empty directory" : "Delete file"}
                            aria-label={`Delete ${entry.name}`}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
