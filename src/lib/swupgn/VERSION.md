# Vendored SWU-PGN reader

Source: forceteki server `swupgn/` module. Re-vendored 2026-09-04 for the format revision
that added `%%% STORY` and `%%% CARDS` and renumbered the format 1.1 -> 1.0.

`validate.ts` intentionally omitted (Node-only: fs/path + ajv).

Client-owned divergences from the reference — preserve these when re-vendoring:

- `types.ts`   — `Annotation` carries `id`/`parent`/`ts` for the viewer's threaded discussion.
- `parse.ts`   — `[Rounds]` falls back to 0 when non-numeric; the reference takes `Number()` raw.
- `fold.ts`    — `snapToKeyframe()` merges a keyframe per seat instead of replacing wholesale,
                 so a pre-fix file with partial keyframes doesn't lose a player. Also keeps
                 token upgrades out of the arenas and folds The Force onto its base.
- `tokens.ts`  — client-only. Repairs the token lifecycle in older files and classifies token
                 upgrades vs token units, which the stream does not state.
- `serialize.ts` — client-owned.

Long-term: replace with a shared npm package (see spec "Long-term note").
