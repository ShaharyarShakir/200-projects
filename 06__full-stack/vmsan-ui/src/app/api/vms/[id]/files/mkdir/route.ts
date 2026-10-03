import { NextResponse } from "next/server";
import { createVmService } from "@/lib/vms/vm-service";
import { toApiErrorResponse, VmValidationError } from "@/lib/vms/vm-errors";
import { parseJsonBody } from "@/app/api/vms/helpers";
import { validateFilename, validatePath } from "@/lib/vms/validation";

const vmService = createVmService();

/**
 * POST /api/vms/:id/files/mkdir
 * Creates a directory inside a microVM.
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

  const { path, parentPath, name } = parsed.data;

  let targetPath: string;
  try {
    if (typeof path === "string" && path.trim().length > 0) {
      targetPath = validatePath(path);
    } else if (parentPath !== undefined && name !== undefined) {
      const validParent = validatePath(parentPath);
      const validName = validateFilename(name);
      targetPath = validParent === "/" ? `/${validName}` : `${validParent}/${validName}`;
    } else {
      throw new VmValidationError("Missing 'path' or ('parentPath' and 'name') in request body");
    }
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }

  try {
    const result = await vmService.mkdirVmDirectory(id, targetPath);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
