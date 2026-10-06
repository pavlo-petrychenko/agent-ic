import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlowEdge } from '@/shared/ui/flow/FlowEdge/FlowEdge';
import styles from '@/shared/ui/flow/FlowEdge/FlowEdge.module.scss';

const ORTHOGONAL_PATH = 'M 60 20 L 60 100 L 300 100 L 300 180';
const CURVE_PATH = 'M 60 20 C 60 120, 300 80, 300 180';
const MIDPOINT = { x: 180, y: 100 };

const meta = {
  component: FlowEdge,
  args: { path: ORTHOGONAL_PATH, midpoint: MIDPOINT, deleteLabel: 'Delete connection' },
  decorators: [
    (Story) => (
      <svg className={styles.storySvg}>
        <Story />
      </svg>
    ),
  ],
} satisfies Meta<typeof FlowEdge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { active: true } };
export const Selected: Story = { args: { selected: true, onDelete: () => undefined } };
export const Drawing: Story = { args: { path: CURVE_PATH, drawing: true } };
export const InsertionTarget: Story = { args: { inserting: true } };
