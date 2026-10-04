import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NavGroup } from '@/shared/ui/NavGroup/NavGroup';

describe('NavGroup', () => {
  it('shows its label above the items', () => {
    render(
      <NavGroup label="Operate">
        <span>Inbox</span>
      </NavGroup>,
    );

    expect(screen.getByText('Operate')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
  });

  it('shows only the items without a label', () => {
    const { container } = render(
      <NavGroup>
        <span>Settings</span>
      </NavGroup>,
    );

    expect(container).toHaveTextContent(/^Settings$/);
  });
});
