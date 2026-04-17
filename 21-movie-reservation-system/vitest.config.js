// vitest.config.js

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Tests secuenciales para evitar conflictos de BD
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    // Variables de entorno para tests
    env: {
      NODE_ENV: 'test',
    },
    // Setup global antes de cada archivo de tests
    setupFiles: ['./tests/setup.js'],
    // Timeout más generoso para operaciones de BD
    testTimeout: 15000,
    hookTimeout: 15000,
    // Cobertura
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/app/**', 'src/lib/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
})
