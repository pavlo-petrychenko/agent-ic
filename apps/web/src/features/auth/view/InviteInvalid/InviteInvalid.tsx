import { useTranslation } from 'react-i18next';
import { AUTH_NAMESPACE } from '@/features/auth/constants/authI18n.constants';
import type { InviteInvalidProps } from '@/features/auth/view/InviteInvalid/InviteInvalid.typedefs';
import { Button, ButtonSize } from '@/shared/ui/Button';
import { EmptyState, EmptyStateTone } from '@/shared/ui/EmptyState';
import { IconName } from '@/shared/ui/Icon';

export function InviteInvalid({ actionLabel, onAction }: InviteInvalidProps) {
  const { t } = useTranslation(AUTH_NAMESPACE);

  return (
    <>
      <EmptyState
        icon={IconName.Link}
        tone={EmptyStateTone.Warn}
        title={t('invite.invalid.title')}
        description={t('invite.invalid.description')}
      />
      <Button size={ButtonSize.Lg} fullWidth onClick={onAction}>
        {actionLabel}
      </Button>
    </>
  );
}
