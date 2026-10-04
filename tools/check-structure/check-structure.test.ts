import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, it } from 'node:test';
import { checkStructure } from './check-structure.helpers.ts';

const TEMP_PREFIX = 'check-structure-';
const BACKEND_SRC = 'apps/backend/src';
const BACKEND_TEST = 'apps/backend/test';
const WEB_SRC = 'apps/web/src';
const WEB_TEST = 'apps/web/test';

const validFiles = [
  `${BACKEND_SRC}/main.ts`,
  `${BACKEND_SRC}/app/app.module.ts`,
  `${BACKEND_SRC}/app/commands/serve.command.ts`,
  `${BACKEND_SRC}/app/schemas/serve-flags.schema.ts`,
  `${BACKEND_SRC}/app/constants/exit-codes.constants.ts`,
  `${BACKEND_SRC}/modules/system/system.module.ts`,
  `${BACKEND_SRC}/modules/system/index.ts`,
  `${BACKEND_SRC}/modules/system/graphql/system.graphql`,
  `${BACKEND_SRC}/modules/system/resolvers/server-status.resolver.ts`,
  `${BACKEND_SRC}/modules/system/use-cases/get-server-status.use-case.ts`,
  `${BACKEND_SRC}/modules/system/use-cases/get-server-status.use-case.spec.ts`,
  `${BACKEND_SRC}/modules/system/services/server-uptime.service.ts`,
  `${BACKEND_SRC}/modules/system/typedefs/server-status.typedefs.ts`,
  `${BACKEND_SRC}/modules/system/gateways/email.gateway.ts`,
  `${BACKEND_SRC}/modules/system/gateways/email.fake.ts`,
  `${BACKEND_SRC}/modules/system/db/users.table.ts`,
  `${BACKEND_SRC}/modules/system/generated/schema.generated.ts`,
  `${BACKEND_SRC}/platform/clock/clock.module.ts`,
  `${BACKEND_SRC}/platform/clock/services/clock.service.ts`,
  `${BACKEND_SRC}/platform/clock/constants/time.constants.ts`,
  `${BACKEND_SRC}/platform/database/database.module.ts`,
  `${BACKEND_SRC}/platform/database/database-clients.module.ts`,
  `${BACKEND_SRC}/platform/database/index.ts`,
  `${BACKEND_SRC}/platform/graphql-server/decorators/graphql-ctx.decorator.ts`,
  `${BACKEND_SRC}/platform/http/constants/http-header.constants.ts`,
  `${BACKEND_TEST}/integration/boot.spec.ts`,
  `${BACKEND_TEST}/integration/tenant-schema.spec.ts`,
  `${BACKEND_TEST}/support/setup/test-infrastructure.setup.ts`,
  `${BACKEND_TEST}/support/fakes/manual-clock.fake.ts`,
  `${BACKEND_TEST}/support/fixtures/test-env.fixture.ts`,
  `${BACKEND_TEST}/support/modules/role-probe.module.ts`,
  `${BACKEND_TEST}/support/errors/test-rollback.error.ts`,
  `${WEB_SRC}/main.tsx`,
  `${WEB_SRC}/routes/__root.tsx`,
  `${WEB_SRC}/routes/w.$workspaceId.tsx`,
  `${WEB_SRC}/app/bootstrap.tsx`,
  `${WEB_SRC}/app/router.tsx`,
  `${WEB_SRC}/app/layouts/AppHeader/AppHeader.tsx`,
  `${WEB_SRC}/app/layouts/AppHeader/AppHeader.module.scss`,
  `${WEB_SRC}/app/layouts/AppHeader/AppHeader.test.tsx`,
  `${WEB_SRC}/app/layouts/AppHeader/LocaleSwitcher/LocaleSwitcher.tsx`,
  `${WEB_SRC}/app/layouts/AppHeader/index.ts`,
  `${WEB_SRC}/features/status/index.ts`,
  `${WEB_SRC}/features/status/constants/uptime.constants.ts`,
  `${WEB_SRC}/features/status/typedefs/uptime.typedefs.ts`,
  `${WEB_SRC}/features/status/communication/gql/query/serverStatus.graphql`,
  `${WEB_SRC}/features/status/communication/gql/query/serverStatus.generated.ts`,
  `${WEB_SRC}/features/status/communication/hooks/useServerStatus.ts`,
  `${WEB_SRC}/features/status/communication/hooks/useServerStatus.test.tsx`,
  `${WEB_SRC}/features/status/communication/helpers/serverStatus.helpers.ts`,
  `${WEB_SRC}/features/status/communication/fixtures/serverStatus.fixture.ts`,
  `${WEB_SRC}/features/status/logic/hooks/useUptimeLabel.ts`,
  `${WEB_SRC}/features/status/logic/helpers/uptime.helpers.test.ts`,
  `${WEB_SRC}/features/status/view/ServerStatus/ServerStatus.tsx`,
  `${WEB_SRC}/features/status/view/ServerStatus/useBlink.ts`,
  `${WEB_SRC}/features/status/containers/StatusPage/StatusPage.tsx`,
  `${WEB_SRC}/shared/api/clients/apollo.client.ts`,
  `${WEB_SRC}/shared/api/errors/appError.error.ts`,
  `${WEB_SRC}/shared/i18n/locales/en/common.json`,
  `${WEB_SRC}/shared/i18n/typedefs/i18next.d.ts`,
  `${WEB_SRC}/shared/ui/Button/Button.tsx`,
  `${WEB_SRC}/shared/ui/Button/Button.stories.tsx`,
  `${WEB_SRC}/shared/ui/Button/index.ts`,
  `${WEB_SRC}/shared/styles/tokens.css`,
  `${WEB_SRC}/shared/styles/global.scss`,
  `${WEB_TEST}/support/setup/vitest.setup.ts`,
  `${WEB_TEST}/support/components/MemoryRouter/MemoryRouter.tsx`,
  `${WEB_TEST}/support/helpers/render.helpers.tsx`,
  `${WEB_TEST}/support/constants/router.constants.ts`,
];

