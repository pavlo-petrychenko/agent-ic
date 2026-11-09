import type {
  TourStepGroup,
  TourStepId,
  TourStepState,
} from '@/features/onboarding/constants/tour.constants';

export interface TourChecklistStep {
  readonly id: TourStepId;
  readonly title: string;
  readonly status: TourStepState;
  readonly statusLabel: string;
}

export interface TourChecklistGroup {
  readonly id: TourStepGroup;
  readonly label: string;
  readonly steps: readonly TourChecklistStep[];
}

export interface TourChecklistLabels {
  readonly title: string;
  readonly description: string;
  readonly close: string;
  readonly restart: string;
}

export interface TourChecklistProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: TourChecklistLabels;
  groups: readonly TourChecklistGroup[];
  onSelectStep: (stepId: TourStepId) => void;
  onRestart: () => void;
}

export interface TourChecklistGroupProps {
  group: TourChecklistGroup;
  onSelectStep: (stepId: TourStepId) => void;
}
