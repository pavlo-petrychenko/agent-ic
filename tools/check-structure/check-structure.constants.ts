import type { StructureAreas } from './check-structure.typedefs.ts';

export const STRUCTURE_AREAS: StructureAreas = {
  backendSource: 'apps/backend/src',
  backendTest: 'apps/backend/test',
  webSource: 'apps/web/src',
  webTest: 'apps/web/test',
};

export const PATH_SEPARATOR = '/';
export const EXIT_FAILURE = 1;

export const IGNORED_DIRECTORIES: ReadonlySet<string> = new Set([
  'node_modules',
  'dist',
  '.dev',
  '.turbo',
  'coverage',
]);

export const GENERATED_FILE_PATTERN = /\.(generated|gen)\.ts$/;

export const KEBAB_TOPIC = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const CAMEL_TOPIC = /^[a-z][A-Za-z0-9]*$/;
export const HOOK_TOPIC = /^use[A-Z][A-Za-z0-9]*$/;
export const COMPONENT_NAME = /^[A-Z][A-Za-z0-9]*$/;
export const LOCALE_NAME = /^[a-z]{2}$/;
export const NO_TESTS: readonly string[] = [];

export const SPEC_SUFFIX_PATTERN = /\.ts$/;
export const SPEC_SUFFIX_REPLACEMENT = '.spec.ts';
export const SPEC_FILE_EXTENSION = '.spec.ts';

export const BACKEND_SOURCE_ROOT_FILE = 'main.ts';
export const INDEX_FILE = 'index.ts';
export const MODULE_FILE_SUFFIX = '.module.ts';
export const APP_MODULE_FILE = 'app.module.ts';

export const BackendRoot = {
  App: 'app',
  Modules: 'modules',
  Platform: 'platform',
} as const;

export const BackendTestRoot = {
  Integration: 'integration',
  Support: 'support',
} as const;

export const DATABASE_PLATFORM_MODULE = 'database';
export const PLATFORM_KIND_NAME_EXCEPTIONS: readonly string[] = ['errors'];
export const DATABASE_CLIENTS_MODULE_FILE = 'database-clients.module.ts';
export const USE_CASES_FOLDER = 'use-cases';
export const COMMANDS_FOLDER = 'commands';

export const BACKEND_KIND_SUFFIXES: Readonly<Record<string, readonly string[]>> = {
  resolvers: ['.resolver.ts'],
  controllers: ['.controller.ts'],
  processors: ['.processor.ts'],
  listeners: ['.listener.ts'],
  graphql: ['.graphql'],
  jobs: ['.job.ts'],
  events: ['.event.ts'],
  channels: ['.channel.ts'],
  [USE_CASES_FOLDER]: ['.use-case.ts'],
  services: ['.service.ts'],
  repositories: ['.repository.ts'],
  gateways: ['.gateway.ts', '.fake.ts'],
  db: ['.table.ts'],
  errors: ['.error.ts'],
  schemas: ['.schema.ts'],
  typedefs: ['.typedefs.ts'],
  constants: ['.constants.ts'],
  helpers: ['.helpers.ts'],
  guards: ['.guard.ts'],
  decorators: ['.decorator.ts'],
  filters: ['.filter.ts'],
  interceptors: ['.interceptor.ts'],
  generated: ['.generated.ts'],
  [COMMANDS_FOLDER]: ['.command.ts'],
};

export const BACKEND_KIND_FOLDERS: readonly string[] = Object.keys(BACKEND_KIND_SUFFIXES);

export const BACKEND_MODULE_KINDS: readonly string[] = BACKEND_KIND_FOLDERS.filter(
  (folder) => folder !== COMMANDS_FOLDER,
);

export const BACKEND_PLATFORM_KINDS: readonly string[] = BACKEND_MODULE_KINDS.filter(
  (folder) => folder !== USE_CASES_FOLDER,
);

