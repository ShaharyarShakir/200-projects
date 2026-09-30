import { NextResponse } from "next/server";
import { createVmService } from "@/lib/vms/vm-service";
import { toApiErrorResponse } from "@/lib/vms/vm-errors";

const vmService = createVmService();

/**
 * Stopping a VM is a privileged operation and goes through the manager via VmService.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const vm = await vmService.stopVm(id);
    return NextResponse.json({ vm }, { status: 200 });
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
