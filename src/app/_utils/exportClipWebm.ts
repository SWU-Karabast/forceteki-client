import type { SwuPgnDocument, ReducedState, Seat } from '@/lib/swupgn';
import { fold } from '@/lib/swupgn';

// P4 heavy stretch: export a clip [start,end] as a real downloadable .webm. We CANNOT
// capture the live DOM board to a canvas — the card images come from an S3 bucket with no
// CORS header, so a DOM->canvas snapshot taints the canvas and captureStream()/toBlob()
// throw a SecurityError. Instead we render our OWN clean scoreboard view of each frame's
// ReducedState onto a canvas (text + shapes only, zero cross-origin pixels) and record it
// with the browser-native MediaRecorder. No gif encoder dependency; webm is native.

export interface ClipExportOpts {
    doc: SwuPgnDocument;
    start: number;
    end: number;
    // seq -> human move label (from the move list), for the action caption.
    labelForSeq: (seq: string) => string | undefined;
    nameOf: (id: string) => string;
    // Hold each game frame on screen this long (default 700ms) so the clip is watchable.
    msPerFrame?: number;
}

const W = 1280;
const H = 720;

function drawFrame(
    ctx: CanvasRenderingContext2D,
    state: ReducedState,
    header: SwuPgnDocument['header'],
    nameOf: (id: string) => string,
    caption: string,
    frameNo: number,
    total: number,
): void {
    ctx.fillStyle = '#0c0f16';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    const p1 = header.p1 || 'Player 1';
    const p2 = header.p2 || 'Player 2';
    ctx.fillText(`${p1}  vs  ${p2}`, W / 2, 60);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '20px sans-serif';
    ctx.fillText(`${nameOf(header.p1Leader)}   ·   ${nameOf(header.p2Leader)}`, W / 2, 92);
    ctx.fillStyle = '#00baff';
    ctx.font = 'bold 22px sans-serif';
    const roundLabel = state.round === 0 ? 'Setup' : `Round ${state.round}`;
    ctx.fillText(`${roundLabel} · ${state.phase}`, W / 2, 132);

    // Per-player columns
    const cols: { seat: Seat; x: number; name: string }[] = [
        { seat: 1, x: W * 0.27, name: p1 },
        { seat: 2, x: W * 0.73, name: p2 },
    ];
    for (const col of cols) {
        const ps = state.players[col.seat];
        ctx.textAlign = 'center';
        ctx.fillStyle = col.seat === (state.initiative ?? 0) ? '#00baff' : '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(col.name + (state.initiative === col.seat ? '  ⚡' : ''), col.x, 210);
        if (!ps) continue;

        // Base HP bar
        const barW = 280;
        const barX = col.x - barW / 2;
        const pct = ps.baseMaxHp > 0 ? Math.max(0, ps.baseHp / ps.baseMaxHp) : 0;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(barX, 240, barW, 22);
        ctx.fillStyle = pct > 0.4 ? '#39d98a' : pct > 0.2 ? '#ffc857' : '#ff6b6b';
        ctx.fillRect(barX, 240, barW * pct, 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`Base ${ps.baseHp}/${ps.baseMaxHp}`, col.x, 257);

        // Stat lines
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '22px sans-serif';
        const units = ps.cards.length;
        const lines = [
            `Resources: ${ps.resourcesReady}+${ps.resourcesExhausted}`,
            `Hand: ${ps.handSize}`,
            `In play: ${units}`,
        ];
        lines.forEach((t, i) => ctx.fillText(t, col.x, 320 + i * 36));
    }

    // Action caption
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(W * 0.1, H - 150, W * 0.8, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(caption || '…', W / 2, H - 112);

    // Frame counter
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '18px sans-serif';
    ctx.fillText(`frame ${frameNo} / ${total}`, W / 2, H - 50);
}

function pickMime(): string {
    const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    const MR = typeof window !== 'undefined' ? window.MediaRecorder : undefined;
    if (MR && typeof MR.isTypeSupported === 'function') {
        for (const m of candidates) if (MR.isTypeSupported(m)) return m;
    }
    return 'video/webm';
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Render the clip frame range to a .webm Blob. Throws if MediaRecorder is unavailable. */
export async function exportClipWebm(opts: ClipExportOpts): Promise<Blob> {
    if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
        throw new Error('Clip export needs a browser with MediaRecorder support.');
    }
    const { doc, start, end, labelForSeq, nameOf, msPerFrame = 700 } = opts;
    const events = doc.events;
    const lo = Math.max(0, Math.min(start, end));
    const hi = Math.min(events.length - 1, Math.max(start, end));

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get a 2D canvas context.');

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: pickMime() });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const stopped = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });

    recorder.start();
    for (let i = lo; i <= hi; i++) {
        const state = fold(events.slice(0, i + 1));
        const caption = labelForSeq(events[i].seq) ?? '';
        drawFrame(ctx, state, doc.header, nameOf, caption, i, events.length - 1);
        await sleep(msPerFrame);
    }
    recorder.stop();
    await stopped;
    return new Blob(chunks, { type: 'video/webm' });
}

/** Export the clip and trigger a download. */
export async function downloadClipWebm(opts: ClipExportOpts & { filename?: string }): Promise<void> {
    const blob = await exportClipWebm(opts);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = opts.filename ?? `${opts.doc.header.p1}-vs-${opts.doc.header.p2}-clip.webm`.replace(/[^a-z0-9.-]+/gi, '-');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}
