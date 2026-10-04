import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { MissingDomainEventSubscriptionError } from '@/platform/domain-events/errors/missing-domain-event-subscription.error';
import { DomainEventListenersService } from '@/platform/domain-events/services/domain-event-listeners.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import {
  defineModule,
  inEveryRole,
  isRoleModule,
} from '@/platform/module-roles/helpers/module-roles.helpers';
import {
  ROLE_PROBE_DEPENDENCY_TOKEN,
  ROLE_PROBE_DEPENDENCY_VALUE,
  ROLE_PROBE_TOKEN,
} from '@test/support/constants/module-roles.constants';
import { FailingController } from '@test/support/controllers/failing.controller';
import { GatewayProbeController } from '@test/support/controllers/gateway-probe.controller';
import { probeSignedUpEvent } from '@test/support/jobs/probe-signed-up.job';
import { welcomeOnProbeSignedUp } from '@test/support/jobs/welcome-on-probe-signed-up.job';
import { DomainEventListenersProbeModule } from '@test/support/modules/domain-event-listeners-probe.module';
import { RoleProbeDependencyModule } from '@test/support/modules/role-probe-dependency.module';
import { RoleProbeModule } from '@test/support/modules/role-probe.module';
import { RecordProbeProcessor } from '@test/support/processors/record-probe.processor';
import { WelcomeProbeListener } from '@test/support/processors/welcome-probe-listener.processor';
import { RoleProbeResolver } from '@test/support/resolvers/role-probe.resolver';
import { ProbeCallsRecorderService } from '@test/support/services/probe-calls-recorder.service';

const roles = Object.values(Role);

const bootForRole = async (role: Role): Promise<TestingModule> => {
  const moduleRef = await Test.createTestingModule({
    imports: [RoleProbeModule.forRole(role)],
  }).compile();
  return moduleRef.init();
};

describe('defineModule', () => {
  it('returns the defining class as the module of every role', () => {
    for (const role of roles) {
      expect(RoleProbeModule.forRole(role).module).toBe(RoleProbeModule);
    }
  });

  it('mounts resolvers and controllers only in the api role', () => {
    const api = RoleProbeModule.forRole(Role.Api);

    expect(api.providers).toContain(RoleProbeResolver);
    expect(api.controllers).toEqual([FailingController]);
    expect(RoleProbeModule.forRole(Role.Gateway).providers).not.toContain(RoleProbeResolver);
    expect(RoleProbeModule.forRole(Role.Worker).providers).not.toContain(RoleProbeResolver);
  });

  it('mounts gateway controllers only in the gateway role', () => {
    expect(RoleProbeModule.forRole(Role.Gateway).controllers).toEqual([GatewayProbeController]);
    expect(RoleProbeModule.forRole(Role.Worker).controllers).toEqual([]);
  });

  it('mounts processors and listeners only in the worker role', () => {
    const worker = RoleProbeModule.forRole(Role.Worker);

    expect(worker.providers).toEqual(
      expect.arrayContaining([RecordProbeProcessor, WelcomeProbeListener]),
    );
    for (const role of [Role.Api, Role.Gateway]) {
      expect(RoleProbeModule.forRole(role).providers).not.toContain(RecordProbeProcessor);
      expect(RoleProbeModule.forRole(role).providers).not.toContain(WelcomeProbeListener);
    }
  });

  it('keeps providers and exports in every role', () => {
    for (const role of roles) {
      const roleModule = RoleProbeModule.forRole(role);

      expect(roleModule.providers).toContain(ProbeCallsRecorderService);
      expect(roleModule.exports).toEqual([ProbeCallsRecorderService]);
    }
  });

  it('adds role providers only to their role', () => {
    const gatewayProvider = { provide: ROLE_PROBE_TOKEN, useValue: Role.Gateway };

    expect(RoleProbeModule.forRole(Role.Gateway).providers).toContainEqual(gatewayProvider);
    expect(RoleProbeModule.forRole(Role.Api).providers).not.toContainEqual(gatewayProvider);
  });

  it('resolves imported role modules for the same role and keeps plain imports', () => {
    for (const role of roles) {
      expect(RoleProbeModule.forRole(role).imports).toEqual([
        RoleProbeDependencyModule.forRole(role),
        DomainEventListenersProbeModule,
      ]);
    }
  });

  it('tells role modules from plain modules', () => {
    expect(isRoleModule(RoleProbeModule)).toBe(true);
    expect(isRoleModule(DomainEventListenersProbeModule)).toBe(false);
  });

  it.each(roles)('registers listener subscriptions in the %s role', async (role) => {
    const moduleRef = await bootForRole(role);

    const listeners = moduleRef.get(DomainEventListenersService, { strict: false });
    expect(listeners.subscriptionsFor(probeSignedUpEvent)).toEqual([welcomeOnProbeSignedUp]);
    expect(moduleRef.get(ROLE_PROBE_DEPENDENCY_TOKEN, { strict: false })).toBe(
      ROLE_PROBE_DEPENDENCY_VALUE,
    );
    await moduleRef.close();
  });

  it.each([Role.Api, Role.Gateway])('does not run listeners in the %s role', async (role) => {
    const moduleRef = await bootForRole(role);

    expect(() => moduleRef.get(WelcomeProbeListener, { strict: false })).toThrow(
      WelcomeProbeListener.name,
    );
    await moduleRef.close();
  });

  it('runs listeners in the worker role', async () => {
    const moduleRef = await bootForRole(Role.Worker);

    expect(moduleRef.get(WelcomeProbeListener, { strict: false })).toBeInstanceOf(
      WelcomeProbeListener,
    );
    await moduleRef.close();
  });

  it('adds role controllers only to their role', () => {
    const module = defineModule({ roleControllers: { [Role.Worker]: [GatewayProbeController] } });

    expect(module.forRole(Role.Worker).controllers).toEqual([GatewayProbeController]);
    expect(module.forRole(Role.Api).controllers).toEqual([]);
  });

  it('mounts controllers in every role with inEveryRole', () => {
    const module = defineModule({ roleControllers: inEveryRole([GatewayProbeController]) });

    for (const role of roles) {
      expect(module.forRole(role).controllers).toEqual([GatewayProbeController]);
    }
  });

  it('makes the module global only when the definition asks for it', () => {
    for (const role of roles) {
      expect(defineModule({ global: true }).forRole(role).global).toBe(true);
      expect(RoleProbeModule.forRole(role).global).toBe(false);
    }
  });

  it('rejects a listener that is not marked with @OnDomainEvent', () => {
    const invalid = defineModule({ listeners: [RoleProbeResolver] });

    expect(() => invalid.forRole(Role.Api)).toThrow(MissingDomainEventSubscriptionError);
  });
});
