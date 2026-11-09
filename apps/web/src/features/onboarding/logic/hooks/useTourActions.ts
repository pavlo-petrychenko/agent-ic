import { useMemo } from 'react';
import type { TourStepId } from '@/features/onboarding/constants/tour.constants';
import {
  completeStep,
  dismissTour,
  finishTour,
  jumpToStep,
  nextStep,
  openTour,
  previousStep,
  rememberAgent,
  skipStep,
  startTour,
} from '@/features/onboarding/logic/helpers/tour.helpers';
import { useTourStore } from '@/features/onboarding/storage/hooks/useTourStore';
import type { TourState } from '@/features/onboarding/typedefs/tour.typedefs';

export function useTourActions() {
  const save = useTourStore((state) => state.save);

  return useMemo(() => {
    const apply = (transition: (state: TourState) => TourState) => {
      const current = useTourStore.getState().tour;
      const next = transition(current);
      if (next !== current) {
        save(next);
      }
    };
    return {
      start: () => apply(startTour),
      open: () => apply(openTour),
      next: () => apply(nextStep),
      back: () => apply(previousStep),
      skip: () => apply(skipStep),
      dismiss: () => apply(dismissTour),
      finish: () => apply(finishTour),
      jumpTo: (stepId: TourStepId) => apply((state) => jumpToStep(state, stepId)),
      complete: (stepId: TourStepId) => apply((state) => completeStep(state, stepId)),
      remember: (agentId: string) => apply((state) => rememberAgent(state, agentId)),
    };
  }, [save]);
}
