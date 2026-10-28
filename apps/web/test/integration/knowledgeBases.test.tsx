import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphQLError } from 'graphql';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CreateKnowledgeBaseDocument } from '@/features/knowledge/communication/gql/mutation/createKnowledgeBase.generated';
import { DeleteKnowledgeBaseDocument } from '@/features/knowledge/communication/gql/mutation/deleteKnowledgeBase.generated';
import {
  KnowledgeBasesDocument,
  type KnowledgeBasesQuery,
} from '@/features/knowledge/communication/gql/query/knowledgeBases.generated';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

type KnowledgeBaseFixture = KnowledgeBasesQuery['knowledgeBases'][number];

const SERVICES_KNOWLEDGE_BASE: KnowledgeBaseFixture = {
  id: 'kbs_services',
  name: 'Services & prices',
  description: null,
  toolName: 'search_services_prices',
  toolDescription: null,
  documentCount: 0,
  chunkCount: 0,
  createdAt: '2026-10-25T09:00:00.000Z',
  updatedAt: '2026-10-25T09:00:00.000Z',
};

const HOURS_KNOWLEDGE_BASE: KnowledgeBaseFixture = {
  ...SERVICES_KNOWLEDGE_BASE,
  id: 'kbs_hours',
  name: 'Opening hours',
  toolName: 'search_opening_hours',
};

const NEW_KNOWLEDGE_BASE: KnowledgeBaseFixture = {
  ...SERVICES_KNOWLEDGE_BASE,
  id: 'kbs_new',
  name: 'Handbook',
  toolName: 'search_handbook',
};

const knowledgePath = `/w/${DEMO_WORKSPACE.id}/knowledge`;

const buildKnowledgeBasesMock = (
  knowledgeBases: readonly KnowledgeBaseFixture[],
): MockLink.MockedResponse => ({
  request: { query: KnowledgeBasesDocument },
  result: { data: { knowledgeBases } },
});

const buildCreateKnowledgeBaseMock = (
  name: string,
  knowledgeBase: KnowledgeBaseFixture,
): MockLink.MockedResponse => ({
  request: {
    query: CreateKnowledgeBaseDocument,
    variables: { input: { name, description: null } },
  },
  result: { data: { createKnowledgeBase: knowledgeBase } },
});

const buildDeleteKnowledgeBaseMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeleteKnowledgeBaseDocument, variables: { input: { id } } },
  result: { data: { deleteKnowledgeBase: { id } } },
});

const buildDeleteKnowledgeBaseFailureMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeleteKnowledgeBaseDocument, variables: { input: { id } } },
  result: {
    errors: [
      new GraphQLError('rejected', {
        extensions: {
          code: ErrorCode.Conflict,
          reason: ErrorReason.KnowledgeBaseHasSources,
        },
      }),
    ],
  },
});

describe('knowledge bases', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('creates a knowledge base from the empty screen', async () => {
    const user = userEvent.setup();
    renderRoute(knowledgePath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildKnowledgeBasesMock([]),
        buildCreateKnowledgeBaseMock('Handbook', NEW_KNOWLEDGE_BASE),
        buildKnowledgeBasesMock([NEW_KNOWLEDGE_BASE]),
      ],
    });

    const main = await screen.findByRole('main');
    await user.click(await within(main).findByRole('button', { name: 'New knowledge base' }));
    const dialog = await screen.findByRole('dialog', { name: 'New knowledge base' });
    await user.type(within(dialog).getByLabelText('Name'), 'Handbook');
    await user.click(within(dialog).getByRole('button', { name: 'Create knowledge base' }));

    expect(await screen.findByText('Knowledge base “Handbook” created.')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Handbook' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Handbook/ })).toHaveAttribute(
      'href',
      `${knowledgePath}?kb=${NEW_KNOWLEDGE_BASE.id}`,
    );
  });

  it('opens the add source dialog from an empty knowledge base', async () => {
    const user = userEvent.setup();
    renderRoute(`${knowledgePath}?kb=${SERVICES_KNOWLEDGE_BASE.id}`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildKnowledgeBasesMock([SERVICES_KNOWLEDGE_BASE]),
      ],
    });

    await screen.findByRole('heading', { name: SERVICES_KNOWLEDGE_BASE.name });
    await user.click(screen.getByRole('button', { name: 'Add source' }));

    const dialog = await screen.findByRole('dialog', {
      name: `Add source to “${SERVICES_KNOWLEDGE_BASE.name}”`,
    });
    expect(
      within(dialog).getByText('Content is chunked, embedded and indexed after you add it'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Drop files here or')).toBeInTheDocument();
  });

  it('deletes an empty knowledge base and selects the next one', async () => {
    const user = userEvent.setup();
    renderRoute(`${knowledgePath}?kb=${SERVICES_KNOWLEDGE_BASE.id}`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildKnowledgeBasesMock([SERVICES_KNOWLEDGE_BASE, HOURS_KNOWLEDGE_BASE]),
        buildDeleteKnowledgeBaseMock(SERVICES_KNOWLEDGE_BASE.id),
        buildKnowledgeBasesMock([HOURS_KNOWLEDGE_BASE]),
      ],
    });

    expect(
      await screen.findByRole('heading', { name: SERVICES_KNOWLEDGE_BASE.name }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', {
      name: `Delete “${SERVICES_KNOWLEDGE_BASE.name}”?`,
    });
    await user.click(within(dialog).getByRole('button', { name: 'Delete knowledge base' }));

    expect(
      await screen.findByText(`Knowledge base “${SERVICES_KNOWLEDGE_BASE.name}” deleted.`),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(
      await screen.findByRole('heading', { name: HOURS_KNOWLEDGE_BASE.name }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: new RegExp(SERVICES_KNOWLEDGE_BASE.name) }),
    ).not.toBeInTheDocument();
  });

  it('keeps a knowledge base that still has sources', async () => {
    const user = userEvent.setup();
    renderRoute(`${knowledgePath}?kb=${SERVICES_KNOWLEDGE_BASE.id}`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildKnowledgeBasesMock([SERVICES_KNOWLEDGE_BASE]),
        buildDeleteKnowledgeBaseFailureMock(SERVICES_KNOWLEDGE_BASE.id),
      ],
    });

    await screen.findByRole('heading', { name: SERVICES_KNOWLEDGE_BASE.name });
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', {
      name: `Delete “${SERVICES_KNOWLEDGE_BASE.name}”?`,
    });
    expect(
      within(dialog).getByText('This deletes the knowledge base. This cannot be undone.'),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete knowledge base' }));

    expect(
      await within(dialog).findByText('Delete the sources in this knowledge base first.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(`Knowledge base “${SERVICES_KNOWLEDGE_BASE.name}” deleted.`),
    ).not.toBeInTheDocument();
  });
});
