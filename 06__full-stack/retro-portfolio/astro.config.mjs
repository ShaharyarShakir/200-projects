// @ts-check
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import { normalizePath } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDetailRoute = path.join(__dirname, 'src/pages/projects/[id].astro');
const projectsDataFile = path.join(__dirname, 'src/components/projects/projectsData.ts');

/** Clear Astro's getStaticPaths cache when project data changes (dev-only). */
function watchProjectsData() {
  return {
    name: 'watch-projects-data',
    handleHotUpdate({ file, server }) {
      const normalized = normalizePath(file);
      if (
        normalized !== normalizePath(projectsDataFile) &&
        !normalized.endsWith('/projectsData.ts')
      ) {
        return;
      }

      const routeMods = server.moduleGraph.getModulesByFile(projectDetailRoute);
      if (routeMods) {
        for (const mod of routeMods) {
          server.moduleGraph.invalidateModule(mod);
        }
      }

      for (const environment of Object.values(server.environments)) {
        environment.hot?.send('astro:content-changed', {});
      }

      server.environments.client?.hot?.send({
        type: 'full-reload',
        path: '*',
      });

      return [];
    },
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx()],

  vite: {
    plugins: [tailwindcss(), watchProjectsData()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  },
});