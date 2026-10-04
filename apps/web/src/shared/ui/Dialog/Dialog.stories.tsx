import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ButtonVariant } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog/Dialog';
import { DialogSize } from '@/shared/ui/Dialog/Dialog.constants';
import styles from '@/shared/ui/Dialog/Dialog.module.scss';

const LONG_BODY_PARAGRAPHS = Array.from({ length: 24 }, (_, index) => index);

const meta = {
  component: Dialog,
  args: {
    open: true,
    onOpenChange: () => undefined,
    title: 'Delete agent',
    description: 'This removes the agent and its published versions.',
    closeLabel: 'Close',
    size: DialogSize.Md,
    footerLeft: <span>Deleted agents cannot be restored.</span>,
    footerRight: (
      <>
        <Button variant={ButtonVariant.Secondary}>Cancel</Button>
        <Button variant={ButtonVariant.Danger}>Delete</Button>
      </>
    ),
    children: 'Type the agent name to confirm that you want to delete it.',
  },
  argTypes: {
    size: { control: 'select', options: Object.values(DialogSize) },
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Medium: Story = {};
export const Small: Story = { args: { size: DialogSize.Sm } };
export const Large: Story = { args: { size: DialogSize.Lg } };
export const ExtraLarge: Story = { args: { size: DialogSize.Xl } };
export const WithoutDescription: Story = { args: { description: null } };
export const WithoutFooter: Story = { args: { footerLeft: null, footerRight: null } };
export const FooterRightOnly: Story = { args: { footerLeft: null } };
export const ScrollingBody: Story = {
  args: {
    children: (
      <div className={styles.storyStack}>
        {LONG_BODY_PARAGRAPHS.map((index) => (
          <p key={index}>The body scrolls while the header and footer stay in place.</p>
        ))}
      </div>
    ),
  },
};
export const Busy: Story = {
  args: {
    busy: true,
    title: 'Pause agent',
    description: 'The agent stops answering new chats.',
    footerLeft: null,
    footerRight: (
      <>
        <Button variant={ButtonVariant.Secondary} disabled>
          Cancel
        </Button>
        <Button loading>Pausing…</Button>
      </>
    ),
    children: 'Chats already in progress finish normally.',
  },
};
export const WithError: Story = {
  args: {
    title: 'Pause agent',
    description: 'The agent stops answering new chats.',
    error: 'Could not pause the agent. Check your connection and try again.',
    footerLeft: null,
    footerRight: (
      <>
        <Button variant={ButtonVariant.Secondary}>Cancel</Button>
        <Button>Try again</Button>
      </>
    ),
    children: 'Chats already in progress finish normally.',
  },
};
export const DestructiveConfirm: Story = {
  args: {
    size: DialogSize.Sm,
    title: 'Delete Salon assistant?',
    description: null,
    footerLeft: null,
    footerRight: (
      <>
        <Button variant={ButtonVariant.Secondary}>Cancel</Button>
        <Button variant={ButtonVariant.Danger}>Delete agent</Button>
      </>
    ),
    children: 'The agent and its published versions are removed for good.',
  },
};
export const Closed: Story = { args: { open: false } };
