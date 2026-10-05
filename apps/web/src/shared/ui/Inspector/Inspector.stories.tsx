import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { Field } from '@/shared/ui/Field';
import { Input } from '@/shared/ui/Input';
import { Inspector } from '@/shared/ui/Inspector/Inspector';
import { InspectorSection } from '@/shared/ui/Inspector/InspectorSection';
import { NodeKind } from '@/shared/ui/NodeTile';
import { Switch } from '@/shared/ui/Switch';
import { VariableChip } from '@/shared/ui/VariableChip';
import styles from '@/shared/ui/Inspector/Inspector.module.scss';

function SendMessageSections() {
  const [waiting, setWaiting] = useState(true);

  return (
    <>
      <InspectorSection title="Message" note="Markdown supported">
        <div className={styles.storyValue}>
          Hi <VariableChip path="contact.name" />, how can we help?
        </div>
      </InspectorSection>
      <InspectorSection title="Name">
        <Field label="Node name">
          {({ invalid, required, ...control }) => (
            <Input
              {...control}
              invalid={invalid}
              required={required}
              defaultValue="Welcome message"
            />
          )}
        </Field>
      </InspectorSection>
      <InspectorSection title="Behaviour">
        <Switch
          checked={waiting}
          onCheckedChange={setWaiting}
          label="Wait for the customer to reply"
        />
      </InspectorSection>
    </>
  );
}

const meta = {
  component: Inspector,
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
  args: {
    kind: { label: 'Send message', kind: NodeKind.Send },
    title: 'Welcome message',
    subtitle: 'Runs when a chat starts',
    closeLabel: 'Close inspector',
    onClose: () => undefined,
    children: <SendMessageSections />,
  },
} satisfies Meta<typeof Inspector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SendMessage: Story = {};
export const WithoutSubtitle: Story = { args: { subtitle: null } };
export const AgentKind: Story = {
  args: { kind: { label: 'Agent', kind: NodeKind.Agent }, title: 'Support agent' },
};
export const RouterKind: Story = {
  args: { kind: { label: 'Router', kind: NodeKind.Router }, title: 'Route by intent' },
};
export const ErrorKind: Story = {
  args: { kind: { label: 'Escalation', kind: NodeKind.Esc }, title: 'Hand over to a person' },
};
export const Dark: Story = { globals: { theme: ResolvedTheme.Dark } };
