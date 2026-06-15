export interface ReplayEvent {
    seq: string;
    type: string;
    [key: string]: any;
}

export interface ReplaySnapshot {
    seq: string;
    rawJson?: string;
    snapshot: any;
}

export interface ParsedReplay {
    header: Record<string, string>;
    events: ReplayEvent[];
    snapshots: ReplaySnapshot[];

    /** Map of card id (SET#NUM) → human card name, parsed from the CARD INDEX. */
    cardNames: Record<string, string>;
}

const CARD_INDEX_SEPARATOR = '═══ CARD INDEX ═══';
const REPLAY_SEPARATOR = '=== REPLAY ===';
const HEADER_TAG_REGEX = /^\[(\w+)\s+"(.*)"\]$/;
// Card index entries look like:  "Leader: Ezra Bridger = ASH#013" or "  3x Aggressive Negotiations = SEC#179"
const CARD_INDEX_REGEX = /^(?:\d+x\s+)?(.+?)\s+=\s+([A-Z0-9]+#\d+)$/;

export function parseReplayFile(content: string): ParsedReplay {
    const lines = content.split(/\r?\n/);
    const header: Record<string, string> = {};
    const events: ReplayEvent[] = [];
    const snapshots: ReplaySnapshot[] = [];
    const cardNames: Record<string, string> = {};

    let section: 'header' | 'cardIndex' | 'replay' = 'header';

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.includes(CARD_INDEX_SEPARATOR)) {
            section = 'cardIndex';
            continue;
        }
        if (trimmed === REPLAY_SEPARATOR) {
            section = 'replay';
            continue;
        }

        if (section === 'header') {
            const match = trimmed.match(HEADER_TAG_REGEX);
            if (match) {
                header[match[1]] = match[2];
            }
            continue;
        }

        if (section === 'cardIndex') {
            // Strip the leader name from "Leader: Name = SET#NUM" / "Base: Name = SET#NUM"
            const entry = trimmed.replace(/^(?:Leader|Base):\s*/, '');
            const match = entry.match(CARD_INDEX_REGEX);
            if (match) {
                const name = match[1].trim();
                const id = match[2];
                // First name wins (decklist lists each id once; leaders/bases first).
                if (!cardNames[id]) cardNames[id] = name;
            }
            continue;
        }

        if (section === 'replay') {
            if (!trimmed) continue;

            if (trimmed.includes('snapshot')) {
                // Server emits ".snapshot" (e.g., "R1.A.snapshot"), also accept
                // "-snapshot" for forward compatibility.
                const seqMatch = trimmed.match(/"seq"\s*:\s*"([^"]*[.\-]snapshot)"/);
                if (seqMatch) {
                    snapshots.push({
                        seq: seqMatch[1],
                        rawJson: trimmed,
                        snapshot: null as any,
                    });
                    continue;
                }
            }

            try {
                const parsed = JSON.parse(trimmed);
                events.push(parsed as ReplayEvent);
            } catch {
                // Skip malformed lines
            }
            continue;
        }
    }

    return {
        header,
        events,
        snapshots,
        cardNames,
    };
}
