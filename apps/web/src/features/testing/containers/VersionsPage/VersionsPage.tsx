import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PublishButton,
  PublishDialog,
  SaveState,
  formatTimeAgo,
  isDraftUnchanged,
  useChangeTexts,
} from '@/features/flow-builder';
import { useTestingAgents } from '@/features/testing/communication/hooks/useTestingAgents';
import { useVersionDiff } from '@/features/testing/communication/hooks/useVersionDiff';
import { useVersionHistory } from '@/features/testing/communication/hooks/useVersionHistory';
import {
  AGENTS_PATH,
  BUILDER_PATH,
  TESTING_PATH,
  TestingTab,
  VERSIONS_PATH,
} from '@/features/testing/constants/testing.constants';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import {
  EMPTY_DOCUMENT,
  VERSION_META_SEPARATOR,
  VersionKind,
} from '@/features/testing/constants/versions.constants';
import { RestoreVersionDialog } from '@/features/testing/containers/RestoreVersionDialog';
import { VersionComparePanel } from '@/features/testing/containers/VersionComparePanel';
import type { VersionsPageProps } from '@/features/testing/containers/VersionsPage/VersionsPage.typedefs';
import { pickAgent } from '@/features/testing/logic/helpers/agent.helpers';
import {
  formatVersionDate,
  noteLines,
  previousVersion,
} from '@/features/testing/logic/helpers/versions.helpers';
import type { TestingAgent } from '@/features/testing/typedefs/testing.typedefs';
import type {
  PublishedVersion,
  VersionHistory,
} from '@/features/testing/typedefs/versions.typedefs';
import { VersionCard } from '@/features/testing/view/VersionCard';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import { SelectButton } from '@/shared/ui/inputs/SelectButton';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Tabs } from '@/shared/ui/navigation/Tabs';
import styles from '@/features/testing/containers/VersionsPage/VersionsPage.module.scss';

