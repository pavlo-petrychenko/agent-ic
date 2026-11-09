import type {
  TourPage,
  TourStatus,
  TourStepGroup,
  TourStepId,
} from '@/features/onboarding/constants/tour.constants';
import type { TourAnchor } from '@/features/onboarding/constants/tourAnchor.constants';
import type { CoachmarkPlacement } from '@/shared/ui/overlays/Coachmark';

export interface TourState {
  readonly status: TourStatus;
  readonly stepId: TourStepId | null;
  readonly skippedStepIds: readonly TourStepId[];
  readonly completedStepIds: readonly TourStepId[];
  readonly agentId: string | null;
}

export interface TourStepDefinition {
  readonly id: TourStepId;
  readonly group: TourStepGroup;
  readonly page: TourPage;
  readonly anchor: TourAnchor | null;
  readonly placement: CoachmarkPlacement;
}

export interface TourRoute {
  readonly page: TourPage | null;
  readonly agentId: string | null;
  readonly versionsAgentId: string | null;
}

export interface TourStore {
  readonly userId: string | null;
  readonly eligible: boolean;
  readonly tour: TourState;
  readonly checklistOpen: boolean;
  readonly load: (userId: string | null, eligible: boolean) => void;
  readonly save: (tour: TourState) => void;
  readonly setChecklistOpen: (open: boolean) => void;
}

export type TourAnchorAttributes = Readonly<Record<'data-tour', string>>;

export interface TourTarget {
  readonly target: HTMLElement | null;
  readonly blocked: boolean;
}

export interface TourProgress {
  readonly current: number;
  readonly total: number;
}
