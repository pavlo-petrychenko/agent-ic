import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Panel } from '@/shared/ui/Panel/Panel';
import { PanelSide, PanelTone } from '@/shared/ui/Panel/Panel.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/Panel/Panel.module.scss';

describe('Panel', () => {
  it('is a labelled complementary region with its title, right slot, body and footer', () => {
    render(
      <Panel
        ariaLabel="Chat details"
        title="Details"
        headRight={<button type="button">Edit</button>}
        footer={<p>Updated just now</p>}
      >
        <p>Started 3 minutes ago</p>
      </Panel>,
    );

    const region = screen.getByRole('complementary', { name: 'Chat details' });
    expect(region).toContainElement(screen.getByRole('heading', { level: 3, name: 'Details' }));
    expect(region).toContainElement(screen.getByRole('button', { name: 'Edit' }));
    expect(region).toHaveTextContent('Started 3 minutes ago');
    expect(region).toHaveTextContent('Updated just now');
  });

  it('leaves out the head and footer when it has no title, right slot or footer', () => {
    render(<Panel ariaLabel="Empty">Body</Panel>);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveTextContent('Body');
  });

  it('applies the tone and the border side', () => {
    render(
      <Panel ariaLabel="Pane" tone={PanelTone.White} side={PanelSide.Left}>
        Body
      </Panel>,
    );

    const region = screen.getByRole('complementary');
    expect(region).toHaveClass(cssClass(styles['tone-white']));
    expect(region).toHaveClass(cssClass(styles['side-left']));
  });

  it('defaults to the panel tone with no border and fills the height', () => {
    render(<Panel ariaLabel="Pane">Body</Panel>);

    const region = screen.getByRole('complementary');
    expect(region).toHaveClass(cssClass(styles['tone-panel']));
    expect(region).toHaveClass(cssClass(styles['side-none']));
    expect(region).not.toHaveClass(cssClass(styles.inline));
  });

  it('sizes to its content when inline', () => {
    render(
      <Panel ariaLabel="Pane" inline>
        Body
      </Panel>,
    );

    expect(screen.getByRole('complementary')).toHaveClass(cssClass(styles.inline));
  });
});
