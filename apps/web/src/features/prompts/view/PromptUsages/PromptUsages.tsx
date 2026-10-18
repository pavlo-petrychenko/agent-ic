import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptUsagesProps } from '@/features/prompts/view/PromptUsages/PromptUsages.typedefs';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { NodeKind, NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/view/PromptUsages/PromptUsages.module.scss';

export function PromptUsages({ usages }: PromptUsagesProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  return (
    <ul aria-label={t('details.usage.title')} className={styles.root}>
      {usages.map((usage) => (
        <li key={`${usage.versionId}:${usage.nodeId}`} className={styles.row}>
          <NodeTile kind={NodeKind.Agent} size={TileSize.Sm} aria-label={usage.nodeLabel} />
          <span className={styles.info}>
            <Text as={TextElement.Span} kind={TextKind.BodySmall} className={styles.name}>
              {t('details.usage.agentVersion', {
                agent: usage.agentName,
                version: usage.live
                  ? t('details.usage.versionLive', { number: usage.versionNumber })
                  : t('details.usage.versionDraft'),
              })}
            </Text>
            <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
              {usage.nodeLabel}
            </Text>
          </span>
          <Badge tone={usage.pinned ? BadgeTone.Violet : BadgeTone.Neutral} mono>
            {usage.pinned
              ? t('details.usage.pinned', { number: usage.pinNumber })
              : t('details.usage.followLatest')}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