const invalidFiles: ReadonlyArray<readonly [string, string]> = [
  [`${BACKEND_SRC}/index.ts`, 'is not allowed here'],
  [`${BACKEND_SRC}/entrypoints/api.module.ts`, 'unknown folder "entrypoints"'],
  [`${BACKEND_SRC}/app/serve.command.ts`, 'is not allowed here'],
  [`${BACKEND_SRC}/app/services/run.service.ts`, 'unknown folder "services"'],
  [`${BACKEND_SRC}/app/commands/serve.ts`, 'does not match'],
  [`${BACKEND_SRC}/modules/system/system.graphql-module.ts`, 'module root may hold only'],
  [`${BACKEND_SRC}/modules/system/helpers.ts`, 'module root may hold only'],
  [`${BACKEND_SRC}/modules/system/domain/server.ts`, 'unknown folder "domain"'],
  [`${BACKEND_SRC}/modules/system/http/status.controller.ts`, 'unknown folder "http"'],
  [`${BACKEND_SRC}/modules/system/services/uptime.ts`, 'does not match'],
  [`${BACKEND_SRC}/modules/system/services/Uptime.service.ts`, 'does not match'],
  [`${BACKEND_SRC}/modules/system/services/nested/uptime.service.ts`, 'is flat'],
  [`${BACKEND_SRC}/modules/system/services/uptime.use-case.ts`, 'does not match'],
  [`${BACKEND_SRC}/modules/system/commands/serve.command.ts`, 'unknown folder "commands"'],
  [`${BACKEND_SRC}/modules/system/index.spec.ts`, 'module root may hold only'],
  [`${BACKEND_SRC}/platform/db/db.module.ts`, 'named after a kind folder'],
  [`${BACKEND_SRC}/platform/graphql/graphql.module.ts`, 'named after a kind folder'],
  [`${BACKEND_SRC}/platform/errors/errors.module.ts`, 'named after a kind folder'],
  [`${BACKEND_SRC}/platform/clock/use-cases/read.use-case.ts`, 'unknown folder "use-cases"'],
  [`${BACKEND_SRC}/platform/clock/database-clients.module.ts`, 'is not allowed here'],
  [`${BACKEND_SRC}/platform/clock.service.ts`, 'sits in the platform root'],
  [`${BACKEND_TEST}/loose.spec.ts`, 'unknown folder "loose.spec.ts"'],
  [`${BACKEND_TEST}/integration/helper.ts`, 'integration holds .spec.ts files only'],
  [`${BACKEND_TEST}/support/loose.ts`, 'is not allowed here'],
  [`${BACKEND_TEST}/support/utils/thing.ts`, 'unknown folder "utils"'],
  [`${BACKEND_TEST}/support/fakes/clock.ts`, 'does not match'],
  [`${WEB_SRC}/App.tsx`, 'is not allowed here'],
  [`${WEB_SRC}/lib/thing.ts`, 'unknown folder "lib"'],
  [`${WEB_SRC}/routes/notes.md`, 'route files only'],
  [`${WEB_SRC}/app/App.tsx`, 'is not allowed here'],
  [`${WEB_SRC}/app/helpers/thing.helpers.ts`, 'unknown folder "helpers"'],
  [`${WEB_SRC}/app/layouts/PublicLayout.tsx`, 'PascalCase component folder'],
  [`${WEB_SRC}/app/layouts/AppHeader/Other.tsx`, 'not allowed in component folder'],
  [`${WEB_SRC}/app/layouts/appHeader/appHeader.tsx`, 'PascalCase component folder'],
  [`${WEB_SRC}/features/status/helpers.ts`, 'is not allowed here'],
  [`${WEB_SRC}/features/status/domain/x.ts`, 'unknown folder "domain"'],
  [`${WEB_SRC}/features/status/communication/serverStatus.graphql`, 'is not allowed here'],
  [`${WEB_SRC}/features/status/communication/gql/serverStatus.graphql`, 'gql holds'],
  [`${WEB_SRC}/features/status/communication/gql/query/status.sql`, 'hold .graphql files only'],
  [`${WEB_SRC}/features/status/communication/hooks/serverStatus.ts`, 'does not match'],
  [`${WEB_SRC}/features/status/communication/mocks/x.mocks.ts`, 'unknown folder "mocks"'],
  [`${WEB_SRC}/features/status/logic/helpers/uptime.ts`, 'does not match'],
  [`${WEB_SRC}/features/status/logic/helpers/nested/uptime.helpers.ts`, 'is flat'],
  [
    `${WEB_SRC}/features/status/view/ServerStatus/ServerStatus.stories.tsx`,
    'not allowed in component folder',
  ],
  [`${WEB_SRC}/features/status/view/ServerStatus/Other.tsx`, 'not allowed in component folder'],
  [`${WEB_SRC}/features/status/storage/status.store.ts`, 'is not allowed here'],
  [`${WEB_SRC}/shared/api/AppError.ts`, 'is not allowed here'],
  [`${WEB_SRC}/shared/api/links/splitLink.ts`, 'unknown folder "links"'],
  [`${WEB_SRC}/shared/config/clients/x.client.ts`, 'unknown folder "clients"'],
  [`${WEB_SRC}/shared/i18n/locales/en-US/common.json`, 'one folder per language'],
  [`${WEB_SRC}/shared/i18n/locales/en/common.ts`, 'hold .json files only'],
  [`${WEB_SRC}/shared/ui/Button.tsx`, 'PascalCase component folder'],
  [`${WEB_SRC}/shared/styles/appStyles.ts`, 'styles holds'],
  [`${WEB_TEST}/loose.ts`, 'unknown folder'],
  [`${WEB_TEST}/support/utils/x.ts`, 'unknown folder "utils"'],
  [`${WEB_TEST}/support/helpers/render.ts`, 'does not match'],
];

