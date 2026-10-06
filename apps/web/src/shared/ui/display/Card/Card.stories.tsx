import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '@/shared/ui/display/Card/Card';
import { CardElement, CardGap, CardPad, CardTone } from '@/shared/ui/display/Card/Card.constants';
import styles from '@/shared/ui/display/Card/Card.module.scss';

const meta = {
  component: Card,
  args: { children: 'Cards group related content on a surface.' },
  argTypes: {
    tone: { control: 'select', options: Object.values(CardTone) },
    pad: { control: 'select', options: [null, ...Object.values(CardPad)] },
    gap: { control: 'select', options: [null, ...Object.values(CardGap)] },
    as: { control: 'select', options: Object.values(CardElement) },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithTitle: Story = { args: { title: 'Workspace' } };
export const Panel: Story = { args: { tone: CardTone.Panel, title: 'Plan summary' } };
export const Sunken: Story = { args: { tone: CardTone.Sunken, children: 'Transcript well' } };
export const Selected: Story = { args: { selected: true, title: 'Selected card' } };

export const Paddings: Story = {
  render: (args) => (
    <div className={styles.gallery}>
      {Object.values(CardPad).map((pad) => (
        <Card key={pad} {...args} pad={pad}>
          pad {pad}
        </Card>
      ))}
    </div>
  ),
};

export const Gaps: Story = {
  render: (args) => (
    <div className={styles.gallery}>
      {Object.values(CardGap).map((gap) => (
        <Card key={gap} {...args} gap={gap}>
          <span>gap {gap}</span>
          <span>second row</span>
        </Card>
      ))}
    </div>
  ),
};

export const FlushWithRows: Story = {
  args: { flush: true, children: null },
  render: (args) => (
    <Card {...args}>
      <div className={styles.demoRow}>First row</div>
      <div className={styles.demoRow}>Second row</div>
    </Card>
  ),
};

export const AsListItem: Story = {
  render: (args) => (
    <ul className={styles.gallery}>
      <Card {...args} as={CardElement.Li}>
        First
      </Card>
      <Card {...args} as={CardElement.Li} selected>
        Second, selected
      </Card>
    </ul>
  ),
};
