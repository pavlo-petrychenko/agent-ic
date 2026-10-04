import { createFormHook } from '@tanstack/react-form';

import { PasswordField } from './fields/PasswordField';
import { SubmitButton } from './fields/SubmitButton';
import { TextField } from './fields/TextField';
import { fieldContext, formContext } from './formContext';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, PasswordField },
  formComponents: { SubmitButton },
});
