---
name: add-deck-provider
description: Add support for importing decklists from a new third-party SWU deckbuilder site (swubase, sithvault, kyberdecks, melee, etc). Use when asked to "add a deck provider", "support deck imports from <site>", "add <site>.com to the supported deck sites", or when a deck link from an unrecognized host needs to work.
---

# Adding a deck provider

Deck import lives in `src/app/_utils/deckProviders/`. Each third-party site is one
`DeckProviderBase` subclass. Almost everything downstream — the supported-sites list shown in
three different forms, `determineDeckSource`, the DeckPage tag pill, and the dev proxy's CORS
allowlist — derives itself from the registry array, so a correct provider needs no UI changes.

## Pick the base class first

**`DeckProviderBase`** — the site exposes a public JSON API returning a Karabast-shaped deck.
The base class handles parse → fetch → status mapping → JSON → stamping. This is the common case.

**`BackendResolvedDeckProvider`** — the site has no usable public API and the forceteki backend
scrapes it via `POST /api/resolve-deck-link`. The subclass is then just five fields, no
`buildApiUrl`. Only use this if the BE already supports the host; the client cannot add BE
scraping on its own. `MeleeDeckProvider.ts` is the whole pattern.

## The three files to edit

The doc comment in `registry.ts` says two. It is wrong — it omits the enum.

1. **`src/app/_utils/deckTypes.ts`** — add a member to the `DeckSource` enum.
2. **`src/app/_utils/deckProviders/<Name>DeckProvider.ts`** — the new subclass.
3. **`src/app/_utils/deckProviders/core/registry.ts`** — one import, one `new ...()` in `providers`.

Nothing else. Do not touch `constants.ts`, `DeckPage`, `AddDeckDialog`, `CreateGameForm`,
`QuickGameForm`, or `deck-proxy` — they all read from the registry already.

## Template

```ts
import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './core/DeckProviderBase';
import { DeckFetchErrorReason } from './core/types';

export class ExampleDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.Example;
    public override readonly displayName = 'example.com';
    public override readonly hostNameMatch = 'example.com';
    public override readonly tagColor = '#4CFF85';
    public override readonly hiddenFromPublicList = false;
    // Deck links in the form: https://example.com/decks/${deckId}
    protected override readonly deckIdRegex = /example\.com\/decks\/([^/]+)\/?$/;

    // Only when the site's status codes do not mean what they normally mean.
    protected override readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.Private,
            message: 'Deck not found. Make sure the deck is set to Public on example.com.',
        },
    };

    protected override buildApiUrl(deckId: string): string {
        return `https://example.com/api/deck/${deckId}/json`;
    }
}
```

## Field rules

**`displayName` must be a bare hostname**, not a pretty name. Despite the base class calling it
"human-readable", it is used verbatim as the dev proxy's CORS allowlist entry and as the public
supported-sites string. `'swubase.com'`, never `'SWU Base'`.

**`hostNameMatch`** feeds a plain `deckLink.includes()`. Registry order is match order and first
match wins, so if a new host could appear as a substring inside another provider's URLs, insert
it above that provider.

**`tagColor`** is any CSS color; `buildTagStyle` derives the whole pill from it. Pick something
close to the site's own branding and distinct from its neighbours in the list.

**`hiddenFromPublicList`** drops the site from the public list while leaving link import working
— for temporarily broken sites. Read the local-dev trap below before setting it `true`.

**`deckIdRegex`** — anchor it tightly. A loose `/decks/([^/]+)/` will happily capture `build`,
`draft` or `new` from the site's own non-deck routes and send garbage to the API.
`SithvaultDeckProvider` anchors on the uuid shape for exactly this reason. When one regex cannot
cover the URL shapes (query-string ids, multiple layouts), override `parseDeckId` instead and
return `null` for no match — see `SwustatsDeckProvider`.

**`statusErrorOverrides`** — only for sites whose statuses lie. Unmapped statuses already fall
back to 404 → `NotFound` and everything else → `ProviderError`. Real examples: swubase returns
404 for *private* decks; swustats returns 500 for *missing* ones.

## Constraints that will bite you

**The API response must already be `IDeckData`.** `fetchAsync` casts the JSON straight to
`IDeckData` and only stamps `deckSource` and `deckID`. There is no transform hook. If the site
returns its own shape, you must override `fetchAsync` entirely, or the deck arrives structurally
broken with no error. Confirm the endpoint returns `{ metadata, leader, secondleader, base, deck,
sideboard }` before writing anything.

**The API host must equal `displayName` or be a subdomain of it.** The dev proxy allows
`host === h || host.endsWith('.' + h)`. `kyberdecks.com` → `exportdeck.kyberdecks.com` is fine.
A wholly different domain 403s in local dev while working in prod.

**Hidden providers cannot be tested locally.** `supportedDeckHosts` filters out
`hiddenFromPublicList` providers, and `/api/deck-proxy` allowlists against that same array — so
in dev a hidden provider's own fetch is rejected with `403 Host not allowed`. Prod is unaffected
(no proxy). To test one locally, flip the flag to `false` temporarily and flip it back.

**Cross-origin redirects cannot be followed.** If the apex 307s to `www.`, target the canonical
host directly in `buildApiUrl` or the browser fetch dies. SithVault documents this in-file.

**No custom request headers, ever.** `httpGetJson` deliberately sends none — adding any turns
the GET into a preflighted request, and several provider origins only advertise
`Access-Control-Allow-Headers: Content-Type` and will fail it. Requests time out at 5s.

## Verify

1. `npm run lint` — this is `tsc --noemit && next lint` and is what CI gates on. The abstract
   members mean a missing field is a compile error, so this catches most mistakes.
2. `npm run dev`, then paste a real deck link into Add Deck on `/DeckPage`. Check that the deck
   resolves, the source pill renders in the right color, and the site appears in the supported
   list on the create-game and quick-game forms.
3. Test the failure paths that matter for this site: a private deck, and a deleted/bad id. Each
   should produce the specific message you wrote, not a generic provider error.
4. In dev every request goes through `/api/deck-proxy`, which re-checks CORS as the production
   origin would. A `502 CORS_MISCONFIGURED` means the site's CORS config genuinely would not
   allow `https://karabast.net` — that is a real finding to report upstream, not a dev-only
   artifact to work around.
