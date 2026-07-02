import type { Meta, StoryObj } from '@storybook/nextjs';
import RecoveryErrorDialog from '@/app/_components/_sharedcomponents/Error/RecoveryErrorDialog';

const meta = {
    title: 'Design/Dialogs/RecoveryErrorDialog',
    component: RecoveryErrorDialog,
    parameters: {
        layout: 'centered',
    },
    args: {
        open: true,
        title: 'Connection lost',
        message: 'Connection lost. Please try again.\nUser ID: anonymous',
        onClose: () => {},
        actions: [
            { label: 'Reconnect', onClick: () => {}, variant: 'warning' },
            { label: 'Home', onClick: () => {}, variant: 'standard' },
        ],
    },
} satisfies Meta<typeof RecoveryErrorDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConnectionLost: Story = {};

export const RetryableError: Story = {
    args: {
        title: 'Decks could not be loaded',
        message: 'Server error when fetching decks.',
        actions: [
            { label: 'Retry', onClick: () => {}, variant: 'warning' },
            { label: 'Close', onClick: () => {}, variant: 'standard' },
        ],
    },
};
