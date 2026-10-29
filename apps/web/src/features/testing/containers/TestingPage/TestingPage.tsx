import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isDraftUnchanged, toFlowIssues, useBlockingIssueTexts } from '@/features/flow-builder';
import { useSimulator } from '@/features/testing/communication/hooks/useSimulator';
import { useTestingAgents } from '@/features/testing/communication/hooks/useTestingAgents';
import { useTestingVersions } from '@/features/testing/communication/hooks/useTestingVersions';
import {
  AGENTS_PATH,
  BUILDER_PATH,
  DRAFT_VERSION_OPTION,
  TESTING_PATH,
  TestingTab,
  VERSIONS_PATH,
} from '@/features/testing/constants/testing.constants';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import { ChatPanel } from '@/features/testing/containers/ChatPanel';
import type { TestingPageProps } from '@/features/testing/containers/TestingPage/TestingPage.typedefs';
import { TracePanel } from '@/features/testing/containers/TracePanel';
import { pickAgent } from '@/features/testing/logic/helpers/agent.helpers';
import {
  closingOutcome,
  handedBackRunIds,
  latestRunId,
  runTexts,
  turnNumber,
} from '@/features/testing/logic/helpers/chat.helpers';
import {
  isSimulatorChannel,
  isSimulatorLanguage,
} from '@/features/testing/logic/helpers/setup.helpers';
import { useDraftRefresh } from '@/features/testing/logic/hooks/useDraftRefresh';
import { useNodeInspection } from '@/features/testing/logic/hooks/useNodeInspection';
import { BrokenDraft } from '@/features/testing/view/BrokenDraft';
import {
  ChannelConversationKind,
  ConversationState,
} from '@/shared/api/generated/schema.generated';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import { SelectButton } from '@/shared/ui/inputs/SelectButton';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Tabs } from '@/shared/ui/navigation/Tabs';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import styles from '@/features/testing/containers/TestingPage/TestingPage.module.scss';

