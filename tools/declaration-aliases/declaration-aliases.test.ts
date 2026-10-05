import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, it } from 'node:test';
import {
  findAliasSpecifiers,
  readDeclarationLayout,
  rewriteDeclarations,
  rewriteSpecifiers,
} from './declaration-aliases.helpers.ts';

const TEMP_PREFIX = 'declaration-aliases-';
const PATHS_CONFIG = {
  compilerOptions: {
    paths: {
      '@flow/*': ['./src/*'],
      '@test/*': ['./test/*'],
      '@contracts/*': ['../contracts/src/*'],
    },
  },
};
const BUILD_CONFIG = { compilerOptions: { rootDir: 'src', outDir: 'dist' } };

let directory = '';

const write = (path: string, content: string): void => {
  const file = join(directory, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
  write('tsconfig.json', JSON.stringify(PATHS_CONFIG));
  write('tsconfig.build.json', JSON.stringify(BUILD_CONFIG));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

void it('maps only the aliases that point inside rootDir to the output directory', () => {
  const layout = readDeclarationLayout(directory);

  assert.deepEqual(layout.aliases, [{ prefix: '@flow/', outputDir: join(directory, 'dist') }]);
  assert.deepEqual(layout.prefixes, ['@flow/', '@test/', '@contracts/']);
});

void it('rewrites static, type and inline imports to relative paths with an extension', () => {
  const file = join(directory, 'dist/nodes/schemas/agent.schema.d.ts');
  const aliases = [{ prefix: '@flow/', outputDir: join(directory, 'dist') }];
  const source = [
    "import { z } from 'zod';",
    "import type { Flow } from '@flow/document/typedefs/flow.typedefs';",
    'export * from "@flow/nodes/schemas/router.schema";',
    "export declare const x: import('@flow/limits/constants/limit.constants').Limit;",
  ].join('\n');

  assert.equal(
    rewriteSpecifiers(source, file, aliases),
    [
      "import { z } from 'zod';",
      "import type { Flow } from '../../document/typedefs/flow.typedefs.js';",
      'export * from "./router.schema.js";',
      "export declare const x: import('../../limits/constants/limit.constants.js').Limit;",
    ].join('\n'),
  );
});

void it('finds specifiers that still use an alias', () => {
  const source = "import { a } from '@contracts/a';\nimport { b } from '@agent-ic/contracts';\n";

  assert.deepEqual(findAliasSpecifiers(source, ['@flow/', '@contracts/']), ['@contracts/a']);
});

void it('rewrites every declaration file and reports what is left', () => {
  write('dist/index.d.ts', "export { a } from '@flow/a/a.helpers';\n");
  write('dist/a/a.helpers.d.ts', "export { b } from '@contracts/b';\n");
  write('dist/index.js', "export * from '@flow/a/a.helpers';\n");

  const unresolved = rewriteDeclarations(directory);

  assert.equal(
    readFileSync(join(directory, 'dist/index.d.ts'), 'utf8'),
    "export { a } from './a/a.helpers.js';\n",
  );
  assert.equal(
    readFileSync(join(directory, 'dist/index.js'), 'utf8'),
    "export * from '@flow/a/a.helpers';\n",
  );
  assert.deepEqual(unresolved, [
    { file: join('dist', 'a', 'a.helpers.d.ts'), specifier: '@contracts/b' },
  ]);
});
