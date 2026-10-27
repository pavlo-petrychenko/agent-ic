import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphQLError } from 'graphql';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CreateKnowledgeBaseDocument } from '@/features/knowledge/communication/gql/mutation/createKnowledgeBase.generated';
import { DeleteKnowledgeBaseDocument } from '@/features/knowledge/communication/gql/mutation/deleteKnowledgeBase.generated';
import { DeleteSourceDocument } from '@/features/knowledge/communication/gql/mutation/deleteSource.generated';
import { RenameKnowledgeBaseDocument } from '@/features/knowledge/communication/gql/mutation/renameKnowledgeBase.generated';
import { RenameSourceDocument } from '@/features/knowledge/communication/gql/mutation/renameSource.generated';
import { RetrySourceDocument } from '@/features/knowledge/communication/gql/mutation/retrySource.generated';
import {
  KnowledgeBasesDocument,
  type KnowledgeBasesQuery,
} from '@/features/knowledge/communication/gql/query/knowledgeBases.generated';
import {
  KnowledgeSourcesDocument,
  type KnowledgeSourcesQuery,
} from '@/features/knowledge/communication/gql/query/knowledgeSources.generated';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/shared/api/generated/schema.generated';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

type KnowledgeBaseFixture = KnowledgeBasesQuery['knowledgeBases'][number];
type KnowledgeSourceFixture = KnowledgeSourcesQuery['knowledgeSources'][number];

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

const READY_SOURCE: KnowledgeSourceFixture = {
  id: 'src_services',
  knowledgeBaseId: SERVICES_KNOWLEDGE_BASE.id,
  kind: KnowledgeSourceKind.Upload,
  title: 'services',
  status: KnowledgeSourceStatus.Ready,
  syncInterval: null,
  nextSyncAt: null,
  lastSyncAt: '2026-10-26T09:10:00.000Z',
  lastErrorCode: null,
  lastErrorMessage: null,
  documentCount: 1,
  chunkCount: 34,
  createdAt: '2026-10-26T09:00:00.000Z',
  updatedAt: '2026-10-26T09:10:00.000Z',
};

const INDEXING_SOURCE: KnowledgeSourceFixture = {
  ...READY_SOURCE,
  id: 'src_handbook',
  title: 'Handbook',
  status: KnowledgeSourceStatus.Indexing,
  lastSyncAt: null,
  documentCount: 0,
  chunkCount: 0,
};

const FAILED_SOURCE: KnowledgeSourceFixture = {
  ...READY_SOURCE,
  id: 'src_broken',
  title: 'Old services',
  status: KnowledgeSourceStatus.Error,
  lastErrorCode: ErrorReason.KnowledgeDocumentInvalid,
  lastErrorMessage: 'This document cannot be read.',
  chunkCount: 0,
};

const knowledgePath = `/w/${DEMO_WORKSPACE.id}/knowledge`;

const buildKnowledgeBasesMock = (
  knowledgeBases: readonly KnowledgeBaseFixture[],
): MockLink.MockedResponse => ({
  request: { query: KnowledgeBasesDocument },
  result: { data: { knowledgeBases } },
});

const buildKnowledgeSourcesMock = (
  knowledgeBaseId: string,
  knowledgeSources: readonly KnowledgeSourceFixture[] = [],
): MockLink.MockedResponse => ({
  request: { query: KnowledgeSourcesDocument, variables: { knowledgeBaseId } },
  result: { data: { knowledgeSources } },
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

const buildRenameKnowledgeBaseMock = (id: string, name: string): MockLink.MockedResponse => ({
  request: { query: RenameKnowledgeBaseDocument, variables: { input: { id, name } } },
  result: { data: { renameKnowledgeBase: { id, name } } },
});

const buildRenameKnowledgeSourceMock = (id: string, title: string): MockLink.MockedResponse => ({
  request: { query: RenameSourceDocument, variables: { input: { id, title } } },
  result: { data: { renameSource: { id, title } } },
});

const buildDeleteKnowledgeSourceMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeleteSourceDocument, variables: { input: { id } } },
  result: { data: { deleteSource: { id } } },
});

