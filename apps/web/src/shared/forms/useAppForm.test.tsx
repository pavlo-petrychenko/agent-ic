import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { useAppForm } from './useAppForm';

const schema = z.object({
  email: z.email('Enter a valid email'),
});

interface SignInFormProps {
  onSubmit: (email: string) => void;
}

function SignInForm({ onSubmit }: SignInFormProps) {
  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onChange: schema },
    onSubmit: ({ value }) => onSubmit(value.email),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="email">{(field) => <field.TextField label="Email" />}</form.AppField>
      <form.AppForm>
        <form.SubmitButton>Continue</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}

describe('useAppForm', () => {
  it('shows the schema message and does not submit an invalid value', async () => {
    const onSubmit = vi.fn<(email: string) => void>();
    render(<SignInForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the typed value once it is valid', async () => {
    const onSubmit = vi.fn<(email: string) => void>();
    render(<SignInForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'ada@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onSubmit).toHaveBeenCalledWith('ada@example.com');
  });
});
