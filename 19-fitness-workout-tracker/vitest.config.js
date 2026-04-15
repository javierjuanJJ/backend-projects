// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // Ejecutar los tests en serie para evitar conflictos de DB
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/server/**/*.js'],
      exclude: ['src/server/app.js', 'src/lib/**'],
    },
    // Timeout generoso para operaciones de DB
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
