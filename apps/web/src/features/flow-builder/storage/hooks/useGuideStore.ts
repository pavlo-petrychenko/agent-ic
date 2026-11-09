import { create } from 'zustand';
import type { GuideStore } from '@/features/flow-builder/typedefs/guide.typedefs';

export const useGuideStore = create<GuideStore>()((set) => ({
  open: false,
  guideId: null,
  openGuide: (guideId) => set({ open: true, guideId }),
  showList: () => set({ guideId: null }),
  close: () => set({ open: false }),
}));
