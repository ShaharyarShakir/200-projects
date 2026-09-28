"use client";

import * as React from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createVM, ApiError } from "@/lib/api/vms";
import type { SupportedRuntime, CreateVMRequest, CreateVMResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export interface CreateVMDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
  createVMFn?: (
    options: CreateVMRequest,
    fetchFn?: typeof fetch
  ) => Promise<CreateVMResponse>;
  trigger?: React.ReactElement;
  className?: string;
}

export const RUNTIME_OPTIONS: Array<{ value: SupportedRuntime; label: string }> = [
  { value: "base", label: "Base" },
  { value: "node22", label: "Node.js 22" },
  { value: "node24", label: "Node.js 24" },
  { value: "python3.13", label: "Python 3.13" },
];

export function CreateVMDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  createVMFn = createVM,
  trigger,
  className,
}: CreateVMDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const [runtime, setRuntime] = React.useState<SupportedRuntime>("base");
  const [vcpus, setVcpus] = React.useState<string>("1");
  const [memoryMiB, setMemoryMiB] = React.useState<string>("128");

  const [vcpusError, setVcpusError] = React.useState<string | null>(null);
  const [memoryError, setMemoryError] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resetForm = React.useCallback(() => {
    setRuntime("base");
    setVcpus("1");
    setMemoryMiB("128");
    setVcpusError(null);
    setMemoryError(null);
    setServerError(null);
    setIsSubmitting(false);
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      controlledOnOpenChange?.(nextOpen);
      if (!nextOpen) {
        resetForm();
      }
    },
    [isControlled, controlledOnOpenChange, resetForm]
  );

  const validate = (): { isValid: boolean; vcpusNum: number; memoryNum: number } => {
    let valid = true;
    let vcpusNum = 1;
    let memoryNum = 128;

    const vcpusTrimmed = vcpus.trim();
    const vcpusParsed = Number(vcpusTrimmed);
    if (
      !vcpusTrimmed ||
      !/^\d+$/.test(vcpusTrimmed) ||
      !Number.isInteger(vcpusParsed) ||
      vcpusParsed < 1
    ) {
      setVcpusError("vCPUs must be an integer at least 1.");
      valid = false;
    } else {
      setVcpusError(null);
      vcpusNum = vcpusParsed;
    }

    const memoryTrimmed = memoryMiB.trim();
    const memoryParsed = Number(memoryTrimmed);
    if (
      !memoryTrimmed ||
      !/^\d+$/.test(memoryTrimmed) ||
      !Number.isInteger(memoryParsed) ||
      memoryParsed < 128
    ) {
      setMemoryError("Memory must be an integer at least 128 MiB.");
      valid = false;
    } else {
      setMemoryError(null);
      memoryNum = memoryParsed;
    }

    return { isValid: valid, vcpusNum, memoryNum };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    const { isValid, vcpusNum, memoryNum } = validate();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createVMFn({
        runtime,
        vcpus: vcpusNum,
        memoryMiB: memoryNum,
      });

      if (onSuccess) {
        await onSuccess();
      }

      handleOpenChange(false);
    } catch (err: unknown) {
      let message = "Unable to create VM. Please check the configuration and try again.";
      if (err instanceof ApiError) {
        message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button
              size="sm"
              className="gap-1.5 font-medium"
              aria-label="Create Virtual Machine"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>Create VM</span>
            </Button>
          )
        }
      />
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle>Create Virtual Machine</DialogTitle>
          <DialogDescription>
            Configure and provision a new Firecracker microVM instance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Runtime Selector */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-vm-runtime">Runtime</Label>
            <Select
              value={runtime}
              onValueChange={(val) => {
                if (val) setRuntime(val as SupportedRuntime);
              }}
            >
              <SelectTrigger
                id="create-vm-runtime"
                className="w-full justify-between"
                aria-label="Runtime"
              >
                <SelectValue placeholder="Select runtime" />
              </SelectTrigger>
              <SelectContent>
                {RUNTIME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* vCPUs Input */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-vm-vcpus">vCPUs</Label>
            <Input
              id="create-vm-vcpus"
              type="number"
              min="1"
              step="1"
              value={vcpus}
              onChange={(e) => {
                setVcpus(e.target.value);
                if (vcpusError) setVcpusError(null);
              }}
              aria-invalid={!!vcpusError}
              aria-describedby={vcpusError ? "create-vm-vcpus-error" : undefined}
              disabled={isSubmitting}
              placeholder="1"
            />
            {vcpusError && (
              <p
                id="create-vm-vcpus-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {vcpusError}
              </p>
            )}
          </div>

          {/* Memory Input */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-vm-memory">Memory (MiB)</Label>
            <Input
              id="create-vm-memory"
              type="number"
              min="128"
              step="1"
              value={memoryMiB}
              onChange={(e) => {
                setMemoryMiB(e.target.value);
                if (memoryError) setMemoryError(null);
              }}
              aria-invalid={!!memoryError}
              aria-describedby={memoryError ? "create-vm-memory-error" : undefined}
              disabled={isSubmitting}
              placeholder="128"
            />
            {memoryError && (
              <p
                id="create-vm-memory-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {memoryError}
              </p>
            )}
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create VM</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
