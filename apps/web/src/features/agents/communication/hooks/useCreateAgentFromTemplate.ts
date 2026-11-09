import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreateAgentFromTemplateDocument } from '@/features/agents/communication/gql/mutation/createAgentFromTemplate.generated';
import { TEMPLATE_KEY_TO_API } from '@/features/agents/constants/agentTemplate.constants';
import type {
  CreateFromTemplateInput,
  UseCreateAgentFromTemplateResult,
} from '@/features/agents/typedefs/agentTemplate.typedefs';

export function useCreateAgentFromTemplate(): UseCreateAgentFromTemplateResult {
  const [create, { loading }] = useMutation(CreateAgentFromTemplateDocument);

  const createFromTemplate = useCallback(
    async ({ templateKey, name, knowledgeBaseIds }: CreateFromTemplateInput) => {
      const { data } = await create({
        variables: {
          input: { templateKey: TEMPLATE_KEY_TO_API[templateKey], name, knowledgeBaseIds },
        },
      });
      return data?.createAgentFromTemplate.id ?? null;
    },
    [create],
  );

  return { createFromTemplate, creating: loading };
}
