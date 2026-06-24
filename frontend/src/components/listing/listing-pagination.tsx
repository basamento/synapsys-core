import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import type { PageInfo } from "@/api/app-data";

type ListingPaginationProps = {
  pageInfo: PageInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

export function ListingPagination({
  pageInfo,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}: ListingPaginationProps) {
  const pages = visiblePages(pageInfo.page, pageInfo.totalPages);
  const firstItem = pageInfo.totalItems === 0 ? 0 : (pageInfo.page - 1) * pageInfo.pageSize + 1;
  const lastItem = Math.min(pageInfo.page * pageInfo.pageSize, pageInfo.totalItems);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {firstItem}-{lastItem} of {pageInfo.totalItems}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {pageInfo.pageSize} / page
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {pageSizeOptions.map((option) => (
              <DropdownMenuItem
                key={option}
                onSelect={() => onPageSizeChange(option)}
                className={option === pageInfo.pageSize ? "bg-accent" : undefined}
              >
                {option} / page
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={pageInfo.page <= 1}
                onClick={() => onPageChange(pageInfo.page - 1)}
              />
            </PaginationItem>
            {pages.map((page) => (
              <PaginationItem key={page}>
                <PaginationButton
                  isActive={page === pageInfo.page}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </PaginationButton>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                disabled={pageInfo.page >= pageInfo.totalPages}
                onClick={() => onPageChange(pageInfo.page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

function visiblePages(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, currentPage + 1);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (!pages.includes(1)) {
    pages.unshift(1);
  }
  if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return pages;
}
