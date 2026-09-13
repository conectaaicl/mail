import { NextResponse } from "next/server";

// This endpoint was disabled for security reasons.
export async function GET() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}
