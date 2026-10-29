import { useCallback, useEffect, useMemo, useState } from 'react';
import { IChatEntry } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';

export const useUnreadChatMessages = (
    messages: IChatEntry[],
    gameId: string,
    opponentId: string,
    isChatVisible: boolean,
) => {
    const scope = JSON.stringify([gameId, opponentId]);
    const [readState, setReadState] = useState<{ scope: string; indices: Set<number> }>(() => ({
        scope,
        indices: new Set(),
    }));
    const [dividerState, setDividerState] = useState<{ scope: string; index: number | null }>({
        scope,
        index: null,
    });

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

    const firstUnreadIndex = unreadMessageIndices.values().next().value ?? null;
    useEffect(() => {
        setDividerState(previous => {
            // Preserve the boundary while reading, even after visibility clears the badge.
            // Closing the drawer prepares the boundary for the next unread group.
            const index = !isChatVisible || previous.scope !== scope || previous.index === null
                ? firstUnreadIndex
                : firstUnreadIndex === null ? previous.index : Math.min(previous.index, firstUnreadIndex);
            return previous.scope === scope && previous.index === index ? previous : { scope, index };
        });
    }, [firstUnreadIndex, isChatVisible, scope]);

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

    const unreadDividerIndex = dividerState.scope === scope ? dividerState.index ?? firstUnreadIndex : firstUnreadIndex;
    return { unreadMessageIndices, unreadDividerIndex, markMessagesRead };
};
