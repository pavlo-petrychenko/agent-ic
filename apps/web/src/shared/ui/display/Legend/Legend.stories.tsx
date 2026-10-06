import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Legend } from '@/shared/ui/display/Legend/Legend';
import { ChartColor, LegendMarkerKind } from '@/shared/ui/display/Legend/Legend.constants';
import type { LegendItem } from '@/shared/ui/display/Legend/Legend.typedefs';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { StatusKind } from '@/shared/ui/display/StatusDot';

const STATUS_ITEMS: LegendItem[] = [
  { id: 'ran', label: 'Ran', marker: { kind: LegendMarkerKind.Status, status: StatusKind.Ok } },
  {
    id: 'running',
    label: 'Running',
    marker: { kind: LegendMarkerKind.Status, status: StatusKind.Run },
  },
  {
    id: 'skipped',
    label: 'Not reached',
    marker: { kind: LegendMarkerKind.Status, status: StatusKind.Idle },
  },
  {
    id: 'failed',
    label: 'Failed',
    marker: { kind: LegendMarkerKind.Status, status: StatusKind.Err },
  },
];

const SERIES_ITEMS: LegendItem[] = [
  {
    id: 'conversations',
    label: 'Conversations',
    marker: { kind: LegendMarkerKind.Series, color: ChartColor.Chart1 },
  },
  {
    id: 'escalated',
    label: 'Escalated',
    marker: { kind: LegendMarkerKind.Series, color: ChartColor.Chart2 },
  },
  {
    id: 'resolved',
    label: 'Resolved',
    marker: { kind: LegendMarkerKind.Series, color: ChartColor.Chart3 },
  },
  {
    id: 'abandoned',
    label: 'Abandoned',
    marker: { kind: LegendMarkerKind.Series, color: ChartColor.Chart4 },
  },
];

const HUE_ITEMS: LegendItem[] = [
  { id: 'agent', label: 'Agent', marker: { kind: LegendMarkerKind.Hue, hue: NodeKind.Agent } },
  { id: 'model', label: 'Model', marker: { kind: LegendMarkerKind.Hue, hue: NodeKind.Gen } },
  { id: 'tool', label: 'Tool', marker: { kind: LegendMarkerKind.Hue, hue: NodeKind.Tool } },
  { id: 'kb', label: 'Knowledge', marker: { kind: LegendMarkerKind.Hue, hue: NodeKind.Kb } },
];

const meta = {
  component: Legend,
  args: { items: SERIES_ITEMS },
} satisfies Meta<typeof Legend>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Status: Story = { args: { items: STATUS_ITEMS } };
export const TwoSeries: Story = { args: { items: SERIES_ITEMS.slice(0, 2) } };
export const FourSeries: Story = {};
export const StepHues: Story = { args: { items: HUE_ITEMS } };
export const HiddenSeries: Story = {
  args: { items: SERIES_ITEMS.slice(0, 2), hiddenIds: ['escalated'], onToggle: () => undefined },
};
export const Interactive: Story = {
  render: function InteractiveStory(args) {
    const [hiddenIds, setHiddenIds] = useState<string[]>([]);

    return (
      <Legend
        {...args}
        hiddenIds={hiddenIds}
        onToggle={(id) =>
          setHiddenIds((current) =>
            current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
          )
        }
      />
    );
  },
};
