import { DefaultMatchPreferences, MATCH_PREFERENCES_LOCALSTORAGE_KEY, MatchPreferences } from '@/app/_constants/constants';

export function loadMatchPreferences(): MatchPreferences {
    if (typeof window === 'undefined') {
        return DefaultMatchPreferences;
    }
    try {
        const stored = window.localStorage.getItem(MATCH_PREFERENCES_LOCALSTORAGE_KEY);
        if (!stored) {
            return DefaultMatchPreferences;
        }
        const parsed = JSON.parse(stored);
        if (
            parsed &&
            typeof parsed === 'object' &&
            typeof parsed.enabled === 'boolean' &&
            Array.isArray(parsed.allowedArchetypes)
        ) {
            return parsed as MatchPreferences;
        }
    } catch {
        // Malformed localStorage entry; fall through to default.
    }
    return DefaultMatchPreferences;
}

export function saveMatchPreferences(prefs: MatchPreferences): void {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(MATCH_PREFERENCES_LOCALSTORAGE_KEY, JSON.stringify(prefs));
    } catch {
        // Quota / private mode — best-effort.
    }
}
