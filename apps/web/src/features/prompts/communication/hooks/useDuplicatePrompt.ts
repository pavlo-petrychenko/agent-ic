import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DuplicatePromptDocument } from '@/features/prompts/communication/gql/mutation/duplicatePrompt.generated';
import { PromptLibraryDocument } from '@/features/prompts/communication/gql/query/promptLibrary.generated';
import type {
  DuplicatePromptValues,
  UseDuplicatePromptResult,
} from '@/features/prompts/typedefs/prompt.typedefs';

export function useDuplicatePrompt(): UseDuplicatePromptResult {
  const [duplicate, { loading }] = useMutation(DuplicatePromptDocument, {
    refetchQueries: [PromptLibraryDocument],
    awaitRefetchQueries: true,
  });

  const duplicatePrompt = useCallback(
    async (values: DuplicatePromptValues) => {
      const { data } = await duplicate({ variables: { input: values } });
      return data?.duplicatePrompt ?? null;
    },
    [duplicate],
  );

  return { duplicatePrompt, duplicating: loading };
}
