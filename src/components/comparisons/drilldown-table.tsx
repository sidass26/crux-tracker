'use client';

import { DrilldownUrl, MetricKey } from '@/lib/types';
import { METRIC_THRESHOLDS, formatP75 } from '@/lib/thresholds';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface DrilldownTableProps {
  urls: DrilldownUrl[];
  metricKey: MetricKey;
}

const STATUS_STYLES = {
  good: 'bg-green-50 text-green-700 border-green-200',
  'needs-improvement': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  poor: 'bg-red-50 text-red-700 border-red-200',
  'no-data': 'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_LABELS = {
  good: 'Good',
  'needs-improvement': 'Needs work',
  poor: 'Poor',
  'no-data': 'No data',
};

function MiniSparkline({ data }: { data: (number | null)[]; metricKey: MetricKey }) {
  if (!data.some((v) => v !== null)) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width={80} height={28}>
      <LineChart data={chartData}>
        <Line
          dataKey="v"
          stroke="#3b82f6"
          strokeWidth={1.5}
          dot={false}
          connectNulls={false}
        />
        <Tooltip
          content={() => null}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function DrilldownTable({ urls, metricKey }: DrilldownTableProps) {
  const threshold = METRIC_THRESHOLDS[metricKey];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left font-medium text-gray-500 pb-2 pr-4">URL</th>
            <th className="text-right font-medium text-gray-500 pb-2 px-4 whitespace-nowrap">
              Latest p75
            </th>
            <th className="text-center font-medium text-gray-500 pb-2 px-4">Trend</th>
            <th className="text-center font-medium text-gray-500 pb-2 pl-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {urls.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-2 pr-4 max-w-xs">
                <a
                  href={row.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate block text-xs"
                  title={row.url}
                >
                  {row.url.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </td>
              <td className="py-2 px-4 text-right font-mono font-medium">
                {row.latestP75 !== null
                  ? formatP75(row.latestP75, metricKey)
                  : <span className="text-gray-400">—</span>}
              </td>
              <td className="py-2 px-4">
                <div className="flex justify-center">
                  <MiniSparkline data={row.weeklyP75} metricKey={metricKey} />
                </div>
              </td>
              <td className="py-2 pl-4 text-center">
                <span
                  className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}
                >
                  {STATUS_LABELS[row.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-gray-400">
        Threshold: good &lt;{' '}
        {threshold.unit === 'ms' && threshold.good >= 1000
          ? `${threshold.good / 1000}s`
          : `${threshold.good}${threshold.unit}`}
        , poor &gt;{' '}
        {threshold.unit === 'ms' && threshold.poor >= 1000
          ? `${threshold.poor / 1000}s`
          : `${threshold.poor}${threshold.unit}`}
      </p>
    </div>
  );
}
