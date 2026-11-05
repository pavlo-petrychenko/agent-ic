import { ErrorReason } from '@agent-ic/contracts';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateKnowledgeBaseTool } from '@/features/knowledge/communication/hooks/useUpdateKnowledgeBaseTool';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { EditKnowledgeBaseToolDialogProps } from '@/features/knowledge/containers/EditKnowledgeBaseToolDialog/EditKnowledgeBaseToolDialog.typedefs';
import { knowledgeToolSchema } from '@/features/knowledge/logic/schemas/knowledgeTool.schema';
import { RenameModal } from '@/features/knowledge/view/RenameModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Textarea } from '@/shared/ui/inputs/Textarea';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

interface FormErrors {
  readonly toolName: string | null;
  readonly toolDescription: string | null;
}

const NO_ERRORS: FormErrors = { toolName: null, toolDescription: null };

export function EditKnowledgeBaseToolDialog({
  knowledgeBase,
  attached,
  onClose,
}: EditKnowledgeBaseToolDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { updateKnowledgeBaseTool, updating } = useUpdateKnowledgeBaseTool();
  const [toolName, setToolName] = useState(knowledgeBase.toolName);
  const [toolDescription, setToolDescription] = useState(knowledgeBase.toolDescription ?? '');
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      knowledgeToolSchema({
        nameInvalid: t('agentAccess.nameInvalid'),
        nameReserved: t('agentAccess.nameReserved'),
        descriptionInvalid: t('agentAccess.descriptionInvalid'),
      }),
    [t],
  );

  const clearErrors = useCallback(() => {
    setErrors(NO_ERRORS);
    setFormError(null);
  }, []);

  const submit = useCallback(async () => {
    clearErrors();
    const parsed = schema.safeParse({
      [KnowledgeFormField.ToolName]: toolName,
      [KnowledgeFormField.ToolDescription]: toolDescription,
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        toolName: fieldErrors[KnowledgeFormField.ToolName]?.[0] ?? null,
        toolDescription: fieldErrors[KnowledgeFormField.ToolDescription]?.[0] ?? null,
      });
      return;
    }

    try {
      await updateKnowledgeBaseTool({
        id: knowledgeBase.id,
        toolName: parsed.data.toolName,
        toolDescription:
          parsed.data.toolDescription.length === 0 ? null : parsed.data.toolDescription,
      });
    } catch (failure) {
      const error = toAppError(failure);
      if (error.reason === ErrorReason.KnowledgeToolNameTaken) {
        setErrors({ ...NO_ERRORS, toolName: t('agentAccess.nameTaken') });
        return;
      }
      if (error.fields.some((field) => field.path === KnowledgeFormField.ToolName)) {
        setErrors({ ...NO_ERRORS, toolName: t('agentAccess.nameInvalid') });
        return;
      }
      if (error.fields.some((field) => field.path === KnowledgeFormField.ToolDescription)) {
        setErrors({ ...NO_ERRORS, toolDescription: t('agentAccess.descriptionInvalid') });
        return;
      }
      setFormError(errorMessage(error));
      return;
    }

    showToast({ message: t('agentAccess.saved'), tone: ToastTone.Ok });
    onClose();
  }, [
    clearErrors,
    errorMessage,
    knowledgeBase.id,
    onClose,
    schema,
    showToast,
    t,
    toolDescription,
    toolName,
    updateKnowledgeBaseTool,
  ]);

  return (
    <RenameModal
      title={t('agentAccess.editTitle')}
      description={
        attached ? t('agentAccess.editDescriptionAttached') : t('agentAccess.editDescription')
      }
      submitLabel={t('agentAccess.save')}
      submitting={updating}
      error={formError}
      onSubmit={() => void submit()}
      onClose={onClose}
    >
      <Field
        label={t('agentAccess.searchName')}
        hint={t('agentAccess.nameHint')}
        error={errors.toolName}
      >
        {(control) => (
          <Input
            {...control}
            mono
            autoComplete="off"
            value={toolName}
            onChange={(event) => {
              setToolName(event.target.value);
              clearErrors();
            }}
          />
        )}
      </Field>
      <Field
        label={t('agentAccess.description')}
        hint={t('agentAccess.descriptionHint')}
        error={errors.toolDescription}
      >
        {(control) => (
          <Textarea
            {...control}
            rows={4}
            value={toolDescription}
            onChange={(event) => {
              setToolDescription(event.target.value);
              clearErrors();
            }}
          />
        )}
      </Field>
    </RenameModal>
  );
}
