import type { FlowDocument } from '@agent-ic/flow';
import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { SaveAgentDraftDocument } from '@/features/flow-builder/communication/gql/mutation/saveAgentDraft.generated';
import { toSavedDraft } from '@/features/flow-builder/communication/helpers/draft.helpers';
import { AGENT_TYPENAME } from '@/features/flow-builder/constants/publish.constants';
import type { SavedDraft } from '@/features/flow-builder/typedefs/autosave.typedefs';

export function useSaveAgentDraft(
  agentId: string,
): (document: FlowDocument, revision: number) => Promise<SavedDraft | null> {
  const [saveAgentDraft] = useMutation(SaveAgentDraftDocument, {
    update: (cache, { data }) =>
      void cache.modify({
        id: cache.identify({ __typename: AGENT_TYPENAME, id: agentId }),
        fields: {
          hasUnpublishedChanges: () => true,
          draftChangeCount: () => data?.saveAgentDraft.changeCount ?? null,
        },
      }),
  });

  return useCallback(
    async (document, revision) => {
      const { data } = await saveAgentDraft({
        variables: { id: agentId, flow: document, revision },
      });
      const saved = data?.saveAgentDraft ?? null;
      return saved === null ? null : toSavedDraft(saved);
    },
    [agentId, saveAgentDraft],
  );
}
