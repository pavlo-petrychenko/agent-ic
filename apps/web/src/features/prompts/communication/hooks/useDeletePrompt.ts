import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DeletePromptDocument } from '@/features/prompts/communication/gql/mutation/deletePrompt.generated';
import { PromptLibraryDocument } from '@/features/prompts/communication/gql/query/promptLibrary.generated';
import type { UseDeletePromptResult } from '@/features/prompts/typedefs/prompt.typedefs';

export function useDeletePrompt(): UseDeletePromptResult {
  const [remove, { loading }] = useMutation(DeletePromptDocument, {
    refetchQueries: [PromptLibraryDocument],
    awaitRefetchQueries: true,
  });

  const deletePrompt = useCallback(
    async (id: string) => {
      await remove({ variables: { input: { id } } });
    },
    [remove],
  );

  return { deletePrompt, deleting: loading };
}
