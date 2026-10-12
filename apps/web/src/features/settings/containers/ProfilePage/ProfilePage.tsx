import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { ProfileDetailsForm } from '@/features/settings/containers/ProfileDetailsForm';
import type { ProfilePageProps } from '@/features/settings/containers/ProfilePage/ProfilePage.typedefs';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import { ChangePasswordCard } from '@/features/settings/view/ChangePasswordCard';
import { useState } from 'react';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';

export function ProfilePage({ workspaceId }: ProfilePageProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
        <ProfileDetailsForm workspaceId={workspaceId} />
        <ChangePasswordCard
          currentPassword={currentPassword}
          newPassword={newPassword}
          onCurrentPasswordChange={setCurrentPassword}
          onNewPasswordChange={setNewPassword}
          onSave={() => undefined}
        />
      </div>
    </div>
  );
}
