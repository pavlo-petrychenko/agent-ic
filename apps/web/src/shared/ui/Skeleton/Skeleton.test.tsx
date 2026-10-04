import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { SKELETON_DEFAULT_LINES, SkeletonBarSize } from '@/shared/ui/Skeleton/Skeleton.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/Skeleton/Skeleton.module.scss';

const getBars = (container: HTMLElement) => container.querySelectorAll('[aria-hidden="true"]');

describe('Skeleton', () => {
  it('announces a busy status with the given label', () => {
    render(<Skeleton label="Loading" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading');
  });

  it('hides every bar from assistive technology', () => {
    const { container } = render(<Skeleton label="Loading" />);

    expect(getBars(container)).toHaveLength(SKELETON_DEFAULT_LINES.length);
  });

  it('renders the requested lines with their widths and sizes', () => {
    const { container } = render(
      <Skeleton
        label="Loading"
        lines={[
          { width: '40%', size: SkeletonBarSize.Title },
          { width: '90%', size: SkeletonBarSize.Text },
        ]}
      />,
    );

    const [title, text] = Array.from(getBars(container));
    expect(title).toHaveStyle({ width: '40%' });
    expect(title).toHaveClass(cssClass(styles.title));
    expect(text).toHaveStyle({ width: '90%' });
    expect(text).toHaveClass(cssClass(styles.text));
  });

  it('fills the available width unless a width is given', () => {
    const { rerender } = render(<Skeleton label="Loading" />);
    expect(screen.getByRole('status')).toHaveStyle({ width: '100%' });

    rerender(<Skeleton label="Loading" width="160px" />);
    expect(screen.getByRole('status')).toHaveStyle({ width: '160px' });
  });
});
