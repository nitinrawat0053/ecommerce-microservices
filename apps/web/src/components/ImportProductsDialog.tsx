import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Image as ImageIcon,
  Trash2,
  X,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface CsvRow {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
}

interface ValidatedRow extends CsvRow {
  _rowNumber: number;
  _errors: string[];
  _valid: boolean;
  _imageFile?: File;
  _imagePreview?: string;
  _imageUrl?: string; // uploaded URL
}

interface ImportResult {
  rowNumber: number;
  productId?: string;
  error?: string;
}

type Step = 'upload' | 'preview' | 'importing' | 'done';

const VALID_CATEGORIES = [
  'electronics',
  'fashion',
  'home & kitchen',
  'beauty',
  'sports',
  'books',
  'furniture',
  'kids & baby',
  'pet supplies',
  'auto',
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ImportProductsDialog() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    successCount: number;
    failureCount: number;
    total: number;
    details: ImportResult[];
  } | null>(null);

  /* ------ helpers ------ */
  const reset = () => {
    setStep('upload');
    setCsvFile(null);
    setRows([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) reset();
  };

  /* ------ CSV parsing & validation ------ */
  const validateRow = (row: CsvRow, idx: number): ValidatedRow => {
    const errors: string[] = [];
    if (!row.name?.trim()) errors.push('Name is required');
    if (row.name?.length > 200) errors.push('Name max 200 chars');
    if (!row.description?.trim()) errors.push('Description is required');
    if (row.description?.length > 2000) errors.push('Description max 2000 chars');
    if (isNaN(row.price) || row.price <= 0) errors.push('Price must be > 0');
    if (row.price > 9999999) errors.push('Price max 9,999,999');
    if (isNaN(row.stock) || row.stock < 0) errors.push('Stock must be ≥ 0');
    if (!row.category?.trim()) errors.push('Category is required');
    else if (!VALID_CATEGORIES.includes(row.category.toLowerCase().trim()))
      errors.push(`Invalid category: ${row.category}`);

    return {
      ...row,
      price: Number(row.price) || 0,
      stock: Number(row.stock) || 0,
      category: row.category?.toLowerCase().trim() || '',
      _rowNumber: idx + 2, // +2: header row + 0-index
      _errors: errors,
      _valid: errors.length === 0,
    };
  };

  const handleCsvUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setCsvFile(file);

      Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim(),
        complete(results) {
          if (results.errors.length > 0) {
            toast.error(`CSV parse error: ${results.errors[0].message}`);
            return;
          }
          if (results.data.length === 0) {
            toast.error('CSV file is empty');
            return;
          }

          const validated = results.data.map((row, i) => validateRow(row, i));
          setRows(validated);
          setStep('preview');
        },
        error(err) {
          toast.error(`Failed to parse CSV: ${err.message}`);
        },
      });
    },
    [],
  );

  /* ------ image assignment ------ */
  const handleImageAssign = (rowIdx: number, file: File) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIdx) return r;
        // revoke old preview
        if (r._imagePreview) URL.revokeObjectURL(r._imagePreview);
        return {
          ...r,
          _imageFile: file,
          _imagePreview: URL.createObjectURL(file),
        };
      }),
    );
  };

  const handleImageRemove = (rowIdx: number) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIdx) return r;
        if (r._imagePreview) URL.revokeObjectURL(r._imagePreview);
        return { ...r, _imageFile: undefined, _imagePreview: undefined };
      }),
    );
  };

  /* ------ bulk import ------ */
  const handleImport = async () => {
    const validRows = rows.filter((r) => _valid(r));
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setImporting(true);
    setStep('importing');

    try {
      // 1. Upload images with URLs
      const rowsWithImages = await Promise.all(
        validRows.map(async (row) => {
          if (row._imageFile) {
            const formData = new FormData();
            formData.append('image', row._imageFile);
            try {
              const res = await api.post('/products/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              return { ...row, _imageUrl: res.data.data.imageUrl };
            } catch {
              toast.error(`Failed to upload image for "${row.name}"`);
              return { ...row, _imageUrl: '' };
            }
          }
          return { ...row, _imageUrl: row.imageUrl || '' };
        }),
      );

      // 2. Bulk import
      const payload = rowsWithImages.map((r) => ({
        name: r.name,
        description: r.description,
        price: r.price,
        stock: r.stock,
        category: r.category,
        imageUrl: r._imageUrl,
      }));

      const res = await api.post('/products/import', { rows: payload });

      setResult({
        success: res.data.success,
        successCount: res.data.data.successCount,
        failureCount: res.data.data.failureCount,
        total: res.data.data.totalRows,
        details: res.data.data.results || [],
      });
      setStep('done');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  /* ------ render ------ */
  const validCount = rows.filter((r) => _valid(r)).length;
  const invalidCount = rows.filter((r) => !_valid(r)).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload size={16} /> Import CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ======================== UPLOAD STEP ======================== */}
        {step === 'upload' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet size={20} /> Import Products from CSV
              </DialogTitle>
              <DialogDescription>
                Upload a CSV file with your products. Download the template
                first to see the required format.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-auto py-4 space-y-4">
              {/* Template download */}
              <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed bg-muted/30">
                <FileSpreadsheet size={24} className="text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Don't have a template?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Download the CSV template with example products.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    api
                      .get('/products/import/template', {
                        responseType: 'blob',
                      })
                      .then((res) => {
                        const url = URL.createObjectURL(res.data);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'product-import-template.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Template downloaded');
                      });
                  }}
                >
                  <Download size={14} className="mr-1" /> Download Template
                </Button>
              </div>

              {/* File upload */}
              <div
                className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed hover:border-primary/50 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCsvUpload}
                />
                <Upload
                  size={40}
                  className="text-muted-foreground mb-3"
                />
                <p className="text-sm font-medium">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  CSV files up to 10MB
                </p>
              </div>
            </div>
          </>
        )}

        {/* ======================== PREVIEW STEP ======================== */}
        {step === 'preview' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet size={20} /> Preview Import
              </DialogTitle>
              <DialogDescription>
                Review your products below. Fix any errors before importing.
              </DialogDescription>
            </DialogHeader>

            {/* Summary badges */}
            <div className="flex items-center gap-3 py-2">
              <Badge variant="outline" className="gap-1">
                <FileSpreadsheet size={12} /> {rows.length} total rows
              </Badge>
              {validCount > 0 && (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <CheckCircle2 size={12} /> {validCount} valid
                </Badge>
              )}
              {invalidCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle size={12} /> {invalidCount} errors
                </Badge>
              )}
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw size={14} className="mr-1" /> Start Over
              </Button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-background z-10">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="w-32">Image</TableHead>
                    <TableHead className="w-48">Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={
                        row._valid ? '' : 'bg-destructive/5'
                      }
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {row._rowNumber}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <Input
                            value={row.name}
                            onChange={(e) => {
                              const v = e.target.value;
                              setRows((prev) =>
                                prev.map((r, i) => {
                                  if (i !== idx) return r;
                                  const updated = validateRow({ ...r, name: v }, r._rowNumber - 2);
                                  return { ...updated, _imageFile: r._imageFile, _imagePreview: r._imagePreview, _imageUrl: r._imageUrl };
                                }),
                              );
                            }}
                            className={`h-8 text-xs ${row._valid ? '' : 'border-destructive'}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {row.category || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        ₹{(row.price || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {row.stock}
                      </TableCell>
                      <TableCell>
                        {/* Image assign / preview */}
                        <div className="flex items-center gap-1">
                          {row._imagePreview || row.imageUrl ? (
                            <div className="relative w-8 h-8 rounded overflow-hidden border">
                              <img
                                src={row._imagePreview || row.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => handleImageRemove(idx)}
                                className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleImageAssign(idx, f);
                                }}
                              />
                              <div className="w-8 h-8 rounded border border-dashed flex items-center justify-center hover:border-primary/50 transition-colors">
                                <ImageIcon
                                  size={14}
                                  className="text-muted-foreground"
                                />
                              </div>
                            </label>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row._errors.length > 0 ? (
                          <div className="space-y-0.5">
                            {row._errors.map((err, ei) => (
                              <p
                                key={ei}
                                className="text-[10px] text-destructive flex items-center gap-1"
                              >
                                <AlertTriangle size={10} /> {err}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <CheckCircle2
                            size={14}
                            className="text-green-500"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || importing}
                className="gap-2"
              >
                {importing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                Import {validCount} Product{validCount !== 1 ? 's' : ''}
                <ArrowRight size={14} />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ======================== IMPORTING STEP ======================== */}
        {step === 'importing' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 size={20} className="animate-spin" /> Importing Products…
              </DialogTitle>
              <DialogDescription>
                Please wait while we import your products.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2
                  size={48}
                  className="animate-spin text-primary mx-auto"
                />
                <p className="text-sm text-muted-foreground">
                  Uploading images and inserting products into the database…
                </p>
              </div>
            </div>
          </>
        )}

        {/* ======================== DONE STEP ======================== */}
        {step === 'done' && result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle2
                      size={20}
                      className="text-green-500"
                    />{' '}
                    Import Complete
                  </>
                ) : (
                  <>
                    <XCircle size={20} className="text-destructive" />{' '}
                    Import Failed
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-auto space-y-4 py-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-lg border text-center">
                  <p className="text-2xl font-bold">{result.total}</p>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </div>
                <div className="p-4 rounded-lg border text-center bg-green-50 dark:bg-green-950/20">
                  <p className="text-2xl font-bold text-green-600">
                    {result.successCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Imported</p>
                </div>
                <div className="p-4 rounded-lg border text-center bg-red-50 dark:bg-red-950/20">
                  <p className="text-2xl font-bold text-destructive">
                    {result.failureCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              {/* Details table */}
              {result.details.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.details.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">
                            {d.rowNumber}
                          </TableCell>
                          <TableCell>
                            {d.productId ? (
                              <Badge
                                variant="default"
                                className="bg-green-600 text-[10px]"
                              >
                                Success
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="text-[10px]"
                              >
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {d.productId
                              ? `Product ID: ${d.productId}`
                              : d.error}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={reset}>
                <RotateCcw size={14} className="mr-1" /> Import More
              </Button>
              {result.successCount > 0 && (
                <Button onClick={() => { handleOpenChange(false); navigate('/admin/products'); }}>
                  View Products
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* helper to avoid TS confusion with the inline validation */
function _valid(r: ValidatedRow) {
  return r._valid;
}
