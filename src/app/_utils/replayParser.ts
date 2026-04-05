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
    cardIndex: string;
    events: ReplayEvent[];
    snapshots: ReplaySnapshot[];
}

const CARD_INDEX_SEPARATOR = '═══ CARD INDEX ═══';
const REPLAY_SEPARATOR = '=== REPLAY ===';
const HEADER_TAG_REGEX = /^\[(\w+)\s+"(.*)"\]$/;

export function parseReplayFile(content: string): ParsedReplay {
    const lines = content.split('\n');
    const header: Record<string, string> = {};
    const cardIndexLines: string[] = [];
    const events: ReplayEvent[] = [];
    const snapshots: ReplaySnapshot[] = [];

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
            if (trimmed) {
                cardIndexLines.push(line);
            }
            continue;
        }

        if (section === 'replay') {
            if (!trimmed) continue;

            if (trimmed.includes('-snapshot')) {
                const seqMatch = trimmed.match(/"seq"\s*:\s*"([^"]+)"/);
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
        cardIndex: cardIndexLines.join('\n'),
        events,
        snapshots,
    };
}

export async function parseReplayFromZip(zipData: ArrayBuffer): Promise<ParsedReplay> {
    const { unzipSync, strFromU8 } = await import('fflate');
    const unzipped = unzipSync(new Uint8Array(zipData));

    const replayFilename = Object.keys(unzipped).find((name) => name.endsWith('.swureplay'));
    if (!replayFilename) {
        throw new Error('No .swureplay file found in zip');
    }

    const content = strFromU8(unzipped[replayFilename]);
    return parseReplayFile(content);
}
