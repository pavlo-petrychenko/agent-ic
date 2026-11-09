import { TourStepState } from '@/features/onboarding/constants/tour.constants';
import { BadgeTone } from '@/shared/ui/display/Badge';
import { IconName } from '@/shared/ui/foundations/Icon';

export const CHECKLIST_STATUS_TONES: Readonly<Record<TourStepState, BadgeTone>> = {
  [TourStepState.Done]: BadgeTone.Ok,
  [TourStepState.Skipped]: BadgeTone.Neutral,
  [TourStepState.Todo]: BadgeTone.Outline,
};

export const CHECKLIST_STATUS_ICONS: Readonly<Record<TourStepState, IconName>> = {
  [TourStepState.Done]: IconName.Check,
  [TourStepState.Skipped]: IconName.Minus,
  [TourStepState.Todo]: IconName.ChevronRight,
};

export const CHECKLIST_ICON_SIZE = 14;
