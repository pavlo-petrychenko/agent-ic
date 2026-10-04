import { z } from 'zod';
import { CliOption, WORKER_QUEUES_REQUIRED_MESSAGE } from '@/app/constants/command-line.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueueName } from '@/platform/queues/queue.constants';

export const serveCommandSchema = z
  .object({
    role: z.enum(Role),
    queues: z.array(z.enum(QueueName)),
  })
  .refine((cli) => cli.role !== Role.Worker || cli.queues.length > 0, {
    path: [CliOption.Queues],
    message: WORKER_QUEUES_REQUIRED_MESSAGE,
  });
