"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import JsBarcode from "jsbarcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag, Printer, Settings2, Loader2 } from "lucide-react";
import { generateItemCode } from "@/lib/label-formats";

interface LabelFormat {
  id: string;
  name: string;
  widthInches: number;
  heightInches: number;
  isPreset: boolean;
  description: string | null;
}

interface TagItem {
  id: string;
  name: string;
  sku: string | null;
  organizationId: string;
  category?: { name: string } | null;
  location?: string | null;
}

interface TagPrintProps {
  item: TagItem;
  trigger?: React.ReactNode;
}

// Generate barcode code from item
function getBarcodeValue(item: TagItem): string {
  // Prefer SKU if set, otherwise generate from IDs
  if (item.sku) {
    return item.sku;
  }
  return generateItemCode(item.organizationId, item.id);
}

// Single tag preview component
function TagPreview({
  item,
  format,
  showBorder = true,
}: {
  item: TagItem;
  format: LabelFormat;
  showBorder?: boolean;
}) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const barcodeValue = getBarcodeValue(item);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, barcodeValue, {
        format: "CODE128",
        width: 1.5,
        height: 30,
        displayValue: true,
        fontSize: 10,
        margin: 2,
        textMargin: 1,
      });
    }
  }, [barcodeValue]);

  // Convert inches to pixels for preview (96 DPI for screen)
  const previewDpi = 96;
  const widthPx = format.widthInches * previewDpi;
  const heightPx = format.heightInches * previewDpi;

  return (
    <div
      className={`bg-white text-black p-2 flex flex-col justify-between overflow-hidden ${
        showBorder ? "border border-zinc-300" : ""
      }`}
      style={{
        width: `${widthPx}px`,
        height: `${heightPx}px`,
      }}
    >
      {/* Item name */}
      <div
        className="font-semibold text-center leading-tight truncate"
        style={{ fontSize: Math.min(12, heightPx / 8) }}
      >
        {item.name}
      </div>

      {/* Barcode */}
      <div className="flex justify-center flex-1 items-center overflow-hidden">
        <svg ref={barcodeRef} className="max-w-full" />
      </div>

      {/* Category/Location footer */}
      {(item.category || item.location) && (
        <div
          className="text-center text-zinc-600 truncate"
          style={{ fontSize: Math.min(8, heightPx / 12) }}
        >
          {item.category?.name || item.location}
        </div>
      )}
    </div>
  );
}

