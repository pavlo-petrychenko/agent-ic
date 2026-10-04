import { Locale } from '@agent-ic/contracts';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { SystemModule } from '@/modules/system/system.module';
import { GetServerStatusUseCase } from '@/modules/system/use-cases/get-server-status.use-case';
import { Clock } from '@/platform/clock/clock';
import { ClockModule } from '@/platform/clock/clock.module';
import { ConfigModule } from '@/platform/config/config.module';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ActorKind } from '@/platform/context/constants/actor.constants';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TEST_ENV } from '@test/support/constants/test-env.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';

const START = new Date('2026-10-04T12:00:00.000Z');
const ANONYMOUS_CTX: UseCaseCtx = {
  actor: { kind: ActorKind.Anonymous },
  initiatedBy: null,
  workspaceId: null,
  traceId: 'trace',
  locale: Locale.En,
};

const createUseCase = async (): Promise<{
  useCase: GetServerStatusUseCase;
  clock: ManualClock;
}> => {
  const clock = new ManualClock(START);
  const config = loadAppConfig({ role: Role.Api, queues: [] }, createTestEnv());
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
