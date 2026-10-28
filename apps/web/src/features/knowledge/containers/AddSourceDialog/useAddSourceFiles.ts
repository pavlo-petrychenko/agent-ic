import { useCallback, useMemo, useState } from 'react';
import { KnowledgeFileStatus } from '@/features/knowledge/constants/knowledgeUpload.constants';
import {
  knowledgeFileId,
  knowledgeFileSkipReason,
} from '@/features/knowledge/logic/helpers/knowledgeUpload.helpers';
import type { SelectedKnowledgeFile } from '@/features/knowledge/typedefs/knowledgeUpload.typedefs';

export function useAddSourceFiles(
  onAddFiles: ((files: readonly File[]) => void) | undefined,
  onClose: () => void,
) {
  const [files, setFiles] = useState<readonly SelectedKnowledgeFile[]>([]);

  const addFiles = useCallback((incoming: readonly File[]) => {
    setFiles((current) => {
      const known = new Set(current.map(({ id }) => id));
      const next = [...current];
      for (const file of incoming) {
        const id = knowledgeFileId(file);
        if (known.has(id)) {
          continue;
        }
        known.add(id);
        const reason = knowledgeFileSkipReason(file);
        next.push({
          id,
          file,
          status: reason === null ? KnowledgeFileStatus.Ready : KnowledgeFileStatus.Skipped,
          reason,
        });
      }
      return next;
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((current) => current.filter((file) => file.id !== id));
  }, []);

  const readyCount = useMemo(
    () => files.filter(({ status }) => status === KnowledgeFileStatus.Ready).length,
    [files],
  );
  const skippedCount = files.length - readyCount;

  const submit = useCallback(() => {
    if (readyCount === 0) {
      return;
    }
    onAddFiles?.(
      files.filter(({ status }) => status === KnowledgeFileStatus.Ready).map(({ file }) => file),
    );
    onClose();
  }, [files, onAddFiles, onClose, readyCount]);

  return { files, readyCount, skippedCount, addFiles, removeFile, submit };
}
