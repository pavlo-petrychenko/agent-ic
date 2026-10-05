import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/Button';
import { Panel } from '@/shared/ui/Panel/Panel';
import { PanelSide, PanelTone } from '@/shared/ui/Panel/Panel.constants';
import styles from '@/shared/ui/Panel/Panel.module.scss';

const meta = {
  component: Panel,
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
  args: {
    ariaLabel: 'Details',
    title: 'Details',
    children: 'Started 3 minutes ago from the website widget.',
  },
  argTypes: {
    tone: { control: 'select', options: Object.values(PanelTone) },
    side: { control: 'select', options: Object.values(PanelSide) },
  },
} satisfies Meta<typeof Panel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const White: Story = { args: { tone: PanelTone.White } };
export const Bg: Story = { args: { tone: PanelTone.Bg } };
export const NoTone: Story = { args: { tone: PanelTone.None } };
export const BorderLeft: Story = { args: { side: PanelSide.Left } };
export const BorderRight: Story = { args: { side: PanelSide.Right } };
export const WithHeadRight: Story = {
  args: {
    headRight: (
      <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm}>
        Edit
      </Button>
    ),
  },
};
export const WithFooter: Story = {
  args: { footer: <div className={styles.storyBar}>Updated just now</div> },
};
export const WithoutTitle: Story = { args: { title: null } };
export const Inline: Story = { args: { inline: true } };
export const Dark: Story = {
  globals: { theme: ResolvedTheme.Dark },
  args: {
    side: PanelSide.Left,
    headRight: (
      <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm}>
        Edit
      </Button>
    ),
    footer: <div className={styles.storyBar}>Updated just now</div>,
  },
};
