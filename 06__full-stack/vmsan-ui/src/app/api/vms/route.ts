import { NextResponse } from "next/server";
import { validateCreateOptions, type CreateVMOptions } from "@/lib/vmsan";
import { createManagerClient } from "@/lib/vmsan-manager/client";
import { toVm } from "@/lib/vmsan-manager/present";
import {
  handleApiError,
  lifecycleUnavailableResponse,
  parseJsonBody,
} from "./helpers";

/**
 * The read path goes through the manager.
 *
 * Listing VM records needs vmsan's own directory, and the web app must not be
 * the process that opens it. The manager already projects the allow-listed
 * fields, so this handler never sees a host path, a pid, or an agent token.
 *
 * The client is constructed per request rather than at module scope so the
 * socket path is read from the environment at call time, which is what makes
 * the same build work against a per-user development socket and the production
 * `/run/vmsan-manager.sock` without a rebuild.
 */
export async function GET() {
  try {
    const vms = await createManagerClient().list();
    return NextResponse.json({ vms: vms.map((vm) => toVm(vm)) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody<Record<string, unknown>>(request);
  if ("errorResponse" in parsed) {
    return parsed.errorResponse;
  }

  const { runtime, vcpus, memoryMiB } = parsed.data;

  const createOptions: CreateVMOptions = {};
  if (runtime !== undefined) {
    createOptions.runtime = runtime as CreateVMOptions["runtime"];
  }
  if (vcpus !== undefined) {
    createOptions.vcpus = vcpus as number;
  }
  if (memoryMiB !== undefined) {
    createOptions.memoryMiB = memoryMiB as number;
  }

  // Validation runs before the unavailable response so a bad request still
  // reports the actual problem instead of a blanket 501. Otherwise a client
  // with a typo would be told to wait for a feature rather than to fix its
  // input.
  try {
    validateCreateOptions(createOptions);
  } catch (error) {
    return handleApiError(error);
  }

  return lifecycleUnavailableResponse();
}
