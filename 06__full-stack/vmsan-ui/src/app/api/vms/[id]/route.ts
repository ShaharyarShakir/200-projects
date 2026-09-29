import { validateVmId } from "@/lib/vmsan";
import { handleApiError, lifecycleUnavailableResponse } from "../helpers";

/**
 * Deleting a VM is a privileged operation and there is no manager RPC for it.
 *
 * The route still exists, and still validates the id, so that a request naming
 * something that could never be a VM is rejected as invalid input rather than
 * being answered with a blanket 501. It performs no vmsan call and touches no
 * metadata record: an unavailable operation must not leave a half-applied
 * change behind for a later run to pick up.
 */
export async function DELETE(
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
