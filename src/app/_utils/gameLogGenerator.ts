import { IChatEntry, IChatMessageContent } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';

/**
 * Flattens a serialized game message into plain text.
 * Client-side port of server-side SwuPgn.flattenMessage.
 */
function flattenMessage(message: unknown): string {
    if (message == null) return '';
    if (typeof message === 'string') return message;
    if (typeof message === 'number') return String(message);

    if (Array.isArray(message)) {
        return message.map((part) => flattenMessage(part)).join('');
    }

    if (typeof message === 'object') {
        const obj = message as Record<string, any>;
        if ('alert' in obj && obj.alert != null) {
            return flattenMessage(obj.alert.message);
        }
        if ('title' in obj && obj.title != null) {
            return obj.subtitle ? `${obj.title}, ${obj.subtitle}` : obj.title;
        }
        if ('name' in obj && obj.name != null) {
            return String(obj.name);
        }
    }

    return '';
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function anonymizePlayers(text: string, player1Name: string, player2Name: string): string {
    let result = text;
    result = result.replace(new RegExp(`${escapeRegex(player1Name)}'s`, 'g'), "P1's");
    result = result.replace(new RegExp(`${escapeRegex(player2Name)}'s`, 'g'), "P2's");
    result = result.replace(new RegExp(escapeRegex(player1Name), 'g'), 'P1');
    result = result.replace(new RegExp(escapeRegex(player2Name), 'g'), 'P2');
    return result;
}

function isPlayerChat(message: IChatMessageContent): boolean {
    return Array.isArray(message) && message.length > 0 && (message[0] as any)?.type === 'playerChat';
}

/**
 * Generates human-readable game notation from chat entries.
 * This is a client-side fallback; the server generates the authoritative version
 * with full card subtitles.
 */
export function generateHumanNotation(entries: IChatEntry[], player1Name: string, player2Name: string): string {
    const lines: string[] = [];
    for (const entry of entries) {
        if (isPlayerChat(entry.message)) continue;
        const text = flattenMessage(entry.message);
        if (text) {
            lines.push(anonymizePlayers(text, player1Name, player2Name));
        }
    }
    return lines.join('\n');
}
