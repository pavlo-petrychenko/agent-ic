import { useCallback, useMemo, useState } from 'react';
import { KnowledgeFileStatus } from '@/features/knowledge/constants/knowledgeUpload.constants';
import {
  knowledgeFileId,
  knowledgeFileSkipReason,
} from '@/features/knowledge/logic/helpers/knowledgeUpload.helpers';
import type { SelectedKnowledgeFile } from '@/features/knowledge/typedefs/knowledgeUpload.typedefs';

interface FileChanges {
  readonly status?: KnowledgeFileStatus;
  readonly error?: string | null;
}

export function useAddSourceFiles() {
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
          error: null,
        });
      }
      return next;
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((current) => current.filter((file) => file.id !== id));
  }, []);

  const updateFile = useCallback((id: string, changes: FileChanges) => {
    setFiles((current) => current.map((file) => (file.id === id ? { ...file, ...changes } : file)));
  }, []);

  const counts = useMemo(() => {
    const byStatus = new Map<KnowledgeFileStatus, number>();
    for (const file of files) {
      byStatus.set(file.status, (byStatus.get(file.status) ?? 0) + 1);
    }
    const count = (status: KnowledgeFileStatus) => byStatus.get(status) ?? 0;
    const readyCount = count(KnowledgeFileStatus.Ready);
    const failedCount = count(KnowledgeFileStatus.Failed);
    return {
      readyCount,
      uploadingCount: count(KnowledgeFileStatus.Uploading),
      uploadedCount: count(KnowledgeFileStatus.Uploaded),
      failedCount,
      skippedCount: count(KnowledgeFileStatus.Skipped),
      actionCount: readyCount + failedCount,
    };
  }, [files]);

  return { files, ...counts, addFiles, removeFile, updateFile };
}
