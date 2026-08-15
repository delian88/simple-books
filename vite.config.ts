// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // Build for node environment (Render) instead of the default Cloudflare worker.
    server: { 
      preset: 'node-server',
      entry: "server" 
    },
  },
  vite: {
    server: {
      // Allow all hosts (for Render deployment and other hosting providers)
      allowedHosts: ['simple-books-06hs.onrender.com', '.onrender.com'],
      host: true,
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
