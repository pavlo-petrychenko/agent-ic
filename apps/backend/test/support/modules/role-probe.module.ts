import { Role } from '@/platform/module-roles/constants/role.constants';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';
import { ROLE_PROBE_TOKEN } from '@test/support/constants/module-roles.constants';
import { FailingController } from '@test/support/controllers/failing.controller';
import { GatewayProbeController } from '@test/support/controllers/gateway-probe.controller';
import { DomainEventRegistryProbeModule } from '@test/support/modules/domain-event-registry-probe.module';
import { RoleProbeDependencyModule } from '@test/support/modules/role-probe-dependency.module';
import { RecordProbeProcessor } from '@test/support/processors/record-probe.processor';
import { WelcomeProbeListener } from '@test/support/processors/welcome-probe-listener.processor';
import { RoleProbeResolver } from '@test/support/resolvers/role-probe.resolver';
import { ProbeCallsRecorderService } from '@test/support/services/probe-calls-recorder.service';

export class RoleProbeModule extends defineModule({
  imports: [RoleProbeDependencyModule, DomainEventRegistryProbeModule],
  providers: [ProbeCallsRecorderService],
  exports: [ProbeCallsRecorderService],
  resolvers: [RoleProbeResolver],
  controllers: [FailingController],
  gatewayControllers: [GatewayProbeController],
  processors: [RecordProbeProcessor],
  listeners: [WelcomeProbeListener],
  roleProviders: { [Role.Gateway]: [{ provide: ROLE_PROBE_TOKEN, useValue: Role.Gateway }] },
}) {}
