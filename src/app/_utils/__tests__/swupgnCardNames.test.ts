import { describe, it, expect } from 'vitest';
import { makeNameResolver } from '../swupgnCardNames';

describe('makeNameResolver', () => {
    it('resolves a known id to its name', () => {
        const r = makeNameResolver({ 'SOR#010': 'Darth Vader' });
        expect(r.nameOf('SOR#010')).toBe('Darth Vader');
    });

    it('strips the :copy suffix before lookup', () => {
        const r = makeNameResolver({ 'SHD#257': 'Battlefield Marine' });
        expect(r.nameOf('SHD#257:3')).toBe('Battlefield Marine');
    });

    it('falls back to the raw id when unknown', () => {
        const r = makeNameResolver({});
        expect(r.nameOf('LOF#164')).toBe('LOF#164');
    });

    it('handles TOKEN: refs by showing the token label', () => {
        const r = makeNameResolver({});
        expect(r.nameOf('TOKEN:Experience')).toBe('Experience');
    });
});
