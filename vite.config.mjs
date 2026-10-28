import { defineConfig } from 'vite';
import { buildId } from './scripts/build-id.mjs';
export default defineConfig({ base: process.env.BASE_PATH || './', define: { __BUILD_ID__: JSON.stringify(buildId()) }, build: { target: 'es2022' } });
