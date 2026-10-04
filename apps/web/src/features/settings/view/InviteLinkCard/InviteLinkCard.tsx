import { useTranslation } from 'react-i18next';
import { INVITABLE_ROLE_SET } from '@/features/settings/constants/inviteLink.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { InviteLinkCardProps } from '@/features/settings/view/InviteLinkCard/InviteLinkCard.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/Heading';
import { IconName } from '@/shared/ui/Icon';
import { Select } from '@/shared/ui/Select';
import { Text, TextColor, TextKind } from '@/shared/ui/Text';
import styles from '@/features/settings/view/InviteLinkCard/InviteLinkCard.module.scss';

export function InviteLinkCard({
  link,
  workspaceName,
  expiresOn,
  canEdit,
  roleOptions,
  resetting,
  onCopy,
  onReset,
  onRoleChange,
}: InviteLinkCardProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  return (
    <Card>
      <div className="flex flex-col gap-0.5">
        <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
          {t('team.invite.title')}
        </Heading>
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('team.invite.description', { workspace: workspaceName })}
        </Text>
      </div>
      {link === null ? (
        canEdit && (
          <div>
            <Button icon={IconName.Link} loading={resetting} onClick={onReset}>
              {t('team.invite.create')}
            </Button>
          </div>
        )
      ) : (
        <>
          <div className={styles.controls}>
            <div className={styles.url}>{link.url}</div>
            {canEdit && (
              <Select
                aria-label={t('team.invite.role')}
                value={link.role}
                options={roleOptions}
                onChange={(event) => {
                  const role = INVITABLE_ROLE_SET.get(event.target.value) ?? null;
                  if (role !== null) {
                    onRoleChange(role);
                  }
                }}
              />
            )}
            <Button icon={IconName.Copy} onClick={onCopy}>
              {t('team.invite.copy')}
            </Button>
            {canEdit && (
              <Button variant={ButtonVariant.Secondary} loading={resetting} onClick={onReset}>
                {t('team.invite.reset')}
              </Button>
            )}
          </div>
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('team.invite.meta', { date: expiresOn, count: link.joinedCount })}
          </Text>
        </>
      )}
    </Card>
  );
}
