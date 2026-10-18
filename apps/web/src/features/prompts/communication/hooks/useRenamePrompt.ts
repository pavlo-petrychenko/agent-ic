import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RenamePromptDocument } from '@/features/prompts/communication/gql/mutation/renamePrompt.generated';
import { PromptDetailDocument } from '@/features/prompts/communication/gql/query/promptDetail.generated';
import { PromptLibraryDocument } from '@/features/prompts/communication/gql/query/promptLibrary.generated';
import type {
  RenamePromptValues,
  UseRenamePromptResult,
} from '@/features/prompts/typedefs/prompt.typedefs';

export function useRenamePrompt(): UseRenamePromptResult {
  const [rename, { loading }] = useMutation(RenamePromptDocument, {
    refetchQueries: [PromptLibraryDocument, PromptDetailDocument],
    awaitRefetchQueries: true,
  });

  const renamePrompt = useCallback(
    async (values: RenamePromptValues) => {
      const { data } = await rename({ variables: { input: values } });
      return data?.renamePrompt.id ?? null;
    },
    [rename],
  );

  return { renamePrompt, renaming: loading };
}
