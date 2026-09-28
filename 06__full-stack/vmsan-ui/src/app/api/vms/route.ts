import { NextResponse } from "next/server";
import {
  listVMs,
  createVM,
  CreateVMOptions,
  SupportedRuntime,
} from "@/lib/vmsan";
import { handleApiError, parseJsonBody } from "./helpers";

export async function GET() {
  try {
    const vms = await listVMs();
    return NextResponse.json({ vms });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody<Record<string, unknown>>(request);
    if ("errorResponse" in parsed) {
      return parsed.errorResponse;
    }

    const { runtime, vcpus, memoryMiB } = parsed.data;

    const createOptions: CreateVMOptions = {};
    if (runtime !== undefined) {
      createOptions.runtime = runtime as SupportedRuntime;
    }
    if (vcpus !== undefined) {
      createOptions.vcpus = vcpus as number;
    }
    if (memoryMiB !== undefined) {
      createOptions.memoryMiB = memoryMiB as number;
    }

    const result = await createVM(createOptions);

    return NextResponse.json(
      {
        success: true,
        result,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

