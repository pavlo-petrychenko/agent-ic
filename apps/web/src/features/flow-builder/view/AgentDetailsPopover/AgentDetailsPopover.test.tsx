import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { AgentDetails } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';
import { AgentDetailsPopover } from '@/features/flow-builder/view/AgentDetailsPopover/AgentDetailsPopover';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const DETAILS: AgentDetails = { name: 'Salon assistant', description: 'Books visits' };

function Harness({ onSave }: { onSave: (details: AgentDetails) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <AgentDetailsPopover
      details={DETAILS}
      open={open}
      saving={false}
      onOpenChange={setOpen}
      onSave={onSave}
    />
  );
}

const openDetails = async () => {
  const onSave = vi.fn<(details: AgentDetails) => void>();
  renderWithProviders(<Harness onSave={onSave} />);
  await userEvent.click(screen.getByRole('button', { name: 'Salon assistant' }));
  return onSave;
};

describe('AgentDetailsPopover', () => {
  it('opens with the current name and description', async () => {
    await openDetails();

    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue(DETAILS.name);
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(DETAILS.description);
  });

  it('saves the edited details when Enter is pressed in the name', async () => {
    const onSave = await openDetails();

    const name = screen.getByRole('textbox', { name: /Name/ });
    await userEvent.clear(name);
    await userEvent.type(name, 'Front desk{Enter}');

    expect(onSave).toHaveBeenCalledWith({ name: 'Front desk', description: DETAILS.description });
  });

  it('saves a cleared description from the Save button', async () => {
    const onSave = await openDetails();

    await userEvent.clear(screen.getByRole('textbox', { name: 'Description' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith({ name: DETAILS.name, description: '' });
  });

  it('keeps Save off while the name is blank', async () => {
    await openDetails();

    await userEvent.clear(screen.getByRole('textbox', { name: /Name/ }));

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('closes without saving on Cancel and on Escape', async () => {
    const onSave = await openDetails();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Agent details' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Salon assistant' }));
    expect(screen.getByRole('dialog', { name: 'Agent details' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Agent details' })).toBeNull();
    expect(onSave).not.toHaveBeenCalled();
  });
});
