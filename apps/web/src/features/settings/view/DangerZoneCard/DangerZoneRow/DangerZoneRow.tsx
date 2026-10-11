import { DangerActionTone } from '@/features/settings/view/DangerZoneCard/DangerZoneCard.constants';
import type { DangerZoneRowProps } from '@/features/settings/view/DangerZoneCard/DangerZoneRow/DangerZoneRow.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/settings/view/DangerZoneCard/DangerZoneRow/DangerZoneRow.module.scss';

export function DangerZoneRow({ row }: DangerZoneRowProps) {
  return (
    <li className={styles.row}>
      <div className={styles.text}>
        <Text as={TextElement.Span} kind={TextKind.Title}>
          {row.title}
        </Text>
        <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
          {row.description}
        </Text>
      </div>
      <Button
        variant={
          row.tone === DangerActionTone.Danger ? ButtonVariant.Danger : ButtonVariant.Secondary
        }
        size={ButtonSize.Sm}
        disabled={row.disabled === true}
        aria-label={`${row.actionLabel}: ${row.title}`}
        onClick={row.onAction ?? undefined}
      >
        {row.actionLabel}
      </Button>
    </li>
  );
}
