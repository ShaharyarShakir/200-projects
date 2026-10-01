import { NextResponse } from "next/server";
import { createVmService } from "@/lib/vms/vm-service";
import { toApiErrorResponse } from "@/lib/vms/vm-errors";
import { parseJsonBody } from "@/app/api/vms/helpers";

const vmService = createVmService();

/**
 * Execute a command inside a running microVM via VmService (privileged RPC to vmsan-manager).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const parsed = await parseJsonBody<Record<string, unknown>>(request);
  if ("errorResponse" in parsed) {
    return parsed.errorResponse;
  }

  try {
    const result = await vmService.execVm(id, parsed.data);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
