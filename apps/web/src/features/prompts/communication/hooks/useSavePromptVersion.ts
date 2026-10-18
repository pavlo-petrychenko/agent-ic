import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { SavePromptVersionDocument } from '@/features/prompts/communication/gql/mutation/savePromptVersion.generated';
import { PromptDetailDocument } from '@/features/prompts/communication/gql/query/promptDetail.generated';
import { PromptVersionsDocument } from '@/features/prompts/communication/gql/query/promptVersions.generated';
import type {
  SavePromptVersionValues,
  UseSavePromptVersionResult,
} from '@/features/prompts/typedefs/prompt.typedefs';

export function useSavePromptVersion(): UseSavePromptVersionResult {
  const [save, { loading }] = useMutation(SavePromptVersionDocument, {
    refetchQueries: [PromptDetailDocument, PromptVersionsDocument],
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
