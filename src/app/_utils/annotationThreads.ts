// Build a reply tree from a flat list of annotations. Annotations carry an optional
// `parent` (the id of the note they reply to); top-level notes have no parent (or a parent
// that isn't present, e.g. a reply whose root was deleted — promoted to a root so it isn't
// lost). Threads are local + file-portable: ids/parents serialize into the .swupgn.

export interface ThreadNode<T> {
    note: T;
    replies: ThreadNode<T>[];
}

/**
 * @param notes   flat annotation list (file + working) for one ref
 * @param idOf    stable id of a note (working `_id` or serialized `id`)
 * @param parentOf id of the note this one replies to, if any
 * @param tsOf    author timestamp for ordering siblings (oldest first)
 */
export function buildThreads<T>(
    notes: T[],
    idOf: (n: T) => string | undefined,
    parentOf: (n: T) => string | undefined,
    tsOf: (n: T) => number,
): ThreadNode<T>[] {
    const nodes = new Map<string, ThreadNode<T>>();
    const present = new Set<string>();
    for (const n of notes) {
        const id = idOf(n);
        if (id) present.add(id);
    }
    // Stable synthetic ids for notes without one, so they can still be nodes/roots.
    let synth = 0;
    const keyOf = (n: T): string => idOf(n) ?? `__anon_${synth++}`;

    const order: string[] = [];
    for (const n of notes) {
        const key = keyOf(n);
        nodes.set(key, { note: n, replies: [] });
        order.push(key);
    }

    const roots: ThreadNode<T>[] = [];
    let i = 0;
    for (const n of notes) {
        const key = order[i++];
        const node = nodes.get(key)!;
        const parent = parentOf(n);
        const parentNode = parent && present.has(parent) ? nodes.get(parent) : undefined;
        if (parentNode && parentNode !== node) {
            parentNode.replies.push(node);
        } else {
            roots.push(node);
        }
    }

    const sortRec = (list: ThreadNode<T>[]) => {
        list.sort((a, b) => tsOf(a.note) - tsOf(b.note));
        for (const node of list) sortRec(node.replies);
    };
    sortRec(roots);
    return roots;
}