// Printable tag sheet (hidden, used for printing)
function PrintableTagSheet({
  item,
  format,
  copies,
}: {
  item: TagItem;
  format: LabelFormat;
  copies: number;
}) {
  const barcodeRefs = useRef<(SVGSVGElement | null)[]>([]);
  const barcodeValue = getBarcodeValue(item);

  useEffect(() => {
    barcodeRefs.current.forEach((ref) => {
      if (ref) {
        JsBarcode(ref, barcodeValue, {
          format: "CODE128",
          width: 2,
          height: 40,
          displayValue: true,
          fontSize: 12,
          margin: 2,
          textMargin: 2,
        });
      }
    });
  }, [barcodeValue, copies]);

  return (
    <div className="print-only">
      {Array.from({ length: copies }).map((_, i) => (
        <div
          key={i}
          className="page-break-after bg-white text-black p-2 flex flex-col justify-between"
          style={{
            width: `${format.widthInches}in`,
            height: `${format.heightInches}in`,
            pageBreakAfter: i < copies - 1 ? "always" : "auto",
          }}
        >
          <div className="font-bold text-center text-sm leading-tight truncate">
            {item.name}
          </div>
          <div className="flex justify-center flex-1 items-center">
            <svg
              ref={(el) => {
                barcodeRefs.current[i] = el;
              }}
            />
          </div>
          {(item.category || item.location) && (
            <div className="text-center text-xs text-zinc-600 truncate">
              {item.category?.name || item.location}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function TagPrint({ item, trigger }: TagPrintProps) {
  const [open, setOpen] = useState(false);
  const [formats, setFormats] = useState<LabelFormat[]>([]);
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copies, setCopies] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);

  const selectedFormat = formats.find((f) => f.id === selectedFormatId);

  const loadFormats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/label-formats");
      if (res.ok) {
        const data = await res.json();
        setFormats(data.formats);
        // Set default format
        if (data.selectedFormatId) {
          setSelectedFormatId(data.selectedFormatId);
        } else if (data.formats.length > 0) {
          setSelectedFormatId(data.formats[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load formats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadFormats();
    }
  }, [open, loadFormats]);

  const handlePrint = () => {
    if (!selectedFormat) return;

    // Create a print window with just the tags
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print tags");
      return;
    }

    const barcodeValue = getBarcodeValue(item);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Tag - ${item.name}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <style>
            @page {
              size: ${selectedFormat.widthInches}in ${selectedFormat.heightInches}in;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
            }
            .tag {
              width: ${selectedFormat.widthInches}in;
              height: ${selectedFormat.heightInches}in;
              padding: 0.1in;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-after: always;
              background: white;
            }
            .tag:last-child {
              page-break-after: auto;
            }
            .name {
              font-weight: bold;
              font-size: 10pt;
              text-align: center;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .barcode {
              display: flex;
              justify-content: center;
              align-items: center;
              flex: 1;
            }
            .barcode svg {
              max-width: 100%;
            }
            .footer {
              font-size: 7pt;
              text-align: center;
              color: #666;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${Array.from({ length: copies })
            .map(
              (_, i) => `
            <div class="tag">
              <div class="name">${item.name}</div>
              <div class="barcode">
                <svg id="barcode-${i}"></svg>
              </div>
              ${
                item.category?.name || item.location
                  ? `<div class="footer">${item.category?.name || item.location}</div>`
                  : ""
              }
            </div>
          `
            )
            .join("")}
          <script>
            ${Array.from({ length: copies })
              .map(
                (_, i) => `
              JsBarcode("#barcode-${i}", "${barcodeValue}", {
                format: "CODE128",
                width: 2,
                height: 40,
                displayValue: true,
                fontSize: 12,
                margin: 2,
                textMargin: 2,
              });
            `
              )
              .join("")}
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="border-zinc-700">
            <Tag className="w-4 h-4 mr-2" />
            Print Tag
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Print Inventory Tag</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Generate a barcode tag for &quot;{item.name}&quot;
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Label Format</label>
              <Select value={selectedFormatId || ""} onValueChange={setSelectedFormatId}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select format..." />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((format) => (
                    <SelectItem key={format.id} value={format.id}>
                      <div className="flex items-center gap-2">
                        <span>{format.name}</span>
                        <span className="text-xs text-zinc-500">
                          ({format.widthInches}&quot; x {format.heightInches}&quot;)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFormat?.description && (
                <p className="text-xs text-zinc-500">{selectedFormat.description}</p>
              )}
            </div>

            {/* Copies */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Number of Copies</label>
              <Select value={copies.toString()} onValueChange={(v) => setCopies(parseInt(v))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 10].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {selectedFormat && (
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Preview</label>
                <div className="flex justify-center p-4 bg-zinc-800 rounded-lg">
                  <TagPreview item={item} format={selectedFormat} />
                </div>
              </div>
            )}

            {/* Barcode Info */}
            <div className="p-3 bg-zinc-800/50 rounded-lg text-xs text-zinc-400">
              <p className="font-medium text-zinc-300 mb-1">Barcode Value</p>
              <code className="font-mono text-purple-400">{getBarcodeValue(item)}</code>
              {!item.sku && (
                <p className="mt-2 text-zinc-500">
                  No SKU set. Using auto-generated code. Set a custom SKU for more readable barcodes.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="border-zinc-700"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePrint}
            disabled={!selectedFormat || loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print {copies > 1 ? `${copies} Tags` : "Tag"}
          </Button>
        </DialogFooter>

        {/* Hidden printable content */}
        <div ref={printRef} className="hidden">
          {selectedFormat && (
            <PrintableTagSheet item={item} format={selectedFormat} copies={copies} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Bulk tag printing for multiple items
interface BulkTagPrintProps {
  items: TagItem[];
  trigger?: React.ReactNode;
}

export function BulkTagPrint({ items, trigger }: BulkTagPrintProps) {
  const [open, setOpen] = useState(false);
  const [formats, setFormats] = useState<LabelFormat[]>([]);
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedFormat = formats.find((f) => f.id === selectedFormatId);

  const loadFormats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/label-formats");
      if (res.ok) {
        const data = await res.json();
        setFormats(data.formats);
        if (data.selectedFormatId) {
          setSelectedFormatId(data.selectedFormatId);
        } else if (data.formats.length > 0) {
          setSelectedFormatId(data.formats[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load formats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadFormats();
    }
  }, [open, loadFormats]);

  const handlePrint = () => {
    if (!selectedFormat) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print tags");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Tags - ${items.length} items</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <style>
            @page {
              size: ${selectedFormat.widthInches}in ${selectedFormat.heightInches}in;
              margin: 0;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            .tag {
              width: ${selectedFormat.widthInches}in;
              height: ${selectedFormat.heightInches}in;
              padding: 0.1in;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-after: always;
              background: white;
            }
            .tag:last-child { page-break-after: auto; }
            .name {
              font-weight: bold;
              font-size: 10pt;
              text-align: center;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .barcode { display: flex; justify-content: center; align-items: center; flex: 1; }
            .barcode svg { max-width: 100%; }
            .footer {
              font-size: 7pt;
              text-align: center;
              color: #666;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${items
            .map(
              (item, i) => `
            <div class="tag">
              <div class="name">${item.name}</div>
              <div class="barcode"><svg id="barcode-${i}"></svg></div>
              ${item.category?.name || item.location ? `<div class="footer">${item.category?.name || item.location}</div>` : ""}
            </div>
          `
            )
            .join("")}
          <script>
            ${items
              .map(
                (item, i) => `
              JsBarcode("#barcode-${i}", "${getBarcodeValue(item)}", {
                format: "CODE128",
                width: 2,
                height: 40,
                displayValue: true,
                fontSize: 12,
                margin: 2,
                textMargin: 2,
              });
            `
              )
              .join("")}
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="border-zinc-700">
            <Tag className="w-4 h-4 mr-2" />
            Print Tags ({items.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Print Inventory Tags</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Generate barcode tags for {items.length} items
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Label Format</label>
              <Select value={selectedFormatId || ""} onValueChange={setSelectedFormatId}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select format..." />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((format) => (
                    <SelectItem key={format.id} value={format.id}>
                      <div className="flex items-center gap-2">
                        <span>{format.name}</span>
                        <span className="text-xs text-zinc-500">
                          ({format.widthInches}&quot; x {format.heightInches}&quot;)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Item list preview */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Items to Print</label>
              <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-zinc-800 rounded-lg">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-zinc-200 truncate">{item.name}</span>
                    <code className="text-xs text-purple-400 font-mono">{getBarcodeValue(item)}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" className="border-zinc-700" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePrint}
            disabled={!selectedFormat || loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print {items.length} Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
