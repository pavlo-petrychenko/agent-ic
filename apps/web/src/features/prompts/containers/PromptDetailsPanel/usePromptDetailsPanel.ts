import { useCallback, useMemo } from 'react';
import { usePromptVersions } from '@/features/prompts/communication/hooks/usePromptVersions';
import type { UsePromptDetailsPanelResult } from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsPanel.typedefs';
import { pinnedNumbers } from '@/features/prompts/logic/helpers/promptUsage.helpers';
import { formatPromptVersionDate } from '@/features/prompts/logic/helpers/promptVersion.helpers';
import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';
import { useLocale } from '@/shared/i18n/hooks/useLocale';

export function usePromptDetailsPanel(
  promptId: string,
  usages: readonly PromptUsageItem[] | null,
  onCompare: ((fromId: string, toId: string) => void) | null,
): UsePromptDetailsPanelResult {
  const { locale } = useLocale();
  const { versions, failed, retry } = usePromptVersions(promptId);

  const versionRows = useMemo(
    () =>
      versions === null
        ? null
        : versions.map((version) => ({
            id: version.id,
            number: version.number,
            note: version.note,
            date: formatPromptVersionDate(version.savedAt, locale),
          })),
    [locale, versions],
  );

  const pinnedVersionNumbers = useMemo(
    () => (usages === null ? [] : pinnedNumbers(usages)),
    [usages],
  );

  const retryVersions = useCallback(() => {
    void retry();
  }, [retry]);

  const compareVersions = useMemo(() => {
    if (onCompare === null || versions === null) {
      return null;
    }
    const [latest, previous] = versions;
    if (latest === undefined || previous === undefined) {
      return null;
    }
    return () => onCompare(previous.id, latest.id);
  }, [onCompare, versions]);

  return {
    versions: versionRows,
    pinnedNumbers: pinnedVersionNumbers,
    versionsFailed: failed,
    retryVersions,
    compareVersions,
  };
}
