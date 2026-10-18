import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RenamePromptFolderDocument } from '@/features/prompts/communication/gql/mutation/renamePromptFolder.generated';
import { PromptLibraryDocument } from '@/features/prompts/communication/gql/query/promptLibrary.generated';
import type {
  RenamePromptFolderValues,
  UseRenamePromptFolderResult,
} from '@/features/prompts/typedefs/prompt.typedefs';

export function useRenamePromptFolder(): UseRenamePromptFolderResult {
  const [rename, { loading }] = useMutation(RenamePromptFolderDocument, {
    refetchQueries: [PromptLibraryDocument],
    awaitRefetchQueries: true,
  });

  const renamePromptFolder = useCallback(
    async (values: RenamePromptFolderValues) => {
      const { data } = await rename({ variables: { input: values } });
      return data?.renamePromptFolder.id ?? null;
    },
    [rename],
  );

  return { renamePromptFolder, renaming: loading };
}
