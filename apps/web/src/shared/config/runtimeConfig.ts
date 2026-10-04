import { fetchJson } from '@/shared/api/fetchJson';

import { RUNTIME_CONFIG_PATH } from './runtimeConfig.constants';
import { runtimeConfigSchema } from './runtimeConfig.schema';
import type { RuntimeConfig } from './runtimeConfig.typedefs';

export async function loadRuntimeConfig(
  path: string = RUNTIME_CONFIG_PATH,
): Promise<RuntimeConfig> {
  return runtimeConfigSchema.parse(await fetchJson(path));
}
