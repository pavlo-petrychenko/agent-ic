import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/shared/forms/contexts/form.context';
import { PasswordField } from '@/shared/forms/fields/PasswordField';
import { SubmitButton } from '@/shared/forms/fields/SubmitButton';
import { TextField } from '@/shared/forms/fields/TextField';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, PasswordField },
  formComponents: { SubmitButton },
});
