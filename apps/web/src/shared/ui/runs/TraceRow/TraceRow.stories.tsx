import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { TraceRow } from '@/shared/ui/runs/TraceRow/TraceRow';
import { TraceStepKind } from '@/shared/ui/runs/TraceRow/TraceRow.constants';
import styles from '@/shared/ui/runs/TraceRow/TraceRow.module.scss';

const meta = {
  component: TraceRow,
  args: {
    depth: 0,
    kind: TraceStepKind.Tool,
    name: 'create_booking',
    durationLabel: '2.1 s',
    onSelect: () => undefined,
  },
  argTypes: {
    kind: { control: 'select', options: Object.values(TraceStepKind) },
  },
  decorators: [
    (Story) => (
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      <div role="tree" aria-label="Run trace" className={styles.storyTree}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TraceRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Nested: Story = { args: { depth: 1 } };
export const CollapsedParent: Story = {
  args: { kind: TraceStepKind.Agent, name: 'Receptionist', expanded: false },
};
export const ExpandedParent: Story = {
  args: { kind: TraceStepKind.Agent, name: 'Receptionist', expanded: true },
};
export const Running: Story = {
  args: { kind: TraceStepKind.Model, name: 'gpt-4.1', durationLabel: 'running…', running: true },
};
export const Failed: Story = { args: { errorLabel: 'timeout' } };
export const AllKinds: Story = {
  render: (args) => (
    <>
      {Object.values(TraceStepKind).map((kind) => (
        <TraceRow key={kind} {...args} kind={kind} name={kind} />
      ))}
    </>
  ),
};
export const Trace: Story = {
  render: function TraceStory(args) {
    const [selected, setSelected] = useState('model');
    const [expanded, setExpanded] = useState(true);

    return (
      <>
        <TraceRow
          {...args}
          kind={TraceStepKind.Agent}
          name="Receptionist"
          durationLabel="4.8 s"
          expanded={expanded}
          selected={selected === 'agent'}
          onSelect={() => setSelected('agent')}
          onToggleExpanded={() => setExpanded((current) => !current)}
        />
        {expanded && (
          <>
            <TraceRow
              {...args}
              depth={1}
              kind={TraceStepKind.Model}
              name="gpt-4.1"
              durationLabel="1.2 s"
              selected={selected === 'model'}
              tabIndex={-1}
              onSelect={() => setSelected('model')}
            />
            <TraceRow
              {...args}
              depth={1}
              kind={TraceStepKind.Knowledge}
              name="search_faq"
              durationLabel="0.4 s"
              selected={selected === 'kb'}
              tabIndex={-1}
              onSelect={() => setSelected('kb')}
            />
            <TraceRow
              {...args}
              depth={1}
              kind={TraceStepKind.Tool}
              name="create_booking"
              errorLabel="timeout"
              selected={selected === 'tool'}
              tabIndex={-1}
              onSelect={() => setSelected('tool')}
            />
          </>
        )}
      </>
    );
  },
};
export const TraceDark: Story = {
  render: Trace.render,
  globals: { theme: ResolvedTheme.Dark },
};
