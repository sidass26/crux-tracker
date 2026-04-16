'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandUrlEditor, { BrandEntry } from '@/components/comparisons/brand-url-editor';

interface BrandWithId extends BrandEntry {
  brandId: string;
}

interface Props {
  pageTypeId: string;
  initialName: string;
  initialDescription: string;
  initialBrands: BrandWithId[];
}

export default function EditComparisonClient({
  pageTypeId,
  initialName,
  initialDescription,
  initialBrands,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [brands, setBrands] = useState<BrandWithId[]>(initialBrands);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleBrandsChange(next: BrandEntry[]) {
    // Preserve brandId for existing, add empty for new entries
    setBrands(
      next.map((b, i) => ({
        brandId: (brands[i] as BrandWithId | undefined)?.brandId ?? '',
        ...b,
      }))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Update page type name/description
      const ptRes = await fetch(`/api/comparisons/${pageTypeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      if (!ptRes.ok) throw new Error('Failed to update page type');

      // Update URLs for each existing brand
      for (const brand of brands) {
        if (!brand.brandId) continue;
        const urls = brand.urlsText
          .split('\n')
          .map((u) => u.trim())
          .filter((u) => u.length > 0);

        await fetch(`/api/comparisons/${pageTypeId}/brands/${brand.brandId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls }),
        });
      }

      router.push(`/comparisons/${pageTypeId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Page type name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Brand URLs{' '}
          <span className="text-gray-400 font-normal">
            (edit URLs per brand — one per line)
          </span>
        </label>
        <BrandUrlEditor brands={brands} onChange={handleBrandsChange} />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
