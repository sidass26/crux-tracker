import AddGroupForm from '@/components/add-group-form';
import Link from 'next/link';

export default function NewGroupPage() {
  return (
    <div className="max-w-2xl">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        &larr; Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Keyword Group</h1>
      <AddGroupForm />
    </div>
  );
}
