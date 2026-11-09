import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreateAgentFromTemplateDocument } from '@/features/agents/communication/gql/mutation/createAgentFromTemplate.generated';
import {
  KNOWLEDGE_ROLE_TO_API,
  TEMPLATE_KEY_TO_API,
} from '@/features/agents/constants/agentTemplate.constants';
import type {
  CreateFromTemplateInput,
  UseCreateAgentFromTemplateResult,
} from '@/features/agents/typedefs/agentTemplate.typedefs';

export function useCreateAgentFromTemplate(): UseCreateAgentFromTemplateResult {
  const [create, { loading }] = useMutation(CreateAgentFromTemplateDocument);

  const createFromTemplate = useCallback(
    async ({ templateKey, name, knowledgeBaseIds, newKnowledgeBases }: CreateFromTemplateInput) => {
      const { data } = await create({
        variables: {
          input: {
            templateKey: TEMPLATE_KEY_TO_API[templateKey],
            name,
            knowledgeBaseIds,
            knowledgeBases: null,
            newKnowledgeBases: newKnowledgeBases.map((knowledgeBase) => ({
              role: knowledgeBase.role === null ? null : KNOWLEDGE_ROLE_TO_API[knowledgeBase.role],
              name: knowledgeBase.name,
            })),
          },
        },
      });
      return data?.createAgentFromTemplate.id ?? null;
    },
    [create],
  );

  return { createFromTemplate, creating: loading };
}
