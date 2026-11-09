import { describe, expect, it } from 'vitest';
import {
  TourStatus,
  TourStepId,
  TourStepState,
} from '@/features/onboarding/constants/tour.constants';
import { INITIAL_TOUR_STATE } from '@/features/onboarding/constants/tourSteps.constants';
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
  stepProgress,
  stepState,
} from '@/features/onboarding/logic/helpers/tour.helpers';

const started = startTour(INITIAL_TOUR_STATE);

describe('tour transitions', () => {
  it('starts on the first step', () => {
    expect(started).toEqual({
      status: TourStatus.Active,
      stepId: TourStepId.Agents,
      skippedStepIds: [],
      completedStepIds: [],
      agentId: null,
    });
  });

  it('marks the step done and moves to the next one', () => {
    const next = nextStep(started);

    expect(next.stepId).toBe(TourStepId.Prompts);
    expect(stepState(next, TourStepId.Agents)).toBe(TourStepState.Done);
  });

  it('goes back without changing what is done', () => {
    const back = previousStep(nextStep(started));

    expect(back.stepId).toBe(TourStepId.Agents);
    expect(back.completedStepIds).toEqual([TourStepId.Agents]);
  });

  it('stays on the first step when going back from it', () => {
    expect(previousStep(started)).toBe(started);
  });

  it('marks a skipped step and moves on', () => {
    const skipped = skipStep(started);

    expect(skipped.stepId).toBe(TourStepId.Prompts);
    expect(stepState(skipped, TourStepId.Agents)).toBe(TourStepState.Skipped);
  });

  it('turns a skipped step into a done one when it is finished later', () => {
    const revisited = nextStep(jumpToStep(skipStep(started), TourStepId.Agents));

    expect(stepState(revisited, TourStepId.Agents)).toBe(TourStepState.Done);
    expect(revisited.skippedStepIds).toEqual([]);
  });

  it('dismisses the whole tour and keeps the step', () => {
    const dismissed = dismissTour(nextStep(started));

    expect(dismissed.status).toBe(TourStatus.Dismissed);
    expect(dismissed.stepId).toBe(TourStepId.Prompts);
  });

  it('completes after the last step', () => {
    const atDone = jumpToStep(started, TourStepId.Done);

    expect(nextStep(atDone)).toMatchObject({ status: TourStatus.Completed, stepId: null });
    expect(finishTour(atDone)).toMatchObject({ status: TourStatus.Completed, stepId: null });
    expect(stepState(finishTour(atDone), TourStepId.Done)).toBe(TourStepState.Done);
  });

  it('completes a step only while it is the current one', () => {
    const atBuild = jumpToStep(started, TourStepId.Build);

    expect(completeStep(atBuild, TourStepId.Build).stepId).toBe(TourStepId.Canvas);
    expect(completeStep(started, TourStepId.Build)).toBe(started);
  });

  it('resumes an active tour and restarts any other', () => {
    const atPalette = jumpToStep(started, TourStepId.Palette);

    expect(openTour(atPalette)).toBe(atPalette);
    expect(openTour(dismissTour(atPalette)).stepId).toBe(TourStepId.Agents);
    expect(openTour(finishTour(atPalette)).status).toBe(TourStatus.Active);
  });

  it('reopens from the start with a clean checklist and keeps the agent', () => {
    const used = rememberAgent(skipStep(nextStep(started)), 'agt_1');
    const reopened = startTour(finishTour(used));

    expect(reopened).toMatchObject({
      status: TourStatus.Active,
      stepId: TourStepId.Agents,
      skippedStepIds: [],
      completedStepIds: [],
      agentId: 'agt_1',
    });
  });

  it('ignores moves while the tour is not running', () => {
    expect(nextStep(INITIAL_TOUR_STATE)).toBe(INITIAL_TOUR_STATE);
    expect(skipStep(INITIAL_TOUR_STATE)).toBe(INITIAL_TOUR_STATE);
    expect(previousStep(INITIAL_TOUR_STATE)).toBe(INITIAL_TOUR_STATE);
  });

  it('counts progress without the closing step', () => {
    expect(stepProgress(TourStepId.Knowledge)).toEqual({ current: 3, total: 12 });
    expect(stepProgress(TourStepId.Done)).toBeNull();
  });
});
