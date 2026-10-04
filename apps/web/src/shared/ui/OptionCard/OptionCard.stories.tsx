import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Input } from '@/shared/ui/Input/Input';
import { OptionCard } from '@/shared/ui/OptionCard/OptionCard';
import styles from '@/shared/ui/OptionCard/OptionCard.module.scss';

const meta = {
  component: OptionCard,
  args: {
    name: 'setup',
    value: 'create',
    checked: false,
    onSelect: () => undefined,
    title: 'Create a new organization',
    description: 'You’ll be its owner and can invite your team',
  },
} satisfies Meta<typeof OptionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { checked: true } };
export const WithContent: Story = {
  args: { checked: true, children: <Input aria-label="Organization name" defaultValue="Demo" /> },
};
export const Group: Story = {
  render: function GroupStory() {
    const [value, setValue] = useState('create');
    return (
      <div role="radiogroup" aria-label="Workspace" className={styles.storyGroup}>
        <OptionCard
          name="group"
          value="create"
          checked={value === 'create'}
          onSelect={setValue}
          title="Create a new organization"
          description="You’ll be its owner and can invite your team"
        >
          {value === 'create' ? <Input aria-label="Organization name" /> : null}
        </OptionCard>
        <OptionCard
          name="group"
          value="join"
          checked={value === 'join'}
          onSelect={setValue}
          title="Join an existing one"
          description="Ask the owner or an admin for an invite link and open it"
        />
      </div>
    );
  },
};
