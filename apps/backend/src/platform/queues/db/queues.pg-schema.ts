import { moduleSchema } from '@/platform/database/helpers/tenant-table.helpers';
import { OUTBOX_SCHEMA } from '@/platform/queues/constants/outbox.constants';

export const outboxSchema = moduleSchema(OUTBOX_SCHEMA);
