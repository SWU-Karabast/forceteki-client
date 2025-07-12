import { useCallback, useRef, useMemo } from 'react';
import { IUser } from '@/app/_contexts/UserTypes';
import {
    loadPreferencesFromLocalStorage,
} from '@/app/_utils/ServerAndLocalStorageUtils';

export type SoundAction =
    | 'foundOpponent'
    | 'incomingMessage'
    | 'statefulPromptResults'
    | 'cardClicked'
    | 'menuButton'
    | 'perCardMenuButton'
    | 'yourTurn';

interface SoundHandlerOptions {
    enabled?: boolean;
    user?: IUser | null;
}

export const useSoundHandler = (options: SoundHandlerOptions = {}) => {
    const {
        enabled = true,
        user,
    } = options;

    // Store audio objects and last play time for incomingMessage only
    const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
    const lastIncomingMessageTime = useRef<number>(0);
    const currentR2SoundIndex = useRef<number>(0);
    const r2BeepSounds = useMemo(() => [
        '/r2beep01.mp3',
        '/r2beep02.mp3',
        '/r2beep03.mp3',
        '/r2beep04.mp3',
        '/r2beep05.mp3',
        '/r2beep06.mp3',
        '/r2beep07.mp3',
        '/r2beep08.mp3',
        '/r2beep09.mp3',
        '/r2beep10.mp3',
        '/r2beep11.mp3',
        '/r2beep12.mp3',
        '/r2beep13.mp3',
        '/r2beep14.mp3',
        '/r2beep15.mp3'
    ], []);
    // Get preferences based on user type
    const getPreferences = () => {
        if (user?.authenticated) {
            return user.preferences;
        } else {
            // Load from localStorage for anonymous users
            return loadPreferencesFromLocalStorage();
        }
    };

    /**
     * Gets the volume from localStorage (device-specific setting)
     * @returns Volume level between 0 and 1, defaults to 0.75
     */
    const getVolumeFromLocalStorage = (): number => {
        try {
            const storedVolume = localStorage.getItem('karabast_volume');
            if (storedVolume !== null) {
                const volume = parseFloat(storedVolume);
                // Ensure it's a valid number between 0 and 1
                if (!isNaN(volume) && volume >= 0 && volume <= 1) {
                    return volume;
                }else{
                    return 0.75
                }
            }else{
                return 0.75
            }
        } catch (error) {
            console.warn('Error reading volume from localStorage:', error);
        }
        return 0.75;
    };

    /**
     * Saves the volume to localStorage (device-specific setting)
     * @param volume Volume level between 0 and 1
     */
    const saveVolumeToLocalStorage = (volume: number): void => {
        try {
            // Clamp volume between 0 and 1
            const clampedVolume = Math.max(0, Math.min(1, volume));
            localStorage.setItem('karabast_volume', clampedVolume.toString());
        } catch (error) {
            console.warn('Error saving volume to localStorage:', error);
        }
    };


    // Sound configuration mapping - just to the source files
    const soundConfigs = useMemo<Record<SoundAction, string>>(() => ({
        foundOpponent: '/HelloThere.mp3',
        incomingMessage: '/r2beep01.mp3',
        statefulPromptResults: '/click1.mp3',
        cardClicked: '/click1.mp3',
        menuButton: '/click1.mp3',
        perCardMenuButton: '/click1.mp3',
        yourTurn: '/HelloThere.mp3',
    }), []);

    const getNextR2Sound = useCallback((): string => {
        const currentSound = r2BeepSounds[currentR2SoundIndex.current];
        // Move to next sound, wrapping around to 0 if we reach the end
        currentR2SoundIndex.current = (currentR2SoundIndex.current + 1) % r2BeepSounds.length;
        return currentSound;
    }, [r2BeepSounds]);

    const getAudioObject = (src: string): HTMLAudioElement | null => {
        const existingAudio = audioRefs.current.get(src);
        const volume = getVolumeFromLocalStorage();
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
    };

    // Main function to play sounds
    const playSound = useCallback((action: SoundAction) => {
        const preferences = getPreferences().sound;
        if (!enabled || preferences?.muteAllSound) {
            return;
        }
        // Check specific action mutes
        const actionMutes = {
            cardClicked: preferences?.muteCardAndButtonClickSound,
            menuButton: preferences?.muteCardAndButtonClickSound,
            yourTurn: preferences?.muteYourTurn,
            perCardMenuButton: preferences?.muteCardAndButtonClickSound,
            statefulPromptResults: preferences?.muteCardAndButtonClickSound,
            incomingMessage: preferences?.muteChatSound,
            foundOpponent: preferences?.muteOpponentFoundSound,
        };

        if (actionMutes[action]) {
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

        let src: string;
        if (action === 'incomingMessage') {
            src = getNextR2Sound();
        } else {
            src = soundConfigs[action];
        }
        if (!src) {
            console.warn(`No sound configuration found for action: ${action}`);
            return;
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
        isEnabled: enabled,
        getVolumeFromLocalStorage,
        saveVolumeToLocalStorage,
    };
};