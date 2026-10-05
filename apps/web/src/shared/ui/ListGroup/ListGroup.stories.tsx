import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { ListGroup } from '@/shared/ui/ListGroup/ListGroup';
import { ListItem } from '@/shared/ui/ListItem/ListItem';
import { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';
import { StatusDot } from '@/shared/ui/StatusDot/StatusDot';
import { StatusKind } from '@/shared/ui/StatusDot/StatusDot.constants';
import { SubnavItem } from '@/shared/ui/SubnavItem/SubnavItem';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/ListGroup/ListGroup.module.scss';

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
