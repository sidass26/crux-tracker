'use client';

import { BRAND_COLORS } from '@/lib/thresholds';

export interface BrandEntry {
  brandName: string;
  urlsText: string; // one URL per line
}

interface BrandUrlEditorProps {
  brands: BrandEntry[];
  onChange: (brands: BrandEntry[]) => void;
}

export default function BrandUrlEditor({ brands, onChange }: BrandUrlEditorProps) {
  function updateBrand(index: number, updates: Partial<BrandEntry>) {
    const next = brands.map((b, i) => (i === index ? { ...b, ...updates } : b));
    onChange(next);
  }

  function addBrand() {
    onChange([...brands, { brandName: '', urlsText: '' }]);
  }

  function removeBrand(index: number) {
    onChange(brands.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {brands.map((brand, index) => {
        const color = BRAND_COLORS[index % BRAND_COLORS.length];
        const urlCount = brand.urlsText
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0).length;

        return (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <input
                type="text"
                placeholder="Brand name (e.g. Headout)"
                value={brand.brandName}
                onChange={(e) => updateBrand(index, { brandName: e.target.value })}
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {brands.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBrand(index)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              URLs{' '}
              <span className="text-gray-400 font-normal">
                (one per line, {urlCount} entered)
              </span>
            </label>
            <textarea
              rows={6}
              placeholder={`https://example.com/city/london\nhttps://example.com/city/paris\n…`}
              value={brand.urlsText}
              onChange={(e) => updateBrand(index, { urlsText: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
        );
      })}

      <button
        type="button"
        onClick={addBrand}
        disabled={brands.length >= 8}
        className="w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        + Add brand
      </button>
    </div>
  );
}
