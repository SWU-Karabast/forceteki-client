/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['karabast-data.s3.amazonaws.com'],
    },
    eslint: {
        // TODO: re-enable linting if we can get vscode to do auto-fixes like with the BE repo setup
        ignoreDuringBuilds: true,
    },
    webpack(config) {
        // Add SVGR loader for importing SVGs as React components
        config.module.rules.push({
            test: /\.svg$/,
            use: [
                {
                    loader: '@svgr/webpack',
                    options: {
                        svgoConfig: {
                            plugins: [
                                {
                                    name: 'removeStyleElement',
                                },
                                {
                                    name: 'removeAttrs',
                                    params: {
                                        attrs: 'class',
                                    },
                                },
                                {
                                    name: 'addAttributesToSVGElement',
                                    params: {
                                        attributes: [{ fill: 'currentColor' }],
                                    },
                                },
                            ],
                        },
                    },
                },
            ],
        });
        return config;
    },
};

export default nextConfig;
