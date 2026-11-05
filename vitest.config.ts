import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,

    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts'
    ],

    environment: 'node',

    clearMocks: true,
    restoreMocks: true,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts'
      ]
    }
  }
});