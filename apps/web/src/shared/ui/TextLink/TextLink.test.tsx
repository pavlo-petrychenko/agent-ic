import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextLink } from '@/shared/ui/TextLink/TextLink';
import { MemoryRouter } from '@test/support/components/MemoryRouter';

describe('TextLink', () => {
  it('renders an anchor that points at the route', async () => {
    render(
      <MemoryRouter>
        <TextLink to="/">Status</TextLink>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'Status' })).toHaveAttribute('href', '/');
  });

  it('marks a link opening a new tab as noopener', async () => {
    render(
      <MemoryRouter>
        <TextLink to="/" target="_blank">
          Docs
        </TextLink>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'Docs' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  it('keeps an explicit rel on a link opening a new tab', async () => {
    render(
      <MemoryRouter>
        <TextLink to="/" target="_blank" rel="author">
          Docs
        </TextLink>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'Docs' })).toHaveAttribute('rel', 'author');
  });

  it('exposes a disabled link as aria-disabled', async () => {
    render(
      <MemoryRouter>
        <TextLink to="/" disabled>
          Status
        </TextLink>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'Status' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
