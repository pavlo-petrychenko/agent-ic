import { create } from 'zustand';
import { INITIAL_TOUR_STATE } from '@/features/onboarding/constants/tourSteps.constants';
import {
  readTourState,
  storeTourState,
} from '@/features/onboarding/storage/helpers/tourStorage.helpers';
import type { TourStore } from '@/features/onboarding/typedefs/tour.typedefs';

export const useTourStore = create<TourStore>()((set, get) => ({
  userId: null,
  eligible: false,
  tour: INITIAL_TOUR_STATE,
  checklistOpen: false,
  load: (userId, eligible) => {
    if (get().userId === userId && get().eligible === eligible) {
      return;
    }
    set({
      userId,
      eligible,
      tour: userId === null ? INITIAL_TOUR_STATE : (readTourState(userId) ?? INITIAL_TOUR_STATE),
    });
  },
  save: (tour) => {
    const { userId } = get();
    if (userId !== null) {
      storeTourState(userId, tour);
    }
    set({ tour });
  },
  setChecklistOpen: (checklistOpen) => set({ checklistOpen }),
}));
