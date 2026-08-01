import type { Meta, StoryObj } from '@storybook/nextjs';
import { default as GradientBorderButtonComponent } from '@/app/_components/_sharedcomponents/_styledcomponents/GradientBorderButton';
import { Box } from '@mui/material';

const meta = {
    title: 'Design/Buttons',
    component: GradientBorderButtonComponent,
    parameters: {
        layout: 'centered',
    },
    argTypes: {
        fillColor: {
            control: { type: 'color' }, // Enables the Storybook color picker
        },
    },
} satisfies Meta<typeof GradientBorderButtonComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GradientBorderButton: Story = {
    args: {
        fillColor: undefined,
        children: 'Button Text'
    },
    decorators: [
        (Story) => (<Box sx={{ display: 'flex', width: '220px' }}>
            <Story />
        </Box>)
    ]
};