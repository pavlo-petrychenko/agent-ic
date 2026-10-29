import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMembersByRole } from '@/features/flow-builder/communication/hooks/useMembersByRole';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  DEFAULT_AUTO_CLOSE_MINUTES,
  FailureChoice,
} from '@/features/flow-builder/constants/flowSettings.constants';
import {
  IssuePathSegment,
  PATH_JOINER,
} from '@/features/flow-builder/constants/inspector.constants';
import type { FlowSettingsPanelProps } from '@/features/flow-builder/containers/FlowSettingsPanel/FlowSettingsPanel.typedefs';
import {
  handoffRecipientsValue,
  withChannel,
  withRecipients,
} from '@/features/flow-builder/logic/helpers/escalation.helpers';
import {
  handoffOf,
  setAutoClose,
  setUnhandledFailure,
  updateHandoff,
} from '@/features/flow-builder/logic/helpers/flowSettings.helpers';
import { useFlowIssues } from '@/features/flow-builder/logic/hooks/useFlowIssues';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { FlowSettingsInspector } from '@/features/flow-builder/view/FlowSettingsInspector';
import { NodeKind } from '@/shared/ui/display/NodeTile';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Inspector } from '@/shared/ui/layout/Inspector';

const FALLBACK_PATH = [
  IssuePathSegment.Settings,
  IssuePathSegment.Handoff,
  IssuePathSegment.FallbackMessage,
].join(PATH_JOINER);

export function FlowSettingsPanel({ agentName }: FlowSettingsPanelProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const open = useFlowBuilderStore((state) => state.settingsOpen);
  const document = useFlowBuilderStore((state) => state.document);
  const apply = useFlowBuilderStore((state) => state.apply);
  const previewEdit = useFlowBuilderStore((state) => state.previewEdit);
  const setSettingsOpen = useFlowBuilderStore((state) => state.setSettingsOpen);
  const issues = useFlowIssues();
  const counts = useMembersByRole(!open);
  const commit = useCallback(() => apply(useFlowBuilderStore.getState().document), [apply]);

  if (!open) {
    return null;
  }

  const { settings } = document;
  const handoff = handoffOf(settings);

  return (
    <Inspector
      kind={{ label: t('settings.kind'), kind: NodeKind.Neutral, icon: IconName.Gear }}
      title={t('settings.title')}
      subtitle={t('settings.subtitle', { name: agentName })}
      closeLabel={t('settings.close')}
      onClose={() => setSettingsOpen(false)}
    >
      <FlowSettingsInspector
        settings={settings}
        handoff={handoff}
        variables={[]}
        recipients={handoffRecipientsValue(handoff)}
        counts={counts}
        fallbackIssue={
          issues.find(
            (issue) => issue.nodeId === null && issue.path.join(PATH_JOINER) === FALLBACK_PATH,
          ) ?? null
        }
        onRecipientsChange={(value) =>
          apply(updateHandoff(document, (current) => withRecipients(current, value)))
        }
        onChannelChange={(channel, on) =>
          apply(updateHandoff(document, (current) => withChannel(current, channel, on)))
        }
        onFallbackMessageChange={(fallbackMessage) =>
          previewEdit(updateHandoff(document, (current) => ({ ...current, fallbackMessage })))
        }
        onFailureChange={(choice) =>
          apply(
            setUnhandledFailure(
              document,
              choice === FailureChoice.Fail
                ? null
                : (settings.onUnhandledFailure?.customerMessage ??
                    t('settings.failure.defaultApology')),
            ),
          )
        }
        onApologyChange={(text) => previewEdit(setUnhandledFailure(document, text))}
        onAutoCloseToggle={(on) =>
          apply(setAutoClose(document, on ? DEFAULT_AUTO_CLOSE_MINUTES : null))
        }
        onAutoCloseChange={(minutes) => apply(setAutoClose(document, minutes))}
        onCommit={commit}
      />
    </Inspector>
  );
}
