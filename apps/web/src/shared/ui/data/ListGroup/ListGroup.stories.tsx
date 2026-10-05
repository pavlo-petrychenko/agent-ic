import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { ListGroup } from '@/shared/ui/data/ListGroup/ListGroup';
import { SubnavItem } from '@/shared/ui/data/SubnavItem/SubnavItem';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { StatusDot } from '@/shared/ui/display/StatusDot/StatusDot';
import { StatusKind } from '@/shared/ui/display/StatusDot/StatusDot.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { ListItem } from '@/shared/ui/navigation/ListItem/ListItem';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/data/ListGroup/ListGroup.module.scss';

const datasets = (
  <>
    <SubnavItem to="/auth/login" label="Booking basics" meta="18" selected />
    <SubnavItem to="/auth/sign-up" label="Escalations" meta="6" />
  </>
);

const apis = (
  <>
    <ListItem
      to="/auth/login"
      title="Orders API"
      subtitle="GET /orders"
      icon={IconName.Api}
      tone={NodeKind.Neutral}
      trailing={<StatusDot kind={StatusKind.Ok} />}
    />
    <ListItem
      to="/auth/sign-up"
      title="Calendar API"
      subtitle="POST /slots"
      icon={IconName.Api}
      tone={NodeKind.Neutral}
      trailing={<StatusDot kind={StatusKind.Ok} />}
    />
  </>
);

const meta = {
  component: ListGroup,
  decorators: [
    withMemoryRouter,
    (Story) => (
      <div className={styles.storyCard}>
        <Story />
      </div>
    ),
  ],
  args: {
    title: 'Datasets',
    children: datasets,
  },
} satisfies Meta<typeof ListGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

const ADD = { addLabel: 'New dataset', onAdd: () => undefined };

export const WithAdd: Story = { args: ADD };
export const WithoutAdd: Story = { args: { title: 'Actions' } };
export const AddDisabled: Story = { args: { ...ADD, addDisabled: true } };
export const Expanded: Story = {
  args: {
    title: 'API',
    count: 2,
    onCollapsedChange: () => undefined,
    children: apis,
  },
};
export const Collapsed: Story = { args: { ...Expanded.args, collapsed: true } };
export const Interactive: Story = {
  render: function InteractiveStory(args) {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <ListGroup {...args} count={2} collapsed={collapsed} onCollapsedChange={setCollapsed}>
        {apis}
      </ListGroup>
    );
  },
};
export const Dark: Story = { args: ADD, globals: { theme: ResolvedTheme.Dark } };
