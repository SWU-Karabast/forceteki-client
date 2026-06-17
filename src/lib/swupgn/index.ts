// Public API for the SWU-PGN/1.1 reader (client-vendored subset).
//
// NOTE: validate.ts from the server's swupgn/src is intentionally OMITTED here — it uses
// Node `fs`/`path` + `ajv` to load JSON schemas from disk and is not browser-safe. The
// client consumes trusted server-generated files, so parse + fold + render are sufficient.
// If you ever need client-side validation, copy swupgn/schema/*.json from the server repo,
// adapt validate.ts to `import` the JSON instead of reading from the filesystem, and
// re-export `validate` below.
export * from './types';
export { parse } from './parse';
export { fold, reduce, stateAt } from './fold';
export { render } from './render';
export { serialize } from './serialize';
export type { NameResolver } from './cardNames';
export { baseId } from './cardNames';
export { checkKeyframes } from './integrity';
export type { IntegrityResult, KeyframeMismatch } from './integrity';
