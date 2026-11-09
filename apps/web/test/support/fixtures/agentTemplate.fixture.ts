import { Locale } from '@agent-ic/contracts';
import type { AgentTemplateKey } from '@agent-ic/flow';
import { toTemplateCards } from '@/features/agents/logic/helpers/agentTemplate.helpers';
import type { AgentTemplateCard } from '@/features/agents/typedefs/agentTemplate.typedefs';

export const TEMPLATE_CARDS: readonly AgentTemplateCard[] = toTemplateCards(
  Locale.En,
  'UTC',
  (type) => `Step ${type}`,
);

export const templateCardOf = (key: AgentTemplateKey): AgentTemplateCard => {
  const card = TEMPLATE_CARDS.find((candidate) => candidate.key === key);
  if (card === undefined) {
    throw new Error(`No template card for ${key}`);
  }
  return card;
};
