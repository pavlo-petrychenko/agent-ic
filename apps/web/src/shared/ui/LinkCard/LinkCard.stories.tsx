import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { LinkCard } from '@/shared/ui/LinkCard/LinkCard';
import { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';
import styles from '@/shared/ui/LinkCard/LinkCard.module.scss';

const meta = {
  component: LinkCard,
  args: {
    href: '/knowledge/faq',
    icon: IconName.Kb,
    kind: NodeKind.Kb,
    title: 'FAQ from documents',
    description: 'Turn your documents into questions and answers',
  },
  argTypes: {
    kind: { control: 'select', options: Object.values(NodeKind) },
    icon: { control: 'select', options: [null, ...Object.values(IconName)] },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyItem}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LinkCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutDescription: Story = { args: { description: null } };
export const Disabled: Story = { args: { disabled: true } };
export const Kinds: Story = {
  render: (args) => (
    <div className={styles.storyGrid}>
      <div className={styles.storyItem}>
        <LinkCard {...args} />
      </div>
      <div className={styles.storyItem}>
        <LinkCard
          {...args}
          icon={IconName.Tool}
          kind={NodeKind.Tool}
          title="Custom tools"
          description="Let the agent call your own services"
        />
      </div>
    </div>
  ),
};
