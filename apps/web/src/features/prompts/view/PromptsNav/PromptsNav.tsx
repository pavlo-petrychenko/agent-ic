import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptsNavProps } from '@/features/prompts/view/PromptsNav/PromptsNav.typedefs';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/ui/actions/IconButton';
import { TreeFolder } from '@/shared/ui/data/TreeFolder';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/view/PromptsNav/PromptsNav.module.scss';

export function PromptsNav({ groups, loading, onCreate, onOpenChange }: PromptsNavProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

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
              key={group.id}
              label={group.name}
              open={group.open}
              onOpenChange={(open) => onOpenChange(group.id, open)}
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
    </nav>
  );
}
