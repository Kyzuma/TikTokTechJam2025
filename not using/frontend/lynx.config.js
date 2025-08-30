import { defineConfig } from '@lynx-js/rspeedy';
import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin';
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';

export default defineConfig({
  // default to lynx entry to avoid falling back to src/index.js
  source: { entry: { index: './src/index.lynx.jsx' } },
  plugins: [
    pluginQRCode({ schema: (url) => `${url}?fullscreen=true` }),
    pluginReactLynx(),
  ],
  environments: {
    web:  { source: { entry: { index: './src/index.web.jsx' } }, output: { assetPrefix: '/' } },
    lynx: { source: { entry: { index: './src/index.lynx.jsx' } } },
  },
});
