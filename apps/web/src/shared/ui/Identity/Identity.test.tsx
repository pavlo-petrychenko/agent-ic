import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Identity } from '@/shared/ui/Identity/Identity';
import { IdentitySize } from '@/shared/ui/Identity/Identity.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/Identity/Identity.module.scss';

describe('Identity', () => {
  it('shows the lead, the name and the sub line', () => {
    render(<Identity name="Anna Kovalenko" sub="Telegram" lead={<span>AK</span>} />);

    expect(screen.getByText('AK')).toBeInTheDocument();
    expect(screen.getByText('Anna Kovalenko')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
  });

  it('omits the sub line when it is null', () => {
    const { container } = render(<Identity name="Anna" sub={null} lead={<span>A</span>} />);

    expect(container.querySelector(`.${cssClass(styles.sub)}`)).toBeNull();
  });

  it('exposes the full text as a title for truncation', () => {
    render(<Identity name="A very long agent name" sub="Booking assistant v6" lead={null} />);

    expect(screen.getByText('A very long agent name')).toHaveAttribute(
      'title',
      'A very long agent name',
    );
    expect(screen.getByText('Booking assistant v6')).toHaveAttribute(
      'title',
      'Booking assistant v6',
    );
  });

  it('defaults to the md size and accepts sm', () => {
    const { rerender } = render(<Identity name="Name" lead={null} data-testid="root" />);
    expect(screen.getByTestId('root')).toHaveClass(cssClass(styles.md));

    rerender(<Identity name="Name" lead={null} size={IdentitySize.Sm} data-testid="root" />);
    expect(screen.getByTestId('root')).toHaveClass(cssClass(styles.sm));
  });
});
