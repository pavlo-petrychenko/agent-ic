import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from '@/shared/ui/typography/Heading/Heading';
import { HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading/Heading.constants';
import styles from '@/shared/ui/typography/Heading/Heading.module.scss';

const meta = {
  component: Heading,
  args: { children: 'Inbox' },
  argTypes: {
    size: { control: 'select', options: Object.values(HeadingSize) },
    as: { control: 'select', options: [null, ...Object.values(HeadingElement)] },
  },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className={styles.gallery}>
      {Object.values(HeadingSize).map((size) => (
        <Heading key={size} {...args} size={size}>
          {size}: Customer conversations
        </Heading>
      ))}
    </div>
  ),
};

export const DecoupledFromTag: Story = {
  args: { size: HeadingSize.H2, as: HeadingElement.H1, children: 'Log in' },
};

export const NoWrap: Story = {
  args: { size: HeadingSize.H3, nowrap: true, children: 'Incoming message . Book 17:30' },
};
