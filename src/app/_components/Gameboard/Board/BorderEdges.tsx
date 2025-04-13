import React from 'react';

type BorderType =
  | 'llt'
  | 'llb'
  | 'lrt'
  | 'lrb'
  | 'rlt'
  | 'rlb'
  | 'rrt'
  | 'rrb';

interface BorderPieceProps extends React.SVGProps<SVGSVGElement> {
    type: BorderType;
}

// Shared styles
const WIDTH = 722;
const HEIGHT = 46;
const VIEWBOX = `0 0 ${WIDTH} ${HEIGHT}`;


const basePaths = {
    leftCurve: 'M10.5 0.999999C5.25331 1 1.00002 5.25329 1.00002 10.5L1 46L4.02145e-06 46L1.56999e-05 10.5C1.76069e-05 4.70101 4.70103 -4.10977e-07 10.5 -9.1794e-07L167.166 -1.46142e-05C168.691 -1.47475e-05 170.148 0.633178 171.188 1.74834L183.148 14.5695C183.999 15.4819 185.191 16 186.439 16L722 16L722 17L186.439 17C184.914 17 183.457 16.3668 182.417 15.2516L170.457 2.43046C169.606 1.51805 168.414 0.999985 167.166 0.999985L10.5 0.999999Z',
    rightCurve: 'M0 0L1 -8.74228e-08L1 15.9999L711.5 15.9999C717.299 15.9999 722 20.701 722 26.4999L722 45.9999L721 45.9999L721 26.4999C721 21.2532 716.747 16.9999 711.5 16.9999L1.48618e-06 16.9999L0 0Z',
};

const transforms: Record<BorderType, string> = {
    llt: '', // original left top
    llb: 'scale(1, -1) translate(0, -46)', // mirror on Y axis
    lrt: '', // original right top
    lrb: 'scale(1, -1) translate(0, -46)',
  
    rlt: 'scale(-1, 1) translate(-722, 0)', // mirror on X axis
    rlb: 'scale(-1, -1) translate(-722, -46)', // X and Y
    rrt: 'scale(-1, 1) translate(-722, 0)',
    rrb: 'scale(-1, -1) translate(-722, -46)',
};

const sourceMap: Record<BorderType, 'leftCurve' | 'rightCurve'> = {
    llt: 'leftCurve',
    llb: 'leftCurve',
    lrt: 'rightCurve',
    lrb: 'rightCurve',
    rlt: 'leftCurve',
    rlb: 'leftCurve',
    rrt: 'rightCurve',
    rrb: 'rightCurve',
};

const BorderEdge: React.FC<BorderPieceProps> = ({ type, ...props }) => {
    const pathData = basePaths[sourceMap[type]];
    const transform = transforms[type];
  
    return (
        <svg
            width="100%"
            height={HEIGHT}
            viewBox={VIEWBOX}
            fill="none"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <g transform={transform}>
                <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="black" />
                <path d={pathData} fill="white" stroke="none" fillRule="evenodd" clipRule="evenodd" />
            </g>
        </svg>
    );
};
  
export default BorderEdge;