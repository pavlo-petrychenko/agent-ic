import { HeadingElement } from '@/shared/ui/Heading';

export enum CardHeaderLevel {
  H2 = 2,
  H3 = 3,
  H4 = 4,
}

export const CARD_HEADER_ELEMENTS: Readonly<Record<CardHeaderLevel, HeadingElement>> = {
  [CardHeaderLevel.H2]: HeadingElement.H2,
  [CardHeaderLevel.H3]: HeadingElement.H3,
  [CardHeaderLevel.H4]: HeadingElement.H4,
};
