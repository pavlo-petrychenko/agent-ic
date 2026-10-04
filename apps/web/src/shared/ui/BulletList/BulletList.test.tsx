import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BulletList } from '@/shared/ui/BulletList/BulletList';

describe('BulletList', () => {
  it('renders a native list with one item per entry', () => {
    render(<BulletList items={['First', 'Second', 'Third']} />);

    const list = screen.getByRole('list');
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['First', 'Second', 'Third']);
  });

  it('renders rich items such as links', () => {
    render(
      <BulletList
        items={[
          <a key="guide" href="/docs">
            Guide
          </a>,
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Guide' })).toHaveAttribute('href', '/docs');
  });

  it('renders an empty list without items', () => {
    render(<BulletList items={[]} />);

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('passes native attributes through', () => {
    render(<BulletList items={['One']} aria-label="Changes" />);

    expect(screen.getByRole('list', { name: 'Changes' })).toBeInTheDocument();
  });
});
