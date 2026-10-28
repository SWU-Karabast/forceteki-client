// Public API for the SWU-PGN/1.0 reader (client-vendored subset).
//
// NOTE: validate.ts from the server's swupgn/src is intentionally OMITTED here — it uses
// Node `fs`/`path` + `ajv` to load JSON schemas from disk and is not browser-safe. parse()
// rejects every malformed file with a §24 code (SwuPgnError), and the fold and the viewer are
// hardened against the well-formed-but-invalid rest, so parse + fold + render are sufficient.
// If you ever need client-side validation, copy swupgn/schema/*.json from the server repo,
// adapt validate.ts to `import` the JSON instead of reading from the filesystem, and
// re-export `validate` below.
export * from './types';
export { parse, SwuPgnError, DEFAULT_LIMITS } from './parse';
export type { ParseNotes, ParsedDocument, ParseLimits } from './parse';
export { fold, foldFrames, frameCost, reduce, stateAt, isSeat, asIdList, isCompleteKeyframe, emptyState, MAX_ZONE_LIST } from './fold';
export { render } from './render';
export { isTopLevelActionRecord } from './actionLinks';
export { serialize } from './serialize';
export { displayText } from './displayText';
export type { NameResolver } from './cardNames';
export { baseId, indexResolver } from './cardNames';
export { normalizeTokenEvents, dropInertRecords, dropFrameworkSources, normalizeEvents, repairUpgradePlays, isStatusTokenCard, isTokenPseudoCard, tokenName, tokenArtId } from './tokens';
export { checkKeyframes } from './integrity';
export type { IntegrityResult, KeyframeMismatch } from './integrity';
