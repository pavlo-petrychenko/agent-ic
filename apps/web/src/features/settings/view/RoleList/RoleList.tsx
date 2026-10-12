import clsx from 'clsx';
import type { RoleListProps } from '@/features/settings/view/RoleList/RoleList.typedefs';
import { AddTile } from '@/shared/ui/actions/AddTile';
import styles from '@/features/settings/view/RoleList/RoleList.module.scss';

export function RoleList({
  roles,
  selectedId,
  ariaLabel,
  newRoleLabel,
  onSelect,
  onNewRole,
}: RoleListProps) {
  return (
    <div className={styles.root}>
      <fieldset className={styles.list}>
        <legend className="sr-only">{ariaLabel}</legend>
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            aria-pressed={role.id === selectedId}
            className={clsx(styles.card, role.id === selectedId && styles.selected)}
            onClick={() => onSelect(role.id)}
          >
            <span className={styles.title}>{role.title}</span>
            <span className={styles.description}>{role.description}</span>
          </button>
        ))}
      </fieldset>
      <AddTile label={newRoleLabel} onClick={onNewRole} />
    </div>
  );
}
