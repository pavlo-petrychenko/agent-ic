import type { WorkspaceListProps } from '@/features/settings/view/WorkspaceList/WorkspaceList.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Avatar, AvatarTone } from '@/shared/ui/display/Avatar';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Card } from '@/shared/ui/display/Card';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import styles from '@/features/settings/view/WorkspaceList/WorkspaceList.module.scss';

export function WorkspaceList({
  title,
  currentLabel,
  leaveLabel,
  logOutLabel,
  rows,
  onLeave,
  onLogOut,
}: WorkspaceListProps) {
  return (
    <Card>
      <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
        {title}
      </Heading>
      <ul className={styles.list}>
        {rows.map((row) => (
          <li key={row.id} className={styles.row}>
            <span className={styles.person}>
              <Avatar
                initials={row.initials}
                tone={row.isCurrent ? AvatarTone.Accent : AvatarTone.Neutral}
              />
              <span className={styles.personText}>
                <span className={styles.name}>{row.name}</span>
                <span className={styles.hint}>{row.hint}</span>
              </span>
            </span>
            <span className={styles.actions}>
              {row.isCurrent && <Badge tone={BadgeTone.Accent}>{currentLabel}</Badge>}
              {row.canLeave && (
                <Button
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Sm}
                  onClick={() => onLeave(row.id)}
                >
                  {leaveLabel}
                </Button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div>
        <Button variant={ButtonVariant.Ghost} onClick={onLogOut}>
          {logOutLabel}
        </Button>
      </div>
    </Card>
  );
}
