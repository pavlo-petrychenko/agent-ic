import { useTranslation } from 'react-i18next';
import { AUTH_NAMESPACE } from '@/features/auth/constants/authI18n.constants';
import type { InviteSummaryProps } from '@/features/auth/view/InviteSummary/InviteSummary.typedefs';
import { Avatar, AvatarSize, AvatarTone } from '@/shared/ui/Avatar';
import { Badge, BadgeTone } from '@/shared/ui/Badge';
import { Card, CardGap, CardPad, CardTone } from '@/shared/ui/Card';
import styles from '@/features/auth/view/InviteSummary/InviteSummary.module.scss';

export function InviteSummary({ invite, initials }: InviteSummaryProps) {
  const { t } = useTranslation(AUTH_NAMESPACE);
  const { t: tCommon } = useTranslation();

  return (
    <Card tone={CardTone.Panel} pad={CardPad.Md} gap={CardGap.Md}>
      <div className={styles.workspace}>
        <Avatar initials={initials} size={AvatarSize.Lg} tone={AvatarTone.Solid} />
        <div className={styles.workspaceText}>
          <span className={styles.name}>{invite.workspaceName}</span>
          <span className={styles.meta}>{t('invite.members', { count: invite.memberCount })}</span>
        </div>
      </div>
      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt className={styles.term}>{t('invite.yourRole')}</dt>
          <dd className={styles.value}>
            <Badge tone={BadgeTone.Accent}>{tCommon(`roles.name.${invite.role}`)}</Badge>
          </dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>{t('invite.youCan')}</dt>
          <dd className={styles.value}>{tCommon(`roles.ability.${invite.role}`)}</dd>
        </div>
      </dl>
    </Card>
  );
}
