import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { Badge, BadgeTone } from '@/shared/ui/Badge';
import { FileRow } from '@/shared/ui/FileRow/FileRow';
import { FileRowList } from '@/shared/ui/FileRow/FileRowList';
import { IconName } from '@/shared/ui/Icon';
import { NodeKind, NodeTile, TileSize } from '@/shared/ui/NodeTile';
import styles from '@/shared/ui/FileRow/FileRow.module.scss';

const kbTile = <NodeTile kind={NodeKind.Kb} size={TileSize.Sm} icon={IconName.Kb} />;

const meta = {
  component: FileRow,
  decorators: [
    (Story) => (
      <FileRowList aria-label="Added files" className={styles.storyList}>
        <Story />
      </FileRowList>
    ),
  ],
  args: {
    icon: kbTile,
    name: 'price-list.pdf',
    subtitle: '2.4 MB · 12 pages',
    status: (
      <Badge tone={BadgeTone.Ok} dot>
        Ready
      </Badge>
    ),
    removeLabel: 'Remove',
    onRemove: () => undefined,
  },
} satisfies Meta<typeof FileRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Indexing: Story = {
  args: {
    status: (
      <Badge tone={BadgeTone.Warn} dot>
        Indexing
      </Badge>
    ),
  },
};
export const Failed: Story = {
  args: {
    status: (
      <Badge tone={BadgeTone.Err} dot>
        Failed
      </Badge>
    ),
  },
};
export const WithoutStatus: Story = { args: { status: null } };
export const Removing: Story = { args: { disabled: true } };
export const LongName: Story = {
  args: { name: 'services-and-prices-spring-collection-2026-final-v3.pdf' },
};
export const InList: Story = {
  decorators: [
    (Story) => (
      <>
        <Story />
        <FileRow
          icon={kbTile}
          name="faq.docx"
          subtitle="180 KB · 4 pages"
          status={
            <Badge tone={BadgeTone.Ok} dot>
              Ready
            </Badge>
          }
          removeLabel="Remove"
          onRemove={() => undefined}
        />
        <FileRow
          icon={kbTile}
          name="booking-rules.txt"
          subtitle="12 KB"
          removeLabel="Remove"
          onRemove={() => undefined}
        />
      </>
    ),
  ],
};
export const Dark: Story = {
  globals: { theme: ResolvedTheme.Dark },
  decorators: InList.decorators,
};
