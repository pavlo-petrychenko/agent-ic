import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import {
  PROMPT_MENU_ICONS,
  PROMPT_MENU_ICON_SIZE,
  PROMPT_MENU_WIDTH,
} from '@/features/prompts/view/PromptOptionsMenu/PromptOptionsMenu.constants';
import type { PromptOptionsMenuProps } from '@/features/prompts/view/PromptOptionsMenu/PromptOptionsMenu.typedefs';
import { IconButton, IconButtonVariant } from '@/shared/ui/actions/IconButton';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { Menu, MenuRole, MenuVariant } from '@/shared/ui/overlays/Menu';
import type { MenuItem } from '@/shared/ui/overlays/Menu';
import { Popover, PopoverAlign } from '@/shared/ui/overlays/Popover';

export function PromptOptionsMenu({
  actions,
  currentFolderName,
  onSelect,
}: PromptOptionsMenuProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const [open, setOpen] = useState(false);

  const toMenuItem = (action: PromptMenuAction): MenuItem => ({
    id: action,
    label: t(`menu.${action}`),
    hint: action === PromptMenuAction.Move ? currentFolderName : null,
    leading: <Icon name={PROMPT_MENU_ICONS[action]} size={PROMPT_MENU_ICON_SIZE} />,
    danger: action === PromptMenuAction.Delete,
  });

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      bare
      align={PopoverAlign.End}
      trigger={
        <IconButton
          icon={IconName.More}
          label={t('menu.label')}
          variant={IconButtonVariant.Secondary}
        />
      }
    >
      <Menu
        items={actions.map(toMenuItem)}
        variant={MenuVariant.Action}
        role={MenuRole.Menu}
        width={PROMPT_MENU_WIDTH}
        ariaLabel={t('menu.label')}
        onSelect={(id) => {
          setOpen(false);
          const action = actions.find((entry) => entry === id);
          if (action !== undefined) {
            onSelect(action);
          }
        }}
      />
    </Popover>
  );
}
