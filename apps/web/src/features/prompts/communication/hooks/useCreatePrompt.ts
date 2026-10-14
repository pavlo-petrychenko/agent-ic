import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreatePromptDocument } from '@/features/prompts/communication/gql/mutation/createPrompt.generated';
import { PromptLibraryDocument } from '@/features/prompts/communication/gql/query/promptLibrary.generated';
import type {
  CreatePromptValues,
  UseCreatePromptResult,
} from '@/features/prompts/typedefs/prompt.typedefs';

export function useCreatePrompt(): UseCreatePromptResult {
  const [create, { loading }] = useMutation(CreatePromptDocument, {
    refetchQueries: [PromptLibraryDocument],
    awaitRefetchQueries: true,
  });

  const createPrompt = useCallback(
    async (values: CreatePromptValues) => {
      const { data } = await create({ variables: { input: values } });
      return data?.createPrompt.id ?? null;
    },
    [create],
  );

  return { createPrompt, creating: loading };
}
