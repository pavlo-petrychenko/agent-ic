import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Topbar } from '@/shared/ui/layout/Topbar/Topbar';
import styles from '@/shared/ui/layout/Topbar/Topbar.module.scss';

const meta = {
  component: Topbar,
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
  args: {
    breadcrumbs: {
      ariaLabel: 'Breadcrumb',
      moreLabel: 'More',
      items: [
        { label: 'Agents', to: '/agents' },
        { label: 'Support agent', to: null },
      ],
    },
    status: (
      <Badge tone={BadgeTone.Warn} dot>
        Draft · edited from v6
      </Badge>
    ),
    actions: (
      <>
        <Button variant={ButtonVariant.Secondary}>Versions</Button>
        <Button>Publish</Button>
      </>
    ),
  },
} satisfies Meta<typeof Topbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Draft: Story = {};
export const Live: Story = {
  args: {
    status: (
      <Badge tone={BadgeTone.Ok} dot>
        Live · v7
      </Badge>
    ),
  },
};
export const WithoutStatus: Story = { args: { status: null } };
export const WithoutActions: Story = { args: { actions: null } };
export const DeepTrailCollapses: Story = {
  args: {
    breadcrumbs: {
      ariaLabel: 'Breadcrumb',
      moreLabel: 'More',
      items: [
        { label: 'Agents', to: '/agents' },
        { label: 'Support agent', to: '/agents/1' },
        { label: 'Flows', to: '/agents/1/flows' },
        { label: 'Greeting flow', to: '/agents/1/flows/1' },
        { label: 'Router step with a long name', to: null },
      ],
    },
  },
};