export const BACKEND_APP_KINDS: readonly string[] = [
  COMMANDS_FOLDER,
  'schemas',
  'constants',
  'typedefs',
  'helpers',
];

export const BACKEND_TEST_SUPPORT_SUFFIXES: Readonly<Record<string, readonly string[]>> = {
  setup: ['.setup.ts'],
  fakes: ['.fake.ts'],
  fixtures: ['.fixture.ts'],
  modules: ['.module.ts'],
  services: ['.service.ts'],
  helpers: ['.helpers.ts'],
  controllers: ['.controller.ts'],
  resolvers: ['.resolver.ts'],
  processors: ['.processor.ts'],
  jobs: ['.job.ts'],
  errors: ['.error.ts'],
  schemas: ['.schema.ts'],
  constants: ['.constants.ts'],
  typedefs: ['.typedefs.ts'],
};

export const WebRoot = {
  App: 'app',
  Routes: 'routes',
  Features: 'features',
  Shared: 'shared',
} as const;

export const WEB_SOURCE_ROOT_FILES: readonly string[] = ['main.tsx', 'vite-env.d.ts'];
export const WEB_APP_ROOT_FILES: readonly string[] = [
  'bootstrap.tsx',
  'bootstrap.test.tsx',
  'router.tsx',
  'router.test.tsx',
];
export const WEB_ROUTE_FILE = /\.tsx?$/;
export const COMPONENT_INDEX_FILE = 'index.ts';
export const JSON_FILE = /\.json$/;
export const WEB_FEATURE_ROOT_FILE = 'index.ts';
export const STYLES_FILE = /\.s?css$/;
export const STYLES_ENTRY_FILE = 'index.ts';

export const WEB_APP_KINDS: readonly string[] = [
  'components',
  'providers',
  'layouts',
  'constants',
  'typedefs',
];

export const WEB_FEATURE_FLAT_KINDS: readonly string[] = ['constants', 'typedefs'];
export const WEB_FEATURE_COMPONENT_LAYERS: readonly string[] = ['view', 'containers'];

export const WEB_FEATURE_LAYER_KINDS: Readonly<Record<string, readonly string[]>> = {
  communication: ['gql', 'hooks', 'helpers', 'schemas', 'fixtures'],
  logic: ['hooks', 'helpers', 'schemas'],
  storage: ['contexts', 'hooks', 'helpers'],
};

export const WEB_COMPONENT_KINDS: ReadonlySet<string> = new Set([
  'components',
  'layouts',
  'providers',
  'fields',
]);

export const WEB_GQL_KIND = 'gql';
export const WEB_LOCALES_KIND = 'locales';
export const WEB_GQL_OPERATION_FOLDERS: readonly string[] = [
  'query',
  'mutation',
  'subscription',
  'fragment',
];

export const WEB_KIND_SUFFIXES: Readonly<Record<string, readonly string[]>> = {
  helpers: ['.helpers.ts', '.helpers.tsx'],
  contexts: ['.context.ts', '.context.tsx'],
  clients: ['.client.ts'],
  errors: ['.error.ts'],
  schemas: ['.schema.ts'],
  constants: ['.constants.ts'],
  typedefs: ['.typedefs.ts', '.d.ts'],
  fixtures: ['.fixture.ts', '.fixture.tsx'],
  setup: ['.setup.ts'],
};

export const WEB_HOOKS_KIND = 'hooks';
export const WEB_HOOK_SUFFIXES: readonly string[] = ['.ts'];
export const WEB_HOOK_TEST_SUFFIXES: readonly string[] = ['.test.ts', '.test.tsx'];
export const WEB_TEST_SUFFIXES: readonly string[] = ['.test.ts', '.test.tsx'];

export const WEB_SHARED_UI = 'ui';
export const WEB_SHARED_STYLES = 'styles';
export const WEB_SHARED_GENERIC_KINDS: readonly string[] = [
  'hooks',
  'helpers',
  'contexts',
  'clients',
  'errors',
  'schemas',
  'constants',
  'typedefs',
  'fields',
];

