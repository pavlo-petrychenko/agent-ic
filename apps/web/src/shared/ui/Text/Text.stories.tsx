import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from '@/shared/ui/Text/Text';
import { TextColor, TextElement, TextKind } from '@/shared/ui/Text/Text.constants';
import styles from '@/shared/ui/Text/Text.module.scss';

const SAMPLE = 'Agents answer from your documents and hand over to a person when unsure.';

const meta = {
  component: Text,
  args: { children: SAMPLE },
  argTypes: {
    kind: { control: 'select', options: Object.values(TextKind) },
    color: { control: 'select', options: [null, ...Object.values(TextColor)] },
    as: { control: 'select', options: Object.values(TextElement) },
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Kinds: Story = {
  render: (args) => (
    <div className={styles.gallery}>
      {Object.values(TextKind).map((kind) => (
        <Text key={kind} {...args} kind={kind}>
          {kind}: {SAMPLE}
        </Text>
      ))}
    </div>
  ),
};

export const Colors: Story = {
  render: (args) => (
    <div className={styles.gallery}>
      {Object.values(TextColor).map((color) => (
        <Text key={color} {...args} color={color}>
          {color}: {SAMPLE}
        </Text>
      ))}
    </div>
  ),
};

export const TabularNumbers: Story = {
  args: { kind: TextKind.Mono, tabularNums: true, children: '1,111.00 / 8,888.00' },
};

export const InlineLink: Story = {
  args: {
    children: (
      <>
        Read the <a href="/docs">publishing guide</a> before going live.
      </>
    ),
  },
};
