import { describe, it, expect } from 'vitest';
import { statOf } from '../swupgnCardStats';

describe('statOf', () => {
    const map = { 'LOF#164': { power: 4, hp: 5 }, 'TOKEN:X-Wing': { type: 'token', id: '9415311381', power: 2, hp: 3 } };
    it('resolves SET#NUM[:copy] and a current-format token id by its numeric art id', () => {
        expect(statOf('LOF#164:2', map)).toEqual({ power: 4, hp: 5 });
        expect(statOf('TOKEN:x-wing#9415311381:2', map)).toEqual(map['TOKEN:X-Wing']);
        expect(statOf('TOKEN:X-Wing:2', map)).toEqual(map['TOKEN:X-Wing']);
        expect(statOf('TOKEN:unknown#1', map)).toBeUndefined();
    });
});

