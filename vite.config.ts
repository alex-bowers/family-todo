import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  plugins: [sveltekit()],
  envPrefix: ["VITE_", "PUBLIC_"],
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/contract/**/*.test.ts"],
    environment: "node",
    globals: true,
    setupFiles: ["./tests/vitest.setup.ts"],
    teardownTimeout: 1000,
    retry: 1,
    isolate: true,
    threads: false,
    singleThread: true,
    watch: false,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      reporter: ["text", "lcov"],
      include: ["src/lib/**/*.ts"],
    },
  },
  server: {
    watch: {
      ignored: ["**/node_modules/**", "**/.git/**"],
    },
  },
});
