import { useTranslation } from 'react-i18next';
import { useLogOut } from '@/features/auth/logic/hooks/useLogOut';
import { AuthPanel } from '@/features/auth/view/AuthPanel';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { Button, ButtonVariant } from '@/shared/ui/Button';
import { Text, TextColor } from '@/shared/ui/Text';

export function WorkspaceStepPage() {
  const { t } = useTranslation(Namespace.Auth);
  const { logOut, leaving } = useLogOut();

  return (
    <AuthPanel title={t('workspaceStep.title')} subtitle={t('workspaceStep.subtitle')}>
      <Text color={TextColor.Mute}>{t('workspaceStep.description')}</Text>
      <Button
        variant={ButtonVariant.Secondary}
        loading={leaving}
        fullWidth
        onClick={() => void logOut()}
      >
        {t('workspaceStep.logout')}
      </Button>
    </AuthPanel>
  );
}
