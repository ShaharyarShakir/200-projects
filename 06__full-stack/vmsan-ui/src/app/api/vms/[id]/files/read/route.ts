import { NextResponse } from "next/server";
import { createVmService } from "@/lib/vms/vm-service";
import { toApiErrorResponse, VmValidationError } from "@/lib/vms/vm-errors";

const vmService = createVmService();

/**
 * GET /api/vms/:id/files/read?path=...
 * Reads text file contents from a microVM for preview (≤ 1 MiB limit).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const path = url.searchParams.get("path");

  if (!path) {
    const { status, body } = toApiErrorResponse(
      new VmValidationError("Missing required 'path' query parameter")
    );
    return NextResponse.json(body, { status });
  }

  try {
    const result = await vmService.readVmFile(id, path);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
