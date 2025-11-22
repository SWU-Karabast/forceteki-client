/**
 * Enum defining all available animation types in the game.
 * Mirrors the server-side AnimationType enum.
 */
export enum AnimationType {
    // Damage and healing
    Damage = 'DAMAGE',
    Heal = 'HEAL',

    // Card state changes
    Exhaust = 'EXHAUST',
    Ready = 'READY',
    Defeat = 'DEFEAT',

    // Card movements
    Play = 'PLAY',
    Draw = 'DRAW',
    Discard = 'DISCARD',
    Return = 'RETURN',
    Move = 'MOVE',

    // Deck operations
    Shuffle = 'SHUFFLE',
    Reveal = 'REVEAL',

    // Resource and tokens
    GainResource = 'GAIN_RESOURCE',
    SpendResource = 'SPEND_RESOURCE',
    // GainShield = 'GAIN_SHIELD', // Not yet implemented - reserved for future use
    LoseShield = 'LOSE_SHIELD',
    GainExperience = 'GAIN_EXPERIENCE',

    // Combat
    Attack = 'ATTACK',

    // Visual effects
    Highlight = 'HIGHLIGHT',
}

/**
 * Core animation event structure received from server.
 * Each event represents a single visual animation to be executed.
 */
export interface AnimationEvent {

    /** Type of animation to execute */
    type: AnimationType;

    /** UUID of the card or 'P1BASE'/'P2BASE' for bases */
    targetId: string;

    /** Duration of the animation in milliseconds */
    durationMs: number;

    /** Priority for execution order (higher = earlier, default: 50) */
    priority: number;

    /** Optional source card UUID (e.g., attacker, ability source) */
    sourceId?: string;

    /** Optional numeric value (e.g., damage amount, heal amount) */
    value?: number;

    /** Type-specific additional data */
    metadata?: Record<string, unknown>;
}

/**
 * Container for a batch of animation events received from the server.
 */
export interface AnimationQueue {

    /** Array of animation events to execute */
    events: AnimationEvent[];

    /** Timestamp when the queue was created */
    timestamp: number;

    /** Unique identifier for this batch of animations */
    sequenceId: string;
}
