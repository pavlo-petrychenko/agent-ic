import type { z } from 'zod';
import type { runtimeConfigSchema } from '@/shared/config/runtimeConfig.schema';

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;
