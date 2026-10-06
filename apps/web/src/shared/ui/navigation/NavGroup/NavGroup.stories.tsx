import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { NavGroup } from '@/shared/ui/navigation/NavGroup/NavGroup';
import { NavItem } from '@/shared/ui/navigation/NavItem/NavItem';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/navigation/NavGroup/NavGroup.module.scss';

const meta = {
  component: NavGroup,
  decorators: [withMemoryRouter],
  args: {
    label: 'Build',
    children: (
      <>
        <NavItem to="/" icon={IconName.Agent}>
          Agents
        </NavItem>
        <NavItem to="/auth/login" icon={IconName.Note}>
          Prompts
        </NavItem>
      </>
    ),
  },
} satisfies Meta<typeof NavGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithLabel: Story = {};
export const WithoutLabel: Story = { args: { label: null } };
export const Stacked: Story = {
  render: (args) => (
    <nav aria-label="Main" className={styles.storyNav}>
      <NavGroup {...args} />
      <NavGroup label="Operate">
        <NavItem to="/auth/sign-up" icon={IconName.Inbox}>
          Inbox
        </NavItem>
      </NavGroup>
    </nav>
  ),
};
