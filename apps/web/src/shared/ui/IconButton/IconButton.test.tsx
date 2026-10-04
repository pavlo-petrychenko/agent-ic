import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconName } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton/IconButton';
import { IconButtonSize, IconButtonVariant } from '@/shared/ui/IconButton/IconButton.constants';

describe('IconButton', () => {
  it('is named by its label and shows the icon', () => {
    render(<IconButton icon={IconName.More} label="More actions" />);

    const button = screen.getByRole('button', { name: 'More actions' });
    expect(button.querySelector('[data-icon="more"]')).not.toBeNull();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn<() => void>();
    render(<IconButton icon={IconName.Plus} label="Add" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not press when disabled', async () => {
    const onClick = vi.fn<() => void>();
    render(<IconButton icon={IconName.Plus} label="Add" disabled onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows a spinner, reports busy and ignores presses while loading', async () => {
    const onClick = vi.fn<() => void>();
    render(<IconButton icon={IconName.Send} label="Send" loading onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Send' });
    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('[data-icon="spinner"]')).not.toBeNull();
    expect(button.querySelector('[data-icon="send"]')).toBeNull();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('accepts every variant and size without changing its role', () => {
    render(
      <>
        {Object.values(IconButtonVariant).map((variant) =>
          Object.values(IconButtonSize).map((size) => (
            <IconButton
              key={`${variant}-${size}`}
              icon={IconName.Plus}
              label={`${variant} ${size}`}
              variant={variant}
              size={size}
            />
          )),
        )}
      </>,
    );

    expect(screen.getAllByRole('button')).toHaveLength(
      Object.values(IconButtonVariant).length * Object.values(IconButtonSize).length,
    );
  });

  it('renders an anchor named by its label when given an href', () => {
    render(<IconButton icon={IconName.ChevronRight} label="Open" href="/next" />);

    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/next');
  });

  it('keeps a disabled link out of the tab order and ignores its clicks', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <IconButton
        icon={IconName.ChevronRight}
        label="Open"
        href="/next"
        disabled
        onClick={onClick}
      />,
    );

    const link = screen.getByRole('link', { name: 'Open' });
    await userEvent.click(link);

    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(onClick).not.toHaveBeenCalled();
  });
});
