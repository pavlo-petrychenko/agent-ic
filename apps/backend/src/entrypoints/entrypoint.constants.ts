import { Role } from '@/platform/config/config.constants';
import { MetricsRoute } from '@/platform/observability/metrics/metrics.constants';

import { ApiAppModule } from './api.app-module';
import { GatewayAppModule } from './gateway.app-module';
import type { RoleEntrypoint } from './entrypoint.typedefs';
import { WorkerAppModule } from './worker.app-module';

export enum GlobalPrefix {
  Api = 'api',
}

export const ROLE_ENTRYPOINTS: Record<Role, RoleEntrypoint> = {
  [Role.Api]: { module: ApiAppModule, globalPrefix: GlobalPrefix.Api },
  [Role.Gateway]: { module: GatewayAppModule, globalPrefix: null },
  [Role.Worker]: { module: WorkerAppModule, globalPrefix: null },
};

export const UNPREFIXED_ROUTES: readonly string[] = [MetricsRoute.Path];