export function TestingPage({ workspaceId, agentId }: TestingPageProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const navigate = useNavigate();
  const agentsResult = useTestingAgents();
  const agent = pickAgent(agentsResult.agents, agentId);
  const [choice, setChoice] = useState({ agentId: '', versionId: DRAFT_VERSION_OPTION });
  const versionChoice = choice.agentId === agent?.id ? choice.versionId : DRAFT_VERSION_OPTION;
  const versionId = versionChoice === DRAFT_VERSION_OPTION ? null : versionChoice;
  const versionsResult = useTestingVersions(agent?.id ?? null);
  const {
    versions,
    draftBroken,
    draftChangeCount,
    draftFlow,
    draftIssues,
    loading: versionsLoading,
  } = versionsResult;
  const parsedIssues = useMemo(() => toFlowIssues(draftIssues), [draftIssues]);
  const blockingIssues = useBlockingIssueTexts(parsedIssues, draftFlow);
  const blocked = versionId === null && draftBroken;
  const { locale } = useLocale();
  const [channelKind, setChannelKind] = useState(ChannelConversationKind.Simulated);
  const [language, setLanguage] = useState(locale);
  const simulator = useSimulator(agent === null || versionsLoading || blocked ? null : agent.id, {
    versionId,
    channelKind,
    language,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const runs = simulator.conversation?.runs ?? [];
  const newestRunId = latestRunId(runs);
  const handedBack = useMemo(
    () =>
      simulator.conversation === null
        ? new Set<string>()
        : handedBackRunIds(simulator.conversation),
    [simulator.conversation],
  );
  const selectedRunId = runs.some((run) => run.id === selected) ? selected : newestRunId;
  const { selectedNodeId, selectNode } = useNodeInspection(selectedRunId);
  const selectRun = (runId: string) => {
    setSelected(runId);
    selectNode(null);
  };
  useDraftRefresh(
    newestRunId,
    versionId === null && simulator.conversation !== null,
    versionsResult.retry,
  );
  const flow =
    versionId === null
      ? draftFlow
      : (versions.find((version) => version.id === versionId)?.flow ?? null);
  const liveNumber = versions.find((version) => version.live)?.number ?? null;
  const errorMessage = useErrorMessage();
  const { showToast } = useToast();
  const closed = simulator.conversation?.state === ConversationState.Closed;

  const reset = async () => {
    try {
      await simulator.restart();
      setSelected(null);
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  const draftUnchanged = isDraftUnchanged(draftChangeCount, liveNumber);
  const draftOption = {
    id: DRAFT_VERSION_OPTION,
    label: draftUnchanged
      ? t('picker.sameAs', { number: liveNumber })
      : t('picker.draft', { number: agent?.draftNumber ?? 0 }),
    trailing: draftUnchanged ? null : t('picker.unpublished'),
  };
  const versionOptions = [
    draftOption,
    ...versions.map((version) => ({
      id: version.id,
      label: t('picker.published', { number: version.number }),
      trailing: version.live ? t('picker.live') : null,
    })),
  ];
  const selectedVersion =
    versionOptions.find((option) => option.id === versionChoice) ?? draftOption;

  const state = () => {
    const failure = [agentsResult, versionsResult].find((result) => result.failed);
    if (failure !== undefined) {
      return (
        <EmptyState
          icon={IconName.Alert}
          tone={EmptyStateTone.Err}
          title={t('loadError')}
          actions={
            <Button variant={ButtonVariant.Secondary} onClick={failure.retry}>
              {t('retry')}
            </Button>
          }
        />
      );
    }
    if (agentsResult.agents === null || versionsLoading) {
      return <Skeleton label={t('loading')} />;
    }
    if (agent === null) {
      return (
        <EmptyState
          icon={IconName.Flask}
          title={t('noAgents.title')}
          description={t('noAgents.description')}
          actions={
            <Button onClick={() => void navigate({ to: AGENTS_PATH, params: { workspaceId } })}>
              {t('noAgents.action')}
            </Button>
          }
        />
      );
    }
    if (blocked) {
      return (
        <BrokenDraft
          draftName={t('picker.draft', { number: agent.draftNumber })}
          issues={blockingIssues}
          onOpen={(nodeId) =>
            void navigate({
              to: BUILDER_PATH,
              params: { workspaceId, agentId: agent.id },
              search: { node: nodeId },
            })
          }
        />
      );
    }
    return null;
  };

  const notReady = state();

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t('page.title')}
        subtitle={t('page.subtitle')}
        actions={
          agent === null ? null : (
            <div className="flex items-center gap-3">
              <SelectButton
                label={t('picker.agent')}
                value={agent.name}
                menuLabel={t('picker.agent')}
                options={(agentsResult.agents ?? []).map(({ id, name }) => ({ id, label: name }))}
                selectedId={agent.id}
                onSelect={(id) =>
                  void navigate({
                    to: TESTING_PATH,
                    params: { workspaceId },
                    search: { agent: id },
                  })
                }
              />
              <SelectButton
                label={t('picker.version')}
                value={selectedVersion.label}
                context={selectedVersion.trailing}
                menuLabel={t('picker.version')}
                options={versionOptions}
                selectedId={versionChoice}
                onSelect={(id) => setChoice({ agentId: agent.id, versionId: id })}
              />
              {!closed && (
                <Button
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Sm}
                  icon={IconName.Refresh}
                  loading={simulator.restarting}
                  disabled={simulator.conversation === null}
                  onClick={() => void reset()}
                >
                  {t('reset')}
                </Button>
              )}
            </div>
          )
        }
      />
      <div className="px-7">
        <Tabs
          ariaLabel={t('tabs.label')}
          value={TestingTab.Simulator}
          tabs={[
            { value: TestingTab.Simulator, label: t('tabs.simulator') },
            { value: TestingTab.Versions, label: t('tabs.versions') },
          ]}
          onValueChange={(tab) =>
            tab === TestingTab.Versions &&
            void navigate({
              to: VERSIONS_PATH,
              params: { workspaceId },
              search: { agent: agent?.id ?? null },
            })
          }
        />
      </div>
      {notReady === null && agent !== null ? (
        <div className={styles.body}>
          <ChatPanel
            agentName={agent.name}
            flow={flow}
            simulator={simulator}
            channelKind={channelKind}
            language={language}
            onChannelKindChange={(value) => isSimulatorChannel(value) && setChannelKind(value)}
            onLanguageChange={(value) => isSimulatorLanguage(value) && setLanguage(value)}
            selectedRunId={selectedRunId}
            onSelectRun={selectRun}
            onRestart={() => void reset()}
          />
          <TracePanel
            workspaceId={workspaceId}
            agentId={agent.id}
            flow={flow}
            run={runs.find((run) => run.id === selectedRunId) ?? null}
            turnNumber={turnNumber(runs, selectedRunId)}
            handedBack={selectedRunId !== null && handedBack.has(selectedRunId)}
            closing={
              simulator.conversation !== null && selectedRunId === newestRunId
                ? closingOutcome(simulator.conversation)
                : null
            }
            texts={runTexts(simulator.conversation?.messages ?? [], selectedRunId)}
            draft={versionId === null}
            liveNumber={liveNumber}
            selectedNodeId={selectedNodeId}
            onSelectNode={selectNode}
          />
        </div>
      ) : (
        <div className="p-7">{notReady}</div>
      )}
    </div>
  );
}
