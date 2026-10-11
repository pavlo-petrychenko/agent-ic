import type { z } from 'zod';
import type { runEscalatedEvent } from '@/modules/runs/events/run-escalated.event';

export type RunEscalatedPayload = z.infer<typeof runEscalatedEvent.schema>;
