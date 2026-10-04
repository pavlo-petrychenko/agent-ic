import { createFormHook } from '@tanstack/react-form';
import { PasswordField } from '@/shared/forms/fields/PasswordField';
import { SubmitButton } from '@/shared/forms/fields/SubmitButton';
import { TextField } from '@/shared/forms/fields/TextField';
import { fieldContext, formContext } from '@/shared/forms/formContext';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, PasswordField },
  formComponents: { SubmitButton },
});
