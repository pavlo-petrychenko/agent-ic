import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { MemberListProps } from '@/features/settings/view/MemberList/MemberList.typedefs';
import { Avatar } from '@/shared/ui/Avatar';
import { Badge, BadgeTone } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import styles from '@/features/settings/view/MemberList/MemberList.module.scss';

export function MemberList({ rows }: MemberListProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  return (
    <Card flush>
      <table className={styles.table}>
        <thead>
          <tr className={styles.head}>
            <th scope="col">{t('team.members.member')}</th>
            <th scope="col">{t('team.members.role')}</th>
            <th scope="col">{t('team.members.lastActive')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={styles.row}>
              <td>
                <span className={styles.person}>
                  <Avatar initials={row.initials} />
                  <span className={styles.personText}>
                    <span className={styles.name}>{row.name}</span>
                    <span className={styles.email}>{row.email}</span>
                  </span>
                </span>
              </td>
              <td>
                <Badge tone={BadgeTone.Accent}>{row.roleLabel}</Badge>
              </td>
              <td className={styles.lastActive}>{row.lastActive}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
