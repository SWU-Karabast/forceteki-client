import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [tsconfigPaths(), react()],
        test: {
          // an example of file based convention,
          // you don't have to follow it
          include: ["**/*.{test,spec}.tsx"],
          name: "unit",
          environment: "jsdom",
          setupFiles: "./vitest.setup.ts",
        },
      },
    ],
  },
});
