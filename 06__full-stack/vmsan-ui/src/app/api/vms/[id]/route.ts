import { NextResponse } from "next/server";
import { removeVM } from "@/lib/vmsan";
import { handleApiError } from "../helpers";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await removeVM(id);

    return NextResponse.json({
      success: true,
      vmId: id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
