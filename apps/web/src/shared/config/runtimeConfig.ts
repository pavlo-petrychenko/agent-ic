import { fetchJson } from '@/shared/api/fetchJson';
import { RUNTIME_CONFIG_PATH } from '@/shared/config/runtimeConfig.constants';
import { runtimeConfigSchema } from '@/shared/config/runtimeConfig.schema';
import type { RuntimeConfig } from '@/shared/config/runtimeConfig.typedefs';

export async function loadRuntimeConfig(
  path: string = RUNTIME_CONFIG_PATH,
): Promise<RuntimeConfig> {
  return runtimeConfigSchema.parse(await fetchJson(path));
}
