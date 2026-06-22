import type { Meta, StoryObj } from '@storybook/nextjs';
import { default as PulseButtonComponent } from '@/app/components/Button/PulseButton';
import { Box } from '@mui/material';

const meta = {
    title: 'Design/Buttons',
    component: PulseButtonComponent,
    parameters: {
        layout: 'centered',
    },
} satisfies Meta<typeof PulseButtonComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PulseButton: Story = {
    args: {
        variant: 'danger',
        text: 'Pass',
        cooldown: false
    },
    decorators: [
        (Story) => (<Box sx={{ display: 'flex', width: '220px' }}>
            <Story />
        </Box>)
    ]
};