import type { Meta, StoryObj } from '@storybook/nextjs';
import Button from '@/app/components/Button/Button';

const meta = {
    title: 'Design/Button',
    component: Button,
    parameters: {
        layout: 'centered',
    },
} satisfies Meta<typeof Button>;

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
