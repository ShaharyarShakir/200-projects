import { NextResponse } from "next/server";
import { createVmService } from "@/lib/vms/vm-service";
import { toApiErrorResponse } from "@/lib/vms/vm-errors";

const vmService = createVmService();

/**
 * Deleting a VM is a privileged operation and goes through the manager via VmService.
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const result = await vmService.removeVm(id);
    return NextResponse.json(
      { removed: result.removed, vmId: result.vmId, id: result.vmId },
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
