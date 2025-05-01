/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['karabast-data.s3.amazonaws.com'],
    },
    eslint: {
        // TODO: re-enable linting if we can get vscode to do auto-fixes like with the BE repo setup
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
