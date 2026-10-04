import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from '@/shared/ui/Avatar/Avatar';

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

  it('shows the image instead of the initials', () => {
    const { container } = render(<Avatar initials="PP" src="/me.png" />);

    expect(container.querySelector('img')).toHaveAttribute('src', '/me.png');
    expect(screen.queryByText('PP')).toBeNull();
  });

  it('falls back to the initials when the image fails to load', () => {
    const { container } = render(<Avatar initials="PP" src="/missing.png" />);

    const image = container.querySelector('img');
    expect(image).not.toBeNull();
    if (image !== null) {
      fireEvent.error(image);
    }

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('PP')).toBeInTheDocument();
  });

  it('tries a new image after a failed one', () => {
    const { container, rerender } = render(<Avatar initials="PP" src="/missing.png" />);
    const image = container.querySelector('img');
    if (image !== null) {
      fireEvent.error(image);
    }

    rerender(<Avatar initials="PP" src="/found.png" />);

    expect(container.querySelector('img')).toHaveAttribute('src', '/found.png');
  });
});
