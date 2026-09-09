"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BULK_TEMPLATES, parseCSVText } from "@/lib/bulk-templates";
import { Download, Upload, CheckCircle2, AlertCircle, RefreshCw, FileSpreadsheet, ArrowRight } from "lucide-react";

export function BulkImportDialog({
  entityType,
  onImportSuccess,
}: {
  entityType: string;
  onImportSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [resultSummary, setResultSummary] = useState<{
    total: number;
    inserted: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const template = BULK_TEMPLATES[entityType] || BULK_TEMPLATES.products;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorMsg("");
    setResultSummary(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        setErrorMsg("Uploaded file is empty");
        return;
      }

      try {
        const rows = parseCSVText(text);
        if (rows.length === 0) {
          setErrorMsg("No data rows found in CSV file.");
        } else {
          setParsedRows(rows);
        }
      } catch (err: any) {
        setErrorMsg(`CSV Parse Error: ${err?.message || "Invalid CSV format"}`);
      }
    };
    reader.readAsText(file);
  }

  function handleDownloadTemplate() {
    window.open(`/api/bulk-import/template?entity=${entityType}`, "_blank");
  }

  async function handleExecuteImport() {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setErrorMsg("");
    setResultSummary(null);

    try {
      const res = await fetch("/api/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          entity: entityType,
          rows: parsedRows,
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        setErrorMsg(d.error || "Bulk import failed");
        return;
      }

      setResultSummary(d.data);
      if (d.data.inserted > 0 && onImportSuccess) {
        onImportSuccess();
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Network error during bulk import");
    } finally {
      setImporting(false);
    }
  }

  function resetState() {
    setParsedRows([]);
    setFileName("");
    setResultSummary(null);
    setErrorMsg("");
  }

  // Row validation check helper
  function checkRowValidity(row: Record<string, string>): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];
    template.requiredFields.forEach((f) => {
      if (!row[f] || row[f].trim() === "") {
        missing.push(f);
      }
    });
    return { isValid: missing.length === 0, missing };
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
          <Upload className="size-3.5" /> Bulk Import
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-emerald-600" />
            <DialogTitle>Bulk Import {template.label}</DialogTitle>
          </div>
          <DialogDescription>
            Download the sample template, populate data rows, and upload your CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1 flex-1 pt-2">
          {/* STEP 1: DOWNLOAD TEMPLATE BANNER */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">Step 1: Download Sample Excel / CSV Template</span>
              <p className="text-[11px] text-slate-500">
                Pre-formatted template with required columns ({template.requiredFields.join(", ")}).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 shrink-0 font-semibold"
            >
              <Download className="size-3.5" /> Download Template (.CSV)
            </Button>
          </div>

          {/* STEP 2: FILE UPLOADER */}
          <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-center space-y-2">
            <span className="text-xs font-bold text-slate-900 block">Step 2: Select & Upload Filled CSV File</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
            />
            {fileName && <p className="text-xs font-mono font-semibold text-emerald-700">Selected: {fileName}</p>}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="size-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultSummary && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Import Complete: {resultSummary.inserted} inserted, {resultSummary.failed} failed out of {resultSummary.total} total rows.
              </div>
              {resultSummary.errors.length > 0 && (
                <div className="pt-2 border-t border-emerald-200/80 space-y-1">
                  <span className="font-semibold block text-rose-700">Row Import Errors:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-rose-700 font-mono text-[11px]">
                    {resultSummary.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PREVIEW DATA MATRIX */}
          {parsedRows.length > 0 && !resultSummary && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Step 3: Preview Data Matrix ({parsedRows.length} Rows Parsed)
                </span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 text-[10px]">
                  Ready for Validation & Import
                </Badge>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-x-auto max-h-60">
                <Table>
                  <TableHeader className="bg-slate-100 sticky top-0">
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead className="w-12">#</TableHead>
                      {template.headers.slice(0, 6).map((h) => (
                        <TableHead key={h} className="text-xs font-bold capitalize">
                          {h.replace("_", " ")}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((r, idx) => {
                      const { isValid, missing } = checkRowValidity(r);
                      return (
                        <TableRow key={idx} className="hover:bg-slate-50 text-xs">
                          <TableCell>
                            {isValid ? (
                              <span title="Valid Row">
                                <CheckCircle2 className="size-4 text-emerald-600" />
                              </span>
                            ) : (
                              <span title={`Missing: ${missing.join(", ")}`}>
                                <AlertCircle className="size-4 text-rose-600" />
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-slate-500">{idx + 1}</TableCell>
                          {template.headers.slice(0, 6).map((h) => (
                            <TableCell key={h} className="font-medium text-slate-900">
                              {r[h] || <span className="text-slate-400 italic">N/A</span>}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 flex justify-between border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>

          {parsedRows.length > 0 && !resultSummary && (
            <Button
              onClick={handleExecuteImport}
              disabled={importing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-xs"
            >
              {importing ? (
                <>
                  <RefreshCw className="size-4 animate-spin" /> Importing Records…
                </>
              ) : (
                <>
                  Confirm Bulk Import ({parsedRows.length} Rows) <ArrowRight className="size-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
