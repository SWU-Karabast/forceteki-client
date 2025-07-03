import { useCallback, useRef, useMemo } from 'react';
import { IUser } from '@/app/_contexts/UserTypes';

export type SoundAction =
    | 'foundOpponent'
    | 'incomingMessage'
    | 'statefulPromptResults'
    | 'cardClicked'
    | 'menuButton'
    | 'perCardMenuButton';

interface SoundHandlerOptions {
    enabled?: boolean;
    user?: IUser;
}

export const useSoundHandler = (options: SoundHandlerOptions = {}) => {
    const {
        enabled = true,
        user,
    } = options;

    // Store audio objects and last play time for incomingMessage only
    const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
    const lastIncomingMessageTime = useRef<number>(0);

    // Get preferences based on user type
    const getPreferences = () => {
        if (user?.authenticated) {
            return user.preferences;
        } else {
            // Load from localStorage for anonymous users
            return loadPreferencesFromLocalStorage();
        }
    };


    const preferences = getPreferences();
    const volume = preferences.volume !== undefined ? preferences.volume : 0.75;


    // Sound configuration mapping - just to the source files
    const soundConfigs = useMemo<Record<SoundAction, string>>(() => ({
        foundOpponent: '/HelloThere.mp3',
        incomingMessage: '/click1.mp3',
        statefulPromptResults: '/click1.mp3',
        cardClicked: '/click1.mp3',
        menuButton: '/click1.mp3',
        perCardMenuButton: '/click1.mp3'
    }), []);

    const getAudioObject = useCallback((src: string): HTMLAudioElement | null => {
        const existingAudio = audioRefs.current.get(src);
        if (existingAudio) {
            return existingAudio;
        }

        try {
            const audio = new Audio(src);
            audio.volume = volume;
            audioRefs.current.set(src, audio);
            return audio;
        } catch (error) {
            console.warn(`Failed to create audio object for ${src}:`, error);
            return null;
        }
    }, [volume]);

    // Main function to play sounds
    const playSound = useCallback((action: SoundAction) => {
        if (!enabled || preferences.muteAllSound) {
            return;
        }
        // Check specific action mutes
        const actionMutes = {
            cardClicked: preferences.muteCardClickSound,
            menuButton: preferences.muteMenuButtonsSound,
            perCardMenuButton: preferences.muteMenuButtonsSound,
            statefulPromptResults: preferences.muteMenuButtonsSound,
            incomingMessage: preferences.muteChatSound,
            foundOpponent: preferences.muteOpponentFoundSound,
        };

        if (actionMutes[action]) {
            return;
        }


        const src = soundConfigs[action];
        if (!src) {
            console.warn(`No sound configuration found for action: ${action}`);
            return;
        }

        // Special handling for incomingMessage cooldown
        if (action === 'incomingMessage') {
            const now = Date.now();
            if (now - lastIncomingMessageTime.current < 100) {
                return; // 100ms cooldown
            }
            lastIncomingMessageTime.current = now;
        }

        const audio = getAudioObject(src);
        if (!audio) {
            return;
        }

        try {
            audio.currentTime = 0;
            audio.play().catch((error) => {
                console.warn(`Failed to play sound for action ${action}:`, error);
            });
        } catch (error) {
            console.warn(`Error playing sound for action ${action}:`, error);
        }
    }, [enabled, soundConfigs, getAudioObject]);

    // Convenience methods for specific actions if needed
    const playFoundOpponentSound = useCallback(() => playSound('foundOpponent'), [playSound]);
    const playIncomingMessageSound = useCallback(() => playSound('incomingMessage'), [playSound]);
    const playInteractionSound = useCallback((action: Extract<SoundAction, 'cardClicked' | 'menuButton' | 'perCardMenuButton' | 'statefulPromptResults'>) => {
        playSound(action);
    }, [playSound]);


    return {
        playSound,
        playFoundOpponentSound,
        playIncomingMessageSound,
        playInteractionSound,
        getPreferences,
        isEnabled: enabled
    };
};