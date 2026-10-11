import { useTranslation } from 'react-i18next';
import { useRenameWorkspace } from '@/features/settings/communication/hooks/useRenameWorkspace';
import { useUpdateTimeZone } from '@/features/settings/communication/hooks/useUpdateTimeZone';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { GeneralPageProps } from '@/features/settings/containers/GeneralPage/GeneralPage.typedefs';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import {
  canonicalTimeZone,
  timeZoneChoices,
} from '@/features/settings/logic/helpers/timeZone.helpers';
import { createWorkspaceSchema } from '@/features/settings/logic/schemas/workspace.schema';
import { WorkspaceCard } from '@/features/settings/view/WorkspaceCard';
import { useActiveWorkspace } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ButtonSize } from '@/shared/ui/actions/Button';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function GeneralPage({ workspaceId }: GeneralPageProps) {
  const { t } = useTranslation([SETTINGS_NAMESPACE, Namespace.Errors]);
  const workspace = useActiveWorkspace(workspaceId);
  const renameWorkspace = useRenameWorkspace();
  const updateTimeZone = useUpdateTimeZone();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const currentTimeZone = canonicalTimeZone(workspace?.timeZone ?? '');
  const timeZoneOptions = timeZoneChoices(currentTimeZone).map((timeZone) => ({
    value: timeZone,
    label: timeZone,
  }));
  const timeZoneSearchPlaceholder = t('general.workspace.timeZoneSearchPlaceholder');

  const form = useAppForm({
    defaultValues: {
      name: workspace?.name ?? '',
      timeZone: currentTimeZone,
    },
    validators: {
      onSubmit: createWorkspaceSchema({
        name: t(`${Namespace.Errors}:reason.INVALID_WORKSPACE_NAME`),
        timeZone: t(`${Namespace.Errors}:reason.INVALID_TIME_ZONE`),
      }),
    },
    onSubmit: async ({ value }) => {
      const name = value.name.trim();
      const nameChanged = name !== (workspace?.name ?? '');
      const timeZoneChanged = value.timeZone !== currentTimeZone;

      if (!nameChanged && !timeZoneChanged) return;

      try {
        const tasks: Promise<unknown>[] = [];

        if (nameChanged) tasks.push(renameWorkspace(name));
        if (timeZoneChanged) tasks.push(updateTimeZone(value.timeZone));

        await Promise.all(tasks);

        if (nameChanged && timeZoneChanged) {
          showToast({ message: t('general.workspace.updateSuccess'), tone: ToastTone.Ok });
        } else if (nameChanged) {
          showToast({ message: t('general.workspace.renameSuccess'), tone: ToastTone.Ok });
        } else {
          showToast({ message: t('general.workspace.timeZoneSuccess'), tone: ToastTone.Ok });
        }
      } catch (error) {
        showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
      }
    },
  });
  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={t('nav.general')}
        subtitle={t('general.subtitle')}
        crumbs={
          <Breadcrumb
            ariaLabel={t('breadcrumb')}
            moreLabel={t('breadcrumbMore')}
            items={[{ label: t('title'), to: settingsHref(workspaceId) }]}
          />
        }
      />
      <div className="flex flex-col gap-4 px-7">
        <WorkspaceCard onSubmit={() => void form.handleSubmit()}>
          <div className="flex flex-col gap-4">
            <form.AppField name="name">
              {(field) => <field.TextField label={t('general.workspace.nameLabel')} type="text" />}
            </form.AppField>
            <form.AppField name="timeZone">
              {(field) => (
                <field.ComboboxField
                  label={t('general.workspace.timeZoneLabel')}
                  hint={t('general.workspace.timeZoneHint')}
                  placeholder={timeZoneSearchPlaceholder}
                  searchLabel={timeZoneSearchPlaceholder}
                  searchClearLabel={t('general.workspace.timeZoneSearchClear')}
                  emptyLabel={t('general.workspace.timeZoneEmpty')}
                  options={timeZoneOptions}
                />
              )}
            </form.AppField>
          </div>
          <div className="mt-4">
            <form.AppForm>
              <form.SubmitButton size={ButtonSize.Lg}>
                {t('general.workspace.save')}
              </form.SubmitButton>
            </form.AppForm>
          </div>
        </WorkspaceCard>
      </div>
    </div>
  );
}
