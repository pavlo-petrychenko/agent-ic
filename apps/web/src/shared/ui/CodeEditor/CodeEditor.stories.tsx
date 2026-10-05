import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { CodeEditor } from '@/shared/ui/CodeEditor/CodeEditor';
import styles from '@/shared/ui/CodeEditor/CodeEditor.module.scss';

const SAMPLE = `{
  "name": "check_order",
  "description": "Look up an order by its number",
  "parameters": {
    "order_id": { "type": "string" }
  }
}`;

const meta = {
  component: CodeEditor,
  args: {
    file: 'check_order.json',
    language: 'json',
    code: SAMPLE,
    readOnly: true,
    onChange: null,
    label: 'Tool definition',
    hint: 'Press Escape, then Tab to leave the editor',
    unsaved: false,
    unsavedLabel: 'Unsaved changes',
  },
  decorators: [
    (Story) => (
      <div className={styles.storyItem}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CodeEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {};
export const Editable: Story = {
  render: function EditableStory(args) {
    const [code, setCode] = useState(args.code);
    return <CodeEditor {...args} readOnly={false} code={code} onChange={setCode} />;
  },
};
export const Unsaved: Story = {
  render: function UnsavedStory(args) {
    const [code, setCode] = useState(args.code);
    return (
      <CodeEditor
        {...args}
        readOnly={false}
        code={code}
        onChange={setCode}
        unsaved={code !== args.code}
      />
    );
  },
};
export const UnsavedMarker: Story = { args: { unsaved: true } };
export const JavaScript: Story = {
  args: {
    file: 'check_order.js',
    language: 'javascript',
    code: `export async function run({ order_id }) {\n  const res = await fetch(\`/orders/\${order_id}\`);\n  return res.json();\n}`,
  },
};
