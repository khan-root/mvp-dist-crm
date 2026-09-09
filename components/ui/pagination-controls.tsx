"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
}: PaginationControlsProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || currentPage * pageSize);

  // Generate page numbers
  const pages: number[] = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
      <div className="text-xs text-slate-500 font-medium font-mono">
        {totalItems !== undefined ? (
          <>
            Showing <span className="font-bold text-slate-900">{startItem}</span> to{" "}
            <span className="font-bold text-slate-900">{endItem}</span> of{" "}
            <span className="font-bold text-slate-900">{totalItems}</span> entries
          </>
        ) : (
          <>
            Page <span className="font-bold text-slate-900">{currentPage}</span> of{" "}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 px-2.5 text-xs font-semibold cursor-pointer gap-1"
        >
          <ChevronLeft className="size-3.5" /> Previous
        </Button>

        {pages.map((p) => (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 text-xs font-mono font-bold cursor-pointer ${
              p === currentPage ? "bg-slate-900 text-white shadow-xs" : "hover:bg-slate-100"
            }`}
          >
            {p}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 px-2.5 text-xs font-semibold cursor-pointer gap-1"
        >
          Next <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