const roots: string[] = [];

const createTree = (files: readonly string[]): string => {
  const root = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
  roots.push(root);
  for (const file of files) {
    const target = join(root, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, '');
  }
  return root;
};

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

void it('accepts every layout the spec allows', () => {
  const root = createTree(validFiles);
  assert.deepEqual(checkStructure(root), []);
});

void it('accepts a tree without any app folders', () => {
  const root = createTree([]);
  assert.deepEqual(checkStructure(root), []);
});

void it('ignores node_modules and dist', () => {
  const root = createTree([`${BACKEND_SRC}/node_modules/x/y.ts`, `${WEB_SRC}/dist/anything.ts`]);
  assert.deepEqual(checkStructure(root), []);
});

for (const [file, expected] of invalidFiles) {
  void it(`rejects ${file}`, () => {
    const root = createTree([file]);
    const violations = checkStructure(root);
    assert.equal(violations.length, 1);
    assert.equal(violations[0]?.file, file);
    assert.ok(
      violations[0]?.message.includes(expected),
      `expected "${violations[0]?.message}" to include "${expected}"`,
    );
  });
}

void it('reports every offending file once', () => {
  const root = createTree([
    `${BACKEND_SRC}/modules/system/helpers.ts`,
    `${BACKEND_SRC}/modules/system/domain/server.ts`,
    `${WEB_SRC}/App.tsx`,
  ]);
  assert.equal(checkStructure(root).length, 3);
});
