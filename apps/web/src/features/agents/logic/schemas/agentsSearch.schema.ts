import { AgentTemplateKey } from '@agent-ic/flow';
import { z } from 'zod';
import { TEMPLATES_SEARCH_OPEN } from '@/features/agents/constants/agentsSearch.constants';

export const agentsSearchSchema = z.object({
  templates: z.literal(TEMPLATES_SEARCH_OPEN).nullable().catch(null).default(null),
  template: z.enum(AgentTemplateKey).nullable().catch(null).default(null),
});
