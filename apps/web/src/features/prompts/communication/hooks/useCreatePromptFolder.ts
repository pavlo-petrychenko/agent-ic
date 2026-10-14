import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreatePromptFolderDocument } from '@/features/prompts/communication/gql/mutation/createPromptFolder.generated';
import { PromptLibraryDocument } from '@/features/prompts/communication/gql/query/promptLibrary.generated';
import type { UseCreatePromptFolderResult } from '@/features/prompts/typedefs/prompt.typedefs';

export function useCreatePromptFolder(): UseCreatePromptFolderResult {
  const [create, { loading }] = useMutation(CreatePromptFolderDocument, {
    refetchQueries: [PromptLibraryDocument],
    awaitRefetchQueries: true,
  });

  const createPromptFolder = useCallback(
    async (name: string) => {
      const { data } = await create({ variables: { input: { name } } });
      return data?.createPromptFolder.id ?? null;
    },
    [create],
  );

  return { createPromptFolder, creating: loading };
}
