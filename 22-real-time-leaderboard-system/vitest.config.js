// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Run tests sequentially so DB operations don't race
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    // Load .env.test automatically if it exists
    env: {
      NODE_ENV: 'test',
    },

    // Coverage config (pnpm vitest run --coverage)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.js'],
      exclude: [
        'src/lib/prisma.js',  // singleton, tested indirectly
        'src/lib/redis.js',
        'config.js',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },

    // Test file pattern
    include: ['tests/**/*.test.js'],

    // Timeout per test (ms)
    testTimeout: 15000,

    // Setup file (runs before all suites)
    globalSetup: './tests/setup.global.js',
  },
})
