import { useCallback, useState } from 'react';
import { usePromptVersion } from '@/features/prompts/communication/hooks/usePromptVersion';
import type { UsePromptVersionViewResult } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';

interface SelectedVersion {
  readonly promptId: string;
  readonly versionId: string;
}

export function usePromptVersionView(
  promptId: string,
  latestVersionId: string | null,
): UsePromptVersionViewResult {
  const [selected, setSelected] = useState<SelectedVersion | null>(null);
  const selectedVersionId =
    selected !== null && selected.promptId === promptId ? selected.versionId : null;
  const olderVersionId =
    selectedVersionId !== null && selectedVersionId !== latestVersionId ? selectedVersionId : null;
  const { version, failed, retry } = usePromptVersion(olderVersionId);

  const select = useCallback(
    (versionId: string) => setSelected({ promptId, versionId }),
    [promptId],
  );
  const clearSelection = useCallback(() => setSelected(null), []);

  return {
    olderVersionId,
    olderVersion: version,
    failed,
    retry,
    select,
    clearSelection,
  };
}
