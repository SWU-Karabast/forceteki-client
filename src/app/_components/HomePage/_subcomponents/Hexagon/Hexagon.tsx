import React from 'react';
import { Box } from '@mui/material';
import { IHexagonProps } from '../../HomePageTypes';

const Hexagon: React.FC<IHexagonProps> = ({
    backgroundColor,
}: {
    backgroundColor: string;
}) => {
    // ------------------------STYLES------------------------//

    const hexagonStyle = {
        width: '1em',
        height: '1em',
        backgroundColor,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        my: '0.15rem',
    };

    return <Box sx={hexagonStyle} />;
};

export default Hexagon;
