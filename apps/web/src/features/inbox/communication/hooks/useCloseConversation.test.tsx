import { useQuery } from '@apollo/client/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { InboxCloseConversationDocument } from '@/features/inbox/communication/gql/mutation/inboxCloseConversation.generated';
import { InboxNeedsYouCountDocument } from '@/features/inbox/communication/gql/query/inboxNeedsYouCount.generated';
import { useCloseConversation } from '@/features/inbox/communication/hooks/useCloseConversation';

function Harness() {
  const { data } = useQuery(InboxNeedsYouCountDocument);
  const { closeConversation } = useCloseConversation();

  return (
    <button type="button" onClick={() => void closeConversation('cnv_1', null)}>
      {data?.inboxNeedsYouCount ?? 'none'}
    </button>
  );
}

describe('useCloseConversation', () => {
  it('refreshes the needs-you count after closing a chat', async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: InboxNeedsYouCountDocument },
            result: { data: { inboxNeedsYouCount: 1 } },
          },
          {
            request: {
              query: InboxCloseConversationDocument,
              variables: { input: { conversationId: 'cnv_1', message: null } },
            },
            result: {
              data: {
                closeConversation: {
                  __typename: 'Conversation',
                  id: 'cnv_1',
                  state: 'closed',
                },
              },
            },
          },
          {
            request: { query: InboxNeedsYouCountDocument },
            result: { data: { inboxNeedsYouCount: 0 } },
          },
        ]}
      >
        <Harness />
      </MockedProvider>,
    );

    const button = await screen.findByRole('button', { name: '1' });
    await userEvent.click(button);

    await waitFor(() => expect(screen.getByRole('button', { name: '0' })).toBeInTheDocument());
  });
});
