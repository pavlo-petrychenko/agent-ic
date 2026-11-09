import { IconName } from '@/shared/ui/foundations/Icon';

export enum HelpAction {
  ProductTour = 'productTour',
  GettingStarted = 'gettingStarted',
  Templates = 'templates',
  Guides = 'guides',
}

export const HELP_ICON = IconName.Info;
export const HELP_MENU_WIDTH = 240;
export const HELP_MENU_ICON_SIZE = 14;

export const HELP_ACTION_ICONS: Readonly<Record<HelpAction, IconName>> = {
  [HelpAction.ProductTour]: IconName.Play,
  [HelpAction.GettingStarted]: IconName.Check,
  [HelpAction.Templates]: IconName.Sparkle,
  [HelpAction.Guides]: IconName.Note,
};
