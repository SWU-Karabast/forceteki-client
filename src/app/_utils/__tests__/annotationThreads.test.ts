import { describe, it, expect } from 'vitest';
import { buildThreads } from '../annotationThreads';

interface N { id?: string; parent?: string; ts: number; text: string }
const build = (notes: N[]) => buildThreads(notes, (n) => n.id, (n) => n.parent, (n) => n.ts);

describe('buildThreads', () => {
    it('nests replies under their parent and orders siblings oldest-first', () => {
        const tree = build([
            { id: 'a', ts: 1, text: 'root' },
            { id: 'b', parent: 'a', ts: 3, text: 'reply 2' },
            { id: 'c', parent: 'a', ts: 2, text: 'reply 1' },
        ]);
        expect(tree).toHaveLength(1);
        expect(tree[0].note.text).toBe('root');
        expect(tree[0].replies.map((r) => r.note.text)).toEqual(['reply 1', 'reply 2']); // ts order
    });

    it('supports nested (reply-to-reply) threads', () => {
        const tree = build([
            { id: 'a', ts: 1, text: 'root' },
            { id: 'b', parent: 'a', ts: 2, text: 'reply' },
            { id: 'c', parent: 'b', ts: 3, text: 'reply to reply' },
        ]);
        expect(tree[0].replies[0].replies[0].note.text).toBe('reply to reply');
    });

    it('promotes an orphan (parent missing) to a root so it is not lost', () => {
        const tree = build([
            { id: 'a', ts: 1, text: 'root' },
            { id: 'b', parent: 'gone', ts: 2, text: 'orphan' },
        ]);
        expect(tree.map((r) => r.note.text).sort()).toEqual(['orphan', 'root']);
    });

    it('treats notes without ids as independent roots', () => {
        const tree = build([
            { ts: 1, text: 'one' },
            { ts: 2, text: 'two' },
        ]);
        expect(tree).toHaveLength(2);
    });
});

describe('buildThreads with duplicate ids', () => {
    it('keeps both notes instead of dropping the first', async () => {
        const { buildThreads } = await import('../annotationThreads');
        type N = { id?: string; parent?: string; ts: number; text: string };
        const notes: N[] = [{ id: 'a', ts: 1, text: 'first' }, { id: 'a', ts: 2, text: 'second' }, { id: 'b', parent: 'a', ts: 3, text: 'reply' }];
        const roots = buildThreads<N>(notes, (n) => n.id, (n) => n.parent, (n) => n.ts);
        expect(roots.map((r) => r.note.text)).toEqual(['first', 'second']);
        expect(roots[0].replies.map((r) => r.note.text)).toEqual(['reply']);
    });
});

describe('buildThreads on a parent cycle', () => {
    // Value: protects=notes in a file whose parents form a cycle still render instead of vanishing; fails_when=buildThreads only guards self-parenting again; why_new=red team found a two-note cycle dropped both notes; seam=none; no_claim=which note of the cycle becomes the root beyond file order
    it('promotes the first note of a two-note cycle to a root and keeps the other as its reply', () => {
        const tree = build([
            { id: 'a', parent: 'b', ts: 1, text: 'A' },
            { id: 'b', parent: 'a', ts: 2, text: 'B' },
        ]);
        expect(tree.map((n) => n.note.id)).toEqual(['a']);
        expect(tree[0].replies.map((n) => n.note.id)).toEqual(['b']);
    });
});
