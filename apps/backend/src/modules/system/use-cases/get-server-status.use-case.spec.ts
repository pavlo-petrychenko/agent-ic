import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

import { Clock } from '@/platform/clock/clock';
import { ClockModule } from '@/platform/clock/clock.module';
import { CliOption, EnvVar, Role } from '@/platform/config/config.constants';
import { ConfigLoader } from '@/platform/config/config.loader';
import { ConfigModule } from '@/platform/config/config.module';
import { ActorKind, Locale } from '@/platform/context/context.constants';
import { UseCaseCtx } from '@/platform/context/use-case-ctx';
import { ManualClock } from '@/platform/testing/manual.clock';
import { TEST_ENV } from '@/platform/testing/test-env.constants';
import { cliArgument, createArgv, createTestEnv } from '@/platform/testing/test-env.fixture';

import { SystemModule } from '../system.module';
import { GetServerStatusUseCase } from './get-server-status.use-case';

const START = new Date('2026-10-04T12:00:00.000Z');
const ANONYMOUS_CTX = new UseCaseCtx({
  actor: { kind: ActorKind.Anonymous },
  workspaceId: null,
  traceId: 'trace',
  locale: Locale.En,
});

const createUseCase = async (): Promise<{
  useCase: GetServerStatusUseCase;
  clock: ManualClock;
}> => {
  const clock = new ManualClock(START);
  const config = new ConfigLoader(createTestEnv()).load(
    createArgv(cliArgument(CliOption.Role, Role.Api)),
  );
  const testingModule = await Test.createTestingModule({
    imports: [ConfigModule.register(config), ClockModule, SystemModule],
  })
    .overrideProvider(Clock)
    .useValue(clock)
    .compile();
  return { useCase: testingModule.get(GetServerStatusUseCase), clock };
};

describe('GetServerStatusUseCase', () => {
  it('reports the configured version', async () => {
    const { useCase } = await createUseCase();

    expect(useCase.execute(ANONYMOUS_CTX).version).toBe(TEST_ENV[EnvVar.AppVersion]);
  });

  it('counts whole seconds since the server started', async () => {
    const { useCase, clock } = await createUseCase();

    clock.advanceBy(2999);

    expect(useCase.execute(ANONYMOUS_CTX).uptimeSeconds).toBe(2);
  });
});
