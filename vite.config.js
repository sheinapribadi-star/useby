import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.BASE_PATH || '/useby/') : '/',
}));
