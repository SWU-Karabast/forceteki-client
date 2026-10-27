/** The parts of a browser tab (a `window.open` result) the Watch Replay flow uses. */
export interface ReplayTab {
    location: { href: string };
    close(): void;
    opener: unknown;
    document?: { title: string; body: { style: { cssText: string }; textContent: string | null } | null };
}

/**
 * Open the tab the replay will show in, NOW, inside the click: a popup blocker refuses one opened
 * after the server answers. It is about:blank (same origin) until the file arrives, so it says
 * it is loading instead of sitting blank. Null when the browser blocked it.
 */
export function openLoadingTab(open: (url: string, target: string) => ReplayTab | null): ReplayTab | null {
    const tab = open('', '_blank');
    if (!tab) return null;
    try {
        if (tab.document) {
            tab.document.title = 'Loading replay…';
            const body = tab.document.body;
            if (body) {
                body.style.cssText = 'margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0f16;color:#fff;font:600 1rem Arial,sans-serif';
                body.textContent = 'Loading replay…';
            }
        }
    } catch {
        // A browser that does not hand back the blank tab's document: it stays blank, still works.
    }
    tab.opener = null;
    return tab;
}

/**
 * Fetch the game's file, store it, and point the tab at the viewer. Any failure (no file, the
 * server's error, no answer, a file the viewer refuses, storage failing) closes the tab, so no
 * blank tab is left behind, and is rethrown for the caller to show.
 */
export async function showReplayInTab(
    tab: ReplayTab,
    fetchFile: () => Promise<string>,
    store: (raw: string) => Promise<{ id: string }>,
): Promise<void> {
    try {
        const { id } = await store(await fetchFile());
        tab.location.href = `/Replay?id=${id}`;
    } catch (err) {
        tab.close();
        throw err;
    }
}
