import { engineProduct, PILOT_WRITER_PRODUCTS, type Header } from '@/lib/swupgn';

// Which writer, and which generation of it, produced a file: the rules the viewer switches on.

/**
 * A pre-release file ([V-04]) is a pilot writer's file with no `WriterRevision`, compared by
 * the exact `Engine` product (§25 "Pilot writer products"). Any other writer's file without the
 * tag is an ordinary file ([W-12]).
 */
export function isPreRelease(h: Pick<Header, 'engine' | 'writerRevision'>): boolean {
    return h.writerRevision == null && PILOT_WRITER_PRODUCTS.has(engineProduct(String(h.engine ?? '')));
}

/**
 * Whether a file may hold records that belong to a later action but carry no `for` (Appendix C,
 * "Grouping records in a file without `for`"): a pre-release file, or forceteki writer revisions
 * 1-3, when [W-18] was a SHOULD. Only those are grouped by where a record sits. Every other file
 * (forceteki revision 4 on, any other writer) owns a record by its `for`, else by its `seq`'s
 * number, and §9.1 forbids inferring ownership from position.
 */
export function groupsByAdjacency(h: Pick<Header, 'engine' | 'writerRevision'>): boolean {
    if (isPreRelease(h)) return true;
    return engineProduct(String(h.engine ?? '')) === 'forceteki' && typeof h.writerRevision === 'number' && h.writerRevision >= 1 && h.writerRevision <= 3;
}
