import type { MockLink } from '@apollo/client/testing';
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CompleteGoogleConnectionDocument } from '@/features/knowledge/communication/gql/mutation/completeGoogleConnection.generated';
import {
  KnowledgeBasesDocument,
  type KnowledgeBasesQuery,
} from '@/features/knowledge/communication/gql/query/knowledgeBases.generated';
import { KnowledgeSourcesDocument } from '@/features/knowledge/communication/gql/query/knowledgeSources.generated';
import { GOOGLE_CONNECTION_RETURN_STORAGE_KEY } from '@/features/knowledge/constants/googleConnection.constants';
import { buildRememberWorkspaceMock } from '@/features/workspace/communication/fixtures/rememberWorkspace.fixture';
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

const buildKnowledgeBasesMock = (): MockLink.MockedResponse => ({
  request: { query: KnowledgeBasesDocument },
  result: { data: { knowledgeBases: [SERVICES_KNOWLEDGE_BASE] } },
});

const buildKnowledgeSourcesMock = (): MockLink.MockedResponse => ({
  request: {
    query: KnowledgeSourcesDocument,
    variables: { knowledgeBaseId: SERVICES_KNOWLEDGE_BASE.id },
  },
  result: { data: { knowledgeSources: [] } },
});

const COMPLETE_CONNECTION_MOCK: MockLink.MockedResponse = {
  request: {
    query: CompleteGoogleConnectionDocument,
    variables: { input: { code: 'code-value', state: 'state-value' } },
  },
  result: { data: { completeGoogleConnection: { id: 'kcn_owner' } } },
};

describe('Google connection callback', () => {
  beforeEach(() => {
    signInForTest();
    sessionStorage.clear();
    setWorkspaceId(null);
  });

  afterEach(async () => {
    sessionStorage.clear();
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('completes the connection and returns to the knowledge base', async () => {
    sessionStorage.setItem(
      GOOGLE_CONNECTION_RETURN_STORAGE_KEY,
      JSON.stringify({
        workspaceId: DEMO_WORKSPACE.id,
        knowledgeBaseId: SERVICES_KNOWLEDGE_BASE.id,
      }),
    );
    renderRoute('/oauth/google/callback?code=code-value&state=state-value', {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildRememberWorkspaceMock(DEMO_WORKSPACE.id),
        COMPLETE_CONNECTION_MOCK,
        buildKnowledgeBasesMock(),
        buildKnowledgeSourcesMock(),
      ],
    });

    expect(
      await screen.findByRole('heading', { name: SERVICES_KNOWLEDGE_BASE.name }),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem(GOOGLE_CONNECTION_RETURN_STORAGE_KEY)).toBeNull();
  });

  it('shows a cancellation message when Google returns an error', async () => {
    sessionStorage.setItem(
      GOOGLE_CONNECTION_RETURN_STORAGE_KEY,
      JSON.stringify({
        workspaceId: DEMO_WORKSPACE.id,
        knowledgeBaseId: SERVICES_KNOWLEDGE_BASE.id,
      }),
    );
    renderRoute('/oauth/google/callback?error=access_denied');

    expect(
      await screen.findByText('Google sign-in was cancelled. Nothing changed.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to knowledge' })).toBeInTheDocument();
    expect(sessionStorage.getItem(GOOGLE_CONNECTION_RETURN_STORAGE_KEY)).toBeNull();
  });
});
