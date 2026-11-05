import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { InboxConversationsDocument } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import { useInboxConversations } from '@/features/inbox/communication/hooks/useInboxConversations';
import { INBOX_CONVERSATIONS_PAGE_SIZE } from '@/features/inbox/constants/inbox.constants';

const summary = (index: number) => ({
  __typename: 'InboxConversationSummary' as const,
  id: `cnv_${index}`,
  state: 'waiting' as const,
  handledByMe: false,
  handledByName: null,
  hasBeenHandled: false,
  channelKind: 'telegram' as const,
  channelId: 'chn_telegram',
  channelName: '@demo_salon_bot',
  agentId: 'agt_salon',
  agentName: 'Salon assistant',
  agentVersion: 3,
  endUserName: `Customer ${index}`,
  endUserExternalId: `cust_${index}`,
  preview: 'Hello',
  createdAt: '2026-11-01T14:00:00.000Z',
  lastMessageAt: new Date(Date.UTC(2026, 10, 1, 14, 0, 0) - index * 60_000).toISOString(),
  lastEscalatedAt: null,
  closedAt: null,
});

const firstPage = Array.from({ length: INBOX_CONVERSATIONS_PAGE_SIZE }, (_, index) =>
  summary(index),
);
const last = firstPage.at(-1);
if (last === undefined) {
  throw new Error('The first page is empty');
}
const secondPage = [summary(INBOX_CONVERSATIONS_PAGE_SIZE)];

function Harness() {
  const { summaries, loadMore, loadingMore, hasMore } = useInboxConversations();
  return (
    <div>
      <span>{summaries.length}</span>
      <span>{hasMore ? 'more' : 'done'}</span>
      <button type="button" disabled={loadingMore} onClick={() => void loadMore()}>
        load
      </button>
    </div>
  );
}

describe('useInboxConversations', () => {
  it('appends the next page and stops when the page is short', async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: InboxConversationsDocument,
              variables: { limit: INBOX_CONVERSATIONS_PAGE_SIZE, after: null },
            },
            result: { data: { inboxConversations: firstPage } },
          },
          {
            request: {
              query: InboxConversationsDocument,
              variables: {
                limit: INBOX_CONVERSATIONS_PAGE_SIZE,
                after: { lastMessageAt: last.lastMessageAt, id: last.id },
              },
            },
            result: { data: { inboxConversations: secondPage } },
          },
        ]}
      >
        <Harness />
      </MockedProvider>,
    );

    expect(await screen.findByText(String(INBOX_CONVERSATIONS_PAGE_SIZE))).toBeInTheDocument();
    expect(screen.getByText('more')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'load' }));

    await waitFor(() =>
      expect(screen.getByText(String(INBOX_CONVERSATIONS_PAGE_SIZE + 1))).toBeInTheDocument(),
    );
    expect(screen.getByText('done')).toBeInTheDocument();
  });
});
