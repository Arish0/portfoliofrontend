import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const envDir = path.resolve(dirname, '..');

export default defineConfig({
  root: path.resolve(dirname),
  envDir,
  plugins: [
    react(),
    {
      name: 'hari-admin-dev-route',
      configureServer(server) {
        server.middlewares.use((req: { url?: string }, _res, next) => {
          const pathname = req.url?.split('?')[0];
          if (pathname === '/hari-admin' || pathname === '/hari-admin/') {
            req.url = '/admin.html';
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5173
  },
  build: {
    outDir: '../backend/dist/client',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: path.resolve(dirname, 'index.html'),
        admin: path.resolve(dirname, 'admin.html')
      }
    }
  }
});
