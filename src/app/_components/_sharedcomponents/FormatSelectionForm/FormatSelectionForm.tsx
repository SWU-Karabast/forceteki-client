import React, { useMemo, useState } from 'react';
import { CardPool, CardPoolLabels, FormatLabels, GamesToWinMode, GamesToWinModeLabels, IFormatModeConfig, SwuGameFormat } from '@/app/_constants/constants';
import { Box, FormControl, Link, MenuItem, SxProps, Typography } from '@mui/material';
import SegmentedControl from '../SegmentedControl/SegmentedControl';
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
        color: 'lightblue',
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
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
                name="format"
                value={format}
                required
                SelectProps={{ inputProps: { 'aria-label': 'Format' } }}
                onChange={(event) => {
                    const selectedConfig = formatConfigs.find((config) => config.format === event.target.value);
                    if (!selectedConfig) {
                        throw new Error(`Unsupported game format '${event.target.value}'`);
                    }
                    setFormat(selectedConfig.format);
                }}
            >
                {formatConfigs.map((config) => (
                    <MenuItem key={config.format} value={config.format}>
                        {FormatLabels[config.format]}
                    </MenuItem>
                ))}
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
                <SegmentedControl
                    name="cardPool"
                    label="Card Pool"
                    value={cardPool}
                    onChange={setCardPool}
                    options={cardPools.map((pool) => ({
                        value: pool,
                        label: CardPoolLabels[pool],
                    }))}
                />
            </FormControl>
        )}
        <FormControl fullWidth sx={formControlStyle}>
            <Typography variant="body1" sx={labelTextStyle}>Match Type</Typography>
            <SegmentedControl
                name="gamesToWinMode"
                label="Match Type"
                value={gamesToWinMode}
                onChange={setGamesToWinMode}
                options={gamesToWinModes.map((mode) => ({
                    value: mode,
                    label: GamesToWinModeLabels[mode],
                    disabled: mode === GamesToWinMode.BestOfThree && !isBo3Allowed,
                    description: mode === GamesToWinMode.BestOfThree && !isBo3Allowed ? '(must be logged in)' : undefined,
                }))}
            />
        </FormControl>
        <FormatInfoPopup open={formatInfoOpen} onClose={() => setFormatInfoOpen(false)} topic="formats" />
        <FormatInfoPopup open={cardPoolInfoOpen} onClose={() => setCardPoolInfoOpen(false)} topic="cardPool" />
    </>
}

export default FormatSelectionForm;