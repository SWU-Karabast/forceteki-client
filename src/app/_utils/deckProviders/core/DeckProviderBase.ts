import { DeckSource, IDeckData } from '../../deckTypes';
import { httpGetJson } from './httpGetJson';
import { DeckFetchError, DeckFetchErrorReason } from './types';

export interface IStatusErrorOverride {
    reason: DeckFetchErrorReason;
    message: string;
}

/**
 * Template-method base class for browser-side deck providers.
 *
 * Subclasses declare *what* (host, regex, API URL, status overrides) and the
 * base handles *how* (validate link, fetch via `httpGetJson`, map errors,
 * parse JSON, stamp `deckSource`/`deckID`). All thrown errors are
 * {@link DeckFetchError} tagged with `providerName = this.displayName`.
 *
 * Add a new provider by creating a subclass and registering an instance in
 * `registry.ts`. No other wiring is required: `determineDeckSource`,
 * `SupportedDeckSources`, and the DeckPage tag-style lookup all derive
 * themselves from the registry.
 */
export abstract class DeckProviderBase {
    // ----- Required per-provider configuration -----

    public abstract readonly source: DeckSource;

    /** Human-readable name used in error messages and the supported-sites list (e.g. "swubase.com"). */
    public abstract readonly displayName: string;

    /**
     * Substring used by the default {@link matches} implementation
     * (`deckLink.includes(hostNameMatch)`). Override `matches` for anything
     * more elaborate. Also consumed by `determineDeckSource` via the
     * registry.
     */
    public abstract readonly hostNameMatch: string;

    /**
     * Accent color (any CSS color string) used for the provider's pill on
     * the DeckPage. The full SX block is derived from this in
     * `tagStyle.ts`. Required so a new provider cannot ship without a
     * colored tag.
     */
    public abstract readonly tagColor: string;

    /**
     * When `true`, this provider's {@link displayName} is omitted from the
     * public list of supported deck sites (`SupportedDeckSources`) while its
     * link-import functionality keeps working. Use to temporarily hide a
     * site that is broken/unavailable without dropping link support.
     * Required (no default) so every provider must make an explicit choice.
     */
    public abstract readonly hiddenFromPublicList: boolean;

    /** Construct the JSON API URL that returns the deck for the given id. */
    protected abstract buildApiUrl(deckId: string): string;

    // ----- Optional configuration -----

    /**
     * Regex applied to the raw deck link to extract the deck id (first
     * capture group). Providers with non-regex parsing (URL parsing, multiple
     * URL shapes, query-string ids, etc.) override {@link parseDeckId}
     * directly instead.
     */
    protected readonly deckIdRegex?: RegExp;

    /**
     * Per-status overrides, consulted before the default 404 → NotFound and
     * generic ProviderError fallbacks. Example:
     * `{ 404: { reason: Private, message: 'Make the deck Public on …' } }`.
     */
    protected readonly statusErrorOverrides: Partial<
        Record<number, IStatusErrorOverride>
    > = {};

    // ----- Overridable hook -----

    /**
     * Default uses {@link deckIdRegex}. Override for URL-based or
     * multi-shape parsing. Return `null` to let the base throw a generic
     * InvalidLink error, or throw a {@link DeckFetchError} directly with a
     * custom message.
     */
    protected parseDeckId(deckLink: string): string | null {
        if (!this.deckIdRegex) {
            throw new Error(
                `${this.displayName}: must set deckIdRegex or override parseDeckId()`,
            );
        }
        const m = deckLink.match(this.deckIdRegex);
        return m && m[1] ? m[1] : null;
    }

    // ----- Template methods -----

    public matches(deckLink: string): boolean {
        return deckLink.includes(this.hostNameMatch);
    }

    public async fetchAsync(deckLink: string): Promise<IDeckData> {
        const deckId = this.parseDeckId(deckLink);
        if (!deckId) {
            throw new DeckFetchError(
                DeckFetchErrorReason.InvalidLink,
                'Invalid deckLink format',
                undefined,
                this.displayName,
            );
        }

        const resp = await httpGetJson(this.buildApiUrl(deckId), this.displayName);
        if (!resp.ok) {
            throw this.toDeckFetchError(resp.status, resp.statusText);
        }

        const data = (await resp.json()) as IDeckData;
        data.deckSource = this.source;
        data.deckID = deckId;
        return data;
    }

    // ----- Internals -----

    private toDeckFetchError(status: number, statusText: string): DeckFetchError {
        const override = this.statusErrorOverrides[status];
        if (override) {
            return new DeckFetchError(override.reason, override.message, status, this.displayName);
        }
        if (status === 404) {
            return new DeckFetchError(
                DeckFetchErrorReason.NotFound,
                `Deck not found. Make sure the deck exists on ${this.displayName}.`,
                status,
                this.displayName,
            );
        }
        return new DeckFetchError(
            DeckFetchErrorReason.ProviderError,
            `${this.displayName} API error: ${statusText || status}`,
            status,
            this.displayName,
        );
    }
}
