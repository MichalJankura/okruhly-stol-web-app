import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex space-x-2 space-y-5 justify-center">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 duration-200 rounded ${
            page === currentPage ? 'bg-purple-600 text-white' : 'bg-gray-300'
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
};

export default Pagination;
