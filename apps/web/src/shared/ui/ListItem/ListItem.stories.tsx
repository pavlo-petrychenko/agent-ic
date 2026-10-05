import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { ListItem } from '@/shared/ui/ListItem/ListItem';
import { ListItemTitleStyle } from '@/shared/ui/ListItem/ListItem.constants';
import { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';
import { StatusDot } from '@/shared/ui/StatusDot/StatusDot';
import { StatusKind } from '@/shared/ui/StatusDot/StatusDot.constants';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/ListItem/ListItem.module.scss';

const meta = {
  component: ListItem,
  decorators: [
    withMemoryRouter,
    (Story) => (
      <div className={styles.storyList}>
        <Story />
      </div>
    ),
  ],
  args: {
    to: '/auth/login',
    title: 'Telegram',
    subtitle: '@demo_salon_bot',
    icon: IconName.Channels,
    tone: NodeKind.Neutral,
  },
  argTypes: {
    tone: { control: 'select', options: Object.values(NodeKind) },
    titleStyle: { control: 'select', options: Object.values(ListItemTitleStyle) },
    icon: { control: 'select', options: [null, ...Object.values(IconName)] },
  },
} satisfies Meta<typeof ListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Disabled: Story = { args: { disabled: true } };
export const WithoutSubtitle: Story = { args: { subtitle: null } };
export const WithStatus: Story = {
  args: { trailing: <StatusDot kind={StatusKind.Ok} aria-label="Connected" /> },
};
export const MonoTitle: Story = {
  args: {
    title: 'create_booking',
    subtitle: 'POST /bookings',
    icon: null,
    tone: NodeKind.Tool,
    titleStyle: ListItemTitleStyle.Mono,
  },
};
export const MonoTitleSelected: Story = {
  args: { ...MonoTitle.args, selected: true },
};

const TONES = [
  { tone: NodeKind.Neutral, icon: IconName.Channels, title: 'Telegram' },
  { tone: NodeKind.Kb, icon: IconName.Kb, title: 'Price list.pdf' },
  { tone: NodeKind.Tool, icon: IconName.Tool, title: 'create_booking' },
  { tone: NodeKind.Agent, icon: IconName.Agent, title: 'Booking agent' },
  { tone: NodeKind.Ok, icon: IconName.Check, title: 'Published flow' },
  { tone: NodeKind.Compl, icon: IconName.Compl, title: 'Classifier' },
  { tone: NodeKind.Api, icon: IconName.Api, title: 'CRM' },
  { tone: NodeKind.Trig, icon: IconName.ToolEvent, title: 'On message' },
] as const;

export const Tones: Story = {
  render: () => (
    <>
      {TONES.map((entry) => (
        <ListItem
          key={entry.tone}
          to="/auth/login"
          title={entry.title}
          subtitle={entry.tone}
          icon={entry.icon}
          tone={entry.tone}
        />
      ))}
    </>
  ),
};
