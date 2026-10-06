import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NarrowScreenNotice } from '@/shared/ui/layout/NarrowScreenNotice/NarrowScreenNotice';

describe('NarrowScreenNotice', () => {
  it('is the main landmark with the title as its only heading and the description', () => {
    render(
      <NarrowScreenNotice
        title="Open on a wider screen"
        description="Agents needs a window at least 1024 pixels wide."
      />,
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Open on a wider screen' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Agents needs a window at least 1024 pixels wide.'),
    ).toBeInTheDocument();
  });

  it('leaves out the description when it is not given one', () => {
    const { container } = render(<NarrowScreenNotice title="Open on a wider screen" />);

    expect(container.querySelector('p')).toBeNull();
  });

  it('hides the decorative logo mark from assistive technology', () => {
    const { container } = render(<NarrowScreenNotice title="Open on a wider screen" />);

    expect(container.querySelector('[aria-hidden="true"] [data-icon="logo"]')).toBeInTheDocument();
  });
});
