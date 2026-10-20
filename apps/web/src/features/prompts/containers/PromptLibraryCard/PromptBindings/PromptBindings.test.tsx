import type { PromptBindings as PromptBindingsMap } from '@agent-ic/flow';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PromptBindings } from '@/features/prompts/containers/PromptLibraryCard/PromptBindings';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const OPTIONS = [
  { id: 'user.name', label: 'user.name', group: 'User' },
  { id: 'message.text', label: 'message.text', group: 'Message' },
];

const renderBindings = (bindings: PromptBindingsMap) => {
  const onChange = vi.fn<(next: PromptBindingsMap) => void>();
  renderWithProviders(
    <PromptBindings
      paths={['customer_name']}
      options={OPTIONS}
      bindings={bindings}
      onChange={onChange}
    />,
  );
  return onChange;
};

describe('PromptBindings', () => {
  it('shows a prompt variable and asks for a flow variable', () => {
    renderBindings({});

    expect(screen.getByText('{{customer_name}}')).toBeVisible();
    expect(screen.getByText('This step fills each prompt variable from its flow.')).toBeVisible();
    expect(screen.getByText('Choose a variable for this prompt variable.')).toBeVisible();
  });

  it('writes the selected flow variable', async () => {
    const onChange = renderBindings({});

    await userEvent.click(screen.getByRole('button', { name: 'Variable for customer_name' }));
    await userEvent.click(screen.getByRole('button', { name: 'user.name · User' }));

    expect(onChange).toHaveBeenCalledWith({ customer_name: 'user.name' });
  });

  it('keeps an existing binding selected', () => {
    renderBindings({ customer_name: 'message.text' });

    expect(screen.getByRole('button', { name: 'Variable for customer_name' })).toHaveTextContent(
      'message.text',
    );
  });

  it('reports a binding that the step no longer has', () => {
    renderBindings({ customer_name: 'old.name' });

    expect(screen.getByText('This variable is not available in this step.')).toBeVisible();
  });
});
