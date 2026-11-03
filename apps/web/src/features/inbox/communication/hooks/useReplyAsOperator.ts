import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { InboxReplyAsOperatorDocument } from '@/features/inbox/communication/gql/mutation/inboxReplyAsOperator.generated';
import { InboxConversationDocument } from '@/features/inbox/communication/gql/query/inboxConversation.generated';
import { InboxConversationsDocument } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import { INBOX_CONVERSATIONS_FETCH_LIMIT } from '@/features/inbox/constants/inbox.constants';

export function useReplyAsOperator() {
  const [reply, { loading }] = useMutation(InboxReplyAsOperatorDocument);

  const replyAsOperator = useCallback(
    async (conversationId: string, text: string) => {
      await reply({
        variables: { input: { conversationId, text } },
        refetchQueries: [
          { query: InboxConversationDocument, variables: { id: conversationId } },
          {
            query: InboxConversationsDocument,
            variables: { limit: INBOX_CONVERSATIONS_FETCH_LIMIT },
          },
        ],
        awaitRefetchQueries: true,
      });
    },
    [reply],
  );

  return { replyAsOperator, sending: loading };
}
