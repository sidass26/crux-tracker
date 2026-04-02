'use client';

import { UrlMetricData } from '@/lib/types';
import { METRIC_ORDER, METRIC_THRESHOLDS } from '@/lib/thresholds';
import MetricChart from './metric-chart';

interface Props {
  urls: UrlMetricData[];
}

export default function ComparisonGrid({ urls }: Props) {
  if (urls.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No URLs in this group. Add URLs to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-56">
              Brand / URL
            </th>
            {METRIC_ORDER.map((key) => (
              <th
                key={key}
                className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {METRIC_THRESHOLDS[key].shortLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {urls.map((urlData) => (
            <tr key={urlData.trackedUrl.id} className="border-b border-gray-100">
              <td className="py-3 px-3">
                <p className="text-sm font-medium text-gray-900">
                  {urlData.trackedUrl.brand_name}
                </p>
                <p className="text-xs text-gray-400 truncate max-w-[200px]" title={urlData.trackedUrl.url}>
                  {urlData.trackedUrl.url}
                </p>
                {urlData.fetchedAt && (
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    {new Date(urlData.fetchedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </td>
              {urlData.noData ? (
                <td colSpan={5} className="py-3 px-2 text-center">
                  <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    Not enough CrUX data
                  </span>
                </td>
              ) : urlData.metrics ? (
                METRIC_ORDER.map((metricKey) => (
                  <td key={metricKey} className="py-3 px-2" style={{ minWidth: 160 }}>
                    <MetricChart
                      data={urlData.metrics![metricKey]}
                      metricKey={metricKey}
                    />
                  </td>
                ))
              ) : (
                <td colSpan={5} className="py-3 px-2 text-center text-sm text-gray-400">
                  Not fetched yet — click &quot;Run Now&quot;
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
