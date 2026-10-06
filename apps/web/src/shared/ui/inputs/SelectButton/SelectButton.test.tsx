import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SelectButton } from '@/shared/ui/inputs/SelectButton/SelectButton';
import type { MenuItem } from '@/shared/ui/overlays/Menu';

const OPTIONS: readonly MenuItem[] = [
  { id: 'crm', label: 'Salon CRM', hint: 'live' },
  { id: 'erp', label: 'Booking ERP', hint: 'draft' },
];

function Picker({ onSelect }: { onSelect: (id: string) => void }) {
  const [selected, setSelected] = useState('crm');
  return (
    <SelectButton
      value="Salon CRM"
      label="Connection"
      options={OPTIONS}
      selectedId={selected}
      menuLabel="Connections"
      onSelect={(id) => {
        setSelected(id);
        onSelect(id);
      }}
    />
  );
}

describe('SelectButton', () => {
  it('shows the value and the context', () => {
    render(<SelectButton value="Salon CRM" context="api.salon.example" />);

    expect(screen.getByRole('button', { name: 'Salon CRM api.salon.example' })).toHaveAttribute(
      'aria-haspopup',
      'listbox',
    );
  });

  it('shows the label inside the control', () => {
    render(<SelectButton value="Salon assistant" label="Agent" />);

    expect(screen.getByRole('button', { name: 'Agent Salon assistant' })).toBeInTheDocument();
  });

  it('reports a click and its open state when it is only a trigger', async () => {
    const onClick = vi.fn<() => void>();
    const { rerender } = render(<SelectButton value="GET" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'GET' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'GET' })).toHaveAttribute('aria-expanded', 'false');

    rerender(<SelectButton value="GET" open onClick={onClick} />);

    expect(screen.getByRole('button', { name: 'GET' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens a listbox and selects an option', async () => {
    const onSelect = vi.fn<(id: string) => void>();
    render(<Picker onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Connection Salon CRM' }));

    expect(screen.getByRole('listbox', { name: 'Connections' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Salon CRM/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await userEvent.click(screen.getByRole('option', { name: /Booking ERP/ }));

    expect(onSelect).toHaveBeenCalledWith('erp');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('moves focus into the listbox when it opens and closes it on Escape', async () => {
    render(<Picker onSelect={vi.fn<(id: string) => void>()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Connection Salon CRM' }));

    expect(screen.getByRole('option', { name: /Salon CRM/ })).toHaveFocus();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows the error message and describes the control with it', () => {
    render(<SelectButton value="CRM_TOKEN" error="Pick a secret" />);

    expect(screen.getByRole('button', { name: 'CRM_TOKEN' })).toHaveAccessibleDescription(
      'Pick a secret',
    );
  });

  it('cannot be used when disabled', async () => {
    const onClick = vi.fn<() => void>();
    render(<SelectButton value="GET" disabled onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'GET' }));

    expect(screen.getByRole('button', { name: 'GET' })).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
