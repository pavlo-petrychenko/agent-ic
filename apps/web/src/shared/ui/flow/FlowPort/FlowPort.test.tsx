import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FlowPort } from '@/shared/ui/flow/FlowPort/FlowPort';
import {
  FlowPortDirection,
  FlowPortState,
  FlowPortStep,
} from '@/shared/ui/flow/FlowPort/FlowPort.constants';
import type {
  FlowPortKeyboard,
  FlowPortTerminal,
} from '@/shared/ui/flow/FlowPort/FlowPort.typedefs';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

const PORT_NAME = 'Connect from Receptionist';

const createKeyboard = (): FlowPortKeyboard => ({
  onStart: vi.fn<() => void>(),
  onCycle: vi.fn<(step: FlowPortStep) => void>(),
  onConfirm: vi.fn<() => void>(),
  onCancel: vi.fn<() => void>(),
});

describe('FlowPort', () => {
  it('is decorative without keyboard handlers', () => {
    const { container } = render(<FlowPort direction={FlowPortDirection.In} />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('[data-port="in"] [aria-hidden="true"]')).toBeInTheDocument();
  });

  it('is a focusable button on an out-port with keyboard handlers', async () => {
    render(
      <FlowPort
        direction={FlowPortDirection.Out}
        ariaLabel={PORT_NAME}
        keyboard={createKeyboard()}
      />,
    );

    await userEvent.tab();

    expect(screen.getByRole('button', { name: PORT_NAME })).toHaveFocus();
  });

  it.each(['{Enter}', ' '])('starts a connection with %s', async (key) => {
    const keyboard = createKeyboard();
    render(
      <FlowPort direction={FlowPortDirection.Out} ariaLabel={PORT_NAME} keyboard={keyboard} />,
    );

    await userEvent.tab();
    await userEvent.keyboard(key);

    expect(keyboard.onStart).toHaveBeenCalledOnce();
    expect(keyboard.onConfirm).not.toHaveBeenCalled();
  });

  it('does not start a connection on a mouse click', async () => {
    const keyboard = createKeyboard();
    render(
      <FlowPort direction={FlowPortDirection.Out} ariaLabel={PORT_NAME} keyboard={keyboard} />,
    );

    await userEvent.click(screen.getByRole('button', { name: PORT_NAME }));

    expect(keyboard.onStart).not.toHaveBeenCalled();
  });

  it('cycles, confirms and cancels while it is the source', async () => {
    const keyboard = createKeyboard();
    render(
      <FlowPort
        direction={FlowPortDirection.Out}
        state={FlowPortState.Source}
        ariaLabel={PORT_NAME}
        keyboard={keyboard}
      />,
    );

    const port = screen.getByRole('button', { name: PORT_NAME });
    expect(port).toHaveAttribute('aria-pressed', 'true');

    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{ArrowDown}{ArrowLeft}{ArrowUp}{Enter}{Escape}');

    expect(vi.mocked(keyboard.onCycle).mock.calls).toEqual([
      [FlowPortStep.Next],
      [FlowPortStep.Next],
      [FlowPortStep.Previous],
      [FlowPortStep.Previous],
    ]);
    expect(keyboard.onConfirm).toHaveBeenCalledOnce();
    expect(keyboard.onCancel).toHaveBeenCalledOnce();
    expect(keyboard.onStart).not.toHaveBeenCalled();
  });

  it('exposes its direction and state for the canvas', () => {
    const { container } = render(
      <FlowPort direction={FlowPortDirection.In} state={FlowPortState.Target} />,
    );

    expect(container.querySelector('[data-port="in"]')).toHaveAttribute('data-state', 'target');
  });

  it('shows an editable label below the port', async () => {
    const onLabelClick = vi.fn<() => void>();
    render(
      <FlowPort
        direction={FlowPortDirection.Out}
        label="needs_human"
        onLabelClick={onLabelClick}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'needs_human' }));

    expect(onLabelClick).toHaveBeenCalledOnce();
  });

  describe('terminal chip', () => {
    const terminal = (onAction: () => void): FlowPortTerminal => ({
      label: 'Hand off · default',
      icon: IconName.Hand,
      actionLabel: 'Customize',
      actionAriaLabel: 'Customize the hand off exit',
      stacked: false,
      onAction,
    });

    it('shows the default exit on an unconnected port and runs its action', async () => {
      const onAction = vi.fn<() => void>();
      render(<FlowPort direction={FlowPortDirection.Out} terminal={terminal(onAction)} />);
      const action = screen.getByRole('button', { name: 'Customize the hand off exit' });
      const press = createEvent.mouseDown(action);
      const stop = vi.spyOn(press, 'stopPropagation');

      expect(screen.getByText('Hand off · default')).toHaveAttribute('title', 'Hand off · default');
      fireEvent(action, press);
      await userEvent.click(action);

      expect(stop).toHaveBeenCalled();
      expect(onAction).toHaveBeenCalledOnce();
    });

    it('hides the chip once the port is connected', () => {
      render(<FlowPort direction={FlowPortDirection.Out} connected terminal={terminal(vi.fn())} />);

      expect(screen.queryByText('Hand off · default')).toBeNull();
    });
  });
});
