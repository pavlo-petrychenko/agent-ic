import type { z } from 'zod';

import type { runtimeConfigSchema } from './runtimeConfig.schema';

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;
