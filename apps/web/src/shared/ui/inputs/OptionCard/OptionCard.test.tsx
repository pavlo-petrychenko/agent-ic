import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OptionCard } from '@/shared/ui/inputs/OptionCard/OptionCard';

describe('OptionCard', () => {
  it('selects its value when the title is clicked', async () => {
    const onSelect = vi.fn<(value: string) => void>();
    render(
      <OptionCard
        name="setup"
        value="join"
        checked={false}
        onSelect={onSelect}
        title="Join an existing one"
        description="Ask for an invite link"
      />,
    );

    await userEvent.click(screen.getByText('Join an existing one'));

    expect(onSelect).toHaveBeenCalledWith('join');
  });

  it('shows its content and reports the checked state', () => {
    render(
      <OptionCard
        name="setup"
        value="create"
        checked
        onSelect={vi.fn<(value: string) => void>()}
        title="Create"
      >
        <span>Name field</span>
      </OptionCard>,
    );

    expect(screen.getByRole('radio', { name: 'Create' })).toBeChecked();
    expect(screen.getByText('Name field')).toBeInTheDocument();
  });
});
