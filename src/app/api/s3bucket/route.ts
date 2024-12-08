import {NextResponse} from "next/server";

export async function GET(req: Request) {
    try {
        const response = await fetch("https://karabast-assets.s3.amazonaws.com/data/_setCodeMap.json");

        if (!response.ok) {
            console.error("Failed to fetch card mapping:", response.statusText);
            return NextResponse.json({ error: "Failed to fetch card mapping" }, { status: 500 });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error) {
            console.error("Internal Server Error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
