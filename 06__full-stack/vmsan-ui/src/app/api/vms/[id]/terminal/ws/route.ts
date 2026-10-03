import { NextResponse } from "next/server";

/**
 * Endpoint for terminal WebSocket connection.
 * When accessed via standard HTTP, responds with 426 Upgrade Required.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: {
        code: "UPGRADE_REQUIRED",
        message: "WebSocket connection required for interactive terminal stream",
      },
    },
    { status: 426 }
  );
}
