/**
 * The damage number shown on a card, and the running total while damage or healing is
 * being distributed across targets. A thin wrapper over Token that picks the matching
 * token type and sizes it.
 *
 * @property value - Number shown on the token.
 * @property variant - Which counter this is; distribution counters are smaller.
 */
import Typography from '@mui/material/Typography';
import { Token, type TokenType } from './Token';

type DamageCounterVariant = 'damage' | 'distributeDamage' | 'distributeHealing';

type DamageCounterProps = {
    value: number | string;
    variant?: DamageCounterVariant;
};

const COUNTER_VARIANTS: Record<DamageCounterVariant, { tokenType: TokenType; fontSize: string }> = {
    damage: { tokenType: 'damageCounter', fontSize: '1.9rem' },
    distributeDamage: { tokenType: 'distributeDamageCounter', fontSize: '1.4rem' },
    distributeHealing: { tokenType: 'distributeHealingCounter', fontSize: '1.4rem' },
};

export function DamageCounterToken({ value, variant = 'damage' }: DamageCounterProps) {
    const { tokenType, fontSize } = COUNTER_VARIANTS[variant];

    // Two digits need less side padding than one to keep the token from growing too wide.
    const paddingX = value.toString().length > 1 ? '.5rem' : '.7rem';

    return (
        <Token
            type={tokenType}
            sx={{
                px: paddingX,
                py: '.3rem',
                fontSize,
                filter: 'drop-shadow(1px 2px 1px rgba(0,0,0,0.40))',
                textShadow: '2px 2px rgba(0,0,0,0.20)',
            }}
        >
            <Typography
                variant="body1"
                sx={{
                    m: 0,
                    fontWeight: 700,
                    fontSize: 'inherit',
                    color: 'inherit',
                    lineHeight: 1,
                    pointerEvents: 'none',
                }}
            >
                {value}
            </Typography>
        </Token>
    );
}
