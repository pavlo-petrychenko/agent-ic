import { z } from 'zod';

import type { ProbeData } from './async-jobs.typedefs';

export const probeDataSchema: z.ZodType<ProbeData> = z.object({ probeId: z.string().min(1) });
