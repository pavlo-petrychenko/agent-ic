import { useTranslation } from 'react-i18next';
import {
  PROMPT_FOLDER_MENU_ACTIONS,
  PromptFolderMenuAction,
} from '@/features/prompts/constants/promptFolderMenu.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptsNavProps } from '@/features/prompts/view/PromptsNav/PromptsNav.typedefs';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/ui/actions/IconButton';
import { TreeFolder } from '@/shared/ui/data/TreeFolder';
import { IconName } from '@/shared/ui/foundations/Icon';
import { ContextMenu } from '@/shared/ui/overlays/ContextMenu';
import type { MenuItem } from '@/shared/ui/overlays/Menu';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/view/PromptsNav/PromptsNav.module.scss';

export function PromptsNav({
  groups,
  loading,
  onCreate,
  onOpenChange,
  folderMenuAnchor,
  onFolderMenuOpen,
  onFolderMenuSelect,
  onFolderMenuClose,
}: PromptsNavProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  const toMenuItem = (action: PromptFolderMenuAction): MenuItem => ({
    id: action,
    label: t(`folderMenu.${action}`),
    danger: action === PromptFolderMenuAction.Delete,
  });

  return (
    <nav aria-label={t('nav.label')} className={styles.root}>
      <header className={styles.header}>
        <Heading size={HeadingSize.H1} as={HeadingElement.Paragraph}>
          {t('page.title')}
        </Heading>
        <IconButton
          icon={IconName.Plus}
          label={t('actions.newPrompt')}
          variant={IconButtonVariant.Secondary}
          size={IconButtonSize.Sm}
          onClick={onCreate}
        />
      </header>
      {!loading && groups.length === 0 && (
        <Text kind={TextKind.BodySmall} color={TextColor.Mute}>
          {t('empty.title')}
        </Text>
      )}
      {groups.length > 0 && (
        <div className={styles.tree}>
          {groups.map((group) => (
            <TreeFolder
              key={group.folder.id}
              label={group.folder.name}
              open={group.open}
              onOpenChange={(open) => onOpenChange(group.folder.id, open)}
              onContextMenu={(event) =>
                onFolderMenuOpen({ folder: group.folder, promptCount: group.prompts.length }, event)
              }
            >
              {group.prompts.map((prompt) => (
                <span key={prompt.id} className={styles.prompt}>
                  {prompt.name}
                </span>
              ))}
            </TreeFolder>
          ))}
        </div>
      )}
      <ContextMenu
        anchor={folderMenuAnchor}
        items={PROMPT_FOLDER_MENU_ACTIONS.map(toMenuItem)}
        ariaLabel={t('folderMenu.label')}
        onSelect={(id) => {
          const action = PROMPT_FOLDER_MENU_ACTIONS.find((entry) => entry === id);
          if (action !== undefined) {
            onFolderMenuSelect(action);
          }
        }}
        onClose={onFolderMenuClose}
      />
    </nav>
  );
}
