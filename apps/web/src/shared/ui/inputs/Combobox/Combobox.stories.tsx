import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Combobox } from '@/shared/ui/inputs/Combobox';
import type { ComboboxProps } from '@/shared/ui/inputs/Combobox';

const TIME_ZONES = ['UTC', 'Europe/Kyiv', 'Europe/London', 'Asia/Tokyo'].map((timeZone) => ({
  value: timeZone,
  label: timeZone,
}));

function StatefulCombobox(args: ComboboxProps) {
  const [value, setValue] = useState(args.value);
  return <Combobox {...args} value={value} onChange={setValue} />;
}

const meta = {
  component: Combobox,
  args: {
    'aria-label': 'Time zone',
    value: 'Europe/Kyiv',
    options: TIME_ZONES,
    searchLabel: 'Search time zones',
    searchClearLabel: 'Clear time zone search',
    emptyLabel: 'No time zone found',
    placeholder: 'Search time zones',
    onChange: () => undefined,
  },
  render: (args) => <StatefulCombobox {...args} />,
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { value: '' } };
export const Invalid: Story = { args: { invalid: true } };
export const WithError: Story = { args: { error: 'Pick a time zone' } };
export const Disabled: Story = { args: { disabled: true } };
export const Creatable: Story = {
  args: {
    value: '',
    createLabel: (query: string) => `Create “${query}”`,
  },
};

const MODELS = [
  {
    value: 'platform:gpt-6-luna',
    label: 'GPT-6 Luna',
    description: 'OpenAI · $0.10 / $0.50 per 1M tokens',
    group: 'platform',
  },
  {
    value: 'platform:glm-5-3-flash',
    label: 'GLM-5.3 Flash',
    description: 'Zhipu · $0.15 / $0.50 per 1M tokens',
    group: 'platform',
  },
  {
    value: 'lmk_openai:accounts/fireworks/models/deepseek-v4p1-flash-instruct-preview',
    label: 'accounts/fireworks/models/deepseek-v4p1-flash-instruct-preview',
    group: 'lmk_openai',
  },
  { value: 'lmk_openai:gpt-4o', label: 'gpt-4o', group: 'lmk_openai' },
  { value: 'lmk_openai:gpt-4o-mini', label: 'gpt-4o-mini', group: 'lmk_openai' },
];

export const Grouped: Story = {
  args: {
    'aria-label': 'Model',
    value: 'lmk_openai:gpt-4o',
    options: MODELS,
    searchLabel: 'Search models',
    searchClearLabel: 'Clear model search',
    emptyLabel: 'No model found',
    placeholder: 'Pick a model',
    createLabel: (query: string) => `Use “${query}”`,
    groups: [
      { id: 'platform', label: 'Platform models' },
      { id: 'lmk_openai', label: 'OpenAI · your key', creatable: true },
      { id: 'lmk_mistral', label: 'Mistral · your key', hint: 'Loading models…', creatable: true },
      {
        id: 'lmk_custom',
        label: 'Local proxy · your key',
        hint: 'This key’s models couldn’t be loaded.',
        action: { label: 'Try again', onSelect: () => undefined },
        creatable: true,
      },
    ],
  },
};
