import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptDetail } from '@/features/prompts/communication/hooks/usePromptDetail';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { usePromptUsages } from '@/features/prompts/communication/hooks/usePromptUsages';
import { usePromptVersions } from '@/features/prompts/communication/hooks/usePromptVersions';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { DeletePromptDialog } from '@/features/prompts/containers/DeletePromptDialog';
import { MovePromptDialog } from '@/features/prompts/containers/MovePromptDialog';
import { PromptDetailsPanel } from '@/features/prompts/containers/PromptDetailsPanel';
import { PromptDraftDialogs } from '@/features/prompts/containers/PromptPage/PromptDraftDialogs';
import type { PromptPageProps } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';
import { PromptPageHeader } from '@/features/prompts/containers/PromptPage/PromptPageHeader';
import { usePromptCompare } from '@/features/prompts/containers/PromptPage/usePromptCompare';
import { usePromptDraftSession } from '@/features/prompts/containers/PromptPage/usePromptDraftSession';
import { usePromptOptions } from '@/features/prompts/containers/PromptPage/usePromptOptions';
import { usePromptTest } from '@/features/prompts/containers/PromptPage/usePromptTest';
import { usePromptVersionView } from '@/features/prompts/containers/PromptPage/usePromptVersionView';
import { RenamePromptDialog } from '@/features/prompts/containers/RenamePromptDialog';
import {
  diffPromptLines,
  toPromptDiffRows,
} from '@/features/prompts/logic/helpers/promptDiff.helpers';
import { findFolderName } from '@/features/prompts/logic/helpers/promptFolder.helpers';
import {
  canEditPrompt,
  promptMenuActions,
} from '@/features/prompts/logic/helpers/promptMenu.helpers';
import { usageCounts } from '@/features/prompts/logic/helpers/promptUsage.helpers';
import { formatPromptVersionDate } from '@/features/prompts/logic/helpers/promptVersion.helpers';
import { usePromptVariables } from '@/features/prompts/logic/hooks/usePromptVariables';
import { storeLastOpenedPromptId } from '@/features/prompts/storage/helpers/promptLastOpenedStorage.helpers';
import type { PromptVersion } from '@/features/prompts/typedefs/prompt.typedefs';
import { PromptCompare } from '@/features/prompts/view/PromptCompare';
import type { PromptCompareVersion } from '@/features/prompts/view/PromptCompare';
import { PromptDraftEditor } from '@/features/prompts/view/PromptDraftEditor';
import { PromptTestPanel } from '@/features/prompts/view/PromptTestPanel';
import { PromptView } from '@/features/prompts/view/PromptView';
import { useActiveWorkspace } from '@/features/workspace';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { normalizePathVariable } from '@/shared/prompt/helpers/promptDocument.helpers';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';

const toCompareVersion = (version: PromptVersion, locale: string): PromptCompareVersion => ({
  id: version.id,
  number: version.number,
  date: formatPromptVersionDate(version.savedAt, locale),
  author: version.author,
  note: version.note,
});

