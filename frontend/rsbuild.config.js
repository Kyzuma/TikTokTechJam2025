import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginLynx } from '@lynx-js/react-rsbuild-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginLynx(), // Add this for .lynx.jsx files
  ],
  source: {
    entry: { 
      index: './src/index.web.jsx',
      // Add Lynx entry if needed
      lynx: './src/index.lynx.jsx'
    },
  },
  server: {
    publicDir: [
      {
        name: path.join(__dirname, 'dist'),
      },
    ],
  },
  // Add WASM support
  tools: {
    rspack: {
      experiments: {
        asyncWebAssembly: true,
      },
    },
  },
});