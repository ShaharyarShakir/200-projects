import { NextResponse } from "next/server";
import { createVmService } from "@/lib/vms/vm-service";
import { toApiErrorResponse, VmValidationError } from "@/lib/vms/vm-errors";
import { parseJsonBody } from "@/app/api/vms/helpers";
import { validateUploadSize } from "@/lib/vms/validation";

const vmService = createVmService();

/**
 * GET /api/vms/:id/files?path=...
 * Lists files and directories in a microVM.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "/";

  try {
    const result = await vmService.listVmFiles(id, path);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/vms/:id/files
 * Uploads a file into a microVM directory.
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

  const { destDir, fileName, name, contentBase64 } = parsed.data;
  const targetFileName = fileName ?? name;

  if (typeof contentBase64 !== "string") {
    const { status, body } = toApiErrorResponse(
      new VmValidationError("contentBase64 must be a string")
    );
    return NextResponse.json(body, { status });
  }

  // Pre-validate upload payload size
  const approximateBytes = Math.floor((contentBase64.length * 3) / 4);
  try {
    validateUploadSize(approximateBytes);
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }

  try {
    const result = await vmService.writeVmFile(
      id,
      destDir ?? "/",
      targetFileName,
      contentBase64
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * DELETE /api/vms/:id/files?path=...
 * Deletes a file or empty directory in a microVM (non-recursive).
 */
export async function DELETE(
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
    const result = await vmService.deleteVmFile(id, path);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
