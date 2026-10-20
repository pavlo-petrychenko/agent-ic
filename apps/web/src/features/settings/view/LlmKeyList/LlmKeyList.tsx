import type { LlmKeyListProps } from '@/features/settings/view/LlmKeyList/LlmKeyList.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge } from '@/shared/ui/display/Badge';
import { Card } from '@/shared/ui/display/Card';
import { NodeKind, NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/settings/view/LlmKeyList/LlmKeyList.module.scss';

export function LlmKeyList({ title, description, rows }: LlmKeyListProps) {
  return (
    <Card flush>
      <div className={styles.header}>
        <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
          {title}
        </Heading>
        <Text kind={TextKind.BodySmall} color={TextColor.Mute}>
          {description}
        </Text>
      </div>
      <ul className={styles.rows}>
        {rows.map((row) => (
          <li key={row.id} className={styles.row}>
            <NodeTile
              kind={NodeKind.Neutral}
              size={TileSize.Md}
              icon={IconName.Sparkle}
              className={styles.tile}
            />
            <div className={styles.text}>
              <Text as={TextElement.Span} kind={TextKind.Title}>
                {row.title}
              </Text>
              <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
                {row.subtitle}
              </Text>
            </div>
            {row.badge !== null && (
              <Badge tone={row.badge.tone} dot={row.badge.dot}>
                {row.badge.label}
              </Badge>
            )}
            {row.badge === null && row.onAdd !== null && row.addLabel !== null && (
              <Button size={ButtonSize.Sm} variant={ButtonVariant.Secondary} onClick={row.onAdd}>
                {row.addLabel}
              </Button>
            )}
            {row.onRemove !== null && row.removeLabel !== null && (
              <Button size={ButtonSize.Sm} variant={ButtonVariant.Danger} onClick={row.onRemove}>
                {row.removeLabel}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
