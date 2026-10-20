import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DeletePromptFolderDocument } from '@/features/prompts/communication/gql/mutation/deletePromptFolder.generated';
import { PromptLibraryDocument } from '@/features/prompts/communication/gql/query/promptLibrary.generated';
import type { UseDeletePromptFolderResult } from '@/features/prompts/typedefs/prompt.typedefs';

export function useDeletePromptFolder(): UseDeletePromptFolderResult {
  const [remove, { loading }] = useMutation(DeletePromptFolderDocument, {
    refetchQueries: [PromptLibraryDocument],
    awaitRefetchQueries: true,
  });

  const deletePromptFolder = useCallback(
    async (id: string) => {
      await remove({ variables: { input: { id } } });
    },
    [remove],
  );

  return { deletePromptFolder, deleting: loading };
}
