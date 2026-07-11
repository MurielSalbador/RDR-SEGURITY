// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // La landing se prerenderiza y se sirve desde CDN; /api/contact sigue siendo
  // serverless porque declara `export const prerender = false`.
  output: 'static',
  // TODO: cuando esté el dominio definitivo, setear `site: 'https://...'`
  // para habilitar canonical + Open Graph con URLs absolutas en Layout.astro.
  integrations: [react()],
  adapter: vercel()
});