import { defineConfig } from 'vitest/config';

// Tests SQL contre un vrai PostgreSQL (voir scripts/db-test-server.sh)
export default defineConfig({
  test: {
    include: ['tests/db/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});
