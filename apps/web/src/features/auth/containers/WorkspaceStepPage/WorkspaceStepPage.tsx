import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateWorkspace } from '@/features/auth/communication/hooks/useCreateWorkspace';
import { useCurrentUserEmail } from '@/features/auth/communication/hooks/useCurrentUserEmail';
import { WORKSPACE_HOME_PATH } from '@/features/auth/constants/authRoute.constants';
import {
  EMPTY_WORKSPACE_STEP_VALUES,
  WORKSPACE_SETUP_GROUP,
  WORKSPACE_STEP_REASON_FIELDS,
  WorkspaceSetupChoice,
  WorkspaceStepField,
} from '@/features/auth/constants/workspaceStep.constants';
import { browserTimeZone } from '@/features/auth/logic/helpers/timeZone.helpers';
import { useLogOut } from '@/features/auth/logic/hooks/useLogOut';
import { useServerErrors } from '@/features/auth/logic/hooks/useServerErrors';
import { createWorkspaceStepSchema } from '@/features/auth/logic/schemas/workspaceStep.schema';
import { AuthForm } from '@/features/auth/view/AuthForm';
import { AuthPanel } from '@/features/auth/view/AuthPanel';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { OptionCard } from '@/shared/ui/inputs/OptionCard';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';

export function WorkspaceStepPage() {
  const { t } = useTranslation(Namespace.Auth);
  const { t: tError } = useTranslation(Namespace.Errors);
  const navigate = useNavigate();
  const email = useCurrentUserEmail();
  const createWorkspace = useCreateWorkspace();
  const { logOut, leaving } = useLogOut();
  const serverErrors = useServerErrors(WORKSPACE_STEP_REASON_FIELDS);
  const [choice, setChoice] = useState(WorkspaceSetupChoice.Create);
  const form = useAppForm({
    defaultValues: EMPTY_WORKSPACE_STEP_VALUES,
    validators: {
      onSubmit: createWorkspaceStepSchema({ name: tError('reason.INVALID_WORKSPACE_NAME') }),
    },
    listeners: { onChange: ({ fieldApi }) => serverErrors.clearField(fieldApi.name) },
    onSubmit: async ({ value }) => {
      try {
        const workspaceId = await createWorkspace({
          name: value.name.trim(),
          timeZone: browserTimeZone(),
        });
        if (workspaceId !== null) {
          await navigate({ to: WORKSPACE_HOME_PATH, params: { workspaceId } });
        }
      } catch (error) {
        serverErrors.report(error);
      }
    },
  });
  const creating = choice === WorkspaceSetupChoice.Create;

  return (
    <AuthPanel
      title={t('workspaceStep.title')}
      subtitle={email === null ? null : t('workspaceStep.subtitle', { email })}
      footer={
        <>
          <Text as={TextElement.Span} kind={TextKind.BodySmall} color={TextColor.Mute}>
            {t('workspaceStep.notYou')}
          </Text>
          <Button
            variant={ButtonVariant.Ghost}
            size={ButtonSize.Sm}
            loading={leaving}
            onClick={() => void logOut()}
          >
            {t('workspaceStep.logout')}
          </Button>
        </>
      }
    >
      <AuthForm onSubmit={() => void form.handleSubmit()}>
        <div
          role="radiogroup"
          aria-label={t('workspaceStep.title')}
          className="flex flex-col gap-3"
        >
          <OptionCard
            name={WORKSPACE_SETUP_GROUP}
            value={WorkspaceSetupChoice.Create}
            checked={creating}
            onSelect={() => setChoice(WorkspaceSetupChoice.Create)}
            title={t('workspaceStep.create.title')}
            description={t('workspaceStep.create.description')}
          >
            {creating && (
              <form.AppField name={WorkspaceStepField.Name}>
                {(field) => (
                  <field.TextField
                    label={t('workspaceStep.create.name')}
                    autoComplete="organization"
                    error={serverErrors.fieldErrors[WorkspaceStepField.Name] ?? null}
                  />
                )}
              </form.AppField>
            )}
          </OptionCard>
          <OptionCard
            name={WORKSPACE_SETUP_GROUP}
            value={WorkspaceSetupChoice.Join}
            checked={!creating}
            onSelect={() => setChoice(WorkspaceSetupChoice.Join)}
            title={t('workspaceStep.join.title')}
            description={t('workspaceStep.join.description')}
          />
        </div>
        {serverErrors.formError !== null && (
          <Callout tone={CalloutTone.Err}>{serverErrors.formError}</Callout>
        )}
        <form.AppForm>
          <form.SubmitButton size={ButtonSize.Lg} fullWidth disabled={!creating}>
            {t('workspaceStep.submit')}
          </form.SubmitButton>
        </form.AppForm>
      </AuthForm>
    </AuthPanel>
  );
}
