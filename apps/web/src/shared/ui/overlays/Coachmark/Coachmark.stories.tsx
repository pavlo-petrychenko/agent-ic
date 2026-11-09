import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '@/shared/ui/actions/Button';
import { Coachmark } from '@/shared/ui/overlays/Coachmark/Coachmark';
import { CoachmarkPlacement } from '@/shared/ui/overlays/Coachmark/Coachmark.constants';
import type { CoachmarkProps } from '@/shared/ui/overlays/Coachmark/Coachmark.typedefs';
import styles from '@/shared/ui/overlays/Coachmark/Coachmark.module.scss';

const NARROW_VIEWPORT = 'mobile1';

const formatProgress: CoachmarkProps['formatProgress'] = ({ current, total }) =>
  `${current} of ${total}`;

function CoachmarkStage({
  withTarget,
  ...props
}: Omit<CoachmarkProps, 'target'> & { withTarget: boolean }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  return (
    <div className={styles.storyStage}>
      <p className={styles.storyCopy}>The page behind the tour stays in place.</p>
      <Button ref={setTarget}>Publish agent</Button>
      <Coachmark {...props} target={withTarget ? target : null} />
    </div>
  );
}

const meta = {
  component: Coachmark,
  render: ({ target: _target, ...args }) => <CoachmarkStage {...args} withTarget />,
  args: {
    open: true,
    target: null,
    title: 'Publish your agent',
    children: 'Publishing puts the agent on your channels. You can pause it at any time.',
    progress: null,
    formatProgress,
    placement: CoachmarkPlacement.Bottom,
    primaryAction: { label: 'Next', onClick: () => undefined },
    secondaryAction: null,
    skipStepAction: null,
    onDismiss: () => undefined,
    dismissLabel: 'Skip tour',
    closeLabel: 'Close tour',
  },
  argTypes: {
    placement: { control: 'select', options: Object.values(CoachmarkPlacement) },
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Coachmark>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlacedBelow: Story = {};
export const PlacedAbove: Story = { args: { placement: CoachmarkPlacement.Top } };
export const PlacedRight: Story = { args: { placement: CoachmarkPlacement.Right } };
export const PlacedLeft: Story = { args: { placement: CoachmarkPlacement.Left } };
export const WithoutTarget: Story = {
  render: ({ target: _target, ...args }) => <CoachmarkStage {...args} withTarget={false} />,
  args: {
    title: 'Welcome to your workspace',
    children: 'A short tour shows where to build an agent, publish it and test it.',
    primaryAction: { label: 'Start the tour', onClick: () => undefined },
  },
};
export const WithProgressAndAllActions: Story = {
  args: {
    progress: { current: 2, total: 9 },
    primaryAction: { label: 'Next', onClick: () => undefined },
    secondaryAction: { label: 'Back', onClick: () => undefined },
    skipStepAction: { label: 'Skip step', onClick: () => undefined },
  },
};
export const LongText: Story = {
  args: {
    progress: { current: 5, total: 9 },
    title: 'Give the agent knowledge from your own documents and keep it up to date',
    children: (
      <>
        <p>
          Upload files, paste a page address or write short answers by hand. The agent searches this
          knowledge before it replies, so customers get facts that match your business.
        </p>
        <p>
          Every source is checked and split into small passages. When a source changes, the agent
          reads the new version the next time it runs, and nothing needs to be published again.
        </p>
      </>
    ),
    primaryAction: { label: 'Next', onClick: () => undefined },
    secondaryAction: { label: 'Back', onClick: () => undefined },
    skipStepAction: { label: 'Skip step', onClick: () => undefined },
  },
};
export const NarrowViewport: Story = {
  args: {
    progress: { current: 3, total: 9 },
    secondaryAction: { label: 'Back', onClick: () => undefined },
    skipStepAction: { label: 'Skip step', onClick: () => undefined },
  },
  globals: { viewport: { value: NARROW_VIEWPORT, isRotated: false } },
};
export const Closed: Story = { args: { open: false } };
