import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from '@/app/_utils/randomUUID';

describe('randomUUID', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('uses the native UUID generator when available', () => {
        const uuid = '00112233-4455-4677-8899-aabbccddeeff';
        const nativeRandomUUID = vi.fn(() => uuid);
        vi.stubGlobal('crypto', { randomUUID: nativeRandomUUID });

        expect(randomUUID()).toBe(uuid);
        expect(nativeRandomUUID).toHaveBeenCalledOnce();
    });

    it.each([
        [0x00, '00000000-0000-4000-8000-000000000000'],
        [0xff, 'ffffffff-ffff-4fff-bfff-ffffffffffff'],
    ])('creates a valid v4 UUID without randomUUID (random byte %i)', (byte, expected) => {
        const getRandomValues = vi.fn((bytes: Uint8Array) => bytes.fill(byte));
        vi.stubGlobal('crypto', { getRandomValues });

        expect(randomUUID()).toBe(expected);
        expect(getRandomValues).toHaveBeenCalledOnce();
        expect(getRandomValues.mock.calls[0][0]).toHaveLength(16);
    });
});
