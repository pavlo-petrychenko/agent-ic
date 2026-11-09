import {
  TourPage,
  TourStepAction,
  TourStepId,
} from '@/features/onboarding/constants/tour.constants';
import type { TourRoute, TourStepDefinition } from '@/features/onboarding/typedefs/tour.typedefs';

export const isOnStepPage = (step: TourStepDefinition, route: TourRoute): boolean =>
  step.page === TourPage.Anywhere || step.page === route.page;

export const stepAction = (
  step: TourStepDefinition,
  route: TourRoute,
  agentId: string | null,
): TourStepAction => {
  if (step.id === TourStepId.Done) {
    return TourStepAction.Finish;
  }
  if (step.id === TourStepId.Build) {
    return route.page === TourPage.Agents ? TourStepAction.OpenTemplates : TourStepAction.GoThere;
  }
  if (isOnStepPage(step, route)) {
    return TourStepAction.Next;
  }
  if (step.page === TourPage.Builder && agentId === null) {
    return TourStepAction.OpenTemplates;
  }
  return TourStepAction.GoThere;
};
