import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ReadonlyValue } from '@/shared/ui/inputs/ReadonlyValue/ReadonlyValue';
import { VariableChip } from '@/shared/ui/inputs/VariableChip/VariableChip';

describe('ReadonlyValue', () => {
  it('shows plain text', () => {
    render(<ReadonlyValue>Returns the open slots for a day</ReadonlyValue>);

    expect(screen.getByText('Returns the open slots for a day')).toBeInTheDocument();
  });

  it('shows variable chips inline', () => {
    render(
      <ReadonlyValue mono>
        /v1/bookings/
        <VariableChip path="event.output.booking_id" />
      </ReadonlyValue>,
    );

    expect(screen.getByText('{{event.output.booking_id}}')).toBeInTheDocument();
  });

  it('is not an editable control', () => {
    render(<ReadonlyValue>GET</ReadonlyValue>);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('copies the given text when a copy label is set', async () => {
    const user = userEvent.setup();
    render(
      <ReadonlyValue copyText="/v1/bookings/42" copyLabel="Copy value">
        /v1/bookings/42
      </ReadonlyValue>,
    );

    await user.click(screen.getByRole('button', { name: 'Copy value' }));

    expect(await navigator.clipboard.readText()).toBe('/v1/bookings/42');
  });

  it('has no copy button without a label', () => {
    render(<ReadonlyValue copyText="GET">GET</ReadonlyValue>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
