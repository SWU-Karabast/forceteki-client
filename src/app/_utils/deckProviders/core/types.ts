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
