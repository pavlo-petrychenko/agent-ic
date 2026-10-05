import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { SubnavItem } from '@/shared/ui/SubnavItem/SubnavItem';
import { SubnavItemDepth, SubnavItemMetaKind } from '@/shared/ui/SubnavItem/SubnavItem.constants';
import { TreeFolder } from '@/shared/ui/TreeFolder/TreeFolder';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/TreeFolder/TreeFolder.module.scss';

const versions = (
  <>
    <SubnavItem
      to="/auth/login"
      label="Receptionist"
      meta="v4"
      metaKind={SubnavItemMetaKind.Version}
      depth={SubnavItemDepth.Nested}
      selected
    />
    <SubnavItem
      to="/auth/sign-up"
      label="Write confirmation"
      meta="v2"
      metaKind={SubnavItemMetaKind.Version}
      depth={SubnavItemDepth.Nested}
    />
  </>
);

const meta = {
  component: TreeFolder,
  decorators: [
    withMemoryRouter,
    (Story) => (
      <nav aria-label="Prompts" className={styles.storyNav}>
        <Story />
      </nav>
    ),
  ],
  args: {
    label: 'Booking',
    open: true,
    onOpenChange: () => undefined,
    children: versions,
  },
} satisfies Meta<typeof TreeFolder>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};
export const Closed: Story = { args: { open: false } };
export const Disabled: Story = { args: { open: false, disabled: true } };
export const Interactive: Story = {
  render: function InteractiveStory(args) {
    const [open, setOpen] = useState(true);
    return <TreeFolder {...args} open={open} onOpenChange={setOpen} />;
  },
};
export const Dark: Story = { globals: { theme: ResolvedTheme.Dark } };
