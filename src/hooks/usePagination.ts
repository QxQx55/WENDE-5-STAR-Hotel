import { useState } from 'react';
import type { PaginationParams } from '../types';

export const usePagination = (initialLimit = 10) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const getPaginationParams = (): PaginationParams => ({
    page,
    limit,
    offset: (page - 1) * limit,
  });

  const goToPage = (pageNumber: number) => {
    setPage(pageNumber);
  };

  const nextPage = () => {
    setPage(p => p + 1);
  };

  const previousPage = () => {
    setPage(p => Math.max(1, p - 1));
  };

  const setPageSize = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return {
    page,
    limit,
    getPaginationParams,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
  };
};
