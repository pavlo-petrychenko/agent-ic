import { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';
import { IconName } from '@/shared/ui/foundations/Icon';

export const PROMPT_MENU_ICON_SIZE = 14;
export const PROMPT_MENU_WIDTH = 240;

export const PROMPT_MENU_ICONS: Readonly<Record<PromptMenuAction, IconName>> = {
  [PromptMenuAction.Rename]: IconName.Note,
  [PromptMenuAction.Move]: IconName.ChevronRight,
  [PromptMenuAction.Duplicate]: IconName.Copy,
  [PromptMenuAction.Delete]: IconName.X,
};
