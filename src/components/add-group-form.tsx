'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UrlRow {
  brand_name: string;
  url: string;
}

export default function AddGroupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [urls, setUrls] = useState<UrlRow[]>([{ brand_name: '', url: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function addRow() {
    setUrls([...urls, { brand_name: '', url: '' }]);
  }

  function removeRow(index: number) {
    if (urls.length <= 1) return;
    setUrls(urls.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof UrlRow, value: string) {
    const updated = [...urls];
    updated[index] = { ...updated[index], [field]: value };
    setUrls(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validUrls = urls.filter((u) => u.brand_name.trim() && u.url.trim());
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
    if (validUrls.length === 0) {
      setError('At least one URL with a brand name is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), urls: validUrls }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create group');
      }

      const data = await res.json();
      router.push(`/groups/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Group Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Burj Khalifa Tickets"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Competitor URLs
        </label>
        <div className="space-y-3">
          {urls.map((row, i) => (
            <div key={i} className="flex gap-3 items-start">
              <input
                type="text"
                value={row.brand_name}
                onChange={(e) => updateRow(i, 'brand_name', e.target.value)}
                placeholder="Brand name"
                className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                value={row.url}
                onChange={(e) => updateRow(i, 'url', e.target.value)}
                placeholder="https://example.com/page"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="rounded-md px-2 py-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add another URL
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Creating...' : 'Create Group'}
      </button>
    </form>
  );
}
