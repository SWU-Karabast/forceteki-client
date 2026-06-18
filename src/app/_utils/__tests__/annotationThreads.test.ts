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
