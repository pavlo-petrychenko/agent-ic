import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { SystemModule } from '@/modules/system/system.module';
import { GetServerStatusUseCase } from '@/modules/system/use-cases/get-server-status.use-case';
import { Clock } from '@/platform/clock/clock';
import { ClockModule } from '@/platform/clock/clock.module';
import { CliOption, EnvVar } from '@/platform/config/config.constants';
import { ConfigLoader } from '@/platform/config/config.loader';
import { ConfigModule } from '@/platform/config/config.module';
import { ActorKind, Locale } from '@/platform/context/context.constants';
import { UseCaseCtx } from '@/platform/context/use-case-ctx';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TEST_ENV } from '@test/support/constants/test-env.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { cliArgument, createArgv, createTestEnv } from '@test/support/fixtures/test-env.fixture';

const START = new Date('2026-10-04T12:00:00.000Z');
const ANONYMOUS_CTX = new UseCaseCtx({
  actor: { kind: ActorKind.Anonymous },
  initiatedBy: null,
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
    imports: [ConfigModule.register(config), ClockModule, SystemModule.forRole(Role.Api)],
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
