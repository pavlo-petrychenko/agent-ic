import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkeletonTone } from '@/shared/ui/display/Skeleton/Skeleton.constants';
import { SkeletonBox } from '@/shared/ui/display/SkeletonBox/SkeletonBox';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/display/SkeletonBox/SkeletonBox.module.scss';

const renderBox = (tone?: SkeletonTone) => {
  const { container } = render(<SkeletonBox width="70px" height="18px" tone={tone} />);
  const box = container.firstElementChild;
  if (box === null) {
    throw new Error('box not rendered');
  }
  return box;
};

describe('SkeletonBox', () => {
  it('has the given size and is hidden from assistive technology', () => {
    const box = renderBox();

    expect(box).toHaveStyle({ width: '70px', height: '18px' });
    expect(box).toHaveAttribute('aria-hidden', 'true');
  });

  it('is soft unless the tone says otherwise', () => {
    expect(renderBox()).toHaveClass(cssClass(styles.soft));
    expect(renderBox(SkeletonTone.Strong)).toHaveClass(cssClass(styles.strong));
  });
});
