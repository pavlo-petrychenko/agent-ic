import { NOT_APPLICABLE_MARK } from '@/features/settings/constants/roles.constants';
import type { RoleMatrixProps } from '@/features/settings/view/RoleMatrix/RoleMatrix.typedefs';
import { Checkbox } from '@/shared/ui/inputs/Checkbox';
import styles from '@/features/settings/view/RoleMatrix/RoleMatrix.module.scss';

export function RoleMatrix({ resourceLabel, columns, rows, onToggle }: RoleMatrixProps) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col" className={styles.resourceHead}>
            {resourceLabel}
          </th>
          {columns.map((column) => (
            <th key={column.id} scope="col" className={styles.actionHead}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <th scope="row" className={styles.resourceCell}>
              <span className={styles.resourceText}>
                <span className={styles.resourceLabel}>{row.label}</span>
                {row.note !== null && <span className={styles.resourceNote}>{row.note}</span>}
              </span>
            </th>
            {columns.map((column) => (
              <td key={column.id} className={styles.actionCell}>
                {row.actions.includes(column.action) ? (
                  <Checkbox
                    checked={row.granted.includes(column.action)}
                    aria-label={`${row.label} · ${column.label}`}
                    onCheckedChange={(checked) => onToggle(row.id, column.action, checked)}
                  />
                ) : (
                  <span className={styles.notApplicable} aria-hidden="true">
                    {NOT_APPLICABLE_MARK}
                  </span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
