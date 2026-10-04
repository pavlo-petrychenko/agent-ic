import type { RuntimeConfig } from '@/shared/config/typedefs/runtimeConfig.typedefs';

export interface ApolloClientOptions {
  readonly config: RuntimeConfig;
  readonly onUnauthenticated?: () => Promise<boolean>;
}
