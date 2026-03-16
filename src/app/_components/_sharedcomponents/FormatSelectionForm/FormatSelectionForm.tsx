import React, { ChangeEvent, useMemo, useState } from 'react';
import { CardPool, CardPoolLabels, FormatLabels, GamesToWinMode, GamesToWinModeLabels, IFormatModeConfig, SwuGameFormat } from '@/app/_constants/constants';
import { Box, FormControl, Link, MenuItem, SxProps, Typography } from '@mui/material';
import StyledTextField from '../_styledcomponents/StyledTextField';
import { Theme } from 'next-auth';
import FormatInfoPopup from './FormatInfoPopup';

interface IFormatSelectionFormProps {
    format: SwuGameFormat;
    cardPool: CardPool;
    gamesToWinMode: GamesToWinMode;
    setFormat: (value: SwuGameFormat) => void;
    setCardPool: (value: CardPool) => void;
    setGamesToWinMode: (value: GamesToWinMode) => void;
    formatConfigs: IFormatModeConfig[];
    isBo3Allowed: boolean;
    styles: {
        formControlStyle?: SxProps<Theme>,
        labelTextStyle?: SxProps<Theme>,
    }
};

const FormatSelectionForm: React.FC<IFormatSelectionFormProps> = ({
    format,
    cardPool,
    gamesToWinMode,
    setFormat,
    setCardPool,
    setGamesToWinMode,
    formatConfigs,
    isBo3Allowed,
    styles,
}: IFormatSelectionFormProps) => {
    const [formatInfoOpen, setFormatInfoOpen] = useState(false);
    const [cardPoolInfoOpen, setCardPoolInfoOpen] = useState(false);

    const formControlStyle = Array.isArray(styles.formControlStyle) ? styles.formControlStyle : [styles.formControlStyle];
    const labelTextStyle = Array.isArray(styles.labelTextStyle) ? styles.labelTextStyle : [styles.labelTextStyle];

    const currentConfig = useMemo(
        () => formatConfigs.find((c) => c.format === format),
        [formatConfigs, format]
    );

    const cardPools = currentConfig?.cardPools ?? [CardPool.Current];
    const gamesToWinModes = currentConfig?.gamesToWinModes ?? [GamesToWinMode.BestOfOne];
    const showCardPoolPicker = cardPools.length > 1;

    const labelRowStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    } as const;

    const learnMoreStyle = {
        color: '#4F8A9E',
        fontSize: '0.7rem',
        cursor: 'pointer',
        '&:hover': { color: '#6BA3BE' },
    } as const;

    return <>
        <FormControl fullWidth sx={formControlStyle}>
            <Box sx={labelRowStyle}>
                <Typography variant="body1" sx={labelTextStyle}>
                    Format
                </Typography>
                <Link component="button" type="button" underline="hover" sx={learnMoreStyle} onClick={() => setFormatInfoOpen(true)}>
                    About Formats
                </Link>
            </Box>
            <StyledTextField
                select
                value={format}
                required
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormat(e.target.value as SwuGameFormat)
                }
            >
                {
                    formatConfigs
                        .map((config) => {
                            return <MenuItem key={config.format} value={config.format}>
                                {FormatLabels[config.format]}
                            </MenuItem>
                        })
                }
            </StyledTextField>
        </FormControl>
        {showCardPoolPicker && (
            <FormControl fullWidth sx={formControlStyle}>
                <Box sx={labelRowStyle}>
                    <Typography variant="body1" sx={labelTextStyle}>
                        Card Pool
                    </Typography>
                    <Link component="button" type="button" underline="hover" sx={learnMoreStyle} onClick={() => setCardPoolInfoOpen(true)}>
                        About Card Pools
                    </Link>
                </Box>
                <StyledTextField
                    select
                    value={cardPool}
                    required
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setCardPool(e.target.value as CardPool)
                    }
                >
                    {
                        cardPools.map((pool) => (
                            <MenuItem key={pool} value={pool}>
                                {CardPoolLabels[pool]}
                            </MenuItem>
                        ))
                    }
                </StyledTextField>
            </FormControl>
        )}
        <FormControl fullWidth sx={formControlStyle}>
            <Typography variant="body1" sx={labelTextStyle}>Match Type</Typography>
            <StyledTextField
                select
                value={gamesToWinMode}
                required
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setGamesToWinMode(e.target.value as GamesToWinMode)
                }
            >
                {
                    gamesToWinModes
                        .map((key) => {
                            const isBo3 = key === GamesToWinMode.BestOfThree;
                            const disabled = isBo3 && !isBo3Allowed;
                            return <MenuItem key={key} value={key} disabled={disabled}>
                                {GamesToWinModeLabels[key]}
                                {disabled && ' (must be logged in)'}
                            </MenuItem>
                        })
                }
            </StyledTextField>
        </FormControl>
        <FormatInfoPopup open={formatInfoOpen} onClose={() => setFormatInfoOpen(false)} topic="formats" />
        <FormatInfoPopup open={cardPoolInfoOpen} onClose={() => setCardPoolInfoOpen(false)} topic="cardPool" />
    </>
}

export default FormatSelectionForm;