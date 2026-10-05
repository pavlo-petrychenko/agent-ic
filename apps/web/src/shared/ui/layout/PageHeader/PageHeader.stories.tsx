import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/shared/ui/actions/Button/Button';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { PageHeader } from '@/shared/ui/layout/PageHeader/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb/Breadcrumb';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';

const meta = {
  component: PageHeader,
  args: { title: 'Agents', subtitle: 'Build, test and publish chat agents for Demo salon' },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = { args: { subtitle: null } };
export const WithSubtitle: Story = {};
export const WithActions: Story = {
  args: { actions: <Button icon={IconName.Plus}>New agent</Button> },
};
export const WithCrumbs: Story = {
  decorators: [withMemoryRouter],
  args: {
    title: 'Team',
    subtitle: '5 members · each person has one role in this workspace',
    crumbs: (
      <Breadcrumb
        ariaLabel="Breadcrumb"
        moreLabel="More"
        items={[{ label: 'Settings', to: '/' }]}
      />
    ),
  },
};
