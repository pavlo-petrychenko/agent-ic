import { readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';
import {
  CONTENT_TYPE_HEADER,
  DEFAULT_LOCALE,
  HTML_CONTENT_TYPE,
  PLUGIN_NAME,
  REDIRECTS_FILE,
  ROBOTS_FILE,
  SITEMAP_FILE,
  TEMPLATE_FILE,
  URL_SEPARATOR,
} from './vite.constants.ts';
import type { LandingEnv } from './vite.env.ts';
import {
  buildRedirects,
  buildRobots,
  buildSitemap,
  localeOfEntry,
  localeOfPath,
  pageEntries,
  pageEntryPath,
  pageValues,
  renderTemplate,
} from './vite.render.ts';

const toUrlPath = (root: string, file: string): string =>
  `${URL_SEPARATOR}${relative(root, file).split(sep).join(URL_SEPARATOR)}`;

export const landingPages = (root: string, env: LandingEnv, year: number): Plugin => {
  const templatePath = join(root, TEMPLATE_FILE);
  const generatedEntries = new Set(
    Object.values(pageEntries(root)).filter((entry) => entry !== templatePath),
  );
  const readTemplate = (): string => readFileSync(templatePath, 'utf8');

  return {
    name: PLUGIN_NAME,
    resolveId: (id) => (generatedEntries.has(id) ? id : null),
    load: (id) => (generatedEntries.has(id) ? readTemplate() : null),
    transformIndexHtml: {
      order: 'pre',
      handler: (html, context) =>
        renderTemplate(
          html,
          pageValues(localeOfEntry(toUrlPath(root, context.filename)), env, year),
        ),
    },
    configureServer: (server) => {
      server.middlewares.use((request, response, next) => {
        const locale = localeOfPath(request.url ?? URL_SEPARATOR);
        if (locale === null || locale === DEFAULT_LOCALE) {
          next();
          return;
        }
        server
          .transformIndexHtml(pageEntryPath(locale), readTemplate(), request.originalUrl)
          .then((html) => {
            response.setHeader(CONTENT_TYPE_HEADER, HTML_CONTENT_TYPE);
            response.end(html);
          })
          .catch(next);
      });
    },
    generateBundle() {
      const files: Record<string, string> = {
        [REDIRECTS_FILE]: buildRedirects(env.LANDING_APP_URL),
        [ROBOTS_FILE]: buildRobots(env.LANDING_SITE_URL),
        [SITEMAP_FILE]: buildSitemap(env),
      };
      for (const [fileName, source] of Object.entries(files)) {
        this.emitFile({ type: 'asset', fileName, source });
      }
    },
  };
};
