import { defineConfig } from 'vite';
import { buildId } from './scripts/build-id.mjs';
export default defineConfig({ base: './', define: { __BUILD_ID__: JSON.stringify(buildId()) }, build: { target: 'es2022' } });
