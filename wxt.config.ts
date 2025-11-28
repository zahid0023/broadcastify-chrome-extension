import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',

manifest: {
  name: 'Capture & Transcribe',
  version: '1.0.0',
  description: 'Capture tab audio and transcribe it.',
  permissions: ["tabCapture", "storage","offscreen"],
  action: { default_popup: "entrypoints/popup/index.html" },
  background: { service_worker: "entrypoints/background/index.ts" }
}

});