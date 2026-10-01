export type VmStatus =
  | "creating"
  | "running"
  | "stopped"
  | "stopping"
  | "starting"
  | "error"
  | "unknown";

export type SupportedRuntime = "base" | "node22" | "node24" | "python3.13";

export type NetworkPolicy = "allow-all" | "deny-all" | "custom";

export interface VmNetwork {
  policy?: NetworkPolicy;
  address?: string;
  publishedPorts?: number[];
}

export interface Vm {
  id: string;
  runtime: string;
  status: VmStatus;
  vcpus: number;
  memoryMib: number;
  memoryMiB?: number;
  diskSizeGb: number;
  createdAt?: string;
  age?: string | null;
  network?: VmNetwork;
}

export interface CreateVmInput {
  vcpus?: number;
  memoryMib?: number;
  memoryMiB?: number; // Supported for backward compatibility
  diskSizeGb?: number;
  runtime?: SupportedRuntime;
  networkPolicy?: NetworkPolicy;
  timeoutMs?: number;
}

export interface RemoveVmResult {
  removed: boolean;
  vmId: string;
}

export interface ExecVmInput {
  command: string;
  timeoutMs?: number;
  workingDirectory?: string;
}

export interface ExecVmResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs?: number;
}

