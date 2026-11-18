import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Transcription runs on the CPU (ADR-31), so the WebGPU build and its 28 MB WASM never ship.
  resolve: { alias: { 'onnxruntime-web/webgpu': 'onnxruntime-web/wasm' } },
  server: { allowedHosts: ['.onamp.dev'] },
});
