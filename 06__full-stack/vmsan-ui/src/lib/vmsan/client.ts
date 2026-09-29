import { spawn } from "node:child_process";
import {
  CommandResult,
  CreateVMOptions,
  RunVmsanOptions,
  SupportedRuntime,
  VM,
} from "./types";
import { VmsanError, VmsanValidationError } from "./errors";
import { parseVmList } from "./parser";

const VM_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
const VALID_RUNTIMES: readonly SupportedRuntime[] = [
  "base",
  "node22",
  "node24",
  "python3.13",
];

export function validateVmId(vmId: unknown): string {
  if (typeof vmId !== "string" || !VM_ID_REGEX.test(vmId)) {
    throw new VmsanValidationError(
      `Invalid VM ID '${String(vmId)}'. VM ID must contain 1-64 alphanumeric characters, hyphens, or underscores.`,
      "id",
      vmId
    );
  }
  return vmId;
}

export function validateCreateOptions(options: CreateVMOptions): void {
  if (options.runtime !== undefined) {
    if (!VALID_RUNTIMES.includes(options.runtime)) {
      throw new VmsanValidationError(
        `Invalid runtime '${String(options.runtime)}'. Allowed runtimes: ${VALID_RUNTIMES.join(", ")}`,
        "runtime",
        options.runtime
      );
    }
  }

  if (options.vcpus !== undefined) {
    if (
      typeof options.vcpus !== "number" ||
      !Number.isInteger(options.vcpus) ||
      options.vcpus < 1
    ) {
      throw new VmsanValidationError(
        `vCPUs must be an integer of at least 1, received: ${String(options.vcpus)}`,
        "vcpus",
        options.vcpus
      );
    }
  }

  if (options.memoryMiB !== undefined) {
    if (
      typeof options.memoryMiB !== "number" ||
      !Number.isInteger(options.memoryMiB) ||
      options.memoryMiB < 128
    ) {
      throw new VmsanValidationError(
        `memoryMiB must be an integer of at least 128, received: ${String(options.memoryMiB)}`,
        "memoryMiB",
        options.memoryMiB
      );
    }
  }
}

export async function runVmsan(
  args: string[],
  options?: RunVmsanOptions
): Promise<CommandResult> {
  // The adapter is deliberately powerless: it runs `vmsan` as the calling
  // user and never escalates. Anything privileged goes through the manager
  // socket, which is the only process with privilege in this design.
  const binPath = options?.binPath || process.env.VMSAN_BIN_PATH || "vmsan";
  const timeoutMs = options?.timeoutMs ?? 15000;

  const executable = binPath;
  const finalArgs = args;

  return new Promise((resolve, reject) => {
    let stdoutData = "";
    let stderrData = "";
    let isSettled = false;

    const child = spawn(/*turbopackIgnore: true*/ executable, finalArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        ...(options?.env || {}),
      },
      shell: false,
    });

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        child.kill("SIGTERM");
        setTimeout(() => {
          try {
            child.kill("SIGKILL");
          } catch {
            // Process might have already exited
          }
        }, 1000).unref();

        reject(
          new VmsanError({
            message: `Command '${executable} ${finalArgs.join(" ")}' timed out after ${timeoutMs}ms`,
            command: executable,
            args: finalArgs,
            exitCode: null,
            stdout: stdoutData,
            stderr: stderrData,
          })
        );
      }
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutData += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrData += chunk.toString("utf8");
    });

    child.on("error", (err: Error) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        reject(
          new VmsanError({
            message: `Failed to execute '${executable}': ${err.message}`,
            command: executable,
            args: finalArgs,
            exitCode: null,
            stdout: stdoutData,
            stderr: stderrData,
          })
        );
      }
    });

    child.on("close", (code: number | null) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);

        if (code === 0) {
          resolve({
            stdout: stdoutData,
            stderr: stderrData,
            exitCode: 0,
          });
        } else {
          reject(
            new VmsanError({
              command: executable,
              args: finalArgs,
              exitCode: code,
              stdout: stdoutData,
              stderr: stderrData,
            })
          );
        }
      }
    });
  });
}

export async function listVMs(options?: RunVmsanOptions): Promise<VM[]> {
  const result = await runVmsan(["--json", "list"], options);
  return parseVmList(result.stdout);
}

export async function createVM(
  options: CreateVMOptions = {},
  execOptions?: RunVmsanOptions
): Promise<CommandResult> {
  validateCreateOptions(options);

  const args: string[] = ["create"];
  if (options.runtime) {
    args.push(`--runtime=${options.runtime}`);
  }
  if (options.vcpus !== undefined) {
    args.push(`--vcpus=${options.vcpus}`);
  }
  if (options.memoryMiB !== undefined) {
    args.push(`--memory=${options.memoryMiB}`);
  }

  return runVmsan(args, execOptions);
}

export async function startVM(
  vmId: string,
  execOptions?: RunVmsanOptions
): Promise<CommandResult> {
  const validId = validateVmId(vmId);
  return runVmsan(["start", validId], execOptions);
}

export async function stopVM(
  vmId: string,
  execOptions?: RunVmsanOptions
): Promise<CommandResult> {
  const validId = validateVmId(vmId);
  return runVmsan(["stop", validId], execOptions);
}

export async function removeVM(
  vmId: string,
  execOptions?: RunVmsanOptions
): Promise<CommandResult> {
  const validId = validateVmId(vmId);
  return runVmsan(["remove", validId], execOptions);
}
