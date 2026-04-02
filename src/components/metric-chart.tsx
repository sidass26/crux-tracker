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

function P75Tooltip({
  active,
  payload,
  label,
  metricKey,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: ChartDataPoint }>;
  label?: string;
  metricKey: MetricKey;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const p75 = point?.p75 ?? null;
  const color = getP75Color(p75, metricKey);
  return (
    <div className="rounded-lg bg-white border border-gray-200 shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="font-bold text-sm" style={{ color }}>
        p75: {formatP75(p75, metricKey)}
      </p>
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
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip content={(props: any) => <P75Tooltip {...props} metricKey={metricKey} />} />
            <Area type="monotone" dataKey="poor" stackId="1" fill={BAND_COLORS.poor} stroke="none" fillOpacity={0.85} />
            <Area type="monotone" dataKey="needsImprovement" stackId="1" fill={BAND_COLORS.needsImprovement} stroke="none" fillOpacity={0.85} />
            <Area type="monotone" dataKey="good" stackId="1" fill={BAND_COLORS.good} stroke="none" fillOpacity={0.85} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-xs font-semibold mt-1" style={{ color: p75Color }}>
        p75: {p75Text}
      </p>
    </div>
  );
}
