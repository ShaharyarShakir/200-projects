"use client";

import * as React from "react";
import {
  FolderTree,
  RefreshCw,
  Upload,
  FolderPlus,
  ChevronRight,
  Home,
  Info,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { VmFileList } from "./vm-file-list";
import { VmFilePreview } from "./vm-file-preview";
import { VmUploadDialog } from "./vm-upload-dialog";
import { VmCreateFolderDialog } from "./vm-create-folder-dialog";
import {
  listVmFiles,
  readVmFile,
  uploadVmFile,
  createVmDirectory,
  deleteVmFile,
  downloadVmFile,
} from "@/lib/api/vm-files";
import { FILE_LIMITS } from "@/lib/vms/validation";
import { useOptionalVmConsole } from "./vm-console-context";
import type { VmFile } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export interface VmFileBrowserProps extends React.ComponentProps<"div"> {
  vmId?: string;
  status?: string;
  initialPath?: string;
  fetchFilesFn?: typeof listVmFiles;
  readFileFn?: typeof readVmFile;
  uploadFileFn?: typeof uploadVmFile;
  createFolderFn?: typeof createVmDirectory;
  deleteFileFn?: typeof deleteVmFile;
  downloadFileFn?: typeof downloadVmFile;
}

export function VmFileBrowser({
  vmId: propVmId,
  status: propStatus,
  initialPath = "/",
  fetchFilesFn = listVmFiles,
  readFileFn = readVmFile,
  uploadFileFn = uploadVmFile,
  createFolderFn = createVmDirectory,
  deleteFileFn = deleteVmFile,
  downloadFileFn = downloadVmFile,
  className,
  ...props
}: VmFileBrowserProps) {
  const consoleCtx = useOptionalVmConsole();
  const contextVmId = consoleCtx?.vm.id ?? "";
  const contextStatus = consoleCtx?.vm.status ?? "unknown";

  const vmId = propVmId ?? contextVmId;
  const status = propStatus ?? contextStatus;
  const isRunning = status === "running";

  const [currentPath, setCurrentPath] = React.useState<string>(initialPath);
  const [entries, setEntries] = React.useState<VmFile[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog & Modal states
  const [uploadOpen, setUploadOpen] = React.useState<boolean>(false);
  const [createFolderOpen, setCreateFolderOpen] = React.useState<boolean>(false);

  // Preview state
  const [previewFile, setPreviewFile] = React.useState<VmFile | null>(null);
  const [previewContent, setPreviewContent] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState<boolean>(false);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [previewTooLarge, setPreviewTooLarge] = React.useState<boolean>(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = React.useState<VmFile | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const loadDirectory = React.useCallback(
    async (targetPath: string, showSpinner = true) => {
      if (!isRunning) return;

      if (showSpinner) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const result = await fetchFilesFn(vmId, targetPath);
        setCurrentPath(result.path);
        setEntries(result.entries);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        if (showSpinner) {
          setIsLoading(false);
        }
      }
    },
    [vmId, isRunning, fetchFilesFn]
  );

  // Initial load on mount or when VM becomes running
  React.useEffect(() => {
    let active = true;
    if (isRunning) {
      void (async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await fetchFilesFn(vmId, currentPath);
          if (active) {
            setCurrentPath(result.path);
            setEntries(result.entries);
          }
        } catch (err: unknown) {
          if (active) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      })();
    }
    return () => {
      active = false;
    };
  }, [isRunning, vmId, currentPath, fetchFilesFn]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDirectory(currentPath, false);
    setIsRefreshing(false);
  };

  const handleNavigate = (targetPath: string) => {
    void loadDirectory(targetPath);
  };

  // Breadcrumbs parsing
  const breadcrumbs = React.useMemo(() => {
    const parts = currentPath.split("/").filter(Boolean);
    const crumbs: Array<{ label: string; path: string }> = [{ label: "Root", path: "/" }];

    let acc = "";
    for (const part of parts) {
      acc += `/${part}`;
      crumbs.push({ label: part, path: acc });
    }
    return crumbs;
  }, [currentPath]);

  // File Preview Handler
  const handleOpenPreview = async (file: VmFile) => {
    setPreviewFile(file);
    setPreviewContent(null);
    setPreviewError(null);
    setPreviewTooLarge(false);

    if (file.size !== undefined && file.size > FILE_LIMITS.previewMaxBytes) {
      setPreviewTooLarge(true);
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await readFileFn(vmId, file.path);
      setPreviewContent(res.content);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes("too large") || message.includes("413")) {
        setPreviewTooLarge(true);
      } else {
        setPreviewError(message);
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  // File Download Handler
  const handleDownload = async (file: VmFile) => {
    try {
      const blob = await downloadFileFn(vmId, file.path);
      if (typeof window !== "undefined") {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Download failed: ${message}`);
    }
  };

  // File Upload Handler
  const handleUpload = async (destDir: string, fileName: string, contentBase64: string) => {
    await uploadFileFn(vmId, {
      destDir,
      fileName,
      contentBase64,
    });
    // Auto refresh directory after upload
    await loadDirectory(currentPath, false);
  };

  // Create Folder Handler
  const handleCreateFolder = async (folderName: string) => {
    const targetPath =
      currentPath === "/" ? `/${folderName}` : `${currentPath}/${folderName}`;
    await createFolderFn(vmId, { path: targetPath });
    // Auto refresh directory after creation
    await loadDirectory(currentPath, false);
  };

  // Delete Action Handlers
  const handleOpenDelete = (file: VmFile) => {
    setDeleteTarget(file);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteFileFn(vmId, deleteTarget.path);
      setDeleteTarget(null);
      await loadDirectory(currentPath, false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
      data-testid="vm-file-browser-card"
      className={cn("overflow-hidden border-border/80 bg-card", className)}
      {...props}
    >
      <CardHeader className="flex flex-col gap-3 border-b border-border/40 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="size-4 text-primary" aria-hidden="true" />
          <CardTitle className="text-sm font-semibold tracking-tight">
            Filesystem Explorer
          </CardTitle>
          <Badge variant="outline" className="font-mono text-[11px]">
            {currentPath}
          </Badge>
        </div>

        <CardAction className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCreateFolderOpen(true)}
            disabled={!isRunning || isLoading}
            className="h-8 gap-1.5 text-xs"
            aria-label="New folder"
          >
            <FolderPlus className="size-3.5" aria-hidden="true" />
            <span>New Folder</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setUploadOpen(true)}
            disabled={!isRunning || isLoading}
            className="h-8 gap-1.5 text-xs"
            aria-label="Upload file"
          >
            <Upload className="size-3.5" aria-hidden="true" />
            <span>Upload</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={!isRunning || isLoading || isRefreshing}
            className="h-8 gap-1.5 text-xs"
            aria-label="Refresh directory"
          >
            <RefreshCw
              className={cn("size-3.5", (isLoading || isRefreshing) && "animate-spin")}
              aria-hidden="true"
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-4">
        {/* Non-Running VM Status Notice */}
        {!isRunning && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500"
          >
            <Info className="size-4 shrink-0" aria-hidden="true" />
            <span>
              Filesystem unavailable while the VM is not running (status:{" "}
              <strong className="font-mono">{status}</strong>). Start the microVM to browse and manage files.
            </span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && isRunning && (
          <div
            role="alert"
            className="flex items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setError(null)}
              className="h-6 px-1.5 text-xs hover:bg-destructive/20 text-destructive"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Interactive Breadcrumbs Trail */}
        {isRunning && (
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md border border-border/40 font-mono"
          >
            <Home className="size-3.5 mr-0.5 text-muted-foreground/70" aria-hidden="true" />
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.path}>
                  {idx > 0 && (
                    <ChevronRight
                      className="size-3.5 text-muted-foreground/40 shrink-0 select-none"
                      aria-hidden="true"
                    />
                  )}
                  {isLast ? (
                    <span className="font-semibold text-foreground truncate max-w-[200px]">
                      {crumb.label}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleNavigate(crumb.path)}
                      className="hover:text-primary hover:underline underline-offset-2 text-left truncate max-w-[150px]"
                      aria-label={`Navigate to ${crumb.label}`}
                    >
                      {crumb.label}
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        {/* File List Table */}
        <VmFileList
          entries={entries}
          currentPath={currentPath}
          isLoading={isLoading || isRefreshing}
          disabled={!isRunning}
          onNavigate={handleNavigate}
          onPreview={handleOpenPreview}
          onDownload={handleDownload}
          onDelete={handleOpenDelete}
        />
      </CardContent>

      {/* Upload Dialog */}
      <VmUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        currentPath={currentPath}
        onUpload={handleUpload}
      />

      {/* Create Folder Dialog */}
      <VmCreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        currentPath={currentPath}
        onCreateFolder={handleCreateFolder}
      />

      {/* File Preview Modal */}
      <VmFilePreview
        open={previewFile !== null}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
        content={previewContent}
        isLoading={previewLoading}
        error={previewError}
        isTooLarge={previewTooLarge}
        onDownload={handleDownload}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !isDeleting && !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
              <DialogTitle>
                {deleteTarget?.type === "directory" ? "Delete Directory" : "Delete File"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">
              Are you sure you want to delete{" "}
              <span className="font-mono font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              ? {deleteTarget?.type === "directory" ? "Non-empty directories cannot be deleted." : "This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive my-1"
            >
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{deleteError}</span>
            </div>
          )}

          <DialogFooter className="mt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
