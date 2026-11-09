import type { AgentTemplateKey } from '@agent-ic/flow';
import { useState } from 'react';
import type {
  TemplateSetup,
  TemplateSetupDraft,
} from '@/features/agents/typedefs/agentTemplate.typedefs';

export function useTemplateSetup(
  templateKey: AgentTemplateKey | null,
  defaultName: string,
): TemplateSetup {
  const [draft, setDraft] = useState<TemplateSetupDraft | null>(null);
  const current = draft !== null && draft.templateKey === templateKey ? draft : null;

  const update = (change: Partial<Omit<TemplateSetupDraft, 'templateKey'>>) => {
    if (templateKey !== null) {
      setDraft({
        templateKey,
        name: current?.name ?? null,
        knowledgeBaseIds: current?.knowledgeBaseIds ?? [],
        ...change,
      });
    }
  };

  return {
    name: current?.name ?? defaultName,
    knowledgeBaseIds: current?.knowledgeBaseIds ?? [],
    setName: (name) => update({ name }),
    setKnowledgeBaseIds: (knowledgeBaseIds) => update({ knowledgeBaseIds }),
  };
}
