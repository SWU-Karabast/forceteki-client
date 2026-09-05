import type { Meta, StoryObj } from '@storybook/nextjs';
import { Box, Typography } from '@mui/material';
import { HealthBadge, PowerBadge } from '@/app/_components/_sharedcomponents/Cards/GameCard/StatBadge';
import StatusIcon from '@/app/_components/_sharedcomponents/Cards/GameCard/StatusIcon';

const meta = {
    title: 'GameCard',
    parameters: {
        layout: 'centered',
    },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const galleryStyles = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    color: 'white',
};

const itemStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
};

export const StatBadges: Story = {
    render: () => (
        <Box sx={galleryStyles}>
            {[
                { label: 'Health', Badge: HealthBadge },
                { label: 'Power', Badge: PowerBadge },
            ].map(({ label, Badge }) => (
                <Box key={label} sx={itemStyles}>
                    <Badge value={5} sx={{ width: '60px', fontSize: '32px' }} />
                    <Typography>{label}</Typography>
                </Box>
            ))}
        </Box>
    ),
};

export const StatusIcons: Story = {
    render: () => (
        <Box sx={galleryStyles}>
            {(['hidden', 'sentinel', 'blank', 'lock', 'stolen'] as const).map((type) => (
                <Box key={type} sx={itemStyles}>
                    <Box sx={{ width: '64px' }}>
                        <StatusIcon type={type} />
                    </Box>
                    <Typography sx={{ textTransform: 'capitalize' }}>{type}</Typography>
                </Box>
            ))}
        </Box>
    ),
};
