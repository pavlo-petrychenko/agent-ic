import { useTranslation } from 'react-i18next';
import { useRenameWorkspace } from '@/features/settings/communication/hooks/useRenameWorkspace';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { GeneralPageProps } from '@/features/settings/containers/GeneralPage/GeneralPage.typedefs';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import { createWorkspaceNameSchema } from '@/features/settings/logic/schemas/workspaceName.schema';
import { WorkspaceNameCard } from '@/features/settings/view/WorkspaceNameCard';
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
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tError } = useTranslation(Namespace.Errors);
  const workspace = useActiveWorkspace(workspaceId);
  const renameWorkspace = useRenameWorkspace();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const form = useAppForm({
    defaultValues: {
      name: workspace?.name ?? '',
    },
    validators: {
      onSubmit: createWorkspaceNameSchema({ name: tError('reason.INVALID_WORKSPACE_NAME') }),
    },
    onSubmit: async ({ value }) => {
      try {
        await renameWorkspace(value.name);
        showToast({ message: t('general.workspace.renameSuccess'), tone: ToastTone.Ok });
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
        <WorkspaceNameCard onSubmit={() => void form.handleSubmit()}>
          <form.AppField name="name">
            {(field) => <field.TextField label={t('general.workspace.nameLabel')} type="text" />}
          </form.AppField>
          <div className="mt-4">
            <form.AppForm>
              <form.SubmitButton size={ButtonSize.Lg}>
                {t('general.workspace.save')}
              </form.SubmitButton>
            </form.AppForm>
          </div>
        </WorkspaceNameCard>
      </div>
    </div>
  );
}
