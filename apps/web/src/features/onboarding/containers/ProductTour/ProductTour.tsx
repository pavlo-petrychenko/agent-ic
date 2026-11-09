import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ONBOARDING_NAMESPACE } from '@/features/onboarding/constants/onboardingI18n.constants';
import {
  TourLink,
  TourPage,
  TourStatus,
  TourStepAction,
  TourStepId,
} from '@/features/onboarding/constants/tour.constants';
import type { ProductTourProps } from '@/features/onboarding/containers/ProductTour/ProductTour.typedefs';
import { TourChecklistDialog } from '@/features/onboarding/containers/ProductTour/TourChecklistDialog';
import { stepProgress, tourStep } from '@/features/onboarding/logic/helpers/tour.helpers';
import { isOnStepPage, stepAction } from '@/features/onboarding/logic/helpers/tourStep.helpers';
import { useTourActions } from '@/features/onboarding/logic/hooks/useTourActions';
import { useTourNavigation } from '@/features/onboarding/logic/hooks/useTourNavigation';
import { useTourRoute } from '@/features/onboarding/logic/hooks/useTourRoute';
import { useTourTarget } from '@/features/onboarding/logic/hooks/useTourTarget';
import { useTourStore } from '@/features/onboarding/storage/hooks/useTourStore';
import { TourDoneLinks } from '@/features/onboarding/view/TourDoneLinks';
import { hasPermission } from '@/shared/api/helpers/permission.helpers';
import { Coachmark } from '@/shared/ui/overlays/Coachmark';
import type { CoachmarkAction, CoachmarkProgress } from '@/shared/ui/overlays/Coachmark';

export function ProductTour({ workspaceId, userId, permissions }: ProductTourProps) {
  const { t } = useTranslation(ONBOARDING_NAMESPACE);
  const load = useTourStore((state) => state.load);
  const loadedEligible = useTourStore((state) => state.eligible);
  const { status, stepId, agentId } = useTourStore((state) => state.tour);
  const actions = useTourActions();
  const route = useTourRoute();
  const go = useTourNavigation(workspaceId);
  const eligible =
    userId !== null &&
    permissions !== null &&
    hasPermission(permissions, PermissionResource.Agents, PermissionAction.Edit);

  useEffect(() => {
    load(userId, eligible);
  }, [load, userId, eligible]);

  const { remember, complete } = actions;
  const active = loadedEligible && status === TourStatus.Active;
  const builderAgentId = route.page === TourPage.Builder ? route.agentId : null;

  useEffect(() => {
    if (active && builderAgentId !== null) {
      remember(builderAgentId);
      complete(TourStepId.Build);
    }
  }, [active, builderAgentId, remember, complete]);

  useEffect(() => {
    if (active && route.versionsAgentId !== null) {
      complete(TourStepId.Publish);
    }
  }, [active, route.versionsAgentId, complete]);

  const step = active && stepId !== null ? tourStep(stepId) : null;
  const welcome = loadedEligible && status === TourStatus.New;
  const onPage = step !== null && isOnStepPage(step, route);
  const { target, blocked } = useTourTarget(onPage ? step.anchor : null, welcome || step !== null);

  if (!loadedEligible) {
    return null;
  }

  const formatProgress = ({ current, total }: CoachmarkProgress) =>
    t('progress', { current, total });
  const checklist = <TourChecklistDialog />;

  if (welcome) {
    return (
      <>
        <Coachmark
          open={!blocked}
          target={null}
          title={t('welcome.title')}
          formatProgress={formatProgress}
          primaryAction={{ label: t('welcome.start'), onClick: actions.start }}
          onDismiss={actions.dismiss}
          dismissLabel={t('welcome.skip')}
          closeLabel={t('actions.close')}
        >
          <span className="flex flex-col gap-2">
            <span>{t('welcome.body')}</span>
            <span>{t('welcome.reopen')}</span>
          </span>
        </Coachmark>
        {checklist}
      </>
    );
  }

  if (step === null) {
    return checklist;
  }

  const goTherePage = step.page === TourPage.Anywhere ? TourPage.Agents : step.page;
  const primaryActions: Readonly<Record<TourStepAction, CoachmarkAction>> = {
    [TourStepAction.Next]: { label: t('actions.next'), onClick: actions.next },
    [TourStepAction.Finish]: { label: t('actions.finish'), onClick: actions.finish },
    [TourStepAction.OpenTemplates]: { label: t('actions.openTemplates'), onClick: go.templates },
    [TourStepAction.GoThere]: {
      label: t(`goThere.${goTherePage}`),
      onClick: () => go.page(goTherePage, agentId),
    },
  };
  const progress = stepProgress(step.id);
  const offPageHint =
    onPage || step.page === TourPage.Anywhere
      ? null
      : step.page === TourPage.Builder && agentId === null
        ? t('offPage.builderNoAgent')
        : t(`offPage.${step.page}`);

  const finishWith = (link: TourLink) => {
    actions.finish();
    if (link === TourLink.Telegram) {
      go.channels();
    } else if (link === TourLink.Team) {
      go.team();
    } else if (link === TourLink.Templates) {
      go.templates();
    } else {
      go.guides(agentId);
    }
  };

  return (
    <>
      <Coachmark
        open={!blocked}
        target={target}
        title={t(`steps.${step.id}.title`)}
        progress={progress}
        formatProgress={formatProgress}
        placement={step.placement}
        primaryAction={primaryActions[stepAction(step, route, agentId)]}
        secondaryAction={
          progress?.current === 1 ? null : { label: t('actions.back'), onClick: actions.back }
        }
        skipStepAction={
          step.id === TourStepId.Done
            ? null
            : { label: t('actions.skipStep'), onClick: actions.skip }
        }
        onDismiss={actions.dismiss}
        dismissLabel={t('actions.skipTour')}
        closeLabel={t('actions.close')}
      >
        {step.id === TourStepId.Done ? (
          <TourDoneLinks
            body={t('steps.done.body')}
            links={Object.values(TourLink).map((id) => ({ id, label: t(`links.${id}`) }))}
            onSelect={finishWith}
          />
        ) : (
          <span className="flex flex-col gap-2">
            <span>{t(`steps.${step.id}.body`)}</span>
            {offPageHint === null ? null : <span>{offPageHint}</span>}
          </span>
        )}
      </Coachmark>
      {checklist}
    </>
  );
}
