import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * @deprecated This route is deprecated.
 * Use the backend endpoint /api/user/:userId/swustats/decks instead.
 */
export async function GET() {
    return NextResponse.json(
        { error: "This endpoint is deprecated. Please use the backend API directly." },
        { status: 410 }
    );
}
