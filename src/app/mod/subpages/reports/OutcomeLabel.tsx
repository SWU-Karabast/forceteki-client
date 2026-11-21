import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { IReportOutcomeOption } from '@/app/_utils/playerReportUtils';

interface IOutcomeLabelProps {
    option: IReportOutcomeOption;
}

/**
 * An outcome's name in its color, wherever a moderator picks one. Outcomes with a rule for when to use them show
 * it on hover, so every moderator applies them the same way.
 */
const OutcomeLabel: React.FC<IOutcomeLabelProps> = ({ option }) => {
    const label = (
        <Box component="span" sx={{ color: option.color, fontSize: '0.875rem', fontWeight: 600 }}>
            {option.label}
        </Box>
    );
    return option.hint
        ? <Tooltip title={option.hint} placement="top" enterDelay={300}>{label}</Tooltip>
        : label;
};

export default OutcomeLabel;
