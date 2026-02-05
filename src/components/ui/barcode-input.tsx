"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Scan, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onScan?: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

// Scanner detection: if characters come in faster than this, it's likely a scanner
const SCANNER_THRESHOLD_MS = 50;
// Minimum length to consider as a valid barcode scan
const MIN_SCAN_LENGTH = 3;

export function BarcodeInput({
  value,
  onChange,
  onScan,
  placeholder = "Scan barcode or type...",
  className,
  autoFocus,
  disabled,
}: BarcodeInputProps) {
  const [inputMode, setInputMode] = useState<"idle" | "typing" | "scanning">("idle");
  const [scanBuffer, setScanBuffer] = useState("");
  const lastKeyTime = useRef<number>(0);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear scan timeout on unmount
  useEffect(() => {
    return () => {
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTime.current;
      lastKeyTime.current = now;

      // Clear any pending scan timeout
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }

      // Enter key - process the input
      if (e.key === "Enter") {
        e.preventDefault();
        const inputValue = (e.target as HTMLInputElement).value.trim();

        if (inputValue.length >= MIN_SCAN_LENGTH) {
          // If we detected fast input, treat as scan
          if (inputMode === "scanning" || timeSinceLastKey < SCANNER_THRESHOLD_MS) {
            onScan?.(inputValue);
          } else {
            // Manual entry - still trigger onScan for consistency
            onScan?.(inputValue);
          }
        }

        setInputMode("idle");
        setScanBuffer("");
        return;
      }

      // Detect scanning vs typing based on input speed
      if (e.key.length === 1) {
        // Single character key
        if (timeSinceLastKey < SCANNER_THRESHOLD_MS && scanBuffer.length > 0) {
          // Fast input - likely a scanner
          setInputMode("scanning");
          setScanBuffer((prev) => prev + e.key);
        } else if (timeSinceLastKey > 500 || scanBuffer.length === 0) {
          // Slow input or fresh start - likely manual typing
          setInputMode("typing");
          setScanBuffer(e.key);
        } else {
          // Medium speed - continue current mode
          setScanBuffer((prev) => prev + e.key);
        }

        // Set timeout to reset mode if no more input
        scanTimeout.current = setTimeout(() => {
          setInputMode("idle");
          setScanBuffer("");
        }, 300);
      }
    },
    [inputMode, scanBuffer, onScan]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setInputMode("idle");
    setScanBuffer("");
    lastKeyTime.current = 0;
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className={cn(
          "pr-10 transition-all",
          inputMode === "scanning" && "ring-2 ring-green-500/50 border-green-500",
          className
        )}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {inputMode === "scanning" ? (
          <Scan className="w-4 h-4 text-green-500 animate-pulse" />
        ) : inputMode === "typing" ? (
          <Keyboard className="w-4 h-4 text-zinc-500" />
        ) : (
          <Scan className="w-4 h-4 text-zinc-600" />
        )}
      </div>
    </div>
  );
}

// Quick scan input - auto-clears after scan and stays focused
interface QuickScanInputProps {
  onScan: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function QuickScanInput({
  onScan,
  placeholder = "Scan barcode...",
  className,
  disabled,
}: QuickScanInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = (scannedValue: string) => {
    onScan(scannedValue);
    setValue("");
    // Keep focus for continuous scanning
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim().length >= MIN_SCAN_LENGTH) {
            e.preventDefault();
            handleScan(value.trim());
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus
        className={cn("pr-10", className)}
      />
      <Scan className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
    </div>
  );
}
