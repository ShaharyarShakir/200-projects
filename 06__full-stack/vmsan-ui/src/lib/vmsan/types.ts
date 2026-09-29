export type VMStatus = "running" | "stopped" | "unknown";

export type SupportedRuntime = "base" | "node22" | "node24" | "python3.13";

export type VM = {
  id: string;
  status: VMStatus;
  memoryMiB: number | null;
  vcpus: number | null;
  runtime: string | null;
  age: string | null;
};

export type CreateVMOptions = {
  runtime?: SupportedRuntime;
  vcpus?: number;
  memoryMiB?: number;
};

export type CommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export type RunVmsanOptions = {
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
  binPath?: string;
};
