import type { WorkspaceRole } from '@agent-ic/contracts';
import type { INestApplication } from '@nestjs/common';
import type { FormattedExecutionResult } from 'graphql';
import type { Redis } from 'ioredis';
import type { RunStepStatus } from '@/modules/runs';
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
  readonly role: WorkspaceRole;
  readonly accessToken: string;
}

export interface LiveSubscription {
  readonly next: () => Promise<IteratorResult<SubscriptionResult>>;
  readonly close: () => Promise<void>;
}

export interface PublishedStep {
  readonly runId: string;
  readonly stepId: string;
  readonly status: RunStepStatus;
}
