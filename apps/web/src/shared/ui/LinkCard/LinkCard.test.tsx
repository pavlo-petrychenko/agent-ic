import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LinkCard } from '@/shared/ui/LinkCard/LinkCard';

describe('LinkCard', () => {
  it('is one link named by its title', () => {
    render(<LinkCard href="/knowledge/faq" title="FAQ from documents" description="Answers" />);

    const link = screen.getByRole('link', { name: /^FAQ from documents/ });
    expect(link).toHaveAttribute('href', '/knowledge/faq');
  });

  it('omits the description when it is null', () => {
    render(<LinkCard href="/x" title="Only a title" description={null} />);

    expect(screen.getByRole('link')).toHaveTextContent(/^Only a title$/);
  });

  it('keeps the tile decorative', () => {
    render(<LinkCard href="/x" title="Title" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('is announced as disabled and loses its destination', () => {
    render(<LinkCard href="/x" title="Title" disabled />);

    const link = screen.getByRole('link', { name: 'Title' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).not.toHaveAttribute('href');
  });

  it('is not marked disabled by default', () => {
    render(<LinkCard href="/x" title="Title" />);

    expect(screen.getByRole('link')).not.toHaveAttribute('aria-disabled');
  });
});
