import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { Button, ButtonVariant } from '@/shared/ui/Button';
import { TextLink } from '@/shared/ui/TextLink';
import { WizardFrame } from '@/shared/ui/WizardFrame/WizardFrame';
import { withMemoryRouter, withViewportWidth } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/WizardFrame/WizardFrame.module.scss';

const COMPACT_WIDTH = 1100;
const SPLIT_WIDTH = 1500;

const STEPS = [
  { id: 'template', label: 'Template' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'channel', label: 'Channel' },
  { id: 'publish', label: 'Publish' },
];

const meta = {
  component: WizardFrame,
  parameters: { layout: 'fullscreen' },
  decorators: [withViewportWidth(SPLIT_WIDTH), withMemoryRouter],
  args: {
    title: 'Demo salon assistant',
    subtitle: 'New agent',
    steps: STEPS,
    current: 1,
    stepperLabel: 'Setup progress',
    stepCompletedLabel: 'completed',
    exitLabel: 'Exit',
    onExit: () => undefined,
    previewLabel: 'Preview',
    side: (
      <>
        <h3 className={styles.storySideTitle}>Try it as you go</h3>
        <p className={styles.storySideText}>
          Chat with your agent here while you build it. Changes show up straight away.
        </p>
      </>
    ),
    footerLeft: <Button variant={ButtonVariant.Secondary}>Back</Button>,
    footerRight: (
      <>
        <TextLink to="/">Skip for now</TextLink>
        <Button>Continue</Button>
      </>
    ),
    children: <p>Add the documents your agent should know about.</p>,
  },
} satisfies Meta<typeof WizardFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithPreview: Story = {};
export const WithoutPreview: Story = { args: { side: null } };
export const FirstStep: Story = {
  args: { current: 0, footerLeft: null },
};
export const LastStep: Story = {
  args: { current: 3, footerRight: <Button>Publish</Button> },
};
export const FooterBusy: Story = {
  args: { footerRight: <Button loading>Saving…</Button> },
};
export const FooterDisabled: Story = {
  args: { footerRight: <Button disabled>Continue</Button> },
};
export const CompactPreviewButton: Story = {
  decorators: [withViewportWidth(COMPACT_WIDTH)],
};
export const Dark: Story = { globals: { theme: ResolvedTheme.Dark } };
