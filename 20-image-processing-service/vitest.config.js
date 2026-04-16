import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',
    include:     ['tests/**/*.test.js'],
    coverage: {
      provider:   'v8',
      reporter:   ['text', 'json', 'html', 'lcov'],
      include:    ['src/server/**/*.js'],
      exclude:    ['src/server/docs/**', 'src/server/lib/prisma.js'],
      thresholds: {
        lines:      80,
        functions:  80,
        branches:   75,
        statements: 80,
      },
    },
    setupFiles: ['./tests/setup.js'],
  },
})
