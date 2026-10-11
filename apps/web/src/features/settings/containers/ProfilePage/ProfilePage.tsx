import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { ProfilePageProps } from '@/features/settings/containers/ProfilePage/ProfilePage.typedefs';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import { ProfileDetailsCard } from '@/features/settings/view/ProfileDetailsCard';
import { useUpdateMyLocale } from '@/features/workspace';
import { useWorkspaceShell } from '@/features/workspace/communication/hooks/useWorkspaceShell';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function ProfilePage({ workspaceId }: ProfilePageProps) {
  const { t } = useTranslation([SETTINGS_NAMESPACE, Namespace.Errors]);
  const user = useWorkspaceShell(workspaceId).data?.user ?? null;
  const { locale, setLocale } = useLocale();
  const { preference, setPreference } = useTheme();
  const updateMyLocale = useUpdateMyLocale();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateMyLocale(locale);
      showToast({ message: t('profile.details.saved'), tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={t('nav.profile')}
        subtitle={t('profile.subtitle')}
        crumbs={
          <Breadcrumb
            ariaLabel={t('breadcrumb')}
            moreLabel={t('breadcrumbMore')}
            items={[{ label: t('title'), to: settingsHref(workspaceId) }]}
          />
        }
      />
      <div className="flex flex-col gap-4 px-7">
        <ProfileDetailsCard
          name={name}
          email={user?.email ?? ''}
          locale={locale}
          theme={preference}
          saving={saving}
          onNameChange={setName}
          onEmailChange={() => undefined}
          onLocaleChange={setLocale}
          onThemeChange={setPreference}
          onSave={() => void save()}
        />
      </div>
    </div>
  );
}