export const WEB_SHARED_KINDS: Readonly<Record<string, readonly string[]>> = {
  api: ['clients', 'helpers', 'errors', 'schemas', 'constants', 'typedefs'],
  config: ['helpers', 'schemas', 'constants', 'typedefs'],
  forms: ['hooks', 'fields', 'contexts', 'helpers', 'typedefs'],
  i18n: ['clients', 'hooks', 'helpers', 'locales', 'constants', 'typedefs'],
};

export const WEB_TEST_SUPPORT_KINDS: readonly string[] = [
  'setup',
  'components',
  'helpers',
  'constants',
  'typedefs',
  'fixtures',
];

export const WEB_TEST_SUPPORT_ROOT = 'support';
export const WEB_TEST_INTEGRATION_ROOT = 'integration';

export const COMPONENT_OWN_SUFFIXES: readonly string[] = [
  '.tsx',
  '.module.scss',
  '.typedefs.ts',
  '.constants.ts',
];
export const COMPONENT_TEST_SUFFIXES: readonly string[] = ['.test.tsx', '.test.ts'];
export const COMPONENT_STORY_SUFFIX = '.stories.tsx';
export const COMPONENT_HOOK_SUFFIXES: readonly string[] = ['.ts'];
export const COMPONENT_CONTEXT_SUFFIXES: readonly string[] = ['.context.ts', '.context.tsx'];

export const MESSAGES = {
  unknownFolder: (name: string, allowed: readonly string[]): string =>
    `unknown folder "${name}"; allowed: ${allowed.join(', ')}`,
  unexpectedFile: (name: string, allowed: readonly string[]): string =>
    `file "${name}" is not allowed here; allowed: ${allowed.join(', ')}`,
  needsFile: (name: string): string => `"${name}" must be a file here, not a folder`,
  nestedKind: (kind: string): string =>
    `kind folder "${kind}" is flat; nested folders are not allowed`,
  badSuffix: (name: string, kind: string, suffixes: readonly string[]): string =>
    `file "${name}" does not match <topic>${suffixes.join(' or <topic>')} for "${kind}/"`,
  moduleRootFile: (name: string, moduleName: string): string =>
    `module root may hold only ${moduleName}${MODULE_FILE_SUFFIX} and ${INDEX_FILE}, found "${name}"`,
  platformKindName: (name: string): string =>
    `platform folder "${name}" is named after a kind folder; pick another name`,
  platformRootFile: (name: string): string =>
    `"${name}" sits in the platform root; put it in a platform folder`,
  integrationSpecOnly: (name: string): string =>
    `integration holds .spec.ts files only, found "${name}"`,
  webIntegrationTestOnly: (name: string): string =>
    `integration holds .test.ts and .test.tsx files only, found "${name}"`,
  componentFolder: (name: string): string => `"${name}" must be a PascalCase component folder`,
  componentFile: (name: string, folder: string): string =>
    `file "${name}" is not allowed in component folder "${folder}"; allowed: ${folder}.tsx, ${folder}.module.scss, ${folder}.test.tsx, ${folder}.typedefs.ts, ${folder}.constants.ts, index.ts, useX.ts, x.context.ts`,
  gqlFolder: (name: string): string =>
    `gql holds query, mutation, subscription and fragment folders, found "${name}"`,
  gqlFile: (name: string): string => `gql folders hold .graphql files only, found "${name}"`,
  localeFolder: (name: string): string => `locales holds one folder per language, found "${name}"`,
  localeFile: (name: string): string => `locale folders hold .json files only, found "${name}"`,
  routeFile: (name: string): string => `routes hold .ts and .tsx route files only, found "${name}"`,
  stylesFile: (name: string): string =>
    `styles holds .css and .scss files and the index.ts entry only, found "${name}"`,
  tooShort: (): string => 'a file must sit inside an area folder',
} as const;
