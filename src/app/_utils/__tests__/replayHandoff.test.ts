import { describe, it, expect } from 'vitest';
import { replayUrl } from '../replayHandoff';

describe('replayUrl', () => {
    it('keeps only t/from/to and adds no separator when there are none', () => {
        expect(replayUrl('abc', new URLSearchParams('t=R1.A.2&x=1'))).toBe('/Replay?id=abc&t=R1.A.2');
        expect(replayUrl('abc', new URLSearchParams('from=3&to=9'))).toBe('/Replay?id=abc&from=3&to=9');
        expect(replayUrl('abc', new URLSearchParams(''))).toBe('/Replay?id=abc');
    });
    it('encodes the id and the kept values', () => {
        expect(replayUrl('a b', new URLSearchParams([['t', 'R1 A']]))).toBe('/Replay?id=a%20b&t=R1+A');
    });
});
