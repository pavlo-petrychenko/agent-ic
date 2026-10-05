import type { Meta, StoryObj } from '@storybook/react-vite';
import { SourceBadges } from '@/shared/ui/SourceBadges/SourceBadges';
import { SourceKind } from '@/shared/ui/SourceBadges/SourceBadges.constants';

const meta = {
  component: SourceBadges,
  args: { sources: [{ kind: SourceKind.Channel, label: 'Channel' }] },
} satisfies Meta<typeof SourceBadges>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {};
export const AllSources: Story = {
  args: {
    sources: [
      { kind: SourceKind.Channel, label: 'Channel' },
      { kind: SourceKind.Flow, label: 'Flow' },
      { kind: SourceKind.Operator, label: 'Operator' },
      { kind: SourceKind.Api, label: 'API' },
      { kind: SourceKind.System, label: 'System' },
    ],
  },
};
