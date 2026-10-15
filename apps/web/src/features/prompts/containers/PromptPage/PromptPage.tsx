import { useTranslation } from 'react-i18next';
import { usePromptDetail } from '@/features/prompts/communication/hooks/usePromptDetail';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptPageProps } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';
import { findFolderName } from '@/features/prompts/logic/helpers/promptFolder.helpers';
import { formatPromptVersionDate } from '@/features/prompts/logic/helpers/promptVersion.helpers';
import { PromptView } from '@/features/prompts/view/PromptView';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { collectPromptVariables } from '@/shared/prompt/helpers/promptDocument.helpers';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function PromptPage({ promptId }: PromptPageProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { locale } = useLocale();
  const { detail, failed, retry } = usePromptDetail(promptId);
  const { folders } = usePromptLibrary();

  if (detail === null) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-5 pb-6">
        <div className="px-7">
          {failed && (
            <Card>
              <EmptyState
                icon={IconName.Alert}
                tone={EmptyStateTone.Err}
                title={t('loadError')}
                actions={
                  <Button variant={ButtonVariant.Secondary} onClick={() => void retry()}>
                    {t('retry')}
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      </div>
    );
  }

  const { prompt, latestVersion } = detail;
  const variables: readonly VariableOption[] = collectPromptVariables(
    latestVersion?.text ?? '',
  ).map((path) => ({ id: path, label: path, group: '' }));
  const savedLabel =
    latestVersion === null
      ? null
      : latestVersion.author === null
        ? t('view.savedAt', { date: formatPromptVersionDate(latestVersion.savedAt, locale) })
        : t('view.savedBy', {
            date: formatPromptVersionDate(latestVersion.savedAt, locale),
            author: latestVersion.author,
          });

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 pb-6">
      <PageHeader title={prompt.name} subtitle={findFolderName(folders, prompt.folderId)} />
      <div className="flex min-h-0 flex-1 flex-col px-7">
        <PromptView
          versionNumber={latestVersion?.number ?? null}
          text={latestVersion?.text ?? ''}
          savedLabel={savedLabel}
          variables={variables}
        />
      </div>
    </div>
  );
}
