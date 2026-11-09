import {
  TourPage,
  TourStatus,
  TourStepGroup,
  TourStepId,
} from '@/features/onboarding/constants/tour.constants';
import { TourAnchor } from '@/features/onboarding/constants/tourAnchor.constants';
import type { TourState, TourStepDefinition } from '@/features/onboarding/typedefs/tour.typedefs';
import { CoachmarkPlacement } from '@/shared/ui/overlays/Coachmark';

export const TOUR_STEPS: readonly TourStepDefinition[] = [
  {
    id: TourStepId.Agents,
    group: TourStepGroup.Explore,
    page: TourPage.Anywhere,
    anchor: TourAnchor.NavAgents,
    placement: CoachmarkPlacement.Right,
  },
  {
    id: TourStepId.Prompts,
    group: TourStepGroup.Explore,
    page: TourPage.Anywhere,
    anchor: TourAnchor.NavPrompts,
    placement: CoachmarkPlacement.Right,
  },
  {
    id: TourStepId.Knowledge,
    group: TourStepGroup.Explore,
    page: TourPage.Anywhere,
    anchor: TourAnchor.NavKnowledge,
    placement: CoachmarkPlacement.Right,
  },
  {
    id: TourStepId.Channels,
    group: TourStepGroup.Explore,
    page: TourPage.Anywhere,
    anchor: TourAnchor.NavChannels,
    placement: CoachmarkPlacement.Right,
  },
  {
    id: TourStepId.Inbox,
    group: TourStepGroup.Explore,
    page: TourPage.Anywhere,
    anchor: TourAnchor.NavInbox,
    placement: CoachmarkPlacement.Right,
  },
  {
    id: TourStepId.Testing,
    group: TourStepGroup.Explore,
    page: TourPage.Anywhere,
    anchor: TourAnchor.NavTesting,
    placement: CoachmarkPlacement.Right,
  },
  {
    id: TourStepId.Build,
    group: TourStepGroup.Build,
    page: TourPage.Agents,
    anchor: TourAnchor.NewAgent,
    placement: CoachmarkPlacement.Bottom,
  },
  {
    id: TourStepId.Canvas,
    group: TourStepGroup.Build,
    page: TourPage.Builder,
    anchor: TourAnchor.BuilderCanvas,
    placement: CoachmarkPlacement.Bottom,
  },
  {
    id: TourStepId.Palette,
    group: TourStepGroup.Build,
    page: TourPage.Builder,
    anchor: TourAnchor.BuilderPalette,
    placement: CoachmarkPlacement.Right,
  },
  {
    id: TourStepId.Guides,
    group: TourStepGroup.Build,
    page: TourPage.Builder,
    anchor: TourAnchor.BuilderGuides,
    placement: CoachmarkPlacement.Bottom,
  },
  {
    id: TourStepId.Publish,
    group: TourStepGroup.Publish,
    page: TourPage.Builder,
    anchor: TourAnchor.BuilderPublish,
    placement: CoachmarkPlacement.Bottom,
  },
  {
    id: TourStepId.Test,
    group: TourStepGroup.Test,
    page: TourPage.Testing,
    anchor: TourAnchor.TestingSimulator,
    placement: CoachmarkPlacement.Left,
  },
  {
    id: TourStepId.Done,
    group: TourStepGroup.Test,
    page: TourPage.Anywhere,
    anchor: null,
    placement: CoachmarkPlacement.Bottom,
  },
];

export const TOUR_CHECKLIST_GROUPS: readonly TourStepGroup[] = [
  TourStepGroup.Explore,
  TourStepGroup.Build,
  TourStepGroup.Publish,
  TourStepGroup.Test,
];

export const INITIAL_TOUR_STATE: TourState = {
  status: TourStatus.New,
  stepId: null,
  skippedStepIds: [],
  completedStepIds: [],
  agentId: null,
};
