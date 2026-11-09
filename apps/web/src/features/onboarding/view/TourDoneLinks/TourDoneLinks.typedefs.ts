import type { TourLink } from '@/features/onboarding/constants/tour.constants';

export interface TourDoneLinkItem {
  readonly id: TourLink;
  readonly label: string;
}

export interface TourDoneLinksProps {
  body: string;
  links: readonly TourDoneLinkItem[];
  onSelect: (link: TourLink) => void;
}
