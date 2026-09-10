"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  title = "Delete Confirmation",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  confirmText = "Delete Item",
  cancelText = "Cancel",
  onConfirm,
  loading = false,
}: ConfirmDeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-6">
        <DialogHeader className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-start gap-4">
          <div className="p-3 rounded-full bg-rose-100 text-rose-600 shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {description}
            </DialogDescription>
            {itemName && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 truncate">
                Target: <span className="font-bold underline">{itemName}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <DialogFooter className="mt-6 flex flex-col sm:flex-row justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
