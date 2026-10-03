import { NextResponse } from "next/server";
import { createVmService } from "@/lib/vms/vm-service";
import { toApiErrorResponse, VmValidationError } from "@/lib/vms/vm-errors";

const vmService = createVmService();

/**
 * GET /api/vms/:id/files/download?path=...
 * Streams a binary file download from a microVM (≤ 100 MiB limit).
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
    const result = await vmService.downloadVmFile(id, path);
    const buffer = Buffer.from(result.contentBase64, "base64");
    const sanitizedFilename = (result.fileName || "download").replace(/["\r\n]/g, "");

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${sanitizedFilename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
