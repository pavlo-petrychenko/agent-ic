import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaneBar } from '@/shared/ui/PaneBar/PaneBar';
import { PaneBarEdge, PaneBarTone } from '@/shared/ui/PaneBar/PaneBar.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/PaneBar/PaneBar.module.scss';

describe('PaneBar', () => {
  it('holds whatever the pane puts in it', () => {
    render(
      <PaneBar>
        <button type="button">Send</button>
      </PaneBar>,
    );

    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('draws its border on the top edge unless told to sit at the bottom', () => {
    const { rerender } = render(<PaneBar data-testid="bar">x</PaneBar>);
    expect(screen.getByTestId('bar')).toHaveClass(cssClass(styles.top));

    rerender(
      <PaneBar data-testid="bar" edge={PaneBarEdge.Bottom}>
        x
      </PaneBar>,
    );
    expect(screen.getByTestId('bar')).toHaveClass(cssClass(styles.bottom));
  });

  it('applies the tone, row layout, soft line and bottom anchoring it was asked for', () => {
    render(
      <PaneBar data-testid="bar" tone={PaneBarTone.White} row softLine push>
        x
      </PaneBar>,
    );

    const bar = screen.getByTestId('bar');
    expect(bar).toHaveClass(cssClass(styles.white));
    expect(bar).toHaveClass(cssClass(styles.row));
    expect(bar).toHaveClass(cssClass(styles.soft));
    expect(bar).toHaveClass(cssClass(styles.push));
  });

  it('passes accessibility attributes through to the bar', () => {
    render(<PaneBar aria-label="Reply bar">x</PaneBar>);

    expect(screen.getByLabelText('Reply bar')).toHaveTextContent('x');
  });
});
