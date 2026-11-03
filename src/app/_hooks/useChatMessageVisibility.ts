import { RefObject, useEffect } from 'react';
import { IChatEntry } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';

interface IUseChatMessageVisibilityOptions {
    chatBoxRef: RefObject<HTMLDivElement>;
    chatHistory: IChatEntry[];
    isVisible: boolean;
    unreadMessageIndices?: ReadonlySet<number>;
    onMessagesRead?: (indices: number[]) => void;
}

export const useChatMessageVisibility = ({
    chatBoxRef,
    chatHistory,
    isVisible,
    unreadMessageIndices,
    onMessagesRead,
}: IUseChatMessageVisibilityOptions) => {
    useEffect(() => {
        const chatBox = chatBoxRef.current;
        if (!chatBox || !isVisible || !onMessagesRead || !unreadMessageIndices?.size) return;

        let observer: IntersectionObserver | undefined;
        let disposed = false;
        const observeUnreadMessages = () => {
            observer?.disconnect();
            if (document.visibilityState !== 'visible') return;

            const currentObserver = new IntersectionObserver(entries => {
                if (disposed || observer !== currentObserver || document.visibilityState !== 'visible') return;

                const visibleIndices = entries
                    .filter(entry => entry.isIntersecting && entry.intersectionRatio >= 0.01
                        && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0)
                    .map(entry => Number((entry.target as HTMLElement).dataset.chatMessageIndex));
                if (visibleIndices.length > 0) {
                    onMessagesRead(visibleIndices);
                }
            }, { root: chatBox, threshold: 0.01 });
            observer = currentObserver;

            chatBox.querySelectorAll<HTMLElement>('[data-chat-message-index]').forEach(element => {
                if (unreadMessageIndices.has(Number(element.dataset.chatMessageIndex))) {
                    currentObserver.observe(element);
                }
            });
        };

        observeUnreadMessages();
        document.addEventListener('visibilitychange', observeUnreadMessages);
        return () => {
            disposed = true;
            observer?.disconnect();
            document.removeEventListener('visibilitychange', observeUnreadMessages);
        };
    }, [chatBoxRef, chatHistory, isVisible, unreadMessageIndices, onMessagesRead]);
};
