import type { Preview } from '@storybook/nextjs';
import { GlobalStyles } from '@mui/material';
import { ThemeContextProvider } from '../src/app/_contexts/Theme.context';
import { barlow, barlowSemiCondensed } from '../src/app/_theme/fonts';

const preview: Preview = {
    decorators: [
        (Story) => (
            <ThemeContextProvider>
                <GlobalStyles styles={{
                    ':root': {
                        '--font-barlow': barlow.style.fontFamily,
                        '--font-barlow-semi-condensed': barlowSemiCondensed.style.fontFamily,
                    },
                    // Let Storybook's background control supply the preview background.
                    body: { backgroundImage: 'none' },
                }} />
                <Story />
            </ThemeContextProvider>
        ),
    ],
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
