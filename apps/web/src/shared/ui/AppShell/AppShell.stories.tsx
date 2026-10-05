import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { AppShell } from '@/shared/ui/AppShell/AppShell';
import { AppShellNavMode } from '@/shared/ui/AppShell/AppShell.constants';
import type { AppShellProps } from '@/shared/ui/AppShell/AppShell.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/Button';
import { Inspector, InspectorSection } from '@/shared/ui/Inspector';
import { NodeKind } from '@/shared/ui/NodeTile';
import { withViewportWidth } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/AppShell/AppShell.module.scss';

const WIDE_WIDTH = 1500;
const DEFAULT_WIDTH = 1300;
const COMPACT_WIDTH = 1100;
const UNSUPPORTED_WIDTH = 900;

function ShellDemo(args: AppShellProps) {
  const [open, setOpen] = useState(args.detailOpen ?? false);
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    args.onDetailOpenChange(next);
  };

  return (
    <AppShell
      {...args}
      detailOpen={open}
      onDetailOpenChange={handleOpenChange}
      detail={
        args.detail === null ? null : (
          <Inspector
            kind={{ label: 'Send message', kind: NodeKind.Send }}
            title="Welcome message"
            subtitle="Runs when a chat starts"
            closeLabel="Close inspector"
            onClose={() => handleOpenChange(false)}
          >
            <InspectorSection title="Message">Hi, how can we help?</InspectorSection>
          </Inspector>
        )
      }
      panes={
        <div className={styles.storyPane}>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            onClick={() => handleOpenChange(true)}
          >
            Open details
          </Button>
        </div>
      }
    />
  );
}

const meta = {
  component: AppShell,
  render: (args) => <ShellDemo {...args} />,
  parameters: { layout: 'fullscreen' },
  decorators: [withViewportWidth(WIDE_WIDTH)],
  args: {
    nav: <div className={styles.storyNav}>Sidebar</div>,
    rail: <div className={styles.storyNav}>Rail</div>,
    topbar: <div className={styles.storyTopbar}>Topbar</div>,
    panes: null,
    detail: 'detail',
    detailOpen: true,
    detailLabel: 'Details',
    onDetailOpenChange: () => undefined,
    narrowScreen: {
      title: 'Open on a wider screen',
      description: 'Agents needs a window at least 1024 pixels wide.',
    },
  },
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Wide: Story = {};
export const Default: Story = { decorators: [withViewportWidth(DEFAULT_WIDTH)] };
export const CompactDrawerOpen: Story = { decorators: [withViewportWidth(COMPACT_WIDTH)] };
export const CompactDrawerClosed: Story = {
  decorators: [withViewportWidth(COMPACT_WIDTH)],
  args: { detailOpen: false },
};
export const ForcedRail: Story = { args: { navMode: AppShellNavMode.Rail } };
export const WithoutTopbar: Story = { args: { topbar: null } };
export const WithoutDetail: Story = { args: { detail: null } };
export const DetailClosed: Story = { args: { detailOpen: false } };
export const BelowMinimumWidth: Story = { decorators: [withViewportWidth(UNSUPPORTED_WIDTH)] };
export const Dark: Story = { globals: { theme: ResolvedTheme.Dark } };