export function PromptPage({ workspaceId, promptId }: PromptPageProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { locale } = useLocale();
  const active = useActiveWorkspace(workspaceId);
  const { detail, failed, retry } = usePromptDetail(promptId);
  const { folders } = usePromptLibrary();
  const versionsResult = usePromptVersions(promptId);
  const { usages, failed: usagesFailed, retry: retryUsages } = usePromptUsages(promptId);
  const latestVersion = detail?.latestVersion ?? null;
  const session = usePromptDraftSession(promptId, latestVersion);
  const options = usePromptOptions(workspaceId, detail?.prompt ?? null);
  const versionView = usePromptVersionView(promptId, latestVersion?.id ?? null);
  const compare = usePromptCompare();
  const shownVersion =
    versionView.olderVersionId === null ? latestVersion : versionView.olderVersion;
  const editorText = session.draft === null ? (shownVersion?.text ?? '') : session.draft.text;
  const variables = usePromptVariables(editorText);
  const test = usePromptTest({
    promptId,
    text: editorText,
    versionNumber: session.editing ? null : (shownVersion?.number ?? null),
    variablePaths: variables.paths,
  });

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

  const { prompt } = detail;
  const role = active?.role ?? null;
  const canTest = canEditPrompt(role) && (session.editing || shownVersion !== null);
  const testVersionLabel =
    session.editing || shownVersion === null
      ? t('test.versionDraft', { number: session.draftNumber })
      : t('test.versionSaved', { number: shownVersion.number });
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
    shownVersion === null
      ? null
      : shownVersion.author === null
        ? t('view.savedAt', { date: formatPromptVersionDate(shownVersion.savedAt, locale) })
        : t('view.savedBy', {
            date: formatPromptVersionDate(shownVersion.savedAt, locale),
            author: shownVersion.author,
          });

  const comparePair = compare.pair;
  const compareFrom = compare.from;
  const compareTo = compare.to;
  const versionOptions = (versionsResult.versions ?? []).map((version) => ({
    id: version.id,
    number: version.number,
  }));

  const headerCompare =
    comparePair === null
      ? null
      : {
          restoreLabel:
            compareFrom === null ? null : t('compare.restore', { number: compareFrom.number }),
          onClose: compare.close,
          onRestoreFrom:
            compareFrom === null
              ? null
              : () => {
                  session.startEditing(compareFrom);
                  compare.close();
                },
        };
  const headerOlder =
    versionView.olderVersionId !== null && shownVersion !== null && latestVersion !== null
      ? {
          compareLabel: t('view.compareWith', { number: latestVersion.number }),
          onCompare: () => compare.begin(shownVersion.id, latestVersion.id),
          onRestore: () => session.startEditing(shownVersion),
        }
      : null;

  const body = () => {
    if (comparePair !== null) {
      const diff =
        compareFrom === null || compareTo === null
          ? null
          : diffPromptLines(compareFrom.text, compareTo.text);
      return (
        <PromptCompare
          fromId={comparePair.fromId}
          toId={comparePair.toId}
          options={versionOptions}
          from={compareFrom === null ? null : toCompareVersion(compareFrom, locale)}
          to={compareTo === null ? null : toCompareVersion(compareTo, locale)}
          diff={
            diff === null
              ? null
              : {
                  rows: toPromptDiffRows(diff.lines),
                  removed: diff.removed,
                  added: diff.added,
                }
          }
          failed={compare.failed}
          onSelectFrom={compare.selectFrom}
          onSelectTo={compare.selectTo}
          onRetry={() => void compare.retry()}
        />
      );
    }
    if (session.draft !== null) {
      return (
        <PromptDraftEditor
          draftNumber={session.draftNumber}
          baseVersionNumber={session.draft.baseVersionNumber}
          text={session.draft.text}
          variables={variables.options}
          normalizeVariable={normalizePathVariable}
          onChange={session.changeText}
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
        variables={variables.options}
        normalizeVariable={normalizePathVariable}
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
        <PromptPageHeader
          name={prompt.name}
          subtitle={subtitle === '' ? null : subtitle}
          editing={session.editing}
          draftNumber={session.draftNumber}
          canEdit={canEditPrompt(role)}
          menuActions={promptMenuActions(role)}
          currentFolderName={folderName}
          onSelect={options.onSelect}
          onEdit={() => session.startEditing()}
          onDiscard={session.openDiscardDialog}
          onSave={session.openSaveDialog}
          compare={headerCompare}
          older={headerOlder}
          onTest={canTest ? test.toggleTesting : null}
        />
        <div className="flex min-h-0 flex-1 flex-col px-7">{body()}</div>
      </div>
      {test.testing ? (
        <PromptTestPanel
          versionLabel={testVersionLabel}
          variables={test.variables}
          onVariableChange={test.changeVariable}
          customerMessage={test.customerMessage}
          onCustomerMessageChange={test.changeCustomerMessage}
          models={test.models}
          modelsLoading={test.modelsLoading}
          model={test.model}
          onModelChange={test.changeModel}
          running={test.running}
          result={test.result}
          failed={test.failed}
          canRun={test.canRun}
          workspaceId={workspaceId}
          onClose={test.closeTesting}
          onRun={test.run}
        />
      ) : (
        <PromptDetailsPanel
          promptId={promptId}
          activeVersionId={
            session.editing || comparePair !== null
              ? null
              : (versionView.olderVersionId ?? latestVersion?.id ?? null)
          }
          onSelect={session.editing || comparePair !== null ? null : versionView.select}
          onCompare={session.editing || comparePair !== null ? null : compare.begin}
          usages={usages}
          usagesFailed={usagesFailed}
          onRetryUsages={() => {
            void retryUsages();
          }}
          variablePaths={variables.paths}
        />
      )}
      <PromptDraftDialogs
        promptId={promptId}
        promptName={prompt.name}
        latestVersionNumber={latestVersion?.number ?? null}
        session={session}
      />
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
