import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import type { TestingPageProps } from '@/features/testing/containers/TestingPage/TestingPage.typedefs';
import { pickAgent } from '@/features/testing/logic/helpers/agent.helpers';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import { SelectButton } from '@/shared/ui/inputs/SelectButton';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Tabs } from '@/shared/ui/navigation/Tabs';
import styles from '@/features/testing/containers/TestingPage/TestingPage.module.scss';

export function TestingPage({ workspaceId, agentId }: TestingPageProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const navigate = useNavigate();
  const agentsResult = useTestingAgents();
  const agent = pickAgent(agentsResult.agents, agentId);
  const [choice, setChoice] = useState({ agentId: '', versionId: DRAFT_VERSION_OPTION });
  const versionChoice = choice.agentId === agent?.id ? choice.versionId : DRAFT_VERSION_OPTION;
  const versionId = versionChoice === DRAFT_VERSION_OPTION ? null : versionChoice;
  const { versions, draftBroken, loading: versionsLoading } = useTestingVersions(agent?.id ?? null);
  const blocked = versionId === null && draftBroken;

  const draftOption = {
    id: DRAFT_VERSION_OPTION,
    label: t('picker.draft', { number: agent?.draftNumber ?? 0 }),
    trailing: t('picker.unpublished'),
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
    if (agentsResult.failed) {
      return (
        <EmptyState
          icon={IconName.Alert}
          tone={EmptyStateTone.Err}
          title={t('loadError')}
          actions={
            <Button variant={ButtonVariant.Secondary} onClick={agentsResult.retry}>
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
        <EmptyState
          icon={IconName.Alert}
          tone={EmptyStateTone.Warn}
          title={t('brokenDraft.title')}
          description={t('brokenDraft.description')}
          actions={
            <Button
              onClick={() =>
                void navigate({ to: BUILDER_PATH, params: { workspaceId, agentId: agent.id } })
              }
            >
              {t('brokenDraft.action')}
            </Button>
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
            void navigate({ to: VERSIONS_PATH, params: { workspaceId } })
          }
        />
      </div>
      {notReady === null ? (
        <div className={styles.body}>
          <p className={styles.note}>{t('note')}</p>
        </div>
      ) : (
        <div className="p-7">{notReady}</div>
      )}
    </div>
  );
}
