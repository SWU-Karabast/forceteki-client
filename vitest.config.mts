import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

// next.config.mjs turns SVG imports into React components with SVGR; the tests only need something renderable
const svgStub: Plugin = {
    name: 'svg-stub',
    enforce: 'pre',
    load(id) {
        if (id.split('?')[0].endsWith('.svg')) {
            return 'export default function Svg() { return null; }';
        }
    },
};

export default defineConfig({
    plugins: [svgStub, react()],
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    test: {
        include: ['test/**/*.test.{ts,tsx}'],
        environment: 'jsdom',
        globalSetup: ['test/helpers/downloadGameStates.ts'],
        setupFiles: ['test/helpers/setup.ts'],
        // the backend the client connects to, as .env.development sets it for `npm run dev`
        env: { NEXT_PUBLIC_ROOT_URL: 'http://localhost:9500' },
        clearMocks: true,
        restoreMocks: true,
    },
});
