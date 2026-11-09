import { TourStatus, TourStepId } from '@/features/onboarding/constants/tour.constants';
import {
  TOUR_STORAGE_KEY_PREFIX,
  TOUR_STORAGE_KEY_SEPARATOR,
} from '@/features/onboarding/constants/tourStorage.constants';
import type { TourState } from '@/features/onboarding/typedefs/tour.typedefs';

const STATUSES: readonly string[] = Object.values(TourStatus);
const STEP_IDS: readonly string[] = Object.values(TourStepId);

const isStatus = (value: unknown): value is TourStatus =>
  typeof value === 'string' && STATUSES.includes(value);

const isStepId = (value: unknown): value is TourStepId =>
  typeof value === 'string' && STEP_IDS.includes(value);

const toStepIds = (value: unknown): TourStepId[] =>
  Array.isArray(value) ? [...new Set(value.filter(isStepId))] : [];

export const tourStorageKey = (userId: string): string =>
  `${TOUR_STORAGE_KEY_PREFIX}${TOUR_STORAGE_KEY_SEPARATOR}${userId}`;

export const toTourState = (value: unknown): TourState | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { status, stepId, skippedStepIds, completedStepIds, agentId } = value as Record<
    string,
    unknown
  >;
  if (!isStatus(status)) {
    return null;
  }
  const step = isStepId(stepId) ? stepId : null;
  if (status === TourStatus.Active && step === null) {
    return null;
  }
  return {
    status,
    stepId: step,
    skippedStepIds: toStepIds(skippedStepIds),
    completedStepIds: toStepIds(completedStepIds),
    agentId: typeof agentId === 'string' && agentId !== '' ? agentId : null,
  };
};

export const readTourState = (userId: string): TourState | null => {
  try {
    const stored = window.localStorage.getItem(tourStorageKey(userId));
    return stored === null ? null : toTourState(JSON.parse(stored));
  } catch {
    return null;
  }
};

export const storeTourState = (userId: string, tour: TourState): void => {
  try {
    window.localStorage.setItem(tourStorageKey(userId), JSON.stringify(tour));
  } catch {
    return;
  }
};
