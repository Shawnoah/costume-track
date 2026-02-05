/**
 * Label format presets and utilities for inventory tagging
 */

export interface LabelFormatPreset {
  name: string;
  widthInches: number;
  heightInches: number;
  description: string;
}

// Preset label formats for common thermal tag/label sizes
export const LABEL_FORMAT_PRESETS: LabelFormatPreset[] = [
  {
    name: "Direct Thermal Tag 2.25x1.37",
    widthInches: 2.25,
    heightInches: 1.37,
    description: "Standard loop tag with pre-punched hole - fits most tag guns",
  },
  {
    name: "Direct Thermal Tag 2x1",
    widthInches: 2,
    heightInches: 1,
    description: "Compact loop tag for smaller items",
  },
  {
    name: "Thermal Label 4x2",
    widthInches: 4,
    heightInches: 2,
    description: "Large shipping-style label",
  },
  {
    name: "Thermal Label 3x2",
    widthInches: 3,
    heightInches: 2,
    description: "Medium label for shelf/bin marking",
  },
  {
    name: "Thermal Label 2x1",
    widthInches: 2,
    heightInches: 1,
    description: "Small adhesive label",
  },
  {
    name: "Jewelry Tag 2.2x0.5",
    widthInches: 2.2,
    heightInches: 0.5,
    description: "Narrow tag for accessories and small items",
  },
];

// Convert inches to pixels at 203 DPI (standard thermal printer resolution)
export function inchesToPixels(inches: number, dpi: number = 203): number {
  return Math.round(inches * dpi);
}

// Convert inches to mm
export function inchesToMm(inches: number): number {
  return inches * 25.4;
}

// Generate a unique item code for barcodes
// Format: ORG-ITEM (shortened org ID + item ID for human readability)
export function generateItemCode(orgId: string, itemId: string): string {
  // Take first 4 chars of org ID and first 8 of item ID
  const orgPrefix = orgId.slice(0, 4).toUpperCase();
  const itemSuffix = itemId.slice(-8).toUpperCase();
  return `${orgPrefix}-${itemSuffix}`;
}

// Validate barcode text for Code 128
export function isValidCode128(text: string): boolean {
  // Code 128 supports ASCII 0-127
  return /^[\x00-\x7F]+$/.test(text);
}
