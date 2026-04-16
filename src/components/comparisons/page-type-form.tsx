'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandUrlEditor, { BrandEntry } from './brand-url-editor';

interface PageTypeFormProps {
  initialName?: string;
  initialDescription?: string;
  initialBrands?: BrandEntry[];
  pageTypeId?: string; // if editing
}

export default function PageTypeForm({
  initialName = '',
  initialDescription = '',
  initialBrands = [{ brandName: '', urlsText: '' }],
  pageTypeId,
}: PageTypeFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [brands, setBrands] = useState<BrandEntry[]>(initialBrands);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Page type name is required.');
      return;
    }

    const validBrands = brands.filter((b) => b.brandName.trim());
    if (validBrands.length === 0) {
      setError('At least one brand is required.');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      brands: validBrands.map((b) => ({
        brandName: b.brandName.trim(),
        urls: b.urlsText
          .split('\n')
          .map((u) => u.trim())
          .filter((u) => u.length > 0),
      })),
    };

    setSaving(true);
    try {
      let res: Response;
      if (pageTypeId) {
        // For edit: update name/description + replace brand URLs
        res = await fetch(`/api/comparisons/${pageTypeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: payload.name, description: payload.description }),
        });
        // Also update each brand's URLs (simplified: just update page type meta for now)
        // Full brand editing is handled by the edit page
      } else {
        res = await fetch('/api/comparisons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Something went wrong');
      }

      const data = await res.json();
      router.push(`/comparisons/${pageTypeId ?? data.id}`);
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
          placeholder="e.g. City Pages"
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
          placeholder="e.g. Top 100 city destination pages"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Brands &amp; URLs
        </label>
        <BrandUrlEditor brands={brands} onChange={setBrands} />
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
          {saving ? 'Saving…' : pageTypeId ? 'Save changes' : 'Create page type'}
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
