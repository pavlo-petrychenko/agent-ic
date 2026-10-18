import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptDetail } from '@/features/prompts/communication/hooks/usePromptDetail';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptPageProps } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';
import { SavePromptVersionDialog } from '@/features/prompts/containers/SavePromptVersionDialog';
import { nextPromptVersionNumber } from '@/features/prompts/logic/helpers/promptDraft.helpers';
import { findFolderName } from '@/features/prompts/logic/helpers/promptFolder.helpers';
import { formatPromptVersionDate } from '@/features/prompts/logic/helpers/promptVersion.helpers';
import { usePromptDraftsStore } from '@/features/prompts/storage/hooks/usePromptDraftsStore';
import { DiscardPromptDraftModal } from '@/features/prompts/view/DiscardPromptDraftModal';
import { PromptDraftEditor } from '@/features/prompts/view/PromptDraftEditor';
import { PromptView } from '@/features/prompts/view/PromptView';
import { useActiveWorkspace } from '@/features/workspace';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { collectPromptVariables } from '@/shared/prompt/helpers/promptDocument.helpers';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function PromptPage({ workspaceId, promptId }: PromptPageProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { locale } = useLocale();
  const active = useActiveWorkspace(workspaceId);
  const { detail, failed, retry } = usePromptDetail(promptId);
  const { folders } = usePromptLibrary();
  const draft = usePromptDraftsStore((state) => state.drafts[promptId] ?? null);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const editing = draft !== null;
  const canEdit =
    active !== null && can(active.role, PermissionResource.Prompts, PermissionAction.Edit);

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
  const draftNumber = nextPromptVersionNumber(latestVersion?.number ?? null);
  const editorText = editing ? draft.text : (latestVersion?.text ?? '');
  const variables: readonly VariableOption[] = collectPromptVariables(editorText).map((path) => ({
    id: path,
    label: path,
    group: '',
  }));
  const savedLabel =
    latestVersion === null
      ? null
      : latestVersion.author === null
        ? t('view.savedAt', { date: formatPromptVersionDate(latestVersion.savedAt, locale) })
        : t('view.savedBy', {
            date: formatPromptVersionDate(latestVersion.savedAt, locale),
            author: latestVersion.author,
          });

  const startEditing = () => {
    usePromptDraftsStore.getState().begin(promptId, {
      text: latestVersion?.text ?? '',
      baseVersionNumber: latestVersion?.number ?? null,
    });
  };

  const changeDraft = (text: string) => {
    usePromptDraftsStore.getState().update(promptId, text);
  };

  const finishSaving = () => {
    usePromptDraftsStore.getState().discard(promptId);
    setSaving(false);
  };

  const finishDiscarding = () => {
    usePromptDraftsStore.getState().discard(promptId);
    setDiscarding(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 pb-6">
      <PageHeader
        title={prompt.name}
        subtitle={findFolderName(folders, prompt.folderId)}
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
          ) : canEdit ? (
            <Button variant={ButtonVariant.Secondary} onClick={startEditing}>
              {t('view.edit')}
            </Button>
          ) : null
        }
      />
      <div className="flex min-h-0 flex-1 flex-col px-7">
        {editing ? (
          <PromptDraftEditor
            draftNumber={draftNumber}
            baseVersionNumber={draft.baseVersionNumber}
            text={draft.text}
            variables={variables}
            onChange={changeDraft}
          />
        ) : (
          <PromptView
            versionNumber={latestVersion?.number ?? null}
            text={latestVersion?.text ?? ''}
            savedLabel={savedLabel}
            variables={variables}
          />
        )}
      </div>
      {discarding && editing && (
        <DiscardPromptDraftModal
          versionNumber={draftNumber}
          baseVersionNumber={draft.baseVersionNumber}
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
    </div>
  );
}
