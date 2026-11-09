import { describe, expect, it } from 'vitest';
import { TourStatus, TourStepId } from '@/features/onboarding/constants/tour.constants';
import {
  readTourState,
  storeTourState,
  tourStorageKey,
} from '@/features/onboarding/storage/helpers/tourStorage.helpers';
import type { TourState } from '@/features/onboarding/typedefs/tour.typedefs';

const ACTIVE: TourState = {
  status: TourStatus.Active,
  stepId: TourStepId.Canvas,
  skippedStepIds: [TourStepId.Prompts],
  completedStepIds: [TourStepId.Agents],
  agentId: 'agt_1',
};

describe('tour storage', () => {
  it('round-trips the tour of a user', () => {
    storeTourState('usr_1', ACTIVE);

    expect(readTourState('usr_1')).toEqual(ACTIVE);
  });

  it('keeps users apart', () => {
    storeTourState('usr_1', ACTIVE);

    expect(readTourState('usr_2')).toBeNull();
  });

  it('reads null for broken JSON', () => {
    window.localStorage.setItem(tourStorageKey('usr_1'), '{not json');

    expect(readTourState('usr_1')).toBeNull();
  });

  it('reads null for an unknown status or an active tour without a step', () => {
    window.localStorage.setItem(tourStorageKey('usr_1'), JSON.stringify({ status: 'paused' }));
    window.localStorage.setItem(
      tourStorageKey('usr_2'),
      JSON.stringify({ ...ACTIVE, stepId: 'gone' }),
    );

    expect(readTourState('usr_1')).toBeNull();
    expect(readTourState('usr_2')).toBeNull();
  });

  it('drops unknown step ids and an empty agent id', () => {
    window.localStorage.setItem(
      tourStorageKey('usr_1'),
      JSON.stringify({
        ...ACTIVE,
        status: TourStatus.Dismissed,
        skippedStepIds: ['gone', TourStepId.Inbox],
        completedStepIds: 'nope',
        agentId: '',
      }),
    );

    expect(readTourState('usr_1')).toEqual({
      ...ACTIVE,
      status: TourStatus.Dismissed,
      skippedStepIds: [TourStepId.Inbox],
      completedStepIds: [],
      agentId: null,
    });
  });
});
