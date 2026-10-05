import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { TimelineWaterfall } from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall';
import type { TimelineRowData } from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall.typedefs';
import { TraceStepKind } from '@/shared/ui/runs/TraceRow/TraceRow.constants';
import styles from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall.module.scss';

const AGENT_ROW: TimelineRowData = {
  id: 'agent',
  label: 'Receptionist',
  depth: 0,
  startMs: 0,
  durationMs: 3200,
  kind: TraceStepKind.Agent,
  durationLabel: '3.2 s',
  description: 'Receptionist, starts at 0 s, lasts 3.2 s',
};

const KNOWLEDGE_ROW: TimelineRowData = {
  id: 'kb',
  label: 'search_faq',
  depth: 1,
  startMs: 120,
  durationMs: 380,
  kind: TraceStepKind.Knowledge,
  durationLabel: '0.4 s',
  description: 'search_faq, starts at 0.1 s, lasts 0.4 s',
};

const ROWS: TimelineRowData[] = [
  AGENT_ROW,
  KNOWLEDGE_ROW,
  {
    id: 'model',
    label: 'gpt-4.1',
    depth: 1,
    startMs: 520,
    durationMs: 1400,
    kind: TraceStepKind.Model,
    durationLabel: '1.4 s',
    description: 'gpt-4.1, starts at 0.5 s, lasts 1.4 s',
  },
  {
    id: 'tool',
    label: 'create_booking',
    depth: 1,
    startMs: 1950,
    durationMs: 900,
    kind: TraceStepKind.Tool,
    durationLabel: '0.9 s',
    description: 'create_booking, starts at 2 s, lasts 0.9 s',
  },
  {
    id: 'completion',
    label: 'Final answer',
    depth: 1,
    startMs: 2880,
    durationMs: 320,
    kind: TraceStepKind.Completion,
    durationLabel: '0.3 s',
    description: 'Final answer, starts at 2.9 s, lasts 0.3 s',
  },
];

const meta = {
  component: TimelineWaterfall,
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
  args: {
    rows: ROWS,
    totalMs: 3200,
    ticks: [
      { valueMs: 0, label: '0 s' },
      { valueMs: 1000, label: '1 s' },
      { valueMs: 2000, label: '2 s' },
      { valueMs: 3000, label: '3 s' },
    ],
    ariaLabel: 'Run timeline',
    legendAriaLabel: 'Step kinds',
    legendLabels: {
      [TraceStepKind.Agent]: 'Agent',
      [TraceStepKind.Model]: 'Model',
      [TraceStepKind.Tool]: 'Tool',
      [TraceStepKind.Completion]: 'Completion',
      [TraceStepKind.Knowledge]: 'Knowledge',
    },
    selectedId: null,
    onSelect: () => undefined,
  },
} satisfies Meta<typeof TimelineWaterfall>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SelectedRow: Story = { args: { selectedId: 'model' } };
export const WithCaption: Story = { args: { caption: 'Run timeline · create_booking' } };
export const ShortStepStaysVisible: Story = {
  args: { rows: [AGENT_ROW, { ...KNOWLEDGE_ROW, durationMs: 4 }] },
};
export const NarrowLabelColumn: Story = { args: { labelWidth: 110 } };
export const Interactive: Story = {
  render: function InteractiveStory(args) {
    const [selectedId, setSelectedId] = useState<string | null>('tool');

    return <TimelineWaterfall {...args} selectedId={selectedId} onSelect={setSelectedId} />;
  },
};
export const Dark: Story = {
  args: { selectedId: 'model' },
  globals: { theme: ResolvedTheme.Dark },
};
