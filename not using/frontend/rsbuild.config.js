import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [pluginReact()],
  source: { entry: { index: './src/index.web.jsx' } },
  server: {
    publicDir: [{ name: path.join(__dirname, 'dist') }], // serve main.web.bundle
  },
});
