import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
    IPlayerReportPlayerContext,
    ModActionType,
    ModerationStanding,
    PlayerReportRole,
    PlayerReportStatus,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { DateFormat } from '@/app/_contexts/UserTypes';
import ReportPlayerPanel from '@/app/mod/subpages/reports/ReportPlayerPanel';

vi.mock('@/app/_hooks/useDateFormat', () => ({ useDateFormat: () => DateFormat.DDMMYYYY }));

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const context = (overrides: Partial<IPlayerReportPlayerContext> = {}): IPlayerReportPlayerContext => ({
    playerId: 'player-1',
    username: 'Offender',
    createdAt: daysAgo(400),
    lastLogin: daysAgo(0.1),
    isMuted: false,
    standing: ModerationStanding.Clean,
    sameUsername: { total: 0, accounts: [] },
    activeRename: null,
    activeReportingDisabledId: null,
    activeUsernameChangesBlockedId: null,
    modActions: [],
    usernameChanges: [],
    reportsAgainst: [],
    reportsFiled: [],
    ...overrides,
});

const renderPanel = (playerContext: IPlayerReportPlayerContext) => render(
    <ReportPlayerPanel
        roleLabel="Reported Player"
        context={playerContext}
        usernameAtReport={playerContext.username}
        selected={false}
        onSelect={() => {}}
        onOpenProfile={() => {}}
    />
);

describe('ReportPlayerPanel', () => {
    it.each([
        [ModerationStanding.Active, 'rgb(239, 83, 80)'],
        [ModerationStanding.History, 'rgb(255, 213, 79)'],
        [ModerationStanding.Clean, 'rgb(129, 199, 132)'],
    ])('colors the name by the player\'s %s standing', (standing, color) => {
        renderPanel(context({ standing }));

        expect(getComputedStyle(screen.getByText('Offender')).color).toBe(color);
    });

    it('shows the account age and last login, and flags new accounts', () => {
        const { unmount } = renderPanel(context());
        expect(screen.getByText(/Account 13 months old · last login/)).toBeTruthy();
        unmount();

        renderPanel(context({ createdAt: daysAgo(2) }));
        expect(screen.getByText(/Account 2 days old \(new\)/)).toBeTruthy();
    });

    it('calls out other accounts with the same name and the worst record among them', () => {
        renderPanel(context({
            sameUsername: {
                total: 3,
                accounts: [
                    { playerId: 'a', username: 'offender', createdAt: daysAgo(10), lastLogin: daysAgo(1), standing: ModerationStanding.History },
                    { playerId: 'b', username: 'Offender', createdAt: daysAgo(20), lastLogin: daysAgo(2), standing: ModerationStanding.Clean },
                ],
            },
        }));

        expect(screen.getByText('3 other accounts with this name (past mute or forced rename)')).toBeTruthy();
    });

    it('says so when the same-name check failed instead of hiding it', () => {
        renderPanel(context({ sameUsername: null }));

        expect(screen.getByText('Same-name check failed')).toBeTruthy();
    });

    it('shows the profile with ID, history and reports when hovering the name', async () => {
        renderPanel(context({
            standing: ModerationStanding.History,
            modActions: [{
                id: 'm1', playerId: 'player-1', actionType: ModActionType.Mute, durationDays: 7, moderatorId: 'mod', moderatorUsername: 'ModAlice',
                createdAt: daysAgo(30), startedAt: daysAgo(30), expiresAt: daysAgo(23),
            }],
            reportsAgainst: [{
                reportId: 'r1', playerId: 'player-1', role: PlayerReportRole.ReportedPlayer, createdAt: daysAgo(1), offense: 'chatHarassment', status: PlayerReportStatus.Open,
            }],
        }));

        fireEvent.mouseOver(screen.getByText('Offender'));

        expect(await screen.findByText('Player ID: player-1')).toBeTruthy();
        expect(screen.getByText('Past mute or forced rename')).toBeTruthy();
        expect(screen.getByText(/Muted \(1 week\)/)).toBeTruthy();
        expect(screen.getByText('1 against · 0 filed')).toBeTruthy();
        expect(screen.getByText('No other account uses this name.')).toBeTruthy();
    });
});
