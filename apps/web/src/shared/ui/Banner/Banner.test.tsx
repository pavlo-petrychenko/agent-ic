import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Banner } from '@/shared/ui/Banner/Banner';
import { BannerTone } from '@/shared/ui/Banner/Banner.constants';
import { IconName } from '@/shared/ui/Icon/Icon.constants';

describe('Banner', () => {
  it('announces info and warn banners politely', () => {
    const { rerender } = render(<Banner tone={BannerTone.Info}>Taken over</Banner>);
    expect(screen.getByRole('status')).toHaveTextContent('Taken over');

    rerender(<Banner tone={BannerTone.Warn}>Unpublished</Banner>);
    expect(screen.getByRole('status')).toHaveTextContent('Unpublished');
  });

  it('announces an error banner as an alert', () => {
    render(<Banner tone={BannerTone.Err}>Disconnected</Banner>);

    expect(screen.getByRole('alert')).toHaveTextContent('Disconnected');
  });

  it('shows the default icon of its tone, hidden from assistive technology', () => {
    const { container } = render(<Banner tone={BannerTone.Warn}>Unpublished</Banner>);

    expect(container.querySelector('[data-icon="alert"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows a custom icon, or none', () => {
    const { container, rerender } = render(<Banner icon={IconName.Info}>Hello</Banner>);
    expect(container.querySelector('[data-icon="info"]')).toBeInTheDocument();

    rerender(<Banner icon={null}>Hello</Banner>);
    expect(container.querySelector('svg')).toBeNull();
  });
});
