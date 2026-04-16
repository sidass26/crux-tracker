import PageTypeForm from '@/components/comparisons/page-type-form';

export default function NewComparisonPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Page Type Comparison</h1>
        <p className="mt-1 text-sm text-gray-500">
          Group competitor URLs by brand to compare aggregate CrUX metrics over 40 weeks.
        </p>
      </div>
      <PageTypeForm />
    </div>
  );
}
