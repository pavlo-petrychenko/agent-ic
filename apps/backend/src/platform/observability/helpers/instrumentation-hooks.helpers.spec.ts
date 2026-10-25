import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { describe, expect, it } from 'vitest';
import { instrumentedModuleNames } from '@/platform/observability/helpers/instrumentation-hooks.helpers';

const runNode = promisify(execFile);

const HOOKS_HELPER_URL = new URL('instrumentation-hooks.helpers.ts', import.meta.url).href;

const REGISTER_FLAG = 'register';

const PATCH_PROBE = [
  "const { IORedisInstrumentation } = await import('@opentelemetry/instrumentation-ioredis');",
  "const { PgInstrumentation } = await import('@opentelemetry/instrumentation-pg');",
  'const { registerInstrumentationHooks } = await import(process.argv[1]);',
  'const instrumentations = [new PgInstrumentation(), new IORedisInstrumentation()];',
  `if (process.argv[2] === '${REGISTER_FLAG}') registerInstrumentationHooks(instrumentations);`,
  "const { Redis } = await import('ioredis');",
  "const { Client } = await import('pg');",
  'process.stdout.write(JSON.stringify({',
  '  ioredis: Boolean(Redis.prototype.sendCommand.__wrapped),',
  '  pg: Boolean(Client.prototype.query.__wrapped),',
  '}));',
].join('\n');

const probeEsmPatches = async (...flags: readonly string[]): Promise<unknown> => {
  const { stdout } = await runNode(process.execPath, [
    '--input-type=module',
    '--eval',
    PATCH_PROBE,
    HOOKS_HELPER_URL,
    ...flags,
  ]);
  const patches: unknown = JSON.parse(stdout);
  return patches;
};

describe('instrumentedModuleNames', () => {
  it('lists every module the instrumentations patch once', () => {
    const disabled = { enabled: false };

    expect(
      instrumentedModuleNames([
        new PgInstrumentation(disabled),
        new PgInstrumentation(disabled),
        new IORedisInstrumentation(disabled),
      ]).toSorted(),
    ).toEqual(['ioredis', 'pg', 'pg-pool']);
  });
});

describe('registerInstrumentationHooks', () => {
  it('patches the ESM imports of pg and ioredis', async () => {
    await expect(probeEsmPatches(REGISTER_FLAG)).resolves.toEqual({ ioredis: true, pg: true });
  });

  it('leaves the ESM-only ioredis unpatched without the hooks', async () => {
    await expect(probeEsmPatches()).resolves.toEqual({ ioredis: false, pg: true });
  });
});
