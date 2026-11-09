import type { AgentTemplateKey } from '@agent-ic/flow';
import { useState } from 'react';
import { TemplateKnowledgeMode } from '@/features/agents/constants/agentTemplate.constants';
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
        knowledgeMode: current?.knowledgeMode ?? TemplateKnowledgeMode.CreateNew,
        knowledgeBaseIds: current?.knowledgeBaseIds ?? [],
        ...change,
      });
    }
  };

  return {
    name: current?.name ?? defaultName,
    knowledgeMode: current?.knowledgeMode ?? TemplateKnowledgeMode.CreateNew,
    knowledgeBaseIds: current?.knowledgeBaseIds ?? [],
    setName: (name) => update({ name }),
    setKnowledgeMode: (knowledgeMode) => update({ knowledgeMode }),
    setKnowledgeBaseIds: (knowledgeBaseIds) => update({ knowledgeBaseIds }),
  };
}
