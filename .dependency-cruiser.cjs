const backend = '^apps/backend/src/';
const modules = `${backend}modules/`;
const web = '^apps/web/src/';
const features = `${web}features/`;

const transport = '\\.(resolver|controller|processor)\\.ts$';
const useCase = '\\.use-case\\.ts$';
const service = '\\.service\\.ts$';
const repository = '\\.repository\\.ts$';

const moduleRootTransport = `${modules}[^/]+/[^/]+\\.(graphql-module|http-module|jobs-module)\\.ts$`;
const moduleIndex = `${modules}[^/]+/index\\.ts$`;
const featureIndex = `${features}[^/]+/index\\.ts$`;
const testFile = '\\.test\\.tsx?$';
const backendTestSupport = '^apps/backend/test/';
const appTestSupport = '^apps/[^/]+/test/';
const appSource = '^apps/[^/]+/src/';
const testOrStoryFile = '\\.(spec|test|stories)\\.tsx?$';

const systemDb = `${backend}platform/db/system-db\\.ts$`;
const systemDbAllowList = [
  `${backend}platform/(db|outbox|queues)/`,
  `${modules}identity/repositories/`,
  `${modules}analytics/repositories/`,
];

const forbidden = (name, from, to) => ({
  name,
  severity: 'error',
  from,
  to,
});

module.exports = {
  forbidden: [
    forbidden(
      'src-never-imports-test-support',
      { path: appSource, pathNot: testOrStoryFile },
      { path: appTestSupport },
    ),
    forbidden(
      'backend-transport-uses-use-case-only',
      { path: transport, pathNot: [`${backend}platform/`, backendTestSupport] },
      {
        path: [service, repository],
      },
    ),
    forbidden('backend-no-use-case-to-use-case', { path: useCase }, { path: useCase }),
    forbidden('backend-use-case-not-up', { path: useCase }, { path: transport }),
    forbidden('backend-service-not-up', { path: service }, { path: [useCase, transport] }),
    forbidden(
      'backend-repository-not-up',
      { path: repository },
      {
        path: [service, useCase, transport],
      },
    ),
    forbidden(
      'backend-cross-module-through-index',
      { path: `${modules}([^/]+)/` },
      {
        path: `${modules}[^/]+/`,
        pathNot: [`${modules}$1/`, moduleIndex],
      },
    ),
    forbidden(
      'backend-module-internals-private',
      { path: backend, pathNot: [modules, `${backend}platform/`] },
      {
        path: `${modules}[^/]+/`,
        pathNot: [moduleIndex, moduleRootTransport],
      },
    ),
    forbidden(
      'backend-platform-never-imports-modules',
      { path: `${backend}platform/` },
      { path: `${backend}(modules|app)/` },
    ),
    forbidden(
      'backend-system-db-allow-list',
      { path: backend, pathNot: [`${backend}platform/db/system-db\\.ts$`, ...systemDbAllowList] },
      { path: systemDb },
    ),
    forbidden(
      'web-communication-layer',
      { path: `${features}([^/]+)/communication/` },
      { path: `${features}$1/`, pathNot: `${features}$1/communication/` },
    ),
    forbidden(
      'web-logic-layer',
      { path: `${features}([^/]+)/logic/` },
      { path: `${features}$1/`, pathNot: `${features}$1/(logic|storage)/` },
    ),
    forbidden(
      'web-storage-layer',
      { path: `${features}([^/]+)/storage/` },
      { path: `${features}$1/`, pathNot: `${features}$1/storage/` },
    ),
    forbidden(
      'web-view-layer',
      { path: `${features}([^/]+)/view/` },
      { path: `${features}$1/`, pathNot: `${features}$1/(view|storage)/` },
    ),
    forbidden(
      'web-view-shared-ui-only',
      { path: `${features}[^/]+/view/`, pathNot: testFile },
      { path: `${web}shared/`, pathNot: `${web}shared/ui/` },
    ),
    forbidden(
      'web-containers-layer',
      { path: `${features}([^/]+)/containers/` },
      {
        path: `${features}$1/`,
        pathNot: `${features}$1/(communication|logic|storage|view|containers)/`,
      },
    ),
    forbidden(
      'web-cross-feature-through-index',
      { path: `${features}([^/]+)/` },
      { path: `${features}[^/]+/`, pathNot: [`${features}$1/`, featureIndex] },
    ),
    forbidden(
      'web-feature-internals-private',
      { path: web, pathNot: features },
      { path: `${features}[^/]+/`, pathNot: featureIndex },
    ),
    forbidden(
      'web-shared-never-imports-features',
      { path: `${web}shared/` },
      {
        path: features,
      },
    ),
    forbidden(
      'web-radix-only-in-shared-ui',
      { path: web, pathNot: `${web}shared/ui/` },
      { path: '(^|node_modules/)(@radix-ui/|radix-ui(/|$))' },
    ),
    forbidden(
      'apps-never-import-each-other',
      { path: '^apps/([^/]+)/' },
      {
        path: '^apps/[^/]+/',
        pathNot: '^apps/$1/',
      },
    ),
    forbidden('packages-never-import-apps', { path: '^packages/' }, { path: '^apps/' }),
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['/dist/', '\\.generated\\.ts$', '(^|/)\\.claude/'] },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['source', 'import', 'require', 'node', 'default'],
      mainFields: ['module', 'main', 'types'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
