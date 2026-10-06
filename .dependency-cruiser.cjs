const backend = '^apps/backend/src/';
const modules = `${backend}modules/`;
const platform = `${backend}platform/`;
const web = '^apps/web/src/';
const features = `${web}features/`;

const inbound = '\\.(resolver|controller|processor|listener)\\.ts$';
const useCase = '\\.use-case\\.ts$';
const service = '\\.service\\.ts$';
const repository = '\\.repository\\.ts$';
const gateway = '\\.(gateway|fake)\\.ts$';

const moduleIndex = `${modules}[^/]+/index\\.ts$`;
const featureIndex = `${features}[^/]+/index\\.ts$`;
const featureShared = `${features}$1/(constants|typedefs)/`;
const testFile = '\\.test\\.tsx?$';
const backendTestSupport = '^apps/backend/test/';
const appTestSupport = '^apps/[^/]+/test/';
const appSource = '^apps/[^/]+/src/';
const testOrStoryFile = '\\.(spec|test|stories)\\.tsx?$';

const systemDatabaseService = `${platform}database/services/system-database\\.service\\.ts$`;
const systemDatabaseAllowList = [
  `${platform}(database|outbox|queues)/`,
  `${modules}identity/repositories/membership-directory\\.repository\\.ts$`,
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
      'backend-inbound-uses-use-cases-only',
      { path: inbound, pathNot: [platform, backendTestSupport] },
      { path: [service, repository, gateway] },
    ),
    forbidden(
      'backend-no-use-case-to-use-case',
      { path: useCase, pathNot: backendTestSupport },
      { path: useCase },
    ),
    forbidden(
      'backend-use-case-not-up',
      { path: useCase, pathNot: backendTestSupport },
      { path: inbound },
    ),
    forbidden(
      'backend-service-not-up',
      { path: service, pathNot: backendTestSupport },
      { path: [useCase, inbound] },
    ),
    forbidden(
      'backend-repository-not-up',
      { path: repository, pathNot: backendTestSupport },
      { path: [service, useCase, inbound], pathNot: systemDatabaseService },
    ),
    forbidden(
      'backend-cross-module-through-index',
      { path: `${modules}([^/]+)/` },
      { path: `${modules}[^/]+/`, pathNot: [`${modules}$1/`, moduleIndex] },
    ),
    forbidden(
      'backend-module-internals-private',
      { path: backend, pathNot: [modules, platform] },
      { path: `${modules}[^/]+/`, pathNot: moduleIndex },
    ),
    forbidden(
      'backend-platform-never-imports-modules',
      { path: platform },
      { path: `${backend}(modules|app)/` },
    ),
    forbidden(
      'backend-system-database-allow-list',
      { path: backend, pathNot: [systemDatabaseService, ...systemDatabaseAllowList] },
      { path: systemDatabaseService },
    ),
    forbidden(
      'web-communication-layer',
      { path: `${features}([^/]+)/communication/` },
      { path: `${features}$1/`, pathNot: [`${features}$1/communication/`, featureShared] },
    ),
    forbidden(
      'web-logic-layer',
      { path: `${features}([^/]+)/logic/` },
      { path: `${features}$1/`, pathNot: [`${features}$1/(logic|storage)/`, featureShared] },
    ),
    forbidden(
      'web-storage-layer',
      { path: `${features}([^/]+)/storage/` },
      { path: `${features}$1/`, pathNot: [`${features}$1/storage/`, featureShared] },
    ),
    forbidden(
      'web-view-layer',
      { path: `${features}([^/]+)/view/` },
      { path: `${features}$1/`, pathNot: [`${features}$1/(view|storage)/`, featureShared] },
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
        pathNot: [`${features}$1/(communication|logic|storage|view|containers)/`, featureShared],
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
    forbidden('web-shared-never-imports-features', { path: `${web}shared/` }, { path: features }),
    forbidden(
      'web-radix-only-in-shared-ui',
      { path: web, pathNot: `${web}shared/ui/` },
      { path: '(^|node_modules/)(@radix-ui/|radix-ui(/|$))' },
    ),
    forbidden(
      'web-react-flow-only-in-shared-ui-flow',
      { path: web, pathNot: `${web}shared/ui/flow/` },
      { path: '(^|node_modules/)@xyflow/' },
    ),
    forbidden(
      'apps-never-import-each-other',
      { path: '^apps/([^/]+)/' },
      { path: '^apps/[^/]+/', pathNot: '^apps/$1/' },
    ),
    forbidden('packages-never-import-apps', { path: '^packages/' }, { path: '^apps/' }),
    forbidden(
      'flow-imports-no-node-builtins',
      { path: '^packages/flow/src/' },
      { dependencyTypes: ['core'] },
    ),
    forbidden(
      'flow-imports-only-zod',
      { path: '^packages/flow/src/', pathNot: '\\.spec\\.ts$' },
      { path: 'node_modules/', pathNot: 'node_modules/zod/' },
    ),
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['^(apps|packages)/[^/]+/dist/', '\\.generated\\.ts$', '(^|/)\\.claude/'] },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['source', 'import', 'require', 'node', 'default'],
      mainFields: ['module', 'main', 'types'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
