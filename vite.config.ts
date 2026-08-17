// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Force Nitro to build for Node.js instead of Cloudflare (which is Lovable's default)
// This is required because Prisma Client uses __dirname which crashes in Cloudflare Edge environments.
process.env.NITRO_PRESET = 'node-server';

export default defineConfig({
  tanstackStart: {
    ssr: false,
    server: { 
      preset: 'node-server',
      entry: "server",
    },
  },
  vite: {
    server: {
      // Allow all hosts (for Render deployment and other hosting providers)
      allowedHosts: ['simple-books-06hs.onrender.com', '.onrender.com'],
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: () => 'app.js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'assets/app.css';
            }
            return 'assets/[name].[ext]';
          },
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
        }
      }
    }
  },
});
