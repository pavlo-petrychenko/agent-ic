import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb/Breadcrumb';
import { BreadcrumbSize } from '@/shared/ui/navigation/Breadcrumb/Breadcrumb.constants';
import type { BreadcrumbItem } from '@/shared/ui/navigation/Breadcrumb/Breadcrumb.typedefs';

const PARENT_TRAIL: readonly BreadcrumbItem[] = [{ label: 'Agents', to: '/agents' }];

const FULL_TRAIL: readonly BreadcrumbItem[] = [
  { label: 'Agents', to: '/agents' },
  { label: 'Support bot', to: '/agents/support' },
  { label: 'Flows', to: '/agents/support/flows' },
  { label: 'Escalation to a human agent', to: null },
];

const LONG_TRAIL: readonly BreadcrumbItem[] = [
  { label: 'Acme workspace', to: '/w/acme' },
  { label: 'Agents', to: '/w/acme/agents' },
  { label: 'Customer support bot', to: '/w/acme/agents/support' },
  { label: 'Flows', to: '/w/acme/agents/support/flows' },
  { label: 'Escalation to a human agent', to: null },
];

const meta = {
  component: Breadcrumb,
  args: {
    items: FULL_TRAIL,
    size: BreadcrumbSize.Topbar,
    ariaLabel: 'Breadcrumb',
    moreLabel: 'Show hidden path',
  },
  argTypes: {
    size: { control: 'select', options: Object.values(BreadcrumbSize) },
  },
  decorators: [
    (Story) => (
      <div className="w-[480px] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Breadcrumb>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Topbar: Story = {};
export const HeaderParentLink: Story = {
  args: { items: PARENT_TRAIL, size: BreadcrumbSize.Header },
};
export const HeaderTrail: Story = { args: { size: BreadcrumbSize.Header } };
export const CollapsedMiddle: Story = {
  args: { items: LONG_TRAIL },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};
