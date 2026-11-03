import { useCallback, useMemo, useState } from 'react';
import { useKnowledgeBases } from '@/features/knowledge/communication/hooks/useKnowledgeBases';
import type { KnowledgeBaseFieldProps } from '@/features/knowledge/containers/KnowledgeBaseField/KnowledgeBaseField.typedefs';
import { KnowledgeBaseField as KnowledgeBaseFieldView } from '@/features/knowledge/view/KnowledgeBaseField';
import { KnowledgeBasePickerDialog } from '@/features/knowledge/view/KnowledgeBasePickerDialog';

export function KnowledgeBaseField({ selectedIds, error, onChange }: KnowledgeBaseFieldProps) {
  const { knowledgeBases, loading, failed, retry } = useKnowledgeBases();
  const [picking, setPicking] = useState(false);
  const byId = useMemo(
    () => new Map(knowledgeBases.map((knowledgeBase) => [knowledgeBase.id, knowledgeBase])),
    [knowledgeBases],
  );
  const selected = selectedIds.flatMap((id) => {
    const knowledgeBase = byId.get(id);
    return knowledgeBase === undefined ? [] : [knowledgeBase];
  });
  const missingIds = loading || failed ? [] : selectedIds.filter((id) => !byId.has(id));

  const onToggle = useCallback(
    (id: string) => {
      onChange(
        selectedIds.includes(id)
          ? selectedIds.filter((selectedId) => selectedId !== id)
          : [...selectedIds, id],
      );
    },
    [onChange, selectedIds],
  );
  const onRemove = useCallback(
    (id: string) => onChange(selectedIds.filter((selectedId) => selectedId !== id)),
    [onChange, selectedIds],
  );

  return (
    <>
      <KnowledgeBaseFieldView
        selected={selected}
        missingIds={missingIds}
        loading={loading}
        failed={failed}
        error={error}
        onRemove={onRemove}
        onAttach={() => setPicking(true)}
        onRetry={() => void retry()}
      />
      {picking ? (
        <KnowledgeBasePickerDialog
          knowledgeBases={knowledgeBases}
          selectedIds={selectedIds}
          loading={loading}
          failed={failed}
          onToggle={onToggle}
          onRetry={() => void retry()}
          onClose={() => setPicking(false)}
        />
      ) : null}
    </>
  );
}
