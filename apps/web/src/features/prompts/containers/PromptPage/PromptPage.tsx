import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptDetail } from '@/features/prompts/communication/hooks/usePromptDetail';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { usePromptUsages } from '@/features/prompts/communication/hooks/usePromptUsages';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { DeletePromptDialog } from '@/features/prompts/containers/DeletePromptDialog';
import { MovePromptDialog } from '@/features/prompts/containers/MovePromptDialog';
import { PromptDetailsPanel } from '@/features/prompts/containers/PromptDetailsPanel';
import { PromptDraftDialogs } from '@/features/prompts/containers/PromptPage/PromptDraftDialogs';
import type { PromptPageProps } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';
import { PromptPageHeader } from '@/features/prompts/containers/PromptPage/PromptPageHeader';
import { usePromptDraftSession } from '@/features/prompts/containers/PromptPage/usePromptDraftSession';
import { usePromptOptions } from '@/features/prompts/containers/PromptPage/usePromptOptions';
import { RenamePromptDialog } from '@/features/prompts/containers/RenamePromptDialog';
import { findFolderName } from '@/features/prompts/logic/helpers/promptFolder.helpers';
import {
  canEditPrompt,
  promptMenuActions,
} from '@/features/prompts/logic/helpers/promptMenu.helpers';
import { usageCounts } from '@/features/prompts/logic/helpers/promptUsage.helpers';
import { formatPromptVersionDate } from '@/features/prompts/logic/helpers/promptVersion.helpers';
import { usePromptVariables } from '@/features/prompts/logic/hooks/usePromptVariables';
import { storeLastOpenedPromptId } from '@/features/prompts/storage/helpers/promptLastOpenedStorage.helpers';
import { PromptDraftEditor } from '@/features/prompts/view/PromptDraftEditor';
import { PromptView } from '@/features/prompts/view/PromptView';
import { useActiveWorkspace } from '@/features/workspace';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';

export function PromptPage({ workspaceId, promptId }: PromptPageProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { locale } = useLocale();
  const active = useActiveWorkspace(workspaceId);
  const { detail, failed, retry } = usePromptDetail(promptId);
  const { folders } = usePromptLibrary();
  const { usages, failed: usagesFailed, retry: retryUsages } = usePromptUsages(promptId);
  const session = usePromptDraftSession(promptId, detail?.latestVersion ?? null);
  const options = usePromptOptions(workspaceId, detail?.prompt ?? null);
  const variables = usePromptVariables(session.editorText);

  useEffect(() => {
    storeLastOpenedPromptId(workspaceId, promptId);
  }, [workspaceId, promptId]);

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
  const role = active?.role ?? null;
  const folderName = findFolderName(folders, prompt.folderId);
  const counts = usages === null ? null : usageCounts(usages);
  const usageSummary =
    counts === null || counts.versions === 0
      ? null
      : t('details.usage.summary', {
          steps: t('details.usage.steps', { count: counts.steps }),
          versions: t('details.usage.versions', { count: counts.versions }),
        });
  const subtitle = [folderName, usageSummary]
    .filter((part): part is string => part !== null)
    .join(' · ');
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
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col gap-5 pb-6">
        <PromptPageHeader
          name={prompt.name}
          subtitle={subtitle === '' ? null : subtitle}
          editing={session.editing}
          draftNumber={session.draftNumber}
          canEdit={canEditPrompt(role)}
          menuActions={promptMenuActions(role)}
          currentFolderName={folderName}
          onSelect={options.onSelect}
          onEdit={session.startEditing}
          onDiscard={session.openDiscardDialog}
          onSave={session.openSaveDialog}
        />
        <div className="flex min-h-0 flex-1 flex-col px-7">
          {session.draft !== null ? (
            <PromptDraftEditor
              draftNumber={session.draftNumber}
              baseVersionNumber={session.draft.baseVersionNumber}
              text={session.draft.text}
              variables={variables.options}
              onChange={session.changeText}
            />
          ) : (
            <PromptView
              versionNumber={latestVersion?.number ?? null}
              text={latestVersion?.text ?? ''}
              savedLabel={savedLabel}
              variables={variables.options}
            />
          )}
        </div>
      </div>
      <PromptDetailsPanel
        promptId={promptId}
        activeVersionId={session.editing ? null : (latestVersion?.id ?? null)}
        usages={usages}
        usagesFailed={usagesFailed}
        onRetryUsages={() => {
          void retryUsages();
        }}
        variablePaths={variables.paths}
      />
      <PromptDraftDialogs promptId={promptId} promptName={prompt.name} session={session} />
      {options.renaming && <RenamePromptDialog prompt={prompt} onClose={options.closeRename} />}
      {options.moving && (
        <MovePromptDialog prompt={prompt} folders={folders} onClose={options.closeMove} />
      )}
      {options.deleting && (
        <DeletePromptDialog
          workspaceId={workspaceId}
          prompt={prompt}
          usages={usages ?? []}
          onClose={options.closeDelete}
        />
      )}
    </div>
  );
}
