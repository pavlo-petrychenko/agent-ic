import type { FlowIssue } from '@agent-ic/flow';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePublishAgent } from '@/features/flow-builder/communication/hooks/usePublishAgent';
import { usePublishPreview } from '@/features/flow-builder/communication/hooks/usePublishPreview';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { CheckTone } from '@/features/flow-builder/constants/publish.constants';
import {
  ISSUE_STEP_SEPARATOR,
  SIMULATOR_CHECK_ID,
  UNKNOWN_CHECK_ID,
  VALID_CHECK_ID,
} from '@/features/flow-builder/containers/PublishDialog/PublishDialog.constants';
import type { PublishDialogProps } from '@/features/flow-builder/containers/PublishDialog/PublishDialog.typedefs';
import { stepNameOf } from '@/features/flow-builder/logic/helpers/issue.helpers';
import {
  formatTimeAgo,
  publishBlockOf,
} from '@/features/flow-builder/logic/helpers/publish.helpers';
import { useChangeTexts } from '@/features/flow-builder/logic/hooks/useChangeTexts';
import type { PublishCheck } from '@/features/flow-builder/typedefs/publish.typedefs';
import { PublishModal } from '@/features/flow-builder/view/PublishModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function PublishDialog({
  agentId,
  agentName,
  document,
  revision,
  saveState,
  onFix,
  onPublished,
  onClose,
}: PublishDialogProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const { locale } = useLocale();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { preview, loading, failed, retry } = usePublishPreview(agentId, revision);
  const { publish, publishing } = usePublishAgent(agentId);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [openedAt] = useState(Date.now);
  const lines = useChangeTexts(preview?.diff ?? null, document);

  const steps = useMemo(
    () => new Map(document.nodes.map((node) => [node.id, stepNameOf(node)])),
    [document],
  );
  const issueCheck =
    (tone: CheckTone) =>
    (issue: FlowIssue, index: number): PublishCheck => {
      const message = t(`issue.${issue.code}`, { ...issue.params });
      const step = issue.nodeId === null ? undefined : steps.get(issue.nodeId);
      return {
        id: `${tone}-${String(index)}`,
        tone,
        label: step === undefined ? message : `${step}${ISSUE_STEP_SEPARATOR}${message}`,
        meta: null,
        nodeId: issue.nodeId,
      };
    };
  const simulatorCheck = (testedAt: string | null): PublishCheck => ({
    id: SIMULATOR_CHECK_ID,
    tone: testedAt === null ? CheckTone.Warn : CheckTone.Ok,
    label: testedAt === null ? t('publish.notTested') : t('publish.tested'),
    meta: testedAt === null ? null : formatTimeAgo(testedAt, openedAt, locale),
    nodeId: null,
  });
  const unknownCheck = (index: number): PublishCheck => ({
    id: `${UNKNOWN_CHECK_ID}-${String(index)}`,
    tone: CheckTone.Err,
    label: t('issue.unknown'),
    meta: null,
    nodeId: null,
  });
  const validCheck: PublishCheck = {
    id: VALID_CHECK_ID,
    tone: CheckTone.Ok,
    label: t('publish.valid'),
    meta: null,
    nodeId: null,
  };
  const checks: PublishCheck[] =
    preview === null
      ? []
      : [
          ...(preview.errorCount === 0
            ? [validCheck]
            : [
                ...preview.errors.map(issueCheck(CheckTone.Err)),
                ...Array.from({ length: preview.errorCount - preview.errors.length }, (_, index) =>
                  unknownCheck(index),
                ),
              ]),
          simulatorCheck(preview.testedAt),
          ...preview.warnings.map(issueCheck(CheckTone.Warn)),
        ];
  const warnings = checks.filter((check) => check.tone === CheckTone.Warn).length;
  const block = preview === null ? null : publishBlockOf(saveState, preview, lines);
  const version = preview?.draftNumber ?? null;
  const summary =
    preview === null
      ? null
      : block !== null
        ? t(`publish.blocked.${block}`, {
            count: preview.errorCount,
            version: preview.liveVersion,
          })
        : warnings > 0
          ? t('issues.warnings', { count: warnings })
          : t('issues.ready');

  const onPublish = async () => {
    setError(null);
    try {
      const number = await publish(note);
      showToast({
        message: t('publish.success', { version: number ?? version }),
        tone: ToastTone.Ok,
      });
      onPublished();
    } catch (failure) {
      setError(errorMessage(toAppError(failure)));
      retry();
    }
  };

  return (
    <PublishModal
      title={
        version === null
          ? t('publish.titleNoVersion', { name: agentName })
          : t('publish.title', { version, name: agentName })
      }
      version={version}
      liveVersion={preview?.liveVersion ?? null}
      changesTitle={
        preview === null || preview.liveVersion === null
          ? t('publish.changesFirst')
          : t('publish.changesSince', { version: preview.liveVersion })
      }
      changes={lines}
      checks={checks}
      note={note}
      summary={summary}
      publishLabel={
        version === null ? t('publish.submitNoVersion') : t('publish.submit', { version })
      }
      canPublish={preview !== null && block === null && !loading && !publishing}
      loading={loading && preview === null}
      failed={failed}
      publishing={publishing}
      error={error}
      onNoteChange={setNote}
      onRetry={retry}
      onFix={(nodeId) => {
        onFix(nodeId);
        onClose();
      }}
      onPublish={() => void onPublish()}
      onClose={onClose}
    />
  );
}
