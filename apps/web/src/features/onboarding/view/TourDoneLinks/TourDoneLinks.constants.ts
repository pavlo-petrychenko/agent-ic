import { TourLink } from '@/features/onboarding/constants/tour.constants';
import { IconName } from '@/shared/ui/foundations/Icon';

export const TOUR_LINK_ICONS: Readonly<Record<TourLink, IconName>> = {
  [TourLink.Telegram]: IconName.Channels,
  [TourLink.Team]: IconName.User,
  [TourLink.Templates]: IconName.Sparkle,
  [TourLink.Guides]: IconName.Note,
};
