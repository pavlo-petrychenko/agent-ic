import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { MemberListProps } from '@/features/settings/view/MemberList/MemberList.typedefs';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { Avatar } from '@/shared/ui/display/Avatar';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Card } from '@/shared/ui/display/Card';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/settings/view/MemberList/MemberList.module.scss';

export function MemberList({ rows, onAction }: MemberListProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  return (
    <Card flush>
      <table className={styles.table}>
        <thead>
          <tr className={styles.head}>
            <th scope="col">{t('team.members.member')}</th>
            <th scope="col">{t('team.members.role')}</th>
            <th scope="col">{t('team.members.lastActive')}</th>
            <th scope="col">
              <span className="sr-only">{t('team.members.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const action = row.action;
            return (
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
                <td className={styles.actions}>
                  {action === null ? null : (
                    <IconButton
                      icon={IconName.More}
                      size={IconButtonSize.Sm}
                      label={t('team.members.moreActions', { name: row.name })}
                      onClick={() => onAction(row.id, action)}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
