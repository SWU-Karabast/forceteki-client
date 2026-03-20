import React, { ChangeEvent } from 'react';
import { FormatLabels, GamesToWinMode, GamesToWinModeLabels, SwuGameFormat } from '@/app/_constants/constants';
import { FormControl, MenuItem, SxProps, Typography } from '@mui/material';
import StyledTextField from '../_styledcomponents/StyledTextField';
import { Theme } from 'next-auth';

interface IFormatSelectionFormProps {
    format: SwuGameFormat;
    gamesToWinMode: GamesToWinMode;
    setFormat: (value: SwuGameFormat) => void;
    setGamesToWinMode: (value: GamesToWinMode) => void;
    formats: SwuGameFormat[],
    gamesToWinModes?: GamesToWinMode[],
    isBo3Allowed: boolean,
    styles: {
        formControlStyle?: SxProps<Theme>,
        labelTextStyle?: SxProps<Theme>,
    }
};

const FormatSelectionForm: React.FC<IFormatSelectionFormProps> = ({
    format,
    gamesToWinMode,
    setFormat,
    setGamesToWinMode,
    formats,
    gamesToWinModes = Object.values(GamesToWinMode) as GamesToWinMode[],
    isBo3Allowed,
    styles,
}: IFormatSelectionFormProps) => {
    const formControlStyle = Array.isArray(styles.formControlStyle) ? styles.formControlStyle : [styles.formControlStyle];
    const labelTextStyle = Array.isArray(styles.labelTextStyle) ? styles.labelTextStyle : [styles.labelTextStyle];

    return <>
        <FormControl fullWidth sx={formControlStyle}>
            <Typography variant="body1" sx={labelTextStyle}>Fight Style</Typography>
            <StyledTextField
                select
                value={format}
                required
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormat(e.target.value as SwuGameFormat)
                }
            >
                {
                    formats
                        .map((key) => {
                            return <MenuItem key={key} value={key}>
                                {FormatLabels[key]}
                            </MenuItem>
                        })
                }
            </StyledTextField>
        </FormControl>
        <FormControl fullWidth sx={formControlStyle}>
            <Typography variant="body1" sx={labelTextStyle}>How Many Bonks</Typography>
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
    </>
}

export default FormatSelectionForm;