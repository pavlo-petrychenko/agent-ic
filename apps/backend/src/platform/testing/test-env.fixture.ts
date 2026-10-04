import { CLI_OPTION_PREFIX } from '@/platform/config/config.constants';
import type { CliOption, EnvVar } from '@/platform/config/config.constants';

import { TEST_ARGV_PREFIX, TEST_ENV } from './test-env.constants';

export const createTestEnv = (
  overrides: Partial<Record<EnvVar, string | undefined>> = {},
): NodeJS.ProcessEnv => ({ ...TEST_ENV, ...overrides });

export const cliArgument = (option: CliOption, value: string): string =>
  `${CLI_OPTION_PREFIX}${option}=${value}`;

export const createArgv = (...args: readonly string[]): string[] => [...TEST_ARGV_PREFIX, ...args];
