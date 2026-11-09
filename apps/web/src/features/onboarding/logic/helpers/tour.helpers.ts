import {
  TourStatus,
  TourStepId,
  TourStepState,
} from '@/features/onboarding/constants/tour.constants';
import { TOUR_STEPS } from '@/features/onboarding/constants/tourSteps.constants';
import type {
  TourProgress,
  TourState,
  TourStepDefinition,
} from '@/features/onboarding/typedefs/tour.typedefs';

const FIRST_STEP = TourStepId.Agents;

const without = (ids: readonly TourStepId[], id: TourStepId): TourStepId[] =>
  ids.filter((current) => current !== id);

const withId = (ids: readonly TourStepId[], id: TourStepId): TourStepId[] => [
  ...without(ids, id),
  id,
];

const stepIndex = (stepId: TourStepId): number =>
  TOUR_STEPS.findIndex((step) => step.id === stepId);

export const tourStep = (stepId: TourStepId): TourStepDefinition | null =>
  TOUR_STEPS.find((step) => step.id === stepId) ?? null;

export const progressSteps = (): readonly TourStepDefinition[] =>
  TOUR_STEPS.filter((step) => step.id !== TourStepId.Done);

export const stepProgress = (stepId: TourStepId): TourProgress | null =>
  stepId === TourStepId.Done
    ? null
    : { current: stepIndex(stepId) + 1, total: progressSteps().length };

const moveForward = (state: TourState, stepId: TourStepId): TourState => {
  const next = TOUR_STEPS[stepIndex(stepId) + 1];
  return next === undefined
    ? { ...state, status: TourStatus.Completed, stepId: null }
    : { ...state, status: TourStatus.Active, stepId: next.id };
};

export const startTour = (state: TourState): TourState => ({
  ...state,
  status: TourStatus.Active,
  stepId: FIRST_STEP,
  skippedStepIds: [],
  completedStepIds: [],
});

export const openTour = (state: TourState): TourState =>
  state.status === TourStatus.Active && state.stepId !== null ? state : startTour(state);

export const jumpToStep = (state: TourState, stepId: TourStepId): TourState => ({
  ...state,
  status: TourStatus.Active,
  stepId,
});

export const nextStep = (state: TourState): TourState => {
  if (state.status !== TourStatus.Active || state.stepId === null) {
    return state;
  }
  const stepId = state.stepId;
  return moveForward(
    {
      ...state,
      completedStepIds: withId(state.completedStepIds, stepId),
      skippedStepIds: without(state.skippedStepIds, stepId),
    },
    stepId,
  );
};

export const previousStep = (state: TourState): TourState => {
  if (state.status !== TourStatus.Active || state.stepId === null) {
    return state;
  }
  const previous = TOUR_STEPS[stepIndex(state.stepId) - 1];
  return previous === undefined ? state : { ...state, stepId: previous.id };
};

export const skipStep = (state: TourState): TourState => {
  if (state.status !== TourStatus.Active || state.stepId === null) {
    return state;
  }
  const stepId = state.stepId;
  return moveForward(
    {
      ...state,
      skippedStepIds: withId(state.skippedStepIds, stepId),
      completedStepIds: without(state.completedStepIds, stepId),
    },
    stepId,
  );
};

export const completeStep = (state: TourState, stepId: TourStepId): TourState =>
  state.status === TourStatus.Active && state.stepId === stepId ? nextStep(state) : state;

export const dismissTour = (state: TourState): TourState => ({
  ...state,
  status: TourStatus.Dismissed,
});

export const finishTour = (state: TourState): TourState => ({
  ...state,
  status: TourStatus.Completed,
  stepId: null,
  completedStepIds: withId(state.completedStepIds, TourStepId.Done),
});

export const rememberAgent = (state: TourState, agentId: string): TourState =>
  state.agentId === agentId ? state : { ...state, agentId };

export const isStepDone = (state: TourState, stepId: TourStepId): boolean =>
  state.completedStepIds.includes(stepId);

export const isStepSkipped = (state: TourState, stepId: TourStepId): boolean =>
  state.skippedStepIds.includes(stepId);

export const stepState = (state: TourState, stepId: TourStepId): TourStepState => {
  if (isStepDone(state, stepId)) {
    return TourStepState.Done;
  }
  return isStepSkipped(state, stepId) ? TourStepState.Skipped : TourStepState.Todo;
};
