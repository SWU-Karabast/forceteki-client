import { SvgIcon, SvgIconProps } from '@mui/material';

/**
 * ─ three offset rounded‑rect cards
 * ─ front card displays the letters **SWU**
 *
 * The back cards fade with lower opacity; the front card is solid.
 * The white text stays readable on dark or coloured fills.
 */
const SWUDeckIcon = (props: SvgIconProps) => (
    <SvgIcon {...props} viewBox="0 0 24 24">
        {/* back card */}
        <rect x="2" y="5" width="15" height="19" rx="2" ry="2" fill="currentColor" opacity="0.25" />

        {/* middle card */}
        <rect x="4" y="3" width="15" height="19" rx="2" ry="2" fill="currentColor" opacity="0.55" />

        {/* front card */}
        <rect x="6" y="1" width="15" height="19" rx="2" ry="2" fill="currentColor" />
    </SvgIcon>
);

export default SWUDeckIcon;