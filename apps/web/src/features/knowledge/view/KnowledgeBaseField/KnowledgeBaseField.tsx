import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { KnowledgeBaseFieldViewProps } from '@/features/knowledge/view/KnowledgeBaseField/KnowledgeBaseField.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { NodeKind, NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/knowledge/view/KnowledgeBaseField/KnowledgeBaseField.module.scss';

export function KnowledgeBaseField({
  selected,
  missingIds,
  loading,
  failed,
  error,
  onRemove,
  onAttach,
  onRetry,
}: KnowledgeBaseFieldViewProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);

  return (
    <div className={styles.root}>
      {failed ? (
        <div className={styles.errorRow}>
          <Text kind={TextKind.Caption} color={TextColor.Err}>
            {t('agentField.loadError')}
          </Text>
          <Button variant={ButtonVariant.Ghost} size={ButtonSize.Sm} onClick={onRetry}>
            {t('retry')}
          </Button>
        </div>
      ) : selected.length === 0 && missingIds.length === 0 && loading ? (
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('agentField.loading')}
        </Text>
      ) : selected.length === 0 && missingIds.length === 0 ? (
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('agentField.empty')}
        </Text>
      ) : (
        <ul className={styles.list} aria-label={t('agentField.selectedLabel')}>
          {selected.map((knowledgeBase) => (
            <li key={knowledgeBase.id} className={styles.row}>
              <NodeTile kind={NodeKind.Kb} size={TileSize.Sm} />
              <span className={styles.name}>{knowledgeBase.name}</span>
              <button
                type="button"
                className={styles.remove}
                aria-label={t('agentField.remove', { name: knowledgeBase.name })}
                onClick={() => onRemove(knowledgeBase.id)}
              >
                <Icon name={IconName.X} size={14} />
              </button>
            </li>
          ))}
          {missingIds.map((id) => (
            <li key={id} className={styles.row}>
              <NodeTile kind={NodeKind.Warn} size={TileSize.Sm} />
              <span className={styles.name}>{t('agentField.missing')}</span>
              <button
                type="button"
                className={styles.remove}
                aria-label={t('agentField.removeMissing')}
                onClick={() => onRemove(id)}
              >
                <Icon name={IconName.X} size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error !== null ? (
        <Text kind={TextKind.Caption} color={TextColor.Err}>
          {error}
        </Text>
      ) : null}
      <Button
        className="self-start"
        variant={ButtonVariant.Ghost}
        size={ButtonSize.Sm}
        icon={IconName.Plus}
        onClick={onAttach}
      >
        {t('agentField.attach')}
      </Button>
    </div>
  );
}
