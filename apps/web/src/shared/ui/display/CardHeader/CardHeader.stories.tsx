import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { TextLink } from '@/shared/ui/actions/TextLink';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Card } from '@/shared/ui/display/Card';
import { CardHeader } from '@/shared/ui/display/CardHeader/CardHeader';
import { CardHeaderLevel } from '@/shared/ui/display/CardHeader/CardHeader.constants';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/display/CardHeader/CardHeader.module.scss';

const meta = {
  component: CardHeader,
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Card>
          <Story />
        </Card>
      </div>
    ),
  ],
  args: { title: 'Recent activity' },
  argTypes: {
    headingLevel: {
      control: 'select',
      options: [CardHeaderLevel.H2, CardHeaderLevel.H3, CardHeaderLevel.H4],
    },
  },
} satisfies Meta<typeof CardHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {};
export const WithSub: Story = { args: { sub: 'Messages handled by the agent in the last 7 days' } };
export const WithTag: Story = {
  args: {
    tag: (
      <Badge tone={BadgeTone.Ok} dot>
        Live
      </Badge>
    ),
  },
};
export const WithSecondaryAction: Story = {
  args: {
    right: (
      <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm}>
        Manage
      </Button>
    ),
  },
};
export const WithDangerAction: Story = {
  args: {
    title: 'Danger zone',
    sub: 'These actions cannot be undone',
    right: (
      <Button variant={ButtonVariant.Danger} size={ButtonSize.Sm}>
        Delete agent
      </Button>
    ),
  },
};
export const WithLink: Story = {
  decorators: [withMemoryRouter],
  args: { right: <TextLink to="/">View all</TextLink> },
};
export const Full: Story = {
  args: {
    title: 'Web chat',
    sub: 'Connected 2 days ago',
    tag: (
      <Badge tone={BadgeTone.Ok} dot>
        Live
      </Badge>
    ),
    right: (
      <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm}>
        Manage
      </Button>
    ),
  },
};
export const Dark: Story = {
  globals: { theme: ResolvedTheme.Dark },
  args: Full.args,
};
