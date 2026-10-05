import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AvatarProps } from '@/shared/ui/display/Avatar/Avatar.typedefs';
import { AvatarStack } from '@/shared/ui/display/AvatarStack/AvatarStack';

const PEOPLE: AvatarProps[] = [
  { initials: 'AB', name: 'Ada B' },
  { initials: 'CD', name: 'Cy D' },
  { initials: 'EF', name: 'Eli F' },
  { initials: 'GH', name: 'Gus H' },
  { initials: 'IJ', name: 'Ida J' },
];

describe('AvatarStack', () => {
  it('shows every avatar when they fit', () => {
    render(<AvatarStack avatars={PEOPLE.slice(0, 2)} max={3} />);

    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it('collapses the rest into a count chip', () => {
    render(<AvatarStack avatars={PEOPLE} max={3} />);

    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('shows no chip when the count equals the maximum', () => {
    render(<AvatarStack avatars={PEOPLE.slice(0, 3)} max={3} />);

    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it('keeps the first avatars in order', () => {
    render(<AvatarStack avatars={PEOPLE} max={2} />);

    expect(screen.getByRole('img', { name: 'Ada B' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Cy D' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Eli F' })).toBeNull();
  });

  it('draws every avatar small', () => {
    render(<AvatarStack avatars={PEOPLE.slice(0, 1)} />);

    expect(screen.getByRole('img', { name: 'Ada B' }).className).toMatch(/sm/);
  });

  it('shows up to three avatars by default', () => {
    render(<AvatarStack avatars={PEOPLE} />);

    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
