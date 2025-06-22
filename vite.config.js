import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa'




console.warn = () => {};

export default defineConfig({
	plugins: [react(),  VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo.png', 'robots.txt'],
      manifest: {
        name: 'Groceroo',
        short_name: 'Groceroo',
        description: 'Your grocery delivery app',
        theme_color: '#2E8B57',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/favicon2.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })],
	server: {
		port:3000
	},
	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json', ],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
