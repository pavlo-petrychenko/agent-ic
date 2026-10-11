import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/shared/forms/contexts/form.context';
import { ComboboxField } from '@/shared/forms/fields/ComboboxField';
import { PasswordField } from '@/shared/forms/fields/PasswordField';
import { SubmitButton } from '@/shared/forms/fields/SubmitButton';
import { TextField } from '@/shared/forms/fields/TextField';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, PasswordField, ComboboxField },
  formComponents: { SubmitButton },
});
