'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BrandAggregateData, MetricKey } from '@/lib/types';
import { METRIC_THRESHOLDS, formatP75, getP75Color } from '@/lib/thresholds';

interface AggregateLineChartProps {
  metricKey: MetricKey;
  brands: BrandAggregateData[];
  onBrandClick?: (brandId: string, brandName: string) => void;
}

interface ChartRow {
  date: string;
  [brandId: string]: string | number | null;
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
  metricKey,
  brands,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number | null; color: string }[];
  label?: string;
  metricKey: MetricKey;
  brands: BrandAggregateData[];
}) {
  if (!active || !payload?.length) return null;

  const brandById = Object.fromEntries(brands.map((b) => [b.brandId, b]));

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-medium text-gray-700 mb-2">{label}</p>
      {payload.map((entry) => {
        const brand = brandById[entry.dataKey];
        if (!brand) return null;
        const formatted = formatP75(entry.value, metricKey);
        const color = entry.value !== null ? getP75Color(entry.value, metricKey) : '#6b7280';

        // Find urlCount for this week
        const weekData = brand.metrics[metricKey]?.find((p) => p.date === label);
        const coverage = weekData ? `${weekData.urlCount}/${weekData.totalUrls} URLs` : '';

        return (
          <div key={entry.dataKey} className="flex items-center justify-between gap-3 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: brand.brandColor }} />
              <span className="text-gray-600">{brand.brandName}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold" style={{ color }}>
                {formatted}
              </span>
              {coverage && <span className="ml-1 text-xs text-gray-400">({coverage})</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AggregateLineChart({
  metricKey,
  brands,
  onBrandClick,
}: AggregateLineChartProps) {
  const threshold = METRIC_THRESHOLDS[metricKey];

  // Build flat chart data: one row per date
  const allDates: string[] = [];
  for (const brand of brands) {
    const dates = brand.metrics[metricKey]?.map((p) => p.date) ?? [];
    if (dates.length > allDates.length) allDates.splice(0, allDates.length, ...dates);
  }

  const chartData: ChartRow[] = allDates.map((date, weekIdx) => {
    const row: ChartRow = { date };
    for (const brand of brands) {
      const point = brand.metrics[metricKey]?.[weekIdx];
      row[brand.brandId] = point?.p75Avg ?? null;
    }
    return row;
  });

  // Y-axis: auto domain with 10% padding
  const allValues = brands.flatMap((b) =>
    (b.metrics[metricKey] ?? []).map((p) => p.p75Avg).filter((v): v is number => v !== null)
  );
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : threshold.poor * 1.5;
  const yPad = (maxVal - minVal) * 0.12 || maxVal * 0.1;
  const yMin = Math.max(0, Math.floor(minVal - yPad));
  const yMax = Math.ceil(maxVal + yPad);

  // Tick formatter
  function formatTick(v: number) {
    if (metricKey === 'cumulative_layout_shift') return v.toFixed(2);
    if (v >= 1000) return `${(v / 1000).toFixed(1)}s`;
    return `${Math.round(v)}ms`;
  }

  // Show only every 4th date label to avoid crowding
  function xTickFormatter(value: string, index: number) {
    return index % 4 === 0 ? value : '';
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
        <p className="text-sm text-gray-400">No data yet — run a fetch first</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={xTickFormatter}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[yMin, yMax]}
          tickFormatter={formatTick}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          content={
            <CustomTooltip metricKey={metricKey} brands={brands} />
          }
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => {
            const brand = brands.find((b) => b.brandId === value);
            return <span className="text-xs text-gray-600">{brand?.brandName ?? value}</span>;
          }}
          onClick={(e) => {
            if (onBrandClick) {
              const brand = brands.find((b) => b.brandId === e.dataKey);
              if (brand) onBrandClick(brand.brandId, brand.brandName);
            }
          }}
          wrapperStyle={{ cursor: onBrandClick ? 'pointer' : 'default' }}
        />
        {/* Good threshold */}
        <ReferenceLine
          y={threshold.good}
          stroke="#0cce6b"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: 'Good', position: 'right', fontSize: 10, fill: '#0cce6b' }}
        />
        {/* Poor threshold */}
        <ReferenceLine
          y={threshold.poor}
          stroke="#ff4e42"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: 'Poor', position: 'right', fontSize: 10, fill: '#ff4e42' }}
        />
        {brands.map((brand) => (
          <Line
            key={brand.brandId}
            dataKey={brand.brandId}
            stroke={brand.brandColor}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 5,
              cursor: onBrandClick ? 'pointer' : 'default',
              onClick: onBrandClick
                ? () => onBrandClick(brand.brandId, brand.brandName)
                : undefined,
            }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
