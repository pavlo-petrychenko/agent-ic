import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ColorSwatch } from '@/shared/ui/actions/ColorSwatch/ColorSwatch';
import type { ColorSwatchProps } from '@/shared/ui/actions/ColorSwatch/ColorSwatch.typedefs';
import styles from '@/shared/ui/actions/ColorSwatch/ColorSwatch.module.scss';

const SAMPLES = [
  { color: '#0F6B6B', label: 'Teal' },
  { color: '#2F5BD3', label: 'Blue' },
  { color: '#6D4FB3', label: 'Violet' },
  { color: '#C27B1A', label: 'Amber' },
  { color: '#A53428', label: 'Red' },
  { color: '#1F1D1A', label: 'Ink' },
];

function SwatchPicker(args: ColorSwatchProps) {
  const [value, setValue] = useState(args.color);

  return (
    <fieldset aria-label="Colour" className={styles.group}>
      {SAMPLES.map((sample) => (
        <ColorSwatch
          key={sample.color}
          {...args}
          color={sample.color}
          label={sample.label}
          selected={value === sample.color}
          onSelect={() => setValue(sample.color)}
        />
      ))}
    </fieldset>
  );
}

const meta = {
  component: ColorSwatch,
  args: { color: '#0F6B6B', label: 'Teal', onSelect: () => undefined },
  argTypes: { onSelect: { action: 'selected' } },
} satisfies Meta<typeof ColorSwatch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Picker: Story = { render: (args) => <SwatchPicker {...args} /> };
