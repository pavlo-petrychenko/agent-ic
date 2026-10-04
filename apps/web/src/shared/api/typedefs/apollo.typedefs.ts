import type { SessionClient } from '@/shared/api/typedefs/session.typedefs';
import type { RuntimeConfig } from '@/shared/config/typedefs/runtimeConfig.typedefs';

export interface ApolloClientOptions {
  readonly config: RuntimeConfig;
  readonly session: SessionClient;
}
