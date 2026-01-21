import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import GameCard from '../../_sharedcomponents/Cards/GameCard';
import { CardStyle } from '../../_sharedcomponents/Cards/CardTypes';
import { ITokenStack } from './tokenStackUtils';
import { useGame } from '@/app/_contexts/Game.context';
import { getBorderColor } from '../../_sharedcomponents/Cards/cardUtils';

interface ITokenStackProps {

    /** The token stack to display */
    stack: ITokenStack;

    /** Card style for rendering */
    cardStyle: CardStyle;
}

/**
 * TokenStack component displays a stack of identical tokens as a single card
 * with a count badge. When multiple tokens are selectable, clicking opens a modal
 * showing all tokens for individual selection.
 */
const TokenStack: React.FC<ITokenStackProps> = ({ stack, cardStyle }) => {
    const { sendGameMessage, connectedPlayer, getConnectedPlayerPrompt } = useGame();

    const { representativeCard, tokens, count, exhausted } = stack;

    // Check selectability
    const selectableTokens = tokens.filter((token) => token.selectable);
    const hasSelectableTokens = selectableTokens.length > 0;
    const selectableCount = selectableTokens.length;
    const isSingleToken = count === 1;

    const promptType = getConnectedPlayerPrompt()?.promptType;
    const borderColor = hasSelectableTokens
        ? getBorderColor(representativeCard, connectedPlayer, promptType, cardStyle)
        : undefined;

    /**
     * Handle click on the token stack
     */
    const handleStackClick = (event: React.MouseEvent<HTMLElement>) => {
        // If there's only one token, the GameCard handles the click
        if (isSingleToken) {
            return;
        }

        // If no tokens are selectable, do nothing special
        if (!hasSelectableTokens) {
            return;
        }
        event.stopPropagation();
        event.preventDefault();
        sendGameMessage(['cardClicked', selectableTokens[0].uuid]);
    };

    // Styles
    const styles = {
        wrapper: {
            position: 'relative',
            cursor: hasSelectableTokens && !isSingleToken ? 'pointer' : 'default',
        },
        badge: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: exhausted ? 'rgba(60, 60, 60, 0.95)' : 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            borderRadius: '50%',
            width: 'clamp(28px, 4vw, 52px)',
            height: 'clamp(28px, 4vw, 52px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(14px, 2vw, 28px)',
            fontWeight: 'bold',
            zIndex: 10,
            pointerEvents: 'none',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
        },
        tokensGrid: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center',
            padding: '8px',
        },
        tokenItemWrapper: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
        },
        tokenItem: {
            position: 'relative',
            width: 'clamp(80px, 15vw, 140px)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        },
        tokenItemSelectable: {
            cursor: 'pointer',
            '&:hover': {
                transform: 'scale(1.08) translateY(-4px)',
                '& > div': {
                    boxShadow: '0 8px 24px rgba(76, 175, 80, 0.5)',
                },
            },
        },
        tokenItemUnselectable: {
            opacity: 0.5,
            cursor: 'not-allowed',
            filter: 'grayscale(30%)',
        },
        tokenLabel: {
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: '500',
            textAlign: 'center',
        },
        tokenLabelUnselectable: {
            color: 'rgba(255, 100, 100, 0.9)',
            fontSize: '0.75rem',
        },
    };

    const wrapperSx = {
        ...styles.wrapper,
        ...(hasSelectableTokens && !isSingleToken ? {
            '&::before': {
                content: '""',
                position: 'absolute' as const,
                top: -3,
                left: -3,
                right: -3,
                bottom: -3,
                border: `2px solid ${borderColor || '#4CAF50'}`,
                borderRadius: '0.6rem',
                pointerEvents: 'none' as const,
                zIndex: 5,
            },
        } : {}),
    };

    // For single tokens, just render the GameCard normally
    if (isSingleToken) {
        return (
            <GameCard
                card={representativeCard}
                subcards={representativeCard.subcards || []}
                capturedCards={representativeCard.capturedCards || []}
                cardStyle={cardStyle}
            />
        );
    }

    return (
        <>
            <Box
                sx={wrapperSx}
                onClick={handleStackClick}
            >
                {/* Render the representative card */}
                {/* We pass a modified card that's non-selectable when we handle selection ourselves */}
                <GameCard
                    card={{
                        ...representativeCard,
                        // Disable individual selection when multiple tokens need selection modal
                        selectable: hasSelectableTokens && selectableCount > 1
                            ? false
                            : representativeCard.selectable,
                    }}
                    subcards={[]}
                    capturedCards={[]}
                    cardStyle={cardStyle}
                />

                {/* Count badge */}
                <Box sx={styles.badge}>
                    <Typography
                        component="span"
                        sx={{
                            fontSize: 'inherit',
                            fontWeight: 'inherit',
                            lineHeight: 1,
                        }}
                    >
                        {count}x
                    </Typography>
                </Box>
            </Box>
        </>
    );
};

export default TokenStack;