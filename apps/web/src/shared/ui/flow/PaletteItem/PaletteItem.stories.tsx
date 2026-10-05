import type { Meta, StoryObj } from '@storybook/react-vite';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { FlowNode } from '@/shared/ui/flow/FlowNode/FlowNode';
import { PaletteItem } from '@/shared/ui/flow/PaletteItem/PaletteItem';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/flow/PaletteItem/PaletteItem.module.scss';

const noop = () => undefined;

const ghost = <FlowNode kind={NodeKind.Send} overline="Send message" name="Send message" />;

const meta = {
  component: PaletteItem,
  args: {
    label: 'Send message',
    kind: NodeKind.Send,
    onSelect: noop,
    dragData: 'send_message',
    ghost,
  },
  argTypes: {
    kind: { control: 'select', options: Object.values(NodeKind) },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyList}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PaletteItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Dragging: Story = { args: { dragging: true } };
export const Disabled: Story = { args: { disabled: true } };
export const NotDraggable: Story = { args: { dragData: null } };
export const Palette: Story = {
  render: (args) => (
    <>
      <PaletteItem {...args} label="Agent" kind={NodeKind.Agent} dragData="agent" />
      <PaletteItem {...args} />
      <PaletteItem {...args} label="API request" kind={NodeKind.Api} dragData="api_request" />
      <PaletteItem
        {...args}
        label="Tool event"
        kind={NodeKind.Trig}
        icon={IconName.ToolEvent}
        dragData="tool_event"
        dragging
      />
      <PaletteItem {...args} label="Hand to a person" kind={NodeKind.Esc} disabled />
    </>
  ),
};
export const DragGhost: Story = {
  render: () => <div className={styles.storyGhost}>{ghost}</div>,
};
