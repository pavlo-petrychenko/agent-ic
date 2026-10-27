import { ErrorCode, ErrorReason, Locale } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphQLError } from 'graphql';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmUploadDocument } from '@/features/knowledge/communication/gql/mutation/confirmUpload.generated';
import { CreateUploadDocument } from '@/features/knowledge/communication/gql/mutation/createUpload.generated';
import { AddSourceDialog } from '@/features/knowledge/containers/AddSourceDialog';
import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/shared/api/generated/schema.generated';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const PDF = new File(['a'], 'services.pdf', { type: 'application/pdf' });
const XLSX = new File(['b'], 'prices.xlsx', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

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

const renderDialog = (
  mocks: readonly MockLink.MockedResponse[] = [],
  locale: Locale = Locale.En,
) => {
  const onClose = vi.fn<() => void>();
  const onUploaded = vi.fn<() => void>();
  renderWithProviders(
    <AddSourceDialog
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

describe('AddSourceDialog', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
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
    expect(screen.getByText('ClickUp')).toBeInTheDocument();

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
});
