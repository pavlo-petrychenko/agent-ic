import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from '@/shared/ui/Avatar/Avatar';
import { StatusKind } from '@/shared/ui/StatusDot/StatusDot.constants';

function getImage(container: HTMLElement): HTMLImageElement {
  const image = container.querySelector('img');
  if (image === null) {
    throw new Error('Expected the avatar to render an image');
  }
  return image;
}

describe('Avatar', () => {
  it('is an image named by the name prop', () => {
    render(<Avatar initials="PP" name="Pavlo Petrenko" />);

    expect(screen.getByRole('img', { name: 'Pavlo Petrenko' })).toHaveTextContent('PP');
  });

  it('is hidden from assistive technology without a name', () => {
    render(<Avatar initials="PP" />);

    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('PP')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the initials while the image is loading', () => {
    const { container } = render(<Avatar initials="PP" src="/me.png" />);

    expect(getImage(container)).toHaveAttribute('src', '/me.png');
    expect(screen.getByText('PP')).toBeInTheDocument();
  });

  it('shows the image instead of the initials once it has loaded', () => {
    const { container } = render(<Avatar initials="PP" src="/me.png" />);

    fireEvent.load(getImage(container));

    expect(getImage(container)).toHaveAttribute('src', '/me.png');
    expect(screen.queryByText('PP')).toBeNull();
  });

  it('falls back to the initials when the image fails to load', () => {
    const { container } = render(<Avatar initials="PP" src="/missing.png" />);

    fireEvent.error(getImage(container));

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('PP')).toBeInTheDocument();
  });

  it('tries a new image after a failed one', () => {
    const { container, rerender } = render(<Avatar initials="PP" src="/missing.png" />);
    fireEvent.error(getImage(container));

    rerender(<Avatar initials="PP" src="/found.png" />);

    expect(getImage(container)).toHaveAttribute('src', '/found.png');
  });

  it('shows the initials again when a new image is still loading', () => {
    const { container, rerender } = render(<Avatar initials="PP" src="/first.png" />);
    fireEvent.load(getImage(container));

    rerender(<Avatar initials="PP" src="/second.png" />);

    expect(screen.getByText('PP')).toBeInTheDocument();
  });

  it('draws no status dot by default', () => {
    const { container } = render(<Avatar initials="PP" />);

    expect(container.querySelector('[data-kind]')).toBeNull();
  });

  it.each(Object.values(StatusKind))('draws a %s status dot', (status) => {
    const { container } = render(<Avatar initials="PP" status={status} />);

    expect(container.querySelector(`[data-kind="${status}"]`)).toBeInTheDocument();
  });
});