const buildRetryKnowledgeSourceMock = (id: string): MockLink.MockedResponse => ({
  request: { query: RetrySourceDocument, variables: { input: { id } } },
  result: { data: { retrySource: { id } } },
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
        buildKnowledgeSourcesMock(NEW_KNOWLEDGE_BASE.id),
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
        buildKnowledgeSourcesMock(SERVICES_KNOWLEDGE_BASE.id),
      ],
    });

    await screen.findByRole('heading', { name: SERVICES_KNOWLEDGE_BASE.name });
    expect(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', {
        name: 'Knowledge',
      }),
    ).toHaveAttribute('href', knowledgePath);
    await screen.findByText('No sources yet');
    await user.click(screen.getByRole('button', { name: 'Add source' }));

    const dialog = await screen.findByRole('dialog', {
      name: `Add source to “${SERVICES_KNOWLEDGE_BASE.name}”`,
    });
    expect(
      within(dialog).getByText('Content is chunked, embedded and indexed after you add it'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Drop files here or')).toBeInTheDocument();
  });

  it('renames a knowledge base from the header', async () => {
    const user = userEvent.setup();
    const renamedKnowledgeBase: KnowledgeBaseFixture = {
      ...SERVICES_KNOWLEDGE_BASE,
      name: 'Services and prices',
      updatedAt: '2026-10-27T10:00:00.000Z',
    };
    renderRoute(`${knowledgePath}?kb=${SERVICES_KNOWLEDGE_BASE.id}`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildKnowledgeBasesMock([SERVICES_KNOWLEDGE_BASE]),
        buildKnowledgeSourcesMock(SERVICES_KNOWLEDGE_BASE.id),
        buildRenameKnowledgeBaseMock(SERVICES_KNOWLEDGE_BASE.id, renamedKnowledgeBase.name),
        buildKnowledgeBasesMock([renamedKnowledgeBase]),
      ],
    });

    await screen.findByRole('heading', { name: SERVICES_KNOWLEDGE_BASE.name });
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename knowledge base' });
    const name = within(dialog).getByLabelText('Name');
    await user.clear(name);
    await user.type(name, renamedKnowledgeBase.name);
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText(`Knowledge base “${renamedKnowledgeBase.name}” renamed.`),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: renamedKnowledgeBase.name }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: new RegExp(renamedKnowledgeBase.name) }),
    ).toHaveAttribute('href', `${knowledgePath}?kb=${SERVICES_KNOWLEDGE_BASE.id}`);
  });

  it('renames a source from the row menu', async () => {
    const user = userEvent.setup();
    const renamedSource: KnowledgeSourceFixture = {
      ...READY_SOURCE,
      title: 'price-list',
      updatedAt: '2026-10-27T10:00:00.000Z',
    };
    renderRoute(`${knowledgePath}?kb=${SERVICES_KNOWLEDGE_BASE.id}`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildKnowledgeBasesMock([SERVICES_KNOWLEDGE_BASE]),
        buildKnowledgeSourcesMock(SERVICES_KNOWLEDGE_BASE.id, [READY_SOURCE]),
        buildRenameKnowledgeSourceMock(READY_SOURCE.id, renamedSource.title),
        buildKnowledgeSourcesMock(SERVICES_KNOWLEDGE_BASE.id, [renamedSource]),
      ],
    });

    await screen.findByRole('heading', { name: SERVICES_KNOWLEDGE_BASE.name });
    await user.click(
      await screen.findByRole('button', { name: `Actions for “${READY_SOURCE.title}”` }),
    );
    await user.click(screen.getByRole('option', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', {
      name: `Rename “${READY_SOURCE.title}”`,
    });
    const title = within(dialog).getByLabelText('Source name');
    await user.clear(title);
    await user.type(title, renamedSource.title);
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(`Source “${renamedSource.title}” renamed.`)).toBeInTheDocument();
    expect(await screen.findByText(renamedSource.title, { exact: true })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Actions for “${renamedSource.title}”` }),
    ).toBeInTheDocument();
  });

  it('shows source indexing status and chunk counts', async () => {
    renderRoute(`${knowledgePath}?kb=${SERVICES_KNOWLEDGE_BASE.id}`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildKnowledgeBasesMock([SERVICES_KNOWLEDGE_BASE]),
        buildKnowledgeSourcesMock(SERVICES_KNOWLEDGE_BASE.id, [
          READY_SOURCE,
          INDEXING_SOURCE,
          FAILED_SOURCE,
        ]),
      ],
    });

    expect(await screen.findByText('Indexed', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sources' })).toBeInTheDocument();
    expect(screen.getByText('Indexing')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('34 chunks')).toBeInTheDocument();
    expect(
      screen.getByText('This document cannot be read. Check the file and try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add source' })).toBeInTheDocument();
  });

  it('retries a failed source from the row menu', async () => {
    const user = userEvent.setup();
    const pendingSource: KnowledgeSourceFixture = {
      ...FAILED_SOURCE,
      status: KnowledgeSourceStatus.Pending,
      lastErrorCode: null,
      lastErrorMessage: null,
    };
    renderRoute(`${knowledgePath}?kb=${SERVICES_KNOWLEDGE_BASE.id}`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildKnowledgeBasesMock([SERVICES_KNOWLEDGE_BASE]),
        buildKnowledgeSourcesMock(SERVICES_KNOWLEDGE_BASE.id, [FAILED_SOURCE]),
        buildRetryKnowledgeSourceMock(FAILED_SOURCE.id),
        buildKnowledgeSourcesMock(SERVICES_KNOWLEDGE_BASE.id, [pendingSource]),
      ],
    });

    await screen.findByRole('heading', { name: SERVICES_KNOWLEDGE_BASE.name });
    await user.click(
      await screen.findByRole('button', { name: `Actions for “${FAILED_SOURCE.title}”` }),
    );
    await user.click(screen.getByRole('option', { name: 'Retry' }));

    expect(await screen.findByText(`Retrying “${FAILED_SOURCE.title}”…`)).toBeInTheDocument();
    expect(await screen.findByText('Queued')).toBeInTheDocument();
  });

  it('deletes a source from the row menu', async () => {
    const user = userEvent.setup();
    renderRoute(`${knowledgePath}?kb=${SERVICES_KNOWLEDGE_BASE.id}`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildKnowledgeBasesMock([SERVICES_KNOWLEDGE_BASE]),
        buildKnowledgeSourcesMock(SERVICES_KNOWLEDGE_BASE.id, [READY_SOURCE]),
        buildDeleteKnowledgeSourceMock(READY_SOURCE.id),
        buildKnowledgeSourcesMock(SERVICES_KNOWLEDGE_BASE.id),
        buildKnowledgeBasesMock([SERVICES_KNOWLEDGE_BASE]),
      ],
    });

    await screen.findByRole('heading', { name: SERVICES_KNOWLEDGE_BASE.name });
    await user.click(
      await screen.findByRole('button', { name: `Actions for “${READY_SOURCE.title}”` }),
    );
    await user.click(screen.getByRole('option', { name: 'Delete source' }));
    const dialog = await screen.findByRole('dialog', {
      name: `Delete “${READY_SOURCE.title}”?`,
    });
    await user.click(within(dialog).getByRole('button', { name: 'Delete source' }));

    expect(await screen.findByText(`Source “${READY_SOURCE.title}” deleted.`)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(READY_SOURCE.title, { exact: true })).not.toBeInTheDocument(),
    );
    expect(await screen.findByText('No sources yet')).toBeInTheDocument();
  });

  it('deletes an empty knowledge base and selects the next one', async () => {
    const user = userEvent.setup();
    renderRoute(`${knowledgePath}?kb=${SERVICES_KNOWLEDGE_BASE.id}`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildKnowledgeBasesMock([SERVICES_KNOWLEDGE_BASE, HOURS_KNOWLEDGE_BASE]),
        buildKnowledgeSourcesMock(SERVICES_KNOWLEDGE_BASE.id),
        buildDeleteKnowledgeBaseMock(SERVICES_KNOWLEDGE_BASE.id),
        buildKnowledgeBasesMock([HOURS_KNOWLEDGE_BASE]),
        buildKnowledgeSourcesMock(HOURS_KNOWLEDGE_BASE.id),
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
        buildKnowledgeSourcesMock(SERVICES_KNOWLEDGE_BASE.id),
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
