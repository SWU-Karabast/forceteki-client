import { describe, it, expect } from 'vitest';
import { readPrefs, writePrefs, DEFAULT_PREFS } from '../replayPrefs';

describe('replayPrefs', () => {
    it('round-trips', () => expect(readPrefs(writePrefs({ speed: 1.5, stepBy: 'record', animate: false }))).toEqual({ speed: 1.5, stepBy: 'record', animate: false }));
    it('falls back per field on junk', () => {
        expect(readPrefs(null)).toEqual(DEFAULT_PREFS);
        expect(readPrefs('{"speed":99,"stepBy":"x","animate":"no"}')).toEqual(DEFAULT_PREFS);
        expect(readPrefs('not json')).toEqual(DEFAULT_PREFS);
    });
});
