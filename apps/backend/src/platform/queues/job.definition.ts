import type { z } from 'zod';

import type { QueueName } from './queue.constants';
import type { JobData } from './queue.typedefs';

export abstract class JobDefinition<TData extends JobData> {
  abstract readonly queue: QueueName;
  abstract readonly name: string;
  abstract readonly schema: z.ZodType<TData>;
}
