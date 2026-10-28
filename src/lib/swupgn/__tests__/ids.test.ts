import { describe, it, expect } from 'vitest';
import { engineProduct, PILOT_WRITER_PRODUCTS, TOKEN_ID, TOKEN_NAME, tokenName, tokenNameOf } from '../index';

// Ported from forceteki test/server/swupgn/tokenNames.spec.ts and validate.spec.ts at a2c013963.
// The card-data case is not ported: the client has no card JSON to check against.
describe('SWU-PGN token names (spec 6.1)', () => {
    it('derives the name from the printed title', () => {
        const table: [string, string][] = [
            ['X-Wing', 'xwing'],
            ['TIE Fighter', 'tie-fighter'],
            ['The Force', 'the-force'],
            ['Battle Droid', 'battle-droid'],
            ['Chirrut \u00CEmwe', 'chirrut-imwe'],
            ['  Clone   Trooper ', 'clone-trooper'],
            ['Spy', 'spy'],
            ['Death Star\'s Beam', 'death-stars-beam'],
        ];
        for (const [title, name] of table) {
            expect(tokenName(title)).toBe(name);
            expect(TOKEN_NAME.test(name)).toBe(true);
        }
    });

    it('matches the id grammar', () => {
        expect(TOKEN_ID.test('TOKEN:xwing#9415311381:2')).toBe(true);
        expect(TOKEN_ID.test('TOKEN:credit')).toBe(true);
        expect(TOKEN_ID.test('TOKEN:X-Wing#1')).toBe(false);
        expect(TOKEN_ID.test('TOKEN:advantage#5844562972:1')).toBe(false);
        expect(TOKEN_ID.test('TOKEN:weakness#weakness-id')).toBe(false);
    });

    // Value: protects=one definition of a token id's name part, shared by the fold and the validator (spec 6.1); fails_when=the copy suffix or the card id is left on the name, or a non-token id gets a name; why_new=fold and validate each matched Credit with their own pattern and disagreed; seam=none; no_claim=whether the id is well-formed
    it('reads the name part of a token id, with the copy suffix and card id stripped', () => {
        expect(tokenNameOf('TOKEN:credit')).toBe('credit');
        expect(tokenNameOf('TOKEN:credit:2')).toBe('credit');
        expect(tokenNameOf('TOKEN:credit#8015500527')).toBe('credit');
        expect(tokenNameOf('TOKEN:credit#8015500527:12')).toBe('credit');
        expect(tokenNameOf('TOKEN:the-force#4571900905')).toBe('the-force');
        expect(tokenNameOf('TOKEN:credit:1')).not.toBe('credit');
        expect(tokenNameOf('SOR#095')).toBeUndefined();
        expect(tokenNameOf('base@1')).toBeUndefined();
    });
});

describe('engineProduct and the pilot writer registry (spec §25)', () => {
    it('is the text before the first @, or the whole value', () => {
        expect(engineProduct('forceteki@a@b')).toBe('forceteki');
        expect(engineProduct('forceteki@0064257c0')).toBe('forceteki');
        expect(engineProduct('forceteki')).toBe('forceteki');
        expect(engineProduct('examplewriter@1.0.0')).toBe('examplewriter');
        expect(engineProduct('')).toBe('');
    });

    it('lists forceteki alone, compared exactly, case included', () => {
        expect([...PILOT_WRITER_PRODUCTS]).toEqual(['forceteki']);
        expect(PILOT_WRITER_PRODUCTS.has(engineProduct('forceteki@abc'))).toBe(true);
        expect(PILOT_WRITER_PRODUCTS.has(engineProduct('Forceteki@abc'))).toBe(false);
        expect(PILOT_WRITER_PRODUCTS.has(engineProduct('examplewriter@1.0.0'))).toBe(false);
        expect(PILOT_WRITER_PRODUCTS.has(engineProduct('forceteki'))).toBe(true);
    });
});
