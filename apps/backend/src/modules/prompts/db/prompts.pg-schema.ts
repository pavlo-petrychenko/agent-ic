import { PROMPTS_SCHEMA } from '@/modules/prompts/constants/prompt.constants';
import { moduleSchema } from '@/platform/database/helpers/tenant-table.helpers';

export const promptsSchema = moduleSchema(PROMPTS_SCHEMA);
