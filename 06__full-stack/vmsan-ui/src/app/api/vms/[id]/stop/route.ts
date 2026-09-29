import { validateVmId } from "@/lib/vmsan";
import { handleApiError, lifecycleUnavailableResponse } from "../../helpers";

/**
 * Stopping a VM is a privileged operation and there is no manager RPC for it.
 *
 * See `POST /api/vms/[id]/start`: the route validates, then reports the
 * operation as unavailable, and runs no vmsan command.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    validateVmId(id);
  } catch (error) {
    return handleApiError(error);
  }

  return lifecycleUnavailableResponse();
}
