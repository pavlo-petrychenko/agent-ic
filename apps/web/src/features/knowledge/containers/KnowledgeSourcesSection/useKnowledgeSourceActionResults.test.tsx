import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import { useKnowledgeSourceActionResults } from '@/features/knowledge/containers/KnowledgeSourcesSection/useKnowledgeSourceActionResults';
import type {
  KnowledgeSource,
  KnowledgeSourceActionResult,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

const SOURCE: KnowledgeSource = {
  id: 'src_1',
  knowledgeBaseId: 'kbs_1',
  connectionId: 'cnn_1',
  kind: KnowledgeSourceKind.GoogleDocs,
  title: 'Source',
  status: KnowledgeSourceStatus.Ready,
  syncInterval: null,
  nextSyncAt: null,
  lastSyncAt: '2026-10-26T09:00:00.000Z',
  lastErrorCode: null,
  lastErrorMessage: null,
  staleDocumentCount: 0,
  documentCount: 1,
  chunkCount: 1,
  createdAt: '2026-10-26T09:00:00.000Z',
  updatedAt: '2026-10-26T09:00:00.000Z',
};

describe('useKnowledgeSourceActionResults', () => {
  it('reports a failed action after the source leaves the active state', () => {
    const onResult = vi.fn<(result: KnowledgeSourceActionResult) => void>();
    const { result, rerender } = renderHook(
      ({ sources }: { readonly sources: readonly KnowledgeSource[] }) =>
        useKnowledgeSourceActionResults(sources, onResult),
      { initialProps: { sources: [SOURCE] } },
    );

    act(() => {
      result.current({ id: SOURCE.id, title: SOURCE.title }, 'retry');
    });
    rerender({ sources: [{ ...SOURCE, status: KnowledgeSourceStatus.Indexing }] });
    rerender({
      sources: [
        {
          ...SOURCE,
          status: KnowledgeSourceStatus.Error,
          lastErrorCode: 'DOCUMENT_UNREADABLE',
        },
      ],
    });

    expect(onResult).toHaveBeenCalledWith({
      action: 'retry',
      source: expect.objectContaining({
        id: SOURCE.id,
        status: KnowledgeSourceStatus.Error,
      }),
      succeeded: false,
    });
  });

  it('reports a result when the source finishes before the first active poll', () => {
    const onResult = vi.fn<(result: KnowledgeSourceActionResult) => void>();
    const { result, rerender } = renderHook(
      ({ sources }: { readonly sources: readonly KnowledgeSource[] }) =>
        useKnowledgeSourceActionResults(sources, onResult),
      { initialProps: { sources: [SOURCE] } },
    );

    act(() => {
      result.current({ id: SOURCE.id, title: SOURCE.title }, 'sync');
    });
    rerender({
      sources: [
        {
          ...SOURCE,
          status: KnowledgeSourceStatus.Error,
          updatedAt: '2026-11-03T14:55:00.000Z',
          lastErrorCode: 'DOCUMENT_UNREADABLE',
        },
      ],
    });

    expect(onResult).toHaveBeenCalledWith({
      action: 'sync',
      source: expect.objectContaining({ id: SOURCE.id, status: KnowledgeSourceStatus.Error }),
      succeeded: false,
    });
  });

  it('reports a successful action after the source becomes ready', () => {
    const onResult = vi.fn<(result: KnowledgeSourceActionResult) => void>();
    const { result, rerender } = renderHook(
      ({ sources }: { readonly sources: readonly KnowledgeSource[] }) =>
        useKnowledgeSourceActionResults(sources, onResult),
      { initialProps: { sources: [SOURCE] } },
    );

    act(() => {
      result.current({ id: SOURCE.id, title: SOURCE.title }, 'sync');
    });
    rerender({ sources: [{ ...SOURCE, status: KnowledgeSourceStatus.Pending }] });
    rerender({ sources: [SOURCE] });

    expect(onResult).toHaveBeenCalledWith({
      action: 'sync',
      source: expect.objectContaining({ id: SOURCE.id, status: KnowledgeSourceStatus.Ready }),
      succeeded: true,
    });
  });
});
