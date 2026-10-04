import { GlobalPrefix } from '@/platform/http/constants/global-prefix.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { MetricsRoute } from '@/platform/observability/constants/metrics.constants';

export enum LogMessage {
  Listening = 'listening',
}

export const ROLE_GLOBAL_PREFIX: Readonly<Record<Role, GlobalPrefix | null>> = {
  [Role.Api]: GlobalPrefix.Api,
  [Role.Gateway]: null,
  [Role.Worker]: null,
};

export const UNPREFIXED_ROUTES: readonly string[] = [MetricsRoute.Path];

export const TRUST_PROXY_SETTING = 'trust proxy';
export const TRUSTED_PROXY_HOPS = 1;
