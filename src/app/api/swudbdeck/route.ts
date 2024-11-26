import { NextResponse } from "next/server";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const deckLink = searchParams.get("deckLink");

		if (!deckLink) {
			console.error("Error: Missing deckLink");
			return NextResponse.json({ error: "Missing deckLink" }, { status: 400 });
		}

		// regex to get deck, i found two link styles one with deck/id and other with deck/view/id so i used this regex to get the id either way
		const match = deckLink.match(/\/deck\/(?:view\/)?([^/?]+)/); // Matches /deck/[id] or /deck/view/[id]
		const deckId = match ? match[1] : null;

		if (!deckId) {
			console.error("Error: Invalid deckLink format");
			return NextResponse.json(
				{ error: "Invalid deckLink format" },
				{ status: 400 }
			);
		}

		console.log("Extracted deckId:", deckId);

		const apiUrl = `https://swudb.com/deck/view/${deckId}?handler=JsonFile`;

		const response = await fetch(apiUrl, { method: "GET" });

		if (!response.ok) {
			console.error("SWUDB API error:", response.statusText);
			throw new Error(`SWUDB API error: ${response.statusText}`);
		}

		const data = await response.json();

		return NextResponse.json(data);
	} catch (error: any) {
		console.error("Internal Server Error:", error.message);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
