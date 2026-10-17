import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptDetail } from '@/features/prompts/communication/hooks/usePromptDetail';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { DeletePromptDialog } from '@/features/prompts/containers/DeletePromptDialog';
import { MovePromptDialog } from '@/features/prompts/containers/MovePromptDialog';
import type { PromptPageProps } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';
import { usePromptDraft } from '@/features/prompts/containers/PromptPage/usePromptDraft';
import { usePromptOptions } from '@/features/prompts/containers/PromptPage/usePromptOptions';
import { usePromptVersionView } from '@/features/prompts/containers/PromptPage/usePromptVersionView';
import { PromptVersionsPanel } from '@/features/prompts/containers/PromptVersionsPanel';
import { RenamePromptDialog } from '@/features/prompts/containers/RenamePromptDialog';
import { SavePromptVersionDialog } from '@/features/prompts/containers/SavePromptVersionDialog';
import { nextPromptVersionNumber } from '@/features/prompts/logic/helpers/promptDraft.helpers';
import { findFolderName } from '@/features/prompts/logic/helpers/promptFolder.helpers';
import { formatPromptVersionDate } from '@/features/prompts/logic/helpers/promptVersion.helpers';
import { storeLastOpenedPromptId } from '@/features/prompts/storage/helpers/promptLastOpenedStorage.helpers';
import { DiscardPromptDraftModal } from '@/features/prompts/view/DiscardPromptDraftModal';
import { PromptDraftEditor } from '@/features/prompts/view/PromptDraftEditor';
import { PromptOptionsMenu } from '@/features/prompts/view/PromptOptionsMenu';
import { PromptView } from '@/features/prompts/view/PromptView';
import { useActiveWorkspace } from '@/features/workspace';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { collectPromptVariables } from '@/shared/prompt/helpers/promptDocument.helpers';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function PromptPage({ workspaceId, promptId }: PromptPageProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { locale } = useLocale();
  const active = useActiveWorkspace(workspaceId);
  const { detail, failed, retry } = usePromptDetail(promptId);
  const { folders } = usePromptLibrary();
  const { draft, beginDraft, updateDraft, discardDraft } = usePromptDraft(promptId);
  const options = usePromptOptions(workspaceId, detail?.prompt ?? null);
  const versionView = usePromptVersionView(promptId, detail?.latestVersion?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  useEffect(() => {
    storeLastOpenedPromptId(workspaceId, promptId);
  }, [workspaceId, promptId]);

  const editing = draft !== null;
  const canEdit =
    active !== null && can(active.role, PermissionResource.Prompts, PermissionAction.Edit);
  const canDelete =
    active !== null && can(active.role, PermissionResource.Prompts, PermissionAction.Delete);
  const menuActions = [
    ...(canEdit
      ? [PromptMenuAction.Rename, PromptMenuAction.Move, PromptMenuAction.Duplicate]
      : []),
    ...(canDelete ? [PromptMenuAction.Delete] : []),
  ];

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
  const folderName = findFolderName(folders, prompt.folderId);
  const draftNumber = nextPromptVersionNumber(latestVersion?.number ?? null);
  const shownVersion =
    versionView.olderVersionId === null ? latestVersion : versionView.olderVersion;
  const editorText = editing ? draft.text : (shownVersion?.text ?? '');
  const variables: readonly VariableOption[] = collectPromptVariables(editorText).map((path) => ({
    id: path,
    label: path,
    group: '',
  }));
  const savedLabel =
    shownVersion === null
      ? null
      : shownVersion.author === null
        ? t('view.savedAt', { date: formatPromptVersionDate(shownVersion.savedAt, locale) })
        : t('view.savedBy', {
            date: formatPromptVersionDate(shownVersion.savedAt, locale),
            author: shownVersion.author,
          });

  const finishSaving = () => {
    discardDraft();
    versionView.clearSelection();
    setSaving(false);
  };

  const finishDiscarding = () => {
    discardDraft();
    setDiscarding(false);
  };

  const body = () => {
    if (editing) {
      return (
        <PromptDraftEditor
          draftNumber={draftNumber}
          baseVersionNumber={draft.baseVersionNumber}
          text={draft.text}
          variables={variables}
          onChange={updateDraft}
        />
      );
    }
    if (versionView.olderVersionId !== null && shownVersion === null) {
      return versionView.failed ? (
        <Card>
          <EmptyState
            icon={IconName.Alert}
            tone={EmptyStateTone.Err}
            title={t('view.versionLoadError')}
            actions={
              <Button variant={ButtonVariant.Secondary} onClick={() => void versionView.retry()}>
                {t('retry')}
              </Button>
            }
          />
        </Card>
      ) : (
        <Skeleton label={t('view.loadingVersion')} />
      );
    }
    return (
      <PromptView
        versionNumber={shownVersion?.number ?? null}
        text={editorText}
        savedLabel={savedLabel}
        variables={variables}
        olderThanVersionNumber={
          versionView.olderVersionId === null ? null : (latestVersion?.number ?? null)
        }
        onBackToLatest={versionView.olderVersionId === null ? null : versionView.clearSelection}
      />
    );
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col gap-5 pb-6">
        <PageHeader
          title={prompt.name}
          subtitle={folderName}
          actions={
            editing ? (
              <>
                <Button variant={ButtonVariant.Secondary} onClick={() => setDiscarding(true)}>
                  {t('draft.discard')}
                </Button>
                <Button onClick={() => setSaving(true)}>
                  {t('draft.saveAs', { number: draftNumber })}
                </Button>
              </>
            ) : versionView.olderVersionId !== null ? (
              canEdit && shownVersion !== null ? (
                <Button onClick={() => beginDraft(shownVersion)}>{t('view.restoreAsDraft')}</Button>
              ) : null
            ) : menuActions.length > 0 ? (
              <>
                <PromptOptionsMenu
                  actions={menuActions}
                  currentFolderName={folderName}
                  onSelect={options.onSelect}
                />
                {canEdit && (
                  <Button onClick={() => beginDraft(latestVersion)}>{t('view.edit')}</Button>
                )}
              </>
            ) : null
          }
        />
        <div className="flex min-h-0 flex-1 flex-col px-7">{body()}</div>
      </div>
      <PromptVersionsPanel
        promptId={promptId}
        activeVersionId={editing ? null : (versionView.olderVersionId ?? latestVersion?.id ?? null)}
        onSelect={editing ? null : versionView.select}
      />
      {discarding && editing && (
        <DiscardPromptDraftModal
          versionNumber={draftNumber}
          baseVersionNumber={draft.baseVersionNumber}
          latestVersionNumber={latestVersion?.number ?? null}
          onDiscard={finishDiscarding}
          onClose={() => setDiscarding(false)}
        />
      )}
      {saving && editing && (
        <SavePromptVersionDialog
          promptId={promptId}
          promptName={prompt.name}
          text={draft.text}
          versionNumber={draftNumber}
          onSaved={finishSaving}
          onClose={() => setSaving(false)}
        />
      )}
      {options.renaming && <RenamePromptDialog prompt={prompt} onClose={options.closeRename} />}
      {options.moving && (
        <MovePromptDialog prompt={prompt} folders={folders} onClose={options.closeMove} />
      )}
      {options.deleting && (
        <DeletePromptDialog
          workspaceId={workspaceId}
          prompt={prompt}
          onClose={options.closeDelete}
        />
      )}
    </div>
  );
}
