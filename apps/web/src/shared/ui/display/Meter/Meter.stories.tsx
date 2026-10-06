import type { Meta, StoryObj } from '@storybook/react-vite';
import { Meter } from '@/shared/ui/display/Meter/Meter';
import { ChartColor } from '@/shared/ui/display/Meter/Meter.constants';
import styles from '@/shared/ui/display/Meter/Meter.module.scss';

const meta = {
  component: Meter,
  args: { label: 'Strong model', value: 39.1, max: 46.5, valueLabel: '$39.10' },
  argTypes: {
    color: { control: 'select', options: Object.values(ChartColor) },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyStack}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Meter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const QualityScore: Story = {
  args: { label: 'Quality', value: 8, max: 10, valueLabel: '8 / 10' },
};
export const Empty: Story = { args: { value: 0, valueLabel: '$0.00' } };
export const Full: Story = { args: { value: 46.5, valueLabel: '$46.50' } };
export const Stacked: Story = {
  render: (args) => (
    <>
      {Object.values(ChartColor).map((color, index) => (
        <Meter
          key={color}
          {...args}
          color={color}
          label={`Series ${index + 1}`}
          value={50 - index * 8}
          max={50}
          valueLabel={`${50 - index * 8}`}
        />
      ))}
    </>
  ),
};
