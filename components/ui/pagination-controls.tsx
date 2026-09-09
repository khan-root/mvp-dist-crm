"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage?: number;
  page?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  totalRecords?: number;
  pageSize?: number;
}

export function PaginationControls({
  currentPage,
  page,
  totalPages: passedTotalPages,
  onPageChange,
  totalItems: passedTotalItems,
  totalRecords,
  pageSize = 10,
}: PaginationControlsProps) {
  const activePage = page ?? currentPage ?? 1;
  const totalCount = totalRecords ?? passedTotalItems;
  const totalPages = passedTotalPages ?? (totalCount ? Math.ceil(totalCount / pageSize) : 1);

  if (totalPages <= 1 && (!totalCount || totalCount <= pageSize)) {
    return null;
  }

  const startItem = (activePage - 1) * pageSize + 1;
  const endItem = Math.min(activePage * pageSize, totalCount || activePage * pageSize);

  // Generate page numbers
  const pages: number[] = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, activePage - Math.floor(maxPagesToShow / 2));
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
        {totalCount !== undefined ? (
          <>
            Showing <span className="font-bold text-slate-900">{startItem}</span> to{" "}
            <span className="font-bold text-slate-900">{endItem}</span> of{" "}
            <span className="font-bold text-slate-900">{totalCount}</span> entries
          </>
        ) : (
          <>
            Page <span className="font-bold text-slate-900">{activePage}</span> of{" "}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={activePage <= 1}
          onClick={() => onPageChange(activePage - 1)}
          className="h-8 px-2.5 text-xs font-semibold cursor-pointer gap-1"
        >
          <ChevronLeft className="size-3.5" /> Previous
        </Button>

        {pages.map((p) => (
          <Button
            key={p}
            variant={p === activePage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 text-xs font-mono font-bold cursor-pointer ${
              p === activePage ? "bg-slate-900 text-white shadow-xs" : "hover:bg-slate-100"
            }`}
          >
            {p}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          disabled={activePage >= totalPages}
          onClick={() => onPageChange(activePage + 1)}
          className="h-8 px-2.5 text-xs font-semibold cursor-pointer gap-1"
        >
          Next <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
