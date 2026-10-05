import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Pagination } from '@/shared/ui/Pagination/Pagination';
import { DEFAULT_PAGE_SIZE, PaginationVariant } from '@/shared/ui/Pagination/Pagination.constants';
import styles from '@/shared/ui/Pagination/Pagination.module.scss';

const TOTAL = 412;

const meta = {
  component: Pagination,
  args: {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: TOTAL,
    rangeLabel: '1–25 of 412',
    rowsLabel: 'Rows',
    rowsPerPageLabel: 'Rows per page',
    previousLabel: 'Previous page',
    nextLabel: 'Next page',
    navLabel: 'Pagination',
    onPageChange: () => undefined,
    onPageSizeChange: () => undefined,
  },
  argTypes: {
    variant: { control: 'select', options: Object.values(PaginationVariant) },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyCard}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

const formatRange = (page: number, pageSize: number): string => {
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, TOTAL);
  return `${first}–${last} of ${TOTAL}`;
};

export const FirstPage: Story = {};
export const MiddlePage: Story = { args: { page: 4, rangeLabel: '76–100 of 412' } };
export const LastPage: Story = { args: { page: 17, rangeLabel: '401–412 of 412' } };
export const LoadMore: Story = {
  args: {
    variant: PaginationVariant.LoadMore,
    page: 2,
    pageSize: 50,
    total: 1037,
    rangeLabel: 'Showing 100 of 1,037',
    onLoadMore: () => undefined,
    loadMoreLabel: 'Load more',
  },
};
export const LoadMoreLoading: Story = {
  args: { ...LoadMore.args, loading: true },
};
export const Interactive: Story = {
  render: function InteractiveStory(args) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    return (
      <Pagination
        {...args}
        page={page}
        pageSize={pageSize}
        rangeLabel={formatRange(page, pageSize)}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    );
  },
};
