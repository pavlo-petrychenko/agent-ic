import { Trans, useTranslation } from 'react-i18next';
import { AUTH_NAMESPACE } from '@/features/auth/constants/authI18n.constants';
import type { InviteRoleNoteProps } from '@/features/auth/view/InviteRoleNote/InviteRoleNote.typedefs';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { IconName } from '@/shared/ui/foundations/Icon';

export function InviteRoleNote({ role }: InviteRoleNoteProps) {
  const { t } = useTranslation();

  return (
    <Callout tone={CalloutTone.Info} icon={IconName.Hand}>
      <Trans
        ns={AUTH_NAMESPACE}
        i18nKey="invite.roleNote"
        values={{ role: t(`roles.name.${role}`), summary: t(`roles.summary.${role}`) }}
        components={{ strong: <strong /> }}
      />
    </Callout>
  );
}
