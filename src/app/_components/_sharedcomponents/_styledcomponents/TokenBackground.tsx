/**
 * Absolutely-positioned token background: a rounded rect whose top-left and bottom-right
 * corners are chamfered rather than rounded, with the chamfer's own tips softened.
 *
 * Render it inside a `position: relative` container, with the token's own content (icon,
 * count) as later siblings so they stack above it. It measures itself and rebuilds its
 * path at that size, so the corners hold their shape at any width.
 *
 * @property fill - Interior colour of the token.
 * @property stroke - Outline colour. Omit (or pass null) for no outline.
 * @property strokeWidth - Outline width. Scales with the token by default, expressed
 *   against a 100-unit-tall reference box. With `nonScalingStroke`, it is CSS pixels.
 * @property nonScalingStroke - Hold the outline at a constant pixel width instead of
 *   scaling it with the token. Worth enabling on small tokens, where a scaled outline all
 *   but disappears.
 * @property sx - Merged into the root sx, e.g. to set a zIndex against sibling content.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { SxProps, Theme } from '@mui/material/styles';

/**
 * Proportions of the token silhouette: a rounded rect whose top-left and bottom-right
 * corners are chamfered rather than rounded, with the chamfer's own tips softened. The
 * chamfer runs taller than it is wide, so it is not a 45 degree cut.
 *
 * Each value is a fraction of the token's HEIGHT, never its width. That is what holds the
 * corners to the shape they take on a square token: as a token widens to fit an icon plus
 * a multi-digit count, the corners stay put and only the flat edges elongate.
 */
const CORNER_RADIUS_RATIO = 5 / 34;
const CHAMFER_X_RATIO = 5 / 34;
const CHAMFER_Y_RATIO = 6 / 34;
const CHAMFER_TIP_RATIO = 1 / 34;

/** Reference height that a scaling `strokeWidth` is expressed against. */
const STROKE_REFERENCE_HEIGHT = 100;

/**
 * Tangent length for a fillet of `radius` tucked into the corner where two edges leave a
 * vertex along unit vectors `a` and `b` — i.e. how far back from the vertex each edge has
 * to stop for an arc of that radius to meet both smoothly.
 */
function tangentLength(a: readonly [number, number], b: readonly [number, number], radius: number): number {
    const cos = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1]));
    return radius / Math.tan(Math.acos(cos) / 2);
}

/**
 * Builds the silhouette at an explicit pixel size, so the SVG viewBox can map 1:1 to the
 * rendered box. Corner sizes come from `height` alone; the four straight runs absorb
 * whatever width is left over.
 */
export function buildTokenBackgroundPath(width: number, height: number): string {
    let radius = CORNER_RADIUS_RATIO * height;
    let chamferX = CHAMFER_X_RATIO * height;
    let chamferY = CHAMFER_Y_RATIO * height;
    let tip = CHAMFER_TIP_RATIO * height;

    // Unit vector along the chamfer, pointing up and to the right.
    const chamferLength = Math.hypot(chamferX, chamferY);
    const along: readonly [number, number] = [chamferX / chamferLength, -chamferY / chamferLength];
    const back: readonly [number, number] = [-along[0], -along[1]];

    // How far the flat edges stop short of each chamfer vertex to make room for the tips.
    let edgeInset = tangentLength([0, 1], along, tip); // against the vertical edge
    let flatInset = tangentLength(back, [1, 0], tip); // against the horizontal edge

    // A token narrower than its own corners would invert the path; shrink everything to fit.
    const fit = Math.min(1, width / (chamferX + flatInset + radius));
    radius *= fit;
    chamferX *= fit;
    chamferY *= fit;
    tip *= fit;
    edgeInset *= fit;
    flatInset *= fit;

    // Chamfer tangent points, offset from each vertex along the chamfer itself.
    const unit = chamferLength * fit;
    const edgeAlong: readonly [number, number] = [chamferX * (edgeInset / unit), chamferY * (edgeInset / unit)];
    const flatAlong: readonly [number, number] = [chamferX * (flatInset / unit), chamferY * (flatInset / unit)];

    const arc = (r: number, x: number, y: number) => `A${r} ${r} 0 0 1 ${x} ${y}`;

    return [
        // top edge, rightward from the top-left chamfer
        `M${chamferX + flatInset} 0`,
        `H${width - radius}`,
        arc(radius, width, radius),
        // right edge down into the bottom-right chamfer
        `V${height - chamferY - edgeInset}`,
        arc(tip, width - edgeAlong[0], height - chamferY + edgeAlong[1]),
        `L${width - chamferX + flatAlong[0]} ${height - flatAlong[1]}`,
        arc(tip, width - chamferX - flatInset, height),
        // bottom edge, leftward
        `H${radius}`,
        arc(radius, 0, height - radius),
        // left edge up into the top-left chamfer
        `V${chamferY + edgeInset}`,
        arc(tip, edgeAlong[0], chamferY - edgeAlong[1]),
        `L${chamferX - flatAlong[0]} ${flatAlong[1]}`,
        arc(tip, chamferX + flatInset, 0),
        'Z',
    ].join(' ');
}

export type TokenBackgroundProps = {
    fill: string;
    stroke?: string | null;
    strokeWidth?: number;
    nonScalingStroke?: boolean;
    sx?: SxProps<Theme>;
};

export function TokenBackground({
    fill,
    stroke,
    strokeWidth = 0,
    nonScalingStroke = false,
    sx,
}: TokenBackgroundProps) {
    const ref = useRef<SVGSVGElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;

        const measure = () => {
            const { width, height } = element.getBoundingClientRect();
            setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
        };

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(element);

        return () => ro.disconnect();
    }, []);

    const { width, height } = size;
    const measured = width > 0 && height > 0;

    // A scaling strokeWidth is relative to a 100-unit-tall box; the viewBox is in pixels,
    // so convert unless the caller wants a fixed pixel outline.
    const resolvedStrokeWidth = nonScalingStroke
        ? strokeWidth
        : strokeWidth * (height / STROKE_REFERENCE_HEIGHT);

    return (
        <Box
            component="svg"
            ref={ref}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={measured ? `0 0 ${width} ${height}` : undefined}
            aria-hidden
            sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                ...sx,
            }}
        >
            {measured && (
                <path
                    d={buildTokenBackgroundPath(width, height)}
                    fill={fill}
                    stroke={stroke ?? undefined}
                    strokeWidth={resolvedStrokeWidth}
                />
            )}
        </Box>
    );
}
