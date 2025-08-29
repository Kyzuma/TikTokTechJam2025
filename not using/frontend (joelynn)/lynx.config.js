import { defineConfig } from '@lynx-js/rspeedy';
import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin';
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';

export default defineConfig({
  // Root default: if no env is selected, use lynx entry (prevents index.js fallback)
  source: {
    entry: { index: './src/index.lynx.jsx' },
  },
  plugins: [
    pluginQRCode({
      schema(url) {
        return `${url}?fullscreen=true`;
      },
    }),
    pluginReactLynx(),
  ],
  environments: {
    web: {
      source: {
        entry: { index: './src/index.web.jsx' },
      },
      output: { assetPrefix: '/' },
    },
    lynx: {
      source: {
        entry: { index: './src/index.lynx.jsx' },
      },
    },
  },
});
