import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SheetAI Copilot',
        short_name: 'SheetAI',
        description: 'Excel spreadsheet with AI side prompt and interactive dashboard generator',
        theme_color: '#0f172a',
        background_color: '#030712',
        display: 'standalone',
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
});
