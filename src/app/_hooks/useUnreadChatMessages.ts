import { useCallback, useMemo, useState } from 'react';
import { IChatEntry } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';

export const useUnreadChatMessages = (
    messages: IChatEntry[],
    gameId: string,
    opponentId: string,
) => {
    const scope = JSON.stringify([gameId, opponentId]);
    const [readState, setReadState] = useState<{ scope: string; indices: Set<number> }>(() => ({
        scope,
        indices: new Set(),
    }));

    // The server assigns stable log indices, including gaps filled by retransmits.
    // Keep read state outside Chat so closing the mobile drawer cannot reset it.
    const unreadMessageIndices = useMemo(() => {
        const unread = new Set<number>();
        if (!opponentId) return unread;

        messages.forEach((entry, index) => {
            const sender = Array.isArray(entry?.message) ? entry.message[0] : undefined;
            if (sender && typeof sender === 'object' && sender.type === 'playerChat'
                && sender.id === opponentId
                && (readState.scope !== scope || !readState.indices.has(index))) {
                unread.add(index);
            }
        });
        return unread;
    }, [messages, opponentId, readState, scope]);

    const markMessagesRead = useCallback((indices: number[]) => {
        setReadState(previous => {
            const next = new Set(previous.scope === scope ? previous.indices : []);
            let changed = previous.scope !== scope;
            for (const index of indices) {
                if (unreadMessageIndices.has(index) && !next.has(index)) {
                    next.add(index);
                    changed = true;
                }
            }
            return changed ? { scope, indices: next } : previous;
        });
    }, [scope, unreadMessageIndices]);

    return { unreadMessageIndices, markMessagesRead };
};
