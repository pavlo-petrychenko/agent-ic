import type { Meta, StoryObj } from '@storybook/react-vite';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { SecondaryNav } from '@/shared/ui/navigation/SecondaryNav/SecondaryNav';
import type { SecondaryNavGroup } from '@/shared/ui/navigation/SecondaryNav/SecondaryNav.typedefs';
import { HeadingElement } from '@/shared/ui/typography/Heading';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';

const noop = () => undefined;

const GROUPS: readonly SecondaryNavGroup[] = [
  {
    id: 'tools',
    label: 'Tools',
    action: { label: 'New tool', onClick: noop },
    items: [
      {
        id: 'create-booking',
        to: '/auth/login',
        title: 'create_booking',
        subtitle: 'Creates a booking',
        monoTitle: true,
        tile: { icon: null, tone: NodeKind.Tool },
        selected: true,
      },
      {
        id: 'cancel-booking',
        to: '/auth/sign-up',
        title: 'cancel_booking',
        subtitle: 'Cancels a booking',
        monoTitle: true,
        tile: { icon: null, tone: NodeKind.Tool },
        selected: false,
      },
    ],
  },
  {
    id: 'api',
    label: 'API connections',
    action: { label: 'New connection', onClick: noop },
    items: [
      {
        id: 'crm',
        to: '/auth/forgot-password',
        title: 'Salon CRM',
        subtitle: 'api.salon-crm.example',
        monoTitle: false,
        tile: { icon: null, tone: NodeKind.Api },
        selected: false,
      },
    ],
  },
];

const meta = {
  component: SecondaryNav,
  decorators: [withMemoryRouter],
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Tools',
    ariaLabel: 'Tools and API connections',
    action: { label: 'New', onClick: noop },
    groups: GROUPS,
  },
} satisfies Meta<typeof SecondaryNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutCreateButton: Story = { args: { action: null } };
export const AsSecondLevelHeading: Story = { args: { headingAs: HeadingElement.H2 } };
export const Empty: Story = {
  args: {
    groups: [
      { id: 'tools', label: 'Tools', action: { label: 'New tool', onClick: noop }, items: [] },
    ],
  },
};
