import type { INestApplication } from '@nestjs/common';
import type { FormattedExecutionResult } from 'graphql';
import type { Redis } from 'ioredis';
import type { AppConfig } from '@/platform/config/typedefs/app-config.typedefs';

export type SubscriptionResult = FormattedExecutionResult<Record<string, unknown>, unknown>;

export interface SubscriptionsApi {
  readonly app: INestApplication;
  readonly config: AppConfig;
  readonly redis: Redis;
}

export interface TestMember {
  readonly workspaceId: string;
  readonly publicWorkspaceId: string;
  readonly accessToken: string;
}

export interface LiveSubscription {
  readonly next: () => Promise<IteratorResult<SubscriptionResult>>;
  readonly close: () => Promise<void>;
}
