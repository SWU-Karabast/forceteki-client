import React from 'react';

interface BaseSVGProps extends React.SVGProps<SVGSVGElement> {
    width?: number | string;
    height?: number | string;
    stroke?: string;
    fill?: string;
}

const BaseSVG: React.FC<BaseSVGProps> = ({ width = '100%', height = '100%', children, ...props }) => {
    return (
        <svg
            width={width}
            height={height}
            fill="none"
            stroke="white"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            {children}
        </svg>
    );
};

export const UnitBoardBorder: React.FC<BaseSVGProps> = (props) => {
    return (
        <BaseSVG {...props} viewBox="0 0 64 64">
            <line x1="32" y1="16" x2="32" y2="48" strokeWidth="4" />
        </BaseSVG>
    );
};