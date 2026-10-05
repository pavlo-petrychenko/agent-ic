import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { userEvent, within } from 'storybook/test';
import { PromptEditor } from '@/shared/ui/PromptEditor/PromptEditor';
import type {
  PromptEditorProps,
  VariableOption,
} from '@/shared/ui/PromptEditor/PromptEditor.typedefs';
import styles from '@/shared/ui/PromptEditor/PromptEditor.module.scss';

const VARIABLES: readonly VariableOption[] = [
  { id: 'contact.name', label: 'contact.name', group: 'Contact' },
  { id: 'contact.phone', label: 'contact.phone', group: 'Contact' },
  { id: 'contact.notes', label: 'contact.notes', group: 'Contact' },
  { id: 'channel', label: 'channel', group: 'Conversation' },
];

const PROMPT = [
  'You are the booking assistant for a hair salon.',
  'Greet {{contact.name}} and answer through {{channel}}.',
  'Never share {{contact.phone}} with anyone else.',
].join('\n');

const TYPED_OPEN = '{{{{contact.';

function Stateful(args: PromptEditorProps) {
  const [value, setValue] = useState(args.value);
  return <PromptEditor {...args} value={value} onChange={setValue} />;
}

const meta = {
  component: PromptEditor,
  args: {
    value: PROMPT,
    onChange: () => undefined,
    variables: VARIABLES,
    label: 'System prompt',
    menuLabel: 'Variables',
    height: 200,
  },
  render: (args) => <Stateful {...args} />,
  decorators: [
    (Story) => (
      <div className={styles.storyColumn}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PromptEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = {
  args: { value: '', placeholder: 'Describe how the agent should behave' },
};
export const MenuOpen: Story = {
  args: { value: '' },
  play: async ({ canvasElement }) => {
    const editor = await within(canvasElement).findByRole('textbox');
    await userEvent.click(editor);
    await userEvent.keyboard(TYPED_OPEN);
  },
};
export const Invalid: Story = {
  args: {
    value: 'Greet {{user.nmae}} politely.',
    invalid: true,
    error: 'Unknown variable user.nmae — did you mean contact.name?',
  },
};
export const ReadOnly: Story = {
  args: { readOnly: true, readOnlyReason: 'v4 is published — create a draft to edit' },
};
export const Disabled: Story = { args: { disabled: true } };
export const AutoHeight: Story = { args: { height: null } };
