import {
  WORKSPACE_CHEVRON_SIZE,
  WORKSPACE_MARK_ICON_SIZE,
} from '@/features/workspace/view/WorkspaceIdentity/WorkspaceIdentity.constants';
import type { WorkspaceIdentityProps } from '@/features/workspace/view/WorkspaceIdentity/WorkspaceIdentity.typedefs';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/workspace/view/WorkspaceIdentity/WorkspaceIdentity.module.scss';

export function WorkspaceIdentity({
  name,
  caption,
  expandable = false,
  markOnly = false,
}: WorkspaceIdentityProps) {
  const mark = (
    <span className={styles.mark}>
      <Icon name={IconName.Logo} size={WORKSPACE_MARK_ICON_SIZE} />
    </span>
  );

  if (markOnly) {
    return mark;
  }

  return (
    <span className={styles.root}>
      {mark}
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        <span className={styles.caption}>{caption}</span>
      </span>
      {expandable && (
        <span className={styles.chevron}>
          <Icon name={IconName.ChevronDown} size={WORKSPACE_CHEVRON_SIZE} />
        </span>
      )}
    </span>
  );
}
