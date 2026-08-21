/**
 * Draws the chamfered token shape around whatever it wraps — an icon, a count, or both.
 * A caller composes one by nesting content rather than by positioning a background
 * behind it.
 *
 * This is the shared visual treatment, not the game's token cards. Anything drawn on the
 * token shape belongs here, counter or otherwise.
 *
 * Appearance comes from `type`, which selects an entry in TOKEN_TYPES. Sizing does not —
 * pass height, padding and font-size through `sx`, since those differ per usage.
 *
 * Establishes its own stacking context and paints the shape behind the content, so
 * children need no positioning of their own. Measures itself and rebuilds the shape at
 * that size, so the corners hold their form at any width.
 *
 * @property type - Which token this is; sets fill, content colour and default outline.
 * @property stroke - Overrides the type's outline, e.g. with a selection colour. Pass null
 *   to force no outline.
 * @property onClick - Makes the token interactive.
 * @property sx - Merged into the root sx. Sizing and spacing belong here.
 * @property children - Rendered above the shape.
 */
import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
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

export type TokenType =
    | 'shield'
    | 'experience'
    | 'advantage'
    | 'damageCounter'
    | 'distributeDamageCounter'
    | 'distributeHealingCounter';

type TokenAppearance = {

    /** Silhouette colour. */
    fill: string;

    /** Colour inherited by the token's content. */
    color: string;

    /** Outline drawn for every token of this type. Upgrade tokens outline only when selectable, so they set none. */
    stroke?: string;

    /** Ignored when there is no outline to draw. */
    strokeWidth: number;

    /** Hold the outline at a constant pixel width rather than scaling it with the token. */
    nonScalingStroke?: boolean;
};

/**
 * Every token in the game, keyed by what it represents. Adding a token means adding an
 * entry here rather than threading colours through a call site.
 */
const TOKEN_TYPES: Record<TokenType, TokenAppearance> = {
    shield: { fill: '#00A6EC', color: '#FFFFFF', strokeWidth: 8, nonScalingStroke: true },
    experience: { fill: '#2E7D32', color: '#FFFFFF', strokeWidth: 8, nonScalingStroke: true },
    advantage: { fill: '#FFFFFF', color: '#000000', strokeWidth: 8, nonScalingStroke: true },
    damageCounter: { fill: '#DB131D', color: '#FFFFFF', strokeWidth: 0 },
    distributeDamageCounter: { fill: '#6D1414', color: '#FFFFFF', stroke: '#DB131D', strokeWidth: 6 },
    distributeHealingCounter: { fill: '#1A6681', color: '#FFFFFF', stroke: '#00BAFF', strokeWidth: 6 },
};

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
export function buildTokenPath(width: number, height: number): string {
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

export type TokenContainerProps = {
    type: TokenType;
    stroke?: string | null;
    onClick?: (event: MouseEvent) => void;
    sx?: SxProps<Theme>;
    children?: ReactNode;
};

export function TokenContainer({ type, stroke, onClick, sx, children }: TokenContainerProps) {
    const appearance = TOKEN_TYPES[type];
    const ref = useRef<HTMLDivElement>(null);
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

    // An explicit stroke wins over the type's own; null forces the outline off.
    const outline = stroke === undefined ? appearance.stroke : stroke ?? undefined;

    // A scaling strokeWidth is relative to a 100-unit-tall box; the viewBox is in pixels.
    const strokeWidth = !outline
        ? 0
        : appearance.nonScalingStroke
            ? appearance.strokeWidth
            : appearance.strokeWidth * (height / STROKE_REFERENCE_HEIGHT);

    return (
        <Box
            ref={ref}
            onClick={onClick}
            sx={{
                position: 'relative',
                // Own stacking context, so the silhouette's negative z-index stays inside
                // the token and children stack above it without any styling of their own.
                isolation: 'isolate',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                lineHeight: 1,
                userSelect: 'none',
                color: appearance.color,
                ...sx,
            }}
        >
            <Box
                component="svg"
                xmlns="http://www.w3.org/2000/svg"
                viewBox={measured ? `0 0 ${width} ${height}` : undefined}
                aria-hidden
                sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: -1 }}
            >
                {measured && (
                    <path
                        d={buildTokenPath(width, height)}
                        fill={appearance.fill}
                        stroke={outline}
                        strokeWidth={strokeWidth}
                    />
                )}
            </Box>
            {children}
        </Box>
    );
}
