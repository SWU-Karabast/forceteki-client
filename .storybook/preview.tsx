import type { Preview } from '@storybook/nextjs'

const preview: Preview = {
    parameters: {
        backgrounds: {
            options: {
                dark: { name: 'Dark', value: 'rgba(0, 0, 0, 0.8)' },
            },
        },
    },
    initialGlobals: {
        backgrounds: { value: 'dark' },
    },
};

export default preview;