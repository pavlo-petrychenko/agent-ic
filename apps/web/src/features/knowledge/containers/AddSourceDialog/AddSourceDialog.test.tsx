import { ErrorCode, ErrorReason, Locale } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphQLError } from 'graphql';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmUploadDocument } from '@/features/knowledge/communication/gql/mutation/confirmUpload.generated';
import { CreateGoogleDocsSourceDocument } from '@/features/knowledge/communication/gql/mutation/createGoogleDocsSource.generated';
import { CreateGooglePickerSessionDocument } from '@/features/knowledge/communication/gql/mutation/createGooglePickerSession.generated';
import { CreateUploadDocument } from '@/features/knowledge/communication/gql/mutation/createUpload.generated';
import { DisconnectGoogleConnectionDocument } from '@/features/knowledge/communication/gql/mutation/disconnectGoogleConnection.generated';
import { StartGoogleConnectionDocument } from '@/features/knowledge/communication/gql/mutation/startGoogleConnection.generated';
import {
  KnowledgeConnectionsDocument,
  type KnowledgeConnectionsQuery,
} from '@/features/knowledge/communication/gql/query/knowledgeConnections.generated';
import { GOOGLE_CONNECTION_RETURN_STORAGE_KEY } from '@/features/knowledge/constants/googleConnection.constants';
import { AddSourceDialog } from '@/features/knowledge/containers/AddSourceDialog';
import type * as GoogleConnectionHelpers from '@/features/knowledge/logic/helpers/googleConnection.helpers';
import { redirectToGoogle } from '@/features/knowledge/logic/helpers/googleConnection.helpers';
import type * as GooglePickerHelpers from '@/features/knowledge/logic/helpers/googlePicker.helpers';
import { openGooglePicker } from '@/features/knowledge/logic/helpers/googlePicker.helpers';
import {
  KnowledgeConnectionStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/shared/api/generated/schema.generated';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

vi.mock('@/features/knowledge/logic/helpers/googleConnection.helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof GoogleConnectionHelpers>();
  return { ...actual, redirectToGoogle: vi.fn<() => void>() };
});

vi.mock('@/features/knowledge/logic/helpers/googlePicker.helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof GooglePickerHelpers>();
  return { ...actual, openGooglePicker: vi.fn<() => Promise<void>>() };
});

const PDF = new File(['a'], 'services.pdf', { type: 'application/pdf' });
const XLSX = new File(['b'], 'prices.xlsx', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});
const AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth?state=state-value';

const SOURCE = {
  id: 'src_services',
  knowledgeBaseId: 'kbs_services',
  kind: KnowledgeSourceKind.Upload,
  title: 'services',
  status: KnowledgeSourceStatus.Pending,
  syncInterval: null,
  nextSyncAt: null,
  lastSyncAt: null,
  lastErrorCode: null,
  lastErrorMessage: null,
  documentCount: 0,
  chunkCount: 0,
  createdAt: '2026-10-26T09:00:00.000Z',
  updatedAt: '2026-10-26T09:00:00.000Z',
};

type ConnectionFixture = KnowledgeConnectionsQuery['knowledgeConnections'][number];

const ACTIVE_CONNECTION: ConnectionFixture = {
  id: 'kcn_owner',
  accountEmail: 'owner@example.com',
  status: KnowledgeConnectionStatus.Active,
};

const REVOKED_CONNECTION: ConnectionFixture = {
  ...ACTIVE_CONNECTION,
  id: 'kcn_revoked',
  status: KnowledgeConnectionStatus.Revoked,
};

const CREATE_UPLOAD_MOCK: MockLink.MockedResponse = {
  request: {
    query: CreateUploadDocument,
    variables: {
      input: {
        knowledgeBaseId: 'kbs_services',
        fileName: 'services.pdf',
        mimeType: 'application/pdf',
        sizeBytes: PDF.size,
        sourceId: null,
      },
    },
  },
  result: {
    data: {
      createUpload: {
        documentId: 'doc_services',
        uploadUrl: 'https://uploads.example/services.pdf',
      },
    },
  },
};

const CONFIRM_UPLOAD_MOCK: MockLink.MockedResponse = {
  request: {
    query: ConfirmUploadDocument,
    variables: { input: { documentId: 'doc_services' } },
  },
  result: { data: { confirmUpload: SOURCE } },
};

const FAILED_CREATE_UPLOAD_MOCK: MockLink.MockedResponse = {
  request: CREATE_UPLOAD_MOCK.request,
  result: {
    errors: [
      new GraphQLError('rejected', {
        extensions: { code: ErrorCode.Internal, reason: ErrorReason.Internal },
      }),
    ],
  },
};

const buildConnectionsMock = (
  connections: readonly ConnectionFixture[],
): MockLink.MockedResponse => ({
  request: { query: KnowledgeConnectionsDocument },
  result: { data: { knowledgeConnections: connections } },
});

const START_GOOGLE_CONNECTION_MOCK: MockLink.MockedResponse = {
  request: { query: StartGoogleConnectionDocument },
  result: {
    data: {
      startGoogleConnection: {
        authorizationUrl: AUTHORIZATION_URL,
        expiresAt: '2026-10-26T09:10:00.000Z',
      },
    },
  },
};

const DISCONNECT_GOOGLE_CONNECTION_MOCK: MockLink.MockedResponse = {
  request: {
    query: DisconnectGoogleConnectionDocument,
    variables: { input: { id: ACTIVE_CONNECTION.id } },
  },
  result: { data: { disconnectGoogleConnection: { id: ACTIVE_CONNECTION.id } } },
};

const PICKER_POLICIES = {
  id: 'gdoc_policies',
  name: 'Policies',
  mimeType: 'application/vnd.google-apps.document',
  url: 'https://docs.google.com/document/d/gdoc_policies',
  resourceKey: null,
};

const PICKER_PRICES = {
  id: 'gdoc_prices',
  name: 'Prices',
  mimeType: 'application/vnd.google-apps.document',
  url: 'https://docs.google.com/document/d/gdoc_prices',
  resourceKey: null,
};

const PICKER_DOCUMENTS = [PICKER_POLICIES, PICKER_PRICES];

const CREATE_GOOGLE_PICKER_SESSION_MOCK: MockLink.MockedResponse = {
  request: {
    query: CreateGooglePickerSessionDocument,
    variables: { connectionId: ACTIVE_CONNECTION.id },
  },
  result: {
    data: {
      createGooglePickerSession: {
        accessToken: 'google-access-token',
        apiKey: 'picker-api-key',
        appId: 'picker-app-id',
        expiresAt: '2026-10-26T10:00:00.000Z',
      },
    },
  },
};

const CREATE_GOOGLE_DOCS_SOURCE_MOCK: MockLink.MockedResponse = {
  request: {
    query: CreateGoogleDocsSourceDocument,
    variables: {
      input: {
        connectionId: ACTIVE_CONNECTION.id,
        knowledgeBaseId: 'kbs_services',
        documents: PICKER_DOCUMENTS,
      },
    },
  },
  result: {
    data: {
      createGoogleDocsSource: {
        source: {
          ...SOURCE,
          kind: KnowledgeSourceKind.GoogleDocs,
          title: 'Policies',
        },
        skipped: [
          {
            id: PICKER_PRICES.id,
            name: PICKER_PRICES.name,
            reason: 'unsupported',
          },
        ],
      },
    },
  },
};

const renderDialog = (
  mocks: readonly MockLink.MockedResponse[] = [],
  locale: Locale = Locale.En,
) => {
  const onClose = vi.fn<() => void>();
  const onUploaded = vi.fn<() => void>();
  renderWithProviders(
    <AddSourceDialog
      workspaceId="ws_demo"
      knowledgeBaseId="kbs_services"
      knowledgeBaseName="Services & prices"
      onClose={onClose}
      onUploaded={onUploaded}
    />,
    { locale, mocks },
  );
  return { onClose, onUploaded };
};

const fileInput = (): HTMLInputElement => {
  const input = document.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('file input not rendered');
  }
  return input;
};

const openGoogleTab = async (): Promise<void> => {
  await userEvent.click(screen.getByRole('button', { name: /Google Docs/ }));
};

describe('AddSourceDialog', () => {
  afterEach(() => {
    vi.mocked(openGooglePicker).mockReset();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('uploads valid files, skips unsupported ones and closes after success', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { onClose, onUploaded } = renderDialog([CREATE_UPLOAD_MOCK, CONFIRM_UPLOAD_MOCK]);

    expect(
      screen.getByRole('dialog', { name: 'Add source to “Services & prices”' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Upload files')).toBeInTheDocument();
    expect(screen.getByText('Google Docs')).toBeInTheDocument();
    expect(screen.queryByText('ClickUp')).not.toBeInTheDocument();

    await user.upload(fileInput(), [PDF, XLSX]);

    expect(await screen.findByText('services.pdf')).toBeInTheDocument();
    expect(screen.getByText('prices.xlsx')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    expect(screen.getByText('not supported')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add 1 file' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onUploaded).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://uploads.example/services.pdf',
      expect.objectContaining({ method: 'PUT', body: PDF }),
    );
  });

  it('removes a selected file and disables adding when none are ready', async () => {
    const user = userEvent.setup();
    const { onUploaded } = renderDialog();

    await user.upload(fileInput(), [PDF]);
    await user.click(screen.getByRole('button', { name: 'Remove services.pdf' }));

    expect(screen.queryByText('services.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('No files selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add files' })).toBeDisabled();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('keeps the footer count in sync with ready and skipped files', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.upload(fileInput(), [PDF, XLSX]);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('1 ready · 1 skipped')).toBeInTheDocument();
  });

  it('names the unsupported format in Ukrainian', async () => {
    const user = userEvent.setup();
    renderDialog([], Locale.Uk);

    await user.upload(fileInput(), [XLSX]);

    expect(await screen.findByText('формат не підтримується')).toBeInTheDocument();
  });

  it('keeps failed files in the dialog so they can be retried', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog([FAILED_CREATE_UPLOAD_MOCK]);

    await user.upload(fileInput(), [PDF]);
    await user.click(screen.getByRole('button', { name: 'Add 1 file' }));

    expect(await screen.findByText('Something went wrong on our side.')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry 1 file' })).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('starts Google OAuth and remembers where to return', async () => {
    const user = userEvent.setup();
    const redirect = vi.mocked(redirectToGoogle);
    redirect.mockClear();
    renderDialog([buildConnectionsMock([]), START_GOOGLE_CONNECTION_MOCK]);

    await openGoogleTab();
    expect(await screen.findByText('No Google account is connected yet.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Connect Google account' }));

    await waitFor(() => expect(redirect).toHaveBeenCalledWith(AUTHORIZATION_URL));
    expect(
      JSON.parse(sessionStorage.getItem(GOOGLE_CONNECTION_RETURN_STORAGE_KEY) ?? 'null'),
    ).toEqual({ workspaceId: 'ws_demo', knowledgeBaseId: 'kbs_services' });
  });

  it('lists a connected Google account and disconnects it', async () => {
    const user = userEvent.setup();
    renderDialog([
      buildConnectionsMock([ACTIVE_CONNECTION]),
      DISCONNECT_GOOGLE_CONNECTION_MOCK,
      buildConnectionsMock([]),
    ]);

    await openGoogleTab();

    expect(await screen.findByText('owner@example.com')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pick documents' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(await screen.findByText('No Google account is connected yet.')).toBeInTheDocument();
    expect(screen.getByText('Google account disconnected.')).toBeInTheDocument();
  });

  it('asks to reconnect a revoked Google account', async () => {
    renderDialog([buildConnectionsMock([REVOKED_CONNECTION])]);

    await openGoogleTab();

    expect(await screen.findByText('Reconnect needed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pick documents' })).not.toBeInTheDocument();
    expect(
      screen.getByText('Sources from this account stop syncing until you reconnect.'),
    ).toBeInTheDocument();
  });

  it('picks Google Docs, creates a source and reports skipped documents', async () => {
    const user = userEvent.setup();
    vi.mocked(openGooglePicker).mockImplementation(async ({ onPicked }) => {
      onPicked(PICKER_DOCUMENTS);
    });
    const { onClose, onUploaded } = renderDialog([
      buildConnectionsMock([ACTIVE_CONNECTION]),
      CREATE_GOOGLE_PICKER_SESSION_MOCK,
      CREATE_GOOGLE_DOCS_SOURCE_MOCK,
    ]);

    await openGoogleTab();
    await screen.findByText('owner@example.com');
    await user.click(screen.getByRole('button', { name: 'Pick documents' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onUploaded).toHaveBeenCalled();
    expect(openGooglePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'google-access-token',
        apiKey: 'picker-api-key',
        appId: 'picker-app-id',
      }),
    );
    expect(screen.getByText('Google Docs source added.')).toBeInTheDocument();
    expect(screen.getByText('Some selected documents could not be added.')).toBeInTheDocument();
  });
});
