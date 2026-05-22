import React, { ChangeEvent } from 'react';
import { Box, Link, SxProps, Theme, Tooltip } from '@mui/material';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { SupportedDeckSources } from '@/app/_constants/constants';

interface DeckImportInputProps {
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    placeholder?: string;
    labelSx?: SxProps<Theme>;
}

const DeckImportInput: React.FC<DeckImportInputProps> = ({
    value,
    onChange,
    disabled = false,
    placeholder,
    labelSx,
}) => (
    <>
        <Box sx={labelSx}>
            Deck link (
            <Tooltip
                arrow={true}
                title={
                    <Box sx={{ whiteSpace: 'pre-line' }}>
                        {SupportedDeckSources.join('\n')}
                    </Box>
                }
            >
                <Link sx={{ color: 'lightblue', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                    supported deckbuilders
                </Link>
            </Tooltip>
            )
            <br />
            OR paste deck JSON directly
        </Box>
        <StyledTextField
            type="text"
            disabled={disabled}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            fullWidth
        />
    </>
);

export default DeckImportInput;
