import { fileURLToPath } from 'node:url';
import { DatabaseRole } from '@/platform/database/constants/database.constants';

export const TEST_INFRASTRUCTURE_KEY = 'testInfrastructure';

export const POSTGRES_IMAGE = 'pgvector/pgvector:0.8.7-pg18-trixie';
export const REDIS_IMAGE = 'redis:8.10-alpine';

export const ROLES_INIT_SCRIPT = fileURLToPath(
  new URL('../../../../../deploy/docker/postgres/init/01-roles.sh', import.meta.url),
);
export const ROLES_INIT_TARGET = '/docker-entrypoint-initdb.d/01-roles.sh';

export const TEST_DATABASE_NAME = 'agent_ic_test';
export const TEST_SUPERUSER = 'postgres';
export const TEST_SUPERUSER_PASSWORD = 'postgres-test';
export const TEST_LANGFUSE_PASSWORD = 'langfuse-test';
export const DATABASE_URL_PROTOCOL = 'postgres:';

export const TEST_ROLE_PASSWORDS: Readonly<Record<DatabaseRole, string>> = {
  [DatabaseRole.Owner]: 'app-owner-test',
  [DatabaseRole.App]: 'app-test',
  [DatabaseRole.System]: 'app-system-test',
};

export enum RolesInitEnvVar {
  Database = 'APP_DATABASE',
  OwnerPassword = 'APP_OWNER_PASSWORD',
  AppPassword = 'APP_PASSWORD',
  SystemPassword = 'APP_SYSTEM_PASSWORD',
  LangfusePassword = 'LANGFUSE_DB_PASSWORD',
}

export const TEST_POOL_SIZE = '1';
export const SCRATCH_POOL_SIZE = 1;
export const TEST_APPLICATION_NAME = 'agent-ic-test';

export enum TestRedisPrefix {
  Database = 'database:',
  Entrypoints = 'entrypoints:',
  RequestLayer = 'request-layer:',
  QueryLimits = 'query-limits:',
  PlatformMetrics = 'platform-metrics:',
  DomainMetrics = 'domain-metrics:',
  GraphqlSubscriptions = 'graphql-subscriptions:',
  Jobs = 'jobs:',
  QueueBoard = 'queue-board:',
  LiveUpdates = 'live-updates:',
  Cache = 'cache:',
  RateLimit = 'rate-limit:',
  Identity = 'identity:',
  AuthFlow = 'auth-flow:',
  WorkspacesFlow = 'workspaces-flow:',
  PasswordResetFlow = 'password-reset-flow:',
  DurableJobs = 'durable-jobs:',
  JobTracing = 'job-tracing:',
  Agents = 'agents:',
  Prompts = 'prompts:',
  LlmKeys = 'llm-keys:',
  Usage = 'usage:',
  UsageGateway = 'usage-gateway:',
  Conversations = 'conversations:',
  Channels = 'channels:',
  ChannelsWorker = 'channels-worker:',
  Runs = 'runs:',
  RunExecution = 'run-execution:',
  RunBackgroundBranches = 'run-background-branches:',
  RunDetails = 'run-details:',
  SimulationRuns = 'simulation-runs:',
  RunStepsBatch = 'run-steps-batch:',
  RunTotalsBatch = 'run-totals-batch:',
  LastSimulationRun = 'last-simulation-run:',
  SimulatorTests = 'simulator-tests:',
  RunTracing = 'run-tracing:',
  CompletionStep = 'completion-step:',
  AgentStep = 'agent-step:',
  RunStart = 'run-start:',
  RunEnd = 'run-end:',
  RunMessages = 'run-messages:',
  RunEscalation = 'run-escalation:',
  RunsWorker = 'runs-worker:',
  SimulatorWorker = 'simulator-worker:',
  Seed = 'seed:',
  IsolationFirst = 'isolation-first:',
  IsolationSecond = 'isolation-second:',
}
