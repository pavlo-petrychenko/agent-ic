import { Role } from '@/platform/module-roles/constants/role.constants';

export const SEED_ROLE_SELECTION = { role: Role.Gateway, queues: [] } as const;
export const SEED_PRODUCTION_MESSAGE = 'the seed only runs outside production';

export enum SeedLogMessage {
  SampleAgentCreated = 'seed: sample agent created',
  SampleAgentExists = 'seed: workspace already has agents',
  SampleWorkspaceReady = 'seed: sample workspace ready',
}