export function VersionsPage({ workspaceId, agentId }: VersionsPageProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const navigate = useNavigate();
  const { locale } = useLocale();
  const agentsResult = useTestingAgents();
  const agent = pickAgent(agentsResult.agents, agentId);
  const historyResult = useVersionHistory(agent?.id ?? null);
  const { history } = historyResult;
  const [publishing, setPublishing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<PublishedVersion | null>(null);
  const [now] = useState(Date.now);
  const latest = history === null ? null : previousVersion(history.published, null);
  const draftDiff = useVersionDiff(
    agent?.id ?? null,
    latest?.id ?? null,
    latest === null ? null : (history?.draft.id ?? null),
  );
  const draftChanges = useChangeTexts(draftDiff.diff, history?.draft.flow ?? EMPTY_DOCUMENT);

  const openBuilder = (nodeId: string | null) =>
    agent !== null &&
    void navigate({
      to: BUILDER_PATH,
      params: { workspaceId, agentId: agent.id },
      search: { node: nodeId },
    });

  const publishedMeta = (version: PublishedVersion) => {
    const date = version.publishedAt === null ? '' : formatVersionDate(version.publishedAt, locale);
    return version.authorName === null
      ? t('versions.publishedOn', { date })
      : t('versions.publishedBy', { name: version.authorName, date });
  };

  const state = () => {
    const failure = [agentsResult, historyResult].find((result) => result.failed);
    if (failure !== undefined) {
      return (
        <EmptyState
          icon={IconName.Alert}
          tone={EmptyStateTone.Err}
          title={t('versions.loadError')}
          actions={
            <Button variant={ButtonVariant.Secondary} onClick={failure.retry}>
              {t('retry')}
            </Button>
          }
        />
      );
    }
    if (agent === null && agentsResult.agents !== null) {
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
    return <Skeleton label={t('versions.loading')} />;
  };

  const body = (current: TestingAgent, { draft, published, liveNumber }: VersionHistory) => {
    const unchanged = isDraftUnchanged(draft.changeCount, liveNumber);
    const selectedId = [draft, ...published].some((version) => version.id === selected)
      ? selected
      : ((published.find((version) => version.live) ?? latest)?.id ?? null);
    const ago = formatTimeAgo(draft.savedAt, now, locale);
    const draftMeta = unchanged
      ? t('versions.unchanged', { number: liveNumber })
      : [
          draft.authorName === null
            ? t('versions.edited', { ago })
            : t('versions.editedBy', { name: draft.authorName, ago }),
          ...(draft.changeCount === null || draft.changeCount === 0
            ? []
            : [t('versions.changes', { count: draft.changeCount })]),
        ].join(VERSION_META_SEPARATOR);

    return (
      <div className={styles.body}>
        <ul className={styles.list} aria-label={t('versions.label')}>
          <VersionCard
            number={draft.number}
            kind={VersionKind.Draft}
            meta={draftMeta}
            lines={draftChanges.map((change) => change.text)}
            selected={selectedId === draft.id}
            onSelect={latest === null ? null : () => setSelected(draft.id)}
            actions={
              <>
                {latest !== null && (
                  <Button
                    variant={ButtonVariant.Secondary}
                    size={ButtonSize.Sm}
                    onClick={() => setSelected(draft.id)}
                  >
                    {t('versions.compare.action', { number: latest.number })}
                  </Button>
                )}
                <PublishButton
                  label={t('versions.publish')}
                  blockedReason={unchanged ? t('versions.publishUnchanged') : null}
                  disabled={draft.flow === null}
                  onClick={() => setPublishing(true)}
                />
              </>
            }
          />
          {published.map((version) => (
            <VersionCard
              key={version.id}
              number={version.number}
              kind={version.live ? VersionKind.Live : VersionKind.Archived}
              meta={publishedMeta(version)}
              lines={noteLines(version.note)}
              selected={selectedId === version.id}
              onSelect={() => setSelected(version.id)}
              actions={
                version.live ? null : (
                  <Button
                    variant={ButtonVariant.Secondary}
                    size={ButtonSize.Sm}
                    onClick={() => setRestoring(version)}
                  >
                    {t('versions.restore.action')}
                  </Button>
                )
              }
            />
          ))}
        </ul>
        {selectedId === null ? (
          <Card>
            <EmptyState
              icon={IconName.Flask}
              title={t('versions.never.title')}
              description={t('versions.never.description')}
            />
          </Card>
        ) : (
          <VersionComparePanel
            agentId={current.id}
            draft={draft}
            published={published}
            selectedId={selectedId}
          />
        )}
        {restoring !== null && (
          <RestoreVersionDialog
            agentName={current.name}
            version={restoring}
            draft={draft}
            liveNumber={liveNumber}
            onRestored={() => openBuilder(null)}
            onClose={() => setRestoring(null)}
          />
        )}
        {publishing && draft.flow !== null && (
          <PublishDialog
            agentId={current.id}
            agentName={current.name}
            document={draft.flow}
            revision={draft.revision}
            saveState={SaveState.Idle}
            onFix={openBuilder}
            onPublished={() => {
              setPublishing(false);
              historyResult.retry();
            }}
            onClose={() => setPublishing(false)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t('page.title')}
        subtitle={t('page.subtitle')}
        actions={
          agent === null ? null : (
            <SelectButton
              label={t('picker.agent')}
              value={agent.name}
              menuLabel={t('picker.agent')}
              options={(agentsResult.agents ?? []).map(({ id, name }) => ({ id, label: name }))}
              selectedId={agent.id}
              onSelect={(id) =>
                void navigate({ to: VERSIONS_PATH, params: { workspaceId }, search: { agent: id } })
              }
            />
          )
        }
      />
      <div className="px-7">
        <Tabs
          ariaLabel={t('tabs.label')}
          value={TestingTab.Versions}
          tabs={[
            { value: TestingTab.Simulator, label: t('tabs.simulator') },
            { value: TestingTab.Versions, label: t('tabs.versions') },
          ]}
          onValueChange={(tab) =>
            tab === TestingTab.Simulator &&
            void navigate({
              to: TESTING_PATH,
              params: { workspaceId },
              search: { agent: agent?.id ?? null },
            })
          }
        />
      </div>
      {agent !== null && history !== null ? (
        body(agent, history)
      ) : (
        <div className="p-7">{state()}</div>
      )}
    </div>
  );
}
