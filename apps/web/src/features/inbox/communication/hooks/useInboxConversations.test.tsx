import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { InboxConversationsDocument } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import { useInboxConversations } from '@/features/inbox/communication/hooks/useInboxConversations';
import { INBOX_CONVERSATIONS_PAGE_SIZE } from '@/features/inbox/constants/inbox.constants';
import type { InboxQueryFilters } from '@/features/inbox/typedefs/filters.typedefs';
import { InboxQueue } from '@/shared/api/generated/schema.generated';

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

const filters = (queue: InboxQueue): InboxQueryFilters => ({
  queue,
  channelIds: [],
  agentIds: [],
  search: '',
});

const listVariables = (queue: InboxQueue, after: unknown = null) => ({
  limit: INBOX_CONVERSATIONS_PAGE_SIZE,
  after,
  queue,
  channelIds: [],
  agentIds: [],
  search: null,
});

function Harness({ queue }: { readonly queue: InboxQueue }) {
  const { summaries, loadMore, loadingMore, hasMore } = useInboxConversations(filters(queue));
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
              variables: listVariables(InboxQueue.NeedsYou),
            },
            result: { data: { inboxConversations: firstPage } },
          },
          {
            request: {
              query: InboxConversationsDocument,
              variables: listVariables(InboxQueue.NeedsYou, {
                lastMessageAt: last.lastMessageAt,
                id: last.id,
              }),
            },
            result: { data: { inboxConversations: secondPage } },
          },
        ]}
      >
        <Harness queue={InboxQueue.NeedsYou} />
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

  it('drops the older pages when the filters change', async () => {
    const view = render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: InboxConversationsDocument,
              variables: listVariables(InboxQueue.NeedsYou),
            },
            result: { data: { inboxConversations: firstPage } },
            maxUsageCount: Number.POSITIVE_INFINITY,
          },
          {
            request: {
              query: InboxConversationsDocument,
              variables: listVariables(InboxQueue.NeedsYou, {
                lastMessageAt: last.lastMessageAt,
                id: last.id,
              }),
            },
            result: { data: { inboxConversations: secondPage } },
            maxUsageCount: Number.POSITIVE_INFINITY,
          },
          {
            request: {
              query: InboxConversationsDocument,
              variables: listVariables(InboxQueue.Live),
            },
            result: { data: { inboxConversations: [summary(99)] } },
            maxUsageCount: Number.POSITIVE_INFINITY,
          },
        ]}
      >
        <Harness queue={InboxQueue.NeedsYou} />
      </MockedProvider>,
    );

    await screen.findByText(String(INBOX_CONVERSATIONS_PAGE_SIZE));
    await userEvent.click(screen.getByRole('button', { name: 'load' }));
    await waitFor(() =>
      expect(screen.getByText(String(INBOX_CONVERSATIONS_PAGE_SIZE + 1))).toBeInTheDocument(),
    );

    view.rerender(
      <MockedProvider
        mocks={[
          {
            request: {
              query: InboxConversationsDocument,
              variables: listVariables(InboxQueue.Live),
            },
            result: { data: { inboxConversations: [summary(99)] } },
            maxUsageCount: Number.POSITIVE_INFINITY,
          },
        ]}
      >
        <Harness queue={InboxQueue.Live} />
      </MockedProvider>,
    );

    expect(await screen.findByText('1')).toBeInTheDocument();
    expect(screen.queryByText(String(INBOX_CONVERSATIONS_PAGE_SIZE + 1))).not.toBeInTheDocument();
  });
});
