import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // D3 usa la hora local: los tests fijan la zona para no depender de la máquina.
    env: { TZ: 'America/Guayaquil' },
  },
});
