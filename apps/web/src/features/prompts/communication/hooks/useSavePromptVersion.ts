import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { SavePromptVersionDocument } from '@/features/prompts/communication/gql/mutation/savePromptVersion.generated';
import { PromptDetailDocument } from '@/features/prompts/communication/gql/query/promptDetail.generated';
import { PromptLibraryDocument } from '@/features/prompts/communication/gql/query/promptLibrary.generated';
import { PromptVersionsDocument } from '@/features/prompts/communication/gql/query/promptVersions.generated';
import type {
  SavePromptVersionValues,
  UseSavePromptVersionResult,
} from '@/features/prompts/typedefs/prompt.typedefs';

export function useSavePromptVersion(): UseSavePromptVersionResult {
  const [save, { loading }] = useMutation(SavePromptVersionDocument, {
    refetchQueries: [PromptDetailDocument, PromptLibraryDocument, PromptVersionsDocument],
    awaitRefetchQueries: true,
  });

  const savePromptVersion = useCallback(
    async (values: SavePromptVersionValues) => {
      const { data } = await save({ variables: { input: values } });
      return data?.savePromptVersion.latestVersion?.number ?? null;
    },
    [save],
  );

  return { savePromptVersion, saving: loading };
}
