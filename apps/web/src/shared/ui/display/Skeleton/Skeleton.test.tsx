import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Skeleton } from '@/shared/ui/display/Skeleton/Skeleton';
import {
  SKELETON_DEFAULT_LINES,
  SKELETON_DELAY_MS,
  SkeletonBarHeight,
  SkeletonTone,
} from '@/shared/ui/display/Skeleton/Skeleton.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/display/Skeleton/Skeleton.module.scss';

const getBars = (container: HTMLElement) => container.querySelectorAll('[aria-hidden="true"]');

const elapse = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Skeleton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing until the delay has passed', () => {
    const { container } = render(<Skeleton label="Loading" />);

    elapse(SKELETON_DELAY_MS - 1);
    expect(container).toBeEmptyDOMElement();

    elapse(1);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('announces a busy status with the given label', () => {
    render(<Skeleton label="Loading" />);
    elapse(SKELETON_DELAY_MS);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading');
  });

  it('hides every bar from assistive technology', () => {
    const { container } = render(<Skeleton label="Loading" />);
    elapse(SKELETON_DELAY_MS);

    expect(getBars(container)).toHaveLength(SKELETON_DEFAULT_LINES.length);
  });

  it('renders the requested lines with their widths, heights and tones', () => {
    const { container } = render(
      <Skeleton
        label="Loading"
        lines={[
          { width: '40%', height: SkeletonBarHeight.Heading, tone: SkeletonTone.Strong },
          { width: '90%', height: SkeletonBarHeight.Hairline, tone: SkeletonTone.Soft },
        ]}
      />,
    );
    elapse(SKELETON_DELAY_MS);

    const [strong, soft] = Array.from(getBars(container));
    expect(strong).toHaveStyle({ width: '40%', height: '14px' });
    expect(strong).toHaveClass(cssClass(styles.strong));
    expect(soft).toHaveStyle({ width: '90%', height: '7px' });
    expect(soft).toHaveClass(cssClass(styles.soft));
  });

  it('fills the available width unless a width is given', () => {
    const { rerender } = render(<Skeleton label="Loading" />);
    elapse(SKELETON_DELAY_MS);
    expect(screen.getByRole('status')).toHaveStyle({ width: '100%' });

    rerender(<Skeleton label="Loading" width="160px" />);
    expect(screen.getByRole('status')).toHaveStyle({ width: '160px' });
  });
});
