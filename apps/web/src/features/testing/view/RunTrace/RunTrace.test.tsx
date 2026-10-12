import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RunTrace } from '@/features/testing/view/RunTrace/RunTrace';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/features/testing/view/RunTrace/RunTrace.module.scss';

const DRAWING = {
  size: { x: 398, y: 144 },
  nodes: [],
  paths: [
    { id: 'waited', d: 'M97 36 V54', dashed: false },
    { id: 'background', d: 'M97 90 V108', dashed: true },
  ],
};

describe('RunTrace', () => {
  it('draws a background branch edge dashed and a waited one solid', () => {
    const { container } = render(<RunTrace drawing={DRAWING} onSelectNode={vi.fn<() => void>()} />);
    const [waited, background] = Array.from(container.querySelectorAll('path'));

    expect(background).toHaveClass(cssClass(styles.dashed));
    expect(waited).not.toHaveClass(cssClass(styles.dashed));
  });
});
