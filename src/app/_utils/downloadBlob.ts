// Shared client-side download helper. Every replay export path (raw .swupgn, text
// log, annotated .swupgn, clip .webm, game-log download) needs the same
// createObjectURL -> anchor -> click -> revoke dance; keep it in one place so the
// object-URL lifecycle (and the revoke that prevents a blob leak) can't drift.

/** Trigger a browser download of `blob` under `filename`. */
export function triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Defer revoke so the click has dispatched before the URL is freed.
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/** Reduce an arbitrary label to a safe download filename (alnum, dot, dash). */
export function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9.-]+/gi, '-');
}
