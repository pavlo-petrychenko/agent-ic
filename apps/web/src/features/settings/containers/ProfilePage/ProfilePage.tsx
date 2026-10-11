import type { Locale } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequestMyEmailChange } from '@/features/settings/communication/hooks/useRequestMyEmailChange';
import { useUpdateMyName } from '@/features/settings/communication/hooks/useUpdateMyName';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { ProfilePageProps } from '@/features/settings/containers/ProfilePage/ProfilePage.typedefs';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import { ProfileDetailsCard } from '@/features/settings/view/ProfileDetailsCard';
import { useUpdateMyLocale, useWorkspaceShell } from '@/features/workspace';
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
  const updateMyName = useUpdateMyName();
  const requestMyEmailChange = useRequestMyEmailChange();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [emailDraft, setEmailDraft] = useState(user?.email ?? '');
  const [emailEditing, setEmailEditing] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const savedName = user?.name ?? '';
  const savedEmail = user?.email ?? '';

  const changeLocale = (next: Locale) => {
    setLocale(next);
    void updateMyLocale(next).catch((error: unknown) => {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    });
  };

  const save = async () => {
    const nextName = name.trim();
    if (nextName === savedName) {
      return;
    }
    setSaving(true);
    try {
      await updateMyName(nextName);
      setName(nextName);
      showToast({ message: t('profile.details.name.success'), tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    } finally {
      setSaving(false);
    }
  };

  const startEmailEdit = () => {
    setEmailDraft(savedEmail);
    setEmailEditing(true);
  };

  const cancelEmailEdit = () => {
    setEmailEditing(false);
    setEmailDraft(savedEmail);
  };

  const submitEmailChange = async () => {
    const nextEmail = emailDraft.trim();
    if (nextEmail === '' || nextEmail === savedEmail) {
      cancelEmailEdit();
      return;
    }
    setEmailSending(true);
    try {
      await requestMyEmailChange(nextEmail);
      showToast({
        message: t('profile.details.email.success', { email: nextEmail }),
        tone: ToastTone.Ok,
      });
      cancelEmailEdit();
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    } finally {
      setEmailSending(false);
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
          email={savedEmail}
          emailDraft={emailDraft}
          emailEditing={emailEditing}
          emailSending={emailSending}
          locale={locale}
          theme={preference}
          saving={saving}
          onNameChange={setName}
          onEmailDraftChange={setEmailDraft}
          onEmailEdit={startEmailEdit}
          onEmailCancel={cancelEmailEdit}
          onEmailSubmit={() => void submitEmailChange()}
          onLocaleChange={changeLocale}
          onThemeChange={setPreference}
          onSave={() => void save()}
        />
      </div>
    </div>
  );
}
