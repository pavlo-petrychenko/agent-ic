import { Locale } from '@agent-ic/contracts';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import {
  KnowledgeDocumentStaleReason,
  KnowledgeDocumentStatus,
} from '@/features/knowledge/constants/knowledgeDocument.constants';
import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import type { KnowledgeSource } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import { KnowledgeSourceDetails } from '@/features/knowledge/view/KnowledgeSourceDetails/KnowledgeSourceDetails';
import { createI18n } from '@/shared/i18n/clients/i18n.client';

const SOURCE: KnowledgeSource = {
  id: 'src_1',
  knowledgeBaseId: 'kbs_1',
  connectionId: 'cnn_1',
  kind: KnowledgeSourceKind.GoogleDocs,
  title: 'Ideas',
  status: KnowledgeSourceStatus.Error,
  syncInterval: null,
  nextSyncAt: null,
  lastSyncAt: '2026-11-03T14:54:06.778Z',
  lastErrorCode: 'DOCUMENT_UNREADABLE',
  lastErrorMessage: 'The document could not be read.',
  staleDocumentCount: 0,
  documentCount: 1,
  chunkCount: 1,
  createdAt: '2026-11-02T15:30:45.049Z',
  updatedAt: '2026-11-03T14:54:06.778Z',
};

describe('KnowledgeSourceDetails', () => {
  it('shows the failure reason instead of a stale summary', () => {
    render(
      <I18nextProvider i18n={createI18n(Locale.En)}>
        <KnowledgeSourceDetails
          detail={{
            source: SOURCE,
            documents: [
              {
                id: 'doc_1',
                title: 'Failed document',
                status: KnowledgeDocumentStatus.Error,
                stale: false,
                staleReason: null,
                summary: 'Stale summary from the first index.',
                failureMessage: 'This document could not be read.',
                errorCode: 'DOCUMENT_UNREADABLE',
                errorMessage: 'The document could not be read.',
                tokenCount: 1,
                chunkCount: 1,
                createdAt: '2026-11-02T15:33:47.940Z',
                updatedAt: '2026-11-03T14:54:06.778Z',
              },
            ],
          }}
          sourceFailureMessage={null}
          connection={null}
          reconnecting={false}
          onReconnect={null}
          loading={false}
          failed={false}
          retrying={false}
          syncing={false}
          canManage={false}
          canRetry={false}
          canSync={false}
          addedLabel={null}
          lastSyncedLabel={null}
          onReload={vi.fn<() => void>()}
          onClose={vi.fn<() => void>()}
          onSync={null}
          onRename={null}
          onRetry={null}
          onDelete={null}
          onEditSummary={null}
        />
      </I18nextProvider>,
    );

    expect(screen.getByText('This document could not be read.')).toBeInTheDocument();
    expect(screen.queryByText('Stale summary from the first index.')).not.toBeInTheDocument();
    expect(screen.queryByText('Connected')).not.toBeInTheDocument();
  });

  it('keeps a stale document summary and explains that it will not update', () => {
    render(
      <I18nextProvider i18n={createI18n(Locale.En)}>
        <KnowledgeSourceDetails
          detail={{
            source: {
              ...SOURCE,
              status: KnowledgeSourceStatus.Ready,
              lastErrorCode: null,
              lastErrorMessage: null,
              staleDocumentCount: 1,
            },
            documents: [
              {
                id: 'doc_1',
                title: 'Removed document',
                status: KnowledgeDocumentStatus.Indexed,
                stale: true,
                staleReason: KnowledgeDocumentStaleReason.Missing,
                summary: 'Refunds are processed within five days.',
                failureMessage: null,
                errorCode: null,
                errorMessage: null,
                tokenCount: 1,
                chunkCount: 1,
                createdAt: '2026-11-02T15:33:47.940Z',
                updatedAt: '2026-11-03T14:54:06.778Z',
              },
            ],
          }}
          sourceFailureMessage={null}
          connection={null}
          reconnecting={false}
          onReconnect={null}
          loading={false}
          failed={false}
          retrying={false}
          syncing={false}
          canManage={false}
          canRetry={false}
          canSync={false}
          addedLabel={null}
          lastSyncedLabel={null}
          onReload={vi.fn<() => void>()}
          onClose={vi.fn<() => void>()}
          onSync={null}
          onRename={null}
          onRetry={null}
          onDelete={null}
          onEditSummary={null}
        />
      </I18nextProvider>,
    );

    expect(
      screen.getByText(/1 document is no longer available in Google Drive/),
    ).toBeInTheDocument();
    expect(screen.getByText('Stale')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Google Drive no longer returns this document. It won't be updated; the last indexed copy is still searchable.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Refunds are processed within five days.')).toBeInTheDocument();
  });
});
