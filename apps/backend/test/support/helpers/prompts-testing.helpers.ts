import type { TestingModule } from '@nestjs/testing';
import { PromptsModule } from '@/modules/prompts';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';

export const createPromptsTestingModule = (): Promise<TestingModule> =>
  createPlatformTestingModule(TestRedisPrefix.Prompts, [PromptsModule.forRole(Role.Api)]);
