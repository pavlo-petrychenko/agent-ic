import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { SubnavItem } from '@/shared/ui/data/SubnavItem/SubnavItem';
import {
  SubnavItemDepth,
  SubnavItemMetaKind,
} from '@/shared/ui/data/SubnavItem/SubnavItem.constants';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/data/SubnavItem/SubnavItem.module.scss';

const meta = {
  component: SubnavItem,
  decorators: [
    withMemoryRouter,
    (Story) => (
      <nav aria-label="Settings" className={styles.storyNav}>
        <Story />
      </nav>
    ),
  ],
  args: { to: '/auth/login', label: 'Roles', meta: '4' },
  argTypes: {
    metaKind: { control: 'select', options: Object.values(SubnavItemMetaKind) },
    depth: { control: 'select', options: Object.values(SubnavItemDepth) },
  },
} satisfies Meta<typeof SubnavItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const WithoutMeta: Story = { args: { meta: null, label: 'Members' } };
export const Version: Story = {
  args: {
    label: 'Receptionist',
    meta: 'v4',
    metaKind: SubnavItemMetaKind.Version,
    depth: SubnavItemDepth.Nested,
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const List: Story = {
  render: () => (
    <>
      <SubnavItem to="/auth/login" label="Roles" meta="4" selected />
      <SubnavItem to="/auth/sign-up" label="API tokens" meta="1" />
      <SubnavItem
        to="/auth/sign-up"
        label="Write confirmation"
        meta="v2"
        metaKind={SubnavItemMetaKind.Version}
        depth={SubnavItemDepth.Nested}
      />
      <SubnavItem to="/auth/sign-up" label="Escalations" meta="6" disabled />
    </>
  ),
};
export const Dark: Story = {
  render: List.render,
  globals: { theme: ResolvedTheme.Dark },
};
