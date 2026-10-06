import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FlowPort } from '@/shared/ui/flow/FlowPort/FlowPort';
import { FlowPortDirection, FlowPortState } from '@/shared/ui/flow/FlowPort/FlowPort.constants';
import type { FlowPortKeyboard } from '@/shared/ui/flow/FlowPort/FlowPort.typedefs';
import styles from '@/shared/ui/flow/FlowPort/FlowPort.module.scss';

const noop = () => undefined;

const keyboard: FlowPortKeyboard = {
  onStart: noop,
  onCycle: noop,
  onConfirm: noop,
  onCancel: noop,
};

const meta = {
  component: FlowPort,
  args: { direction: FlowPortDirection.Out, state: FlowPortState.Idle },
  argTypes: {
    direction: { control: 'select', options: Object.values(FlowPortDirection) },
    state: { control: 'select', options: Object.values(FlowPortState) },
  },
} satisfies Meta<typeof FlowPort>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
export const Hover: Story = { args: { state: FlowPortState.Hover } };
export const Source: Story = { args: { state: FlowPortState.Source } };
export const ValidTarget: Story = {
  args: { direction: FlowPortDirection.In, state: FlowPortState.Target },
};
export const Connected: Story = { args: { connected: true } };
export const Labelled: Story = { args: { label: 'needs_human', onLabelClick: noop } };
export const LabelledActive: Story = { args: { label: 'else', labelActive: true } };
export const RevealedByNode: Story = {
  args: { state: FlowPortState.Hidden },
  render: (args) => (
    <span className={styles.storyReveal}>
      <FlowPort {...args} />
    </span>
  ),
};

export const AllStates: Story = {
  render: (args) => (
    <div className={styles.storyRow}>
      {[FlowPortState.Idle, FlowPortState.Hover, FlowPortState.Source, FlowPortState.Target].map(
        (state) => (
          <span key={state} className={styles.storyItem}>
            <FlowPort {...args} state={state} />
            {state}
          </span>
        ),
      )}
      <span className={styles.storyItem}>
        <FlowPort {...args} connected />
        connected
      </span>
    </div>
  ),
};

function KeyboardDemo() {
  const [connecting, setConnecting] = useState(false);
  const stop = () => setConnecting(false);

  return (
    <FlowPort
      direction={FlowPortDirection.Out}
      state={connecting ? FlowPortState.Source : FlowPortState.Idle}
      ariaLabel="Connect from Receptionist"
      keyboard={{
        ...keyboard,
        onStart: () => setConnecting(true),
        onConfirm: stop,
        onCancel: stop,
      }}
    />
  );
}

export const Keyboard: Story = { render: () => <KeyboardDemo /> };
