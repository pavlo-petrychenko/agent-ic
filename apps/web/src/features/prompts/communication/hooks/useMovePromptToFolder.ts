import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { MovePromptToFolderDocument } from '@/features/prompts/communication/gql/mutation/movePromptToFolder.generated';
import { PromptDetailDocument } from '@/features/prompts/communication/gql/query/promptDetail.generated';
import { PromptLibraryDocument } from '@/features/prompts/communication/gql/query/promptLibrary.generated';
import type {
  MovePromptToFolderValues,
  UseMovePromptToFolderResult,
} from '@/features/prompts/typedefs/prompt.typedefs';

export function useMovePromptToFolder(): UseMovePromptToFolderResult {
  const [move, { loading }] = useMutation(MovePromptToFolderDocument, {
    refetchQueries: [PromptLibraryDocument, PromptDetailDocument],
    awaitRefetchQueries: true,
  });

  const movePromptToFolder = useCallback(
    async (values: MovePromptToFolderValues) => {
      const { data } = await move({ variables: { input: values } });
      return data?.movePromptToFolder.id ?? null;
    },
    [move],
  );

  return { movePromptToFolder, moving: loading };
}
