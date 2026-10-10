import type { TestingModule } from '@nestjs/testing';
import { AgentsModule } from '@/modules/agents/agents.module';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';

export const createAgentsTestingModule = (): Promise<TestingModule> =>
  createPlatformTestingModule(TestRedisDatabase.Agents, [AgentsModule.forRole(Role.Gateway)]);
