import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { InboxReplyAsOperatorDocument } from '@/features/inbox/communication/gql/mutation/inboxReplyAsOperator.generated';
import { InboxConversationDocument } from '@/features/inbox/communication/gql/query/inboxConversation.generated';

export function useReplyAsOperator() {
  const [reply, { loading }] = useMutation(InboxReplyAsOperatorDocument);

  const replyAsOperator = useCallback(
    async (conversationId: string, text: string) => {
      await reply({
        variables: { input: { conversationId, text } },
        refetchQueries: [
          { query: InboxConversationDocument, variables: { id: conversationId } },
          'InboxConversations',
          'InboxCounts',
        ],
        awaitRefetchQueries: true,
      });
    },
    [reply],
  );

  return { replyAsOperator, sending: loading };
}
