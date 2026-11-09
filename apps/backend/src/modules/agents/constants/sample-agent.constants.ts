import { Locale } from '@agent-ic/contracts';
import { AgentTemplateKey, agentTemplate } from '@agent-ic/flow';

export const SAMPLE_AGENT_TEMPLATE_KEY = AgentTemplateKey.CafeSupport;
export const SAMPLE_LOCALE = Locale.En;
export const SAMPLE_AGENT_NAME = agentTemplate(SAMPLE_AGENT_TEMPLATE_KEY).name[SAMPLE_LOCALE];
export const SAMPLE_AGENT_NOTE = 'First version';
export const SAMPLE_FIRST_PAGE_SIZE = 1;
