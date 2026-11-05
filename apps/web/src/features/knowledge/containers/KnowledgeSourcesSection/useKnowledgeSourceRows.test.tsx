import { ErrorReason, KnowledgeDocumentFailureCode, Locale } from '@agent-ic/contracts';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import { useKnowledgeSourceRows } from '@/features/knowledge/containers/KnowledgeSourcesSection/useKnowledgeSourceRows';
import type { KnowledgeSource } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import { KnowledgeConnectionStatus } from '@/shared/api/generated/schema.generated';
import { createI18n } from '@/shared/i18n/clients/i18n.client';

const SOURCE: KnowledgeSource = {
  id: 'src_upstream',
  knowledgeBaseId: 'kbs_services',
  connectionId: null,
  kind: KnowledgeSourceKind.Upload,
  title: 'Unavailable source',
  status: KnowledgeSourceStatus.Error,
  syncInterval: null,
  nextSyncAt: null,
  lastSyncAt: null,
  lastErrorCode: ErrorReason.UpstreamFailed,
  lastErrorMessage: 'An upstream service failed.',
  documentCount: 0,
  chunkCount: 0,
  createdAt: '2026-10-26T09:00:00.000Z',
  updatedAt: '2026-10-26T09:00:00.000Z',
};

const wrapperFor =
  (locale: Locale) =>
  ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={createI18n(locale)}>{children}</I18nextProvider>
  );

describe('useKnowledgeSourceRows', () => {
  it('translates a known source error code into a short Ukrainian reason', () => {
    const { result } = renderHook(() => useKnowledgeSourceRows([SOURCE]), {
      wrapper: wrapperFor(Locale.Uk),
    });

    expect(result.current[0]?.statusDetail).toBe('Сервіс недоступний');
    expect(result.current[0]?.canRetry).toBe(true);
  });

  it('translates a permanent document failure and hides retry', () => {
    const { result } = renderHook(
      () =>
        useKnowledgeSourceRows([
          { ...SOURCE, lastErrorCode: KnowledgeDocumentFailureCode.TooLarge },
        ]),
      { wrapper: wrapperFor(Locale.En) },
    );

    expect(result.current[0]?.statusDetail).toBe('File too large');
    expect(result.current[0]?.canRetry).toBe(false);
  });

  it('translates an unreadable document and offers retry', () => {
    const { result } = renderHook(
      () =>
        useKnowledgeSourceRows([
          { ...SOURCE, lastErrorCode: KnowledgeDocumentFailureCode.Unreadable },
        ]),
      { wrapper: wrapperFor(Locale.En) },
    );

    expect(result.current[0]?.statusDetail).toBe('Could not read');
    expect(result.current[0]?.canRetry).toBe(true);
  });

  it('asks for a reconnect while the Google connection is revoked', () => {
    const { result } = renderHook(
      () =>
        useKnowledgeSourceRows(
          [
            {
              ...SOURCE,
              connectionId: 'cnn_google',
              lastErrorCode: ErrorReason.GoogleReconnectRequired,
            },
          ],
          new Map([['cnn_google', KnowledgeConnectionStatus.Revoked]]),
        ),
      { wrapper: wrapperFor(Locale.En) },
    );

    expect(result.current[0]?.statusDetail).toBe('Reconnect needed');
    expect(result.current[0]?.canRetry).toBe(false);
  });

  it('offers a retry after the Google connection is restored', () => {
    const { result } = renderHook(
      () =>
        useKnowledgeSourceRows(
          [
            {
              ...SOURCE,
              connectionId: 'cnn_google',
              lastErrorCode: ErrorReason.GoogleReconnectRequired,
            },
          ],
          new Map([['cnn_google', KnowledgeConnectionStatus.Active]]),
        ),
      { wrapper: wrapperFor(Locale.En) },
    );

    expect(result.current[0]?.statusDetail).toBe('Retry needed');
    expect(result.current[0]?.canRetry).toBe(true);
  });

  it('falls back to the localized generic message for an unknown error code', () => {
    const { result } = renderHook(
      () => useKnowledgeSourceRows([{ ...SOURCE, lastErrorCode: 'UNKNOWN_FAILURE' }]),
      { wrapper: wrapperFor(Locale.Uk) },
    );

    expect(result.current[0]?.statusDetail).toBe('Не вдалося проіндексувати');
  });

  it('offers a sync for a ready Google source with an active connection', () => {
    const { result } = renderHook(
      () =>
        useKnowledgeSourceRows(
          [
            {
              ...SOURCE,
              connectionId: 'cnn_google',
              kind: KnowledgeSourceKind.GoogleDocs,
              status: KnowledgeSourceStatus.Ready,
              lastErrorCode: null,
              lastSyncAt: '2026-10-26T12:00:00.000Z',
            },
          ],
          new Map([['cnn_google', KnowledgeConnectionStatus.Active]]),
        ),
      { wrapper: wrapperFor(Locale.En) },
    );

    expect(result.current[0]?.canSync).toBe(true);
    expect(result.current[0]?.canRetry).toBe(false);
    expect(result.current[0]?.syncDetail).toBe('Synced Oct 26');
  });

  it('offers retry instead of sync for a failed Google source', () => {
    const { result } = renderHook(
      () =>
        useKnowledgeSourceRows(
          [
            {
              ...SOURCE,
              connectionId: 'cnn_google',
              kind: KnowledgeSourceKind.GoogleDocs,
              status: KnowledgeSourceStatus.Error,
              lastErrorCode: ErrorReason.UpstreamFailed,
            },
          ],
          new Map([['cnn_google', KnowledgeConnectionStatus.Active]]),
        ),
      { wrapper: wrapperFor(Locale.En) },
    );

    expect(result.current[0]?.canSync).toBe(false);
    expect(result.current[0]?.canRetry).toBe(true);
    expect(result.current[0]?.syncDetail).toBe('Failed Oct 26');
  });

  it('offers a sync for a ready Google source that has not synced yet', () => {
    const { result } = renderHook(
      () =>
        useKnowledgeSourceRows(
          [
            {
              ...SOURCE,
              connectionId: 'cnn_google',
              kind: KnowledgeSourceKind.GoogleDocs,
              status: KnowledgeSourceStatus.Ready,
              lastErrorCode: null,
              lastSyncAt: null,
            },
          ],
          new Map([['cnn_google', KnowledgeConnectionStatus.Active]]),
        ),
      { wrapper: wrapperFor(Locale.En) },
    );

    expect(result.current[0]?.canSync).toBe(true);
    expect(result.current[0]?.syncDetail).toBe('Added Oct 26');
  });

  it('does not offer a sync when the Google connection is revoked', () => {
    const { result } = renderHook(
      () =>
        useKnowledgeSourceRows(
          [
            {
              ...SOURCE,
              connectionId: 'cnn_google',
              kind: KnowledgeSourceKind.GoogleDocs,
              status: KnowledgeSourceStatus.Ready,
              lastErrorCode: null,
            },
          ],
          new Map([['cnn_google', KnowledgeConnectionStatus.Revoked]]),
        ),
      { wrapper: wrapperFor(Locale.En) },
    );

    expect(result.current[0]?.canSync).toBe(false);
    expect(result.current[0]?.syncDetail).toBe('Added Oct 26');
  });
});
