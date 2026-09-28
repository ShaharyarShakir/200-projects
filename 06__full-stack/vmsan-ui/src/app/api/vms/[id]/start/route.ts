import { NextResponse } from "next/server";
import { startVM } from "@/lib/vmsan";
import { handleApiError } from "../../helpers";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await startVM(id);

    return NextResponse.json({
      success: true,
      vmId: id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
