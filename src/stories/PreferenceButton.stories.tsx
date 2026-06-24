import type { Meta, StoryObj } from '@storybook/nextjs';
import { default as PreferenceButtonComponent } from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { Box } from '@mui/material';

const meta = {
    title: 'Design/Buttons',
    component: PreferenceButtonComponent,
    parameters: {
        layout: 'centered',
    },
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: ['concede', 'standard', 'warning'],
        }
    }
} satisfies Meta<typeof PreferenceButtonComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PreferenceButton: Story = {
    args: {
        variant: 'standard',
        text: 'Button text',
        disabled: false,
        buttonFnc: () => {},
    },
    decorators: [
        (Story) => (<Box sx={{ display: 'flex', width: '220px' }}>
            <Story />
        </Box>)
    ]
};
