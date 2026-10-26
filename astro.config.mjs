// @ts-check
import { defineConfig } from 'astro/config';

// TODO: înlocuiește cu domeniul final (folosit pentru og:image absolut și canonical).
// Pe Netlify, variabila URL e setată automat cu domeniul principal al site-ului.
const SITE = process.env.SITE_URL || process.env.URL || 'https://diana-si-dragos.netlify.app';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  devToolbar: { enabled: false },
});
