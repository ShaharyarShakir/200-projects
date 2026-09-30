import type { SupportedRuntime } from "../vms/types";

export * from "../vms/types";

export type ClientVMStatus = "running" | "stopped" | "unknown";

export type ClientVM = {
  id: string;
  /**
   * Display metadata that the `/api/vms` route does not populate yet: vmsan
   * owns VM identity and the adapter reports only the id. Optional until the
   * route starts supplying these, so fixtures and the UI agree on one shape.
   */
  name?: string;
  vmsanId?: string;
  status: ClientVMStatus;
  memoryMiB: number | null;
  vcpus: number | null;
  runtime: string | null;
  age: string | null;
};

export type GetVMsResponse = {
  vms: ClientVM[];
};

export type CreateVMRequest = {
  /**
   * Optional: vmsan derives VM identity itself, and `/api/vms` ignores this
   * field today. It stays in the type for the planned rename-on-create work.
   */
  name?: string;
  runtime: SupportedRuntime;
  vcpus: number;
  memoryMiB: number;
};

export type CreateVMResponse = {
  success: boolean;
  result?: {
    stdout: string;
    stderr: string;
    exitCode: number;
  };
  vm?: ClientVM;
};

export type LifecycleActionResponse = {
  success: boolean;
  vmId: string;
};

export type VMAction = "starting" | "stopping" | "deleting" | null;

export type ApiErrorDetail = {
  code: string;
  message: string;
};

export type ApiErrorResponse = {
  error: ApiErrorDetail;
};

