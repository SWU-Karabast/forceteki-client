import { DeckSource, IDeckData } from '../deckTypes';

/**
 * Discriminator for {@link DeckFetchError}. Consumers should switch on this
 * (rather than parse the error message) to decide which UX to show.
 */
export enum DeckFetchErrorReason {

    /** The deck URL did not parse for the matched provider (bad shape, missing id, etc.). */
    InvalidLink = 'InvalidLink',

    /** None of the registered providers matched the URL. */
    UnsupportedProvider = 'UnsupportedProvider',

    /** Provider returned 404 / explicit "not found" semantics. */
    NotFound = 'NotFound',

    /** Provider indicated the deck is not publicly accessible. */
    Private = 'Private',

    /** Provider returned an unexpected non-OK status. */
    ProviderError = 'ProviderError',

    /** Network-level failure (fetch threw). */
    NetworkError = 'NetworkError',
}

export class DeckFetchError extends Error {
    public readonly reason: DeckFetchErrorReason;
    public readonly status?: number;

    /** Human-readable name of the provider that produced the error (e.g. "swubase.com"). */
    public readonly providerName?: string;

    public constructor(reason: DeckFetchErrorReason, message: string, status?: number, providerName?: string) {
        super(message);
        this.name = 'DeckFetchError';
        this.reason = reason;
        this.status = status;
        this.providerName = providerName;
    }
}

/**
 * Implementations MUST issue their HTTP requests via `httpGetJson` so that
 * `cache: 'no-store'` is applied uniformly. Browser caching of deck-builder
 * responses is not allowed.
 */
export interface IDeckProvider {
    readonly source: DeckSource;

    /** Human-readable name used in error messages (e.g. "swubase.com"). */
    readonly displayName: string;
    matches(deckLink: string): boolean;
    fetchAsync(deckLink: string): Promise<IDeckData>;
}
