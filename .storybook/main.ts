import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
    stories: [
        '../src/**/*.mdx',
        '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
    ],
    addons: [
        '@storybook/addon-a11y',
        '@storybook/addon-docs',
        '@storybook/addon-onboarding'
    ],
    framework: '@storybook/nextjs',
    staticDirs: [
        '../public'
    ],
    core: {
        disableWhatsNewNotifications: true,
    },
    webpackFinal: async (config) => {
        const rules = config.module?.rules ?? [];
        // Next's Storybook image loader returns metadata; our SVG imports are React components.
        for (const rule of rules) {
            if (rule && typeof rule === 'object' && rule.test instanceof RegExp && rule.test.test('.svg')) {
                rule.exclude = rule.exclude ? [rule.exclude, /\.svg$/i] : /\.svg$/i;
            }
        }
        rules.push({
            test: /\.svg$/i,
            use: [{
                loader: '@svgr/webpack',
                // Match the icon treatment in next.config.mjs.
                options: {
                    svgoConfig: {
                        plugins: [
                            { name: 'removeStyleElement' },
                            { name: 'removeAttrs', params: { attrs: 'class' } },
                            {
                                name: 'addAttributesToSVGElement',
                                params: { attributes: [{ fill: 'currentColor' }] },
                            },
                        ],
                    },
                },
            }],
        });
        config.module = { ...config.module, rules };
        return config;
    },
};
export default config;
