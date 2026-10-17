import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptDetail } from '@/features/prompts/communication/hooks/usePromptDetail';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { usePromptVersion } from '@/features/prompts/communication/hooks/usePromptVersion';
import { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { DeletePromptDialog } from '@/features/prompts/containers/DeletePromptDialog';
import { MovePromptDialog } from '@/features/prompts/containers/MovePromptDialog';
import type { PromptPageProps } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';
import { usePromptOptions } from '@/features/prompts/containers/PromptPage/usePromptOptions';
import { PromptVersionsPanel } from '@/features/prompts/containers/PromptVersionsPanel';
import { RenamePromptDialog } from '@/features/prompts/containers/RenamePromptDialog';
import { SavePromptVersionDialog } from '@/features/prompts/containers/SavePromptVersionDialog';
import { nextPromptVersionNumber } from '@/features/prompts/logic/helpers/promptDraft.helpers';
import { findFolderName } from '@/features/prompts/logic/helpers/promptFolder.helpers';
import { formatPromptVersionDate } from '@/features/prompts/logic/helpers/promptVersion.helpers';
import { storeLastOpenedPromptId } from '@/features/prompts/storage/helpers/promptLastOpenedStorage.helpers';
import { usePromptDraftsStore } from '@/features/prompts/storage/hooks/usePromptDraftsStore';
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

interface SelectedVersion {
  readonly promptId: string;
  readonly versionId: string;
}

export function PromptPage({ workspaceId, promptId }: PromptPageProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { locale } = useLocale();
  const active = useActiveWorkspace(workspaceId);
  const { detail, failed, retry } = usePromptDetail(promptId);
  const { folders } = usePromptLibrary();
  const draft = usePromptDraftsStore((state) => state.drafts[promptId] ?? null);
  const options = usePromptOptions(workspaceId, detail?.prompt ?? null);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [selected, setSelected] = useState<SelectedVersion | null>(null);
  const latestVersionId = detail?.latestVersion?.id ?? null;
  const selectedVersionId =
    selected !== null && selected.promptId === promptId ? selected.versionId : null;
  const olderVersionId =
    selectedVersionId !== null && selectedVersionId !== latestVersionId ? selectedVersionId : null;
  const olderVersionResult = usePromptVersion(olderVersionId);

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
  const shownVersion = olderVersionId === null ? latestVersion : olderVersionResult.version;
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

  const startEditing = () => {
    usePromptDraftsStore.getState().begin(promptId, {
      text: latestVersion?.text ?? '',
      baseVersionNumber: latestVersion?.number ?? null,
    });
  };

  const restoreAsDraft = () => {
    const source = olderVersionResult.version;
    if (source === null) {
      return;
    }
    usePromptDraftsStore.getState().begin(promptId, {
      text: source.text,
      baseVersionNumber: source.number,
    });
  };

  const selectVersion = (versionId: string) => {
    setSelected({ promptId, versionId });
  };

  const changeDraft = (text: string) => {
    usePromptDraftsStore.getState().update(promptId, text);
  };

  const finishSaving = () => {
    usePromptDraftsStore.getState().discard(promptId);
    setSelected(null);
    setSaving(false);
  };

  const finishDiscarding = () => {
    usePromptDraftsStore.getState().discard(promptId);
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
          onChange={changeDraft}
        />
      );
    }
    if (olderVersionId !== null && shownVersion === null) {
      return olderVersionResult.failed ? (
        <Card>
          <EmptyState
            icon={IconName.Alert}
            tone={EmptyStateTone.Err}
            title={t('view.versionLoadError')}
            actions={
              <Button
                variant={ButtonVariant.Secondary}
                onClick={() => void olderVersionResult.retry()}
              >
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
        olderThanVersionNumber={olderVersionId === null ? null : (latestVersion?.number ?? null)}
        onBackToLatest={olderVersionId === null ? null : () => setSelected(null)}
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
            ) : olderVersionId !== null ? (
              canEdit && shownVersion !== null ? (
                <Button onClick={restoreAsDraft}>{t('view.restoreAsDraft')}</Button>
              ) : null
            ) : menuActions.length > 0 ? (
              <>
                <PromptOptionsMenu
                  actions={menuActions}
                  currentFolderName={folderName}
                  onSelect={options.onSelect}
                />
                {canEdit && <Button onClick={startEditing}>{t('view.edit')}</Button>}
              </>
            ) : null
          }
        />
        <div className="flex min-h-0 flex-1 flex-col px-7">{body()}</div>
      </div>
      <PromptVersionsPanel
        promptId={promptId}
        activeVersionId={editing ? null : (olderVersionId ?? latestVersionId)}
        onSelect={editing ? null : selectVersion}
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
