import type { Meta, StoryObj } from '@storybook/nextjs';
import PulseButton from '@/app/components/Button/PulseButton';

const meta = {
    title: 'Design/PulseButton',
    component: PulseButton,
    parameters: {
        layout: 'centered',
    },
} satisfies Meta<typeof PulseButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Variants: Story = {
    args: {
        variant: 'danger',
        text: 'Pass',
        cooldown: true
    },
};
