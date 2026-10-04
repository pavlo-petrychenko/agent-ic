import { ApiAppModule } from '@/entrypoints/api.app-module';
import type { RoleEntrypoint } from '@/entrypoints/entrypoint.typedefs';
import { GatewayAppModule } from '@/entrypoints/gateway.app-module';
import { WorkerAppModule } from '@/entrypoints/worker.app-module';
import { Role } from '@/platform/config/config.constants';
import { GlobalPrefix } from '@/platform/http/http.constants';
import { MetricsRoute } from '@/platform/observability/metrics/metrics.constants';

export const ROLE_ENTRYPOINTS: Record<Role, RoleEntrypoint> = {
  [Role.Api]: { module: ApiAppModule, globalPrefix: GlobalPrefix.Api },
  [Role.Gateway]: { module: GatewayAppModule, globalPrefix: null },
  [Role.Worker]: { module: WorkerAppModule, globalPrefix: null },
};

export const UNPREFIXED_ROUTES: readonly string[] = [MetricsRoute.Path];
