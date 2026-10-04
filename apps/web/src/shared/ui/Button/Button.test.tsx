import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MouseEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '@/shared/ui/Button/Button';
import { ButtonSize, ButtonVariant } from '@/shared/ui/Button/Button.constants';
import { IconName } from '@/shared/ui/Icon';

describe('Button', () => {
  it('calls onClick when pressed', async () => {
    const onClick = vi.fn<() => void>();
    render(<Button onClick={onClick}>Save</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults to type button so it never submits a form by accident', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('ignores presses and reports busy while loading, keeping its label', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    await userEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('[data-icon="spinner"]')).not.toBeNull();
  });

  it('replaces the leading icon with a spinner while loading', () => {
    const { rerender } = render(<Button icon={IconName.Plus}>Add</Button>);

    expect(
      screen.getByRole('button', { name: 'Add' }).querySelector('[data-icon="plus"]'),
    ).not.toBeNull();

    rerender(
      <Button icon={IconName.Plus} loading>
        Add
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Add' });
    expect(button.querySelector('[data-icon="plus"]')).toBeNull();
    expect(button.querySelector('[data-icon="spinner"]')).not.toBeNull();
  });

  it('does not press when disabled', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('accepts every variant and size without changing its role', () => {
    render(
      <>
        {Object.values(ButtonVariant).map((variant) =>
          Object.values(ButtonSize).map((size) => (
            <Button key={`${variant}-${size}`} variant={variant} size={size}>
              {`${variant} ${size}`}
            </Button>
          )),
        )}
      </>,
    );

    expect(screen.getAllByRole('button')).toHaveLength(
      Object.values(ButtonVariant).length * Object.values(ButtonSize).length,
    );
  });

  it('renders an anchor when given an href', () => {
    render(<Button href="/docs">Docs</Button>);

    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
  });

  it('keeps a disabled link out of the tab order and ignores its clicks', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <Button href="/docs" disabled onClick={onClick}>
        Docs
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Docs' });
    await userEvent.click(link);

    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls onClick on an enabled link', async () => {
    const onClick = vi.fn<(event: MouseEvent<HTMLAnchorElement>) => void>((event) =>
      event.preventDefault(),
    );
    render(
      <Button href="/docs" onClick={onClick}>
        Docs
      </Button>,
    );

    await userEvent.click(screen.getByRole('link', { name: 'Docs' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
