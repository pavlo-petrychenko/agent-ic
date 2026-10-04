import { fetchJson } from '@/shared/api/helpers/fetchJson.helpers';
import { RUNTIME_CONFIG_PATH } from '@/shared/config/constants/runtimeConfig.constants';
import { runtimeConfigSchema } from '@/shared/config/schemas/runtimeConfig.schema';
import type { RuntimeConfig } from '@/shared/config/typedefs/runtimeConfig.typedefs';

export async function loadRuntimeConfig(
  path: string = RUNTIME_CONFIG_PATH,
): Promise<RuntimeConfig> {
  return runtimeConfigSchema.parse(await fetchJson(path));
}
