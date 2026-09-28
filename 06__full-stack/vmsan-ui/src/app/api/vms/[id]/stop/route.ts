import { NextResponse } from "next/server";
import { stopVM } from "@/lib/vmsan";
import { handleApiError } from "../../helpers";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await stopVM(id);

    return NextResponse.json({
      success: true,
      vmId: id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
