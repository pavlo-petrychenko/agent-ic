import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TriggerNode } from '@/shared/ui/flow/TriggerNode/TriggerNode';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/flow/TriggerNode/TriggerNode.module.scss';

const TITLE = 'Incoming message';

describe('TriggerNode', () => {
  it('is a focusable group named after the trigger', async () => {
    render(<TriggerNode title={TITLE} />);

    await userEvent.tab();

    expect(screen.getByRole('group', { name: TITLE })).toHaveFocus();
  });

  it('shows the channels below the title', () => {
    render(<TriggerNode title={TITLE} subtitle="Telegram · Web widget" />);

    expect(screen.getByText('Telegram · Web widget')).toBeInTheDocument();
  });

  it('marks an invalid trigger with the reason', () => {
    render(<TriggerNode title={TITLE} invalidLabel="Connect the trigger to a step" />);

    expect(screen.getByRole('group')).toHaveClass(cssClass(styles.invalid));
    expect(screen.getByTitle('Connect the trigger to a step')).toBeInTheDocument();
  });

  it('uses the message icon unless told otherwise', () => {
    const { container, rerender } = render(<TriggerNode title={TITLE} />);
    expect(container.querySelector('[data-icon="msg"]')).toBeInTheDocument();

    rerender(<TriggerNode title="Schedule" icon={IconName.Cal} />);
    expect(container.querySelector('[data-icon="cal"]')).toBeInTheDocument();
  });

  it('draws the gap ring when selected', () => {
    render(<TriggerNode title={TITLE} selected />);

    const node = screen.getByRole('group');
    expect(node).toHaveAttribute('aria-current', 'true');
    expect(node).toHaveClass(cssClass(styles.selected));
  });

  it('fades while an edge is being drawn, because it is never a target', () => {
    render(<TriggerNode title={TITLE} faded />);

    expect(screen.getByRole('group')).toHaveClass(cssClass(styles.faded));
  });

  it('takes a disabled trigger out of the tab order', async () => {
    render(<TriggerNode title={TITLE} disabled />);

    await userEvent.tab();

    expect(screen.getByRole('group')).not.toHaveFocus();
  });

  it('renders only an out-port slot', () => {
    render(<TriggerNode title={TITLE} outPort={<span data-testid="out" />} />);

    expect(screen.getByTestId('out')).toBeInTheDocument();
  });
});
