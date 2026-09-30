import { NextResponse } from "next/server";
import { createVmService } from "@/lib/vms/vm-service";
import { parseJsonBody } from "./helpers";
import { toApiErrorResponse } from "@/lib/vms/vm-errors";

const vmService = createVmService();

/**
 * List all microVMs.
 */
export async function GET() {
  try {
    const vms = await vmService.listVms();
    return NextResponse.json({ vms });
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * Create a new microVM.
 */
export async function POST(request: Request) {
  const parsed = await parseJsonBody<Record<string, unknown>>(request);
  if ("errorResponse" in parsed) {
    return parsed.errorResponse;
  }

  try {
    const vm = await vmService.createVm(parsed.data);
    return NextResponse.json({ vm }, { status: 201 });
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
