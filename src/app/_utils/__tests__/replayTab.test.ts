import { describe, it, expect, vi } from 'vitest';
import { openLoadingTab, showReplayInTab, type ReplayTab } from '../replayTab';

const fakeTab = (): ReplayTab & { close: ReturnType<typeof vi.fn> } => ({
    location: { href: '' },
    close: vi.fn(),
    opener: {},
    document: { title: '', body: { style: { cssText: '' }, textContent: '' } },
});

// Value: protects=Watch Replay opens its tab inside the click with a loading message and no opener, and a blocked popup is reported, not ignored; fails_when=the tab is opened later (popup blockers refuse it) or left blank; why_new=the flow lived inside the component with no test; seam=none (window.open passed in); no_claim=a real browser's popup blocker
describe('openLoadingTab', () => {
    it('opens a blank tab that says it is loading, with no opener', () => {
        const tab = fakeTab();
        const open = vi.fn(() => tab);
        expect(openLoadingTab(open)).toBe(tab);
        expect(open).toHaveBeenCalledWith('', '_blank');
        expect(tab.document!.title).toBe('Loading replay…');
        expect(tab.document!.body!.textContent).toBe('Loading replay…');
        expect(tab.opener).toBeNull();
    });
    it('returns null when the browser blocked it, and tolerates a tab with no document', () => {
        expect(openLoadingTab(() => null)).toBeNull();
        const bare = { ...fakeTab(), document: undefined };
        expect(openLoadingTab(() => bare)).toBe(bare);
    });
});

// Value: protects=the tab goes to the stored replay on success, and on ANY failure (no file, a refused file, storage failing) it is closed and the error reaches the caller; fails_when=a failure leaves a blank tab open, or navigates it anyway; why_new=same; seam=none (fetch and store passed in); no_claim=the viewer page that loads the id
describe('showReplayInTab', () => {
    it('navigates the tab to the stored replay', async () => {
        const tab = fakeTab();
        const store = vi.fn(async () => ({ id: 'abc' }));
        await showReplayInTab(tab, async () => '%%% HEADER', store);
        expect(store).toHaveBeenCalledWith('%%% HEADER');
        expect(tab.location.href).toBe('/Replay?id=abc');
        expect(tab.close).not.toHaveBeenCalled();
    });
    it('closes the tab and rethrows when the file never came or could not be stored', async () => {
        for (const [fetchFile, store] of [
            [async () => { throw new Error('no file'); }, async () => ({ id: 'x' })],
            [async () => 'raw', async () => { throw new Error('too large to show'); }],
        ] as const) {
            const tab = fakeTab();
            await expect(showReplayInTab(tab, fetchFile, store)).rejects.toThrow();
            expect(tab.close).toHaveBeenCalledTimes(1);
            expect(tab.location.href).toBe('');
        }
    });
});
