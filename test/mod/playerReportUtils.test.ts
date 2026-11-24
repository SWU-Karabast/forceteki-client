import { describe, expect, it } from 'vitest';
import { ModerationStanding } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { daysSince, formatAccountAge, mostSevereStanding } from '@/app/_utils/playerReportUtils';

const NOW = Date.UTC(2026, 10, 24, 12);
const daysAgo = (days: number) => new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();

describe('formatAccountAge', () => {
    it.each([
        [0, 'today'],
        [1, '1 day'],
        [59, '59 days'],
        [60, '2 months'],
        [400, '13 months'],
        [730, '2 years'],
    ])('describes an account created %i days ago as %s', (days, expected) => {
        expect(formatAccountAge(daysAgo(days), NOW)).toBe(expected);
    });

    it('returns nothing for players without a creation date', () => {
        expect(formatAccountAge(undefined, NOW)).toBe('');
        expect(formatAccountAge('not a date', NOW)).toBe('');
    });
});

describe('daysSince', () => {
    it('counts whole days and never goes negative for dates slightly in the future', () => {
        expect(daysSince(daysAgo(3.5), NOW)).toBe(3);
        expect(daysSince(new Date(NOW + 60_000).toISOString(), NOW)).toBe(0);
        expect(daysSince(undefined, NOW)).toBeNull();
    });
});

describe('mostSevereStanding', () => {
    it('calls out an active record over a past one over a clean one', () => {
        expect(mostSevereStanding([ModerationStanding.Clean, ModerationStanding.Active, ModerationStanding.History])).toBe(ModerationStanding.Active);
        expect(mostSevereStanding([ModerationStanding.Clean, ModerationStanding.History])).toBe(ModerationStanding.History);
        expect(mostSevereStanding([])).toBe(ModerationStanding.Clean);
    });
});
