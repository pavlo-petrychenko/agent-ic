import { ErrorReason, Locale } from '@agent-ic/contracts';
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
import { createI18n } from '@/shared/i18n/clients/i18n.client';

const SOURCE: KnowledgeSource = {
  id: 'src_upstream',
  knowledgeBaseId: 'kbs_services',
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
  it('translates a known source error code into Ukrainian', () => {
    const { result } = renderHook(() => useKnowledgeSourceRows([SOURCE]), {
      wrapper: wrapperFor(Locale.Uk),
    });

    expect(result.current[0]?.statusDetail).toBe(
      'Зовнішній сервіс не відповідає. Спробуйте за мить.',
    );
  });

  it('falls back to the localized generic message for an unknown error code', () => {
    const { result } = renderHook(
      () => useKnowledgeSourceRows([{ ...SOURCE, lastErrorCode: 'DOCUMENT_UNREADABLE' }]),
      { wrapper: wrapperFor(Locale.Uk) },
    );

    expect(result.current[0]?.statusDetail).toBe('Не вдалося проіндексувати');
  });
});
