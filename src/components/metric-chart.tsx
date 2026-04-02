'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint, MetricKey } from '@/lib/types';
import { BAND_COLORS, getP75Color, formatP75 } from '@/lib/thresholds';

interface Props {
  data: ChartDataPoint[];
  metricKey: MetricKey;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;

  const good = payload.find((p) => p.dataKey === 'good')?.value ?? 0;
  const ni = payload.find((p) => p.dataKey === 'needsImprovement')?.value ?? 0;
  const poor = payload.find((p) => p.dataKey === 'poor')?.value ?? 0;

  return (
    <div className="rounded-lg bg-white border border-gray-200 shadow-lg p-2.5 text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      <div className="space-y-0.5">
        <p><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: BAND_COLORS.good }} />Good: {(good * 100).toFixed(1)}%</p>
        <p><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: BAND_COLORS.needsImprovement }} />Needs improvement: {(ni * 100).toFixed(1)}%</p>
        <p><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: BAND_COLORS.poor }} />Poor: {(poor * 100).toFixed(1)}%</p>
      </div>
    </div>
  );
}

export default function MetricChart({ data, metricKey }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-xs text-gray-400">
        No data
      </div>
    );
  }

  const latestP75 = data[data.length - 1]?.p75 ?? null;
  const p75Color = getP75Color(latestP75, metricKey);
  const p75Text = formatP75(latestP75, metricKey);

  return (
    <div>
      <div className="h-[72px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 1]} hide />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="poor"
              stackId="1"
              fill={BAND_COLORS.poor}
              stroke="none"
              fillOpacity={0.85}
            />
            <Area
              type="monotone"
              dataKey="needsImprovement"
              stackId="1"
              fill={BAND_COLORS.needsImprovement}
              stroke="none"
              fillOpacity={0.85}
            />
            <Area
              type="monotone"
              dataKey="good"
              stackId="1"
              fill={BAND_COLORS.good}
              stroke="none"
              fillOpacity={0.85}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-xs font-semibold mt-1" style={{ color: p75Color }}>
        p75: {p75Text}
      </p>
    </div>
  );
}
