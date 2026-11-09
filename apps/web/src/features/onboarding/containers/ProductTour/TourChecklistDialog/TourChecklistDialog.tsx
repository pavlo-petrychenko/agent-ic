import { useTranslation } from 'react-i18next';
import { ONBOARDING_NAMESPACE } from '@/features/onboarding/constants/onboardingI18n.constants';
import { TOUR_CHECKLIST_GROUPS } from '@/features/onboarding/constants/tourSteps.constants';
import { progressSteps, stepState } from '@/features/onboarding/logic/helpers/tour.helpers';
import { useTourActions } from '@/features/onboarding/logic/hooks/useTourActions';
import { useTourStore } from '@/features/onboarding/storage/hooks/useTourStore';
import { TourChecklist } from '@/features/onboarding/view/TourChecklist';

export function TourChecklistDialog() {
  const { t } = useTranslation(ONBOARDING_NAMESPACE);
  const tour = useTourStore((state) => state.tour);
  const open = useTourStore((state) => state.checklistOpen);
  const setOpen = useTourStore((state) => state.setChecklistOpen);
  const actions = useTourActions();
  const steps = progressSteps();

  return (
    <TourChecklist
      open={open}
      onOpenChange={setOpen}
      labels={{
        title: t('checklist.title'),
        description: t('checklist.description'),
        close: t('checklist.close'),
        restart: t('checklist.restart'),
      }}
      groups={TOUR_CHECKLIST_GROUPS.map((group) => ({
        id: group,
        label: t(`checklist.groups.${group}`),
        steps: steps
          .filter((step) => step.group === group)
          .map((step) => {
            const status = stepState(tour, step.id);
            return {
              id: step.id,
              title: t(`steps.${step.id}.title`),
              status,
              statusLabel: t(`checklist.status.${status}`),
            };
          }),
      }))}
      onSelectStep={(stepId) => {
        setOpen(false);
        actions.jumpTo(stepId);
      }}
      onRestart={() => {
        setOpen(false);
        actions.start();
      }}
    />
  );
}
