'use client';

import { useRouter } from 'next/navigation';
import FormFactorToggle from '@/components/form-factor-toggle';
import { FormFactor, MetricKey } from '@/lib/types';

interface Props {
  pageTypeId: string;
  brandId: string;
  metricKey: MetricKey;
  formFactor: FormFactor;
}

export default function FormFactorToggleWrapper({ pageTypeId, brandId, metricKey, formFactor }: Props) {
  const router = useRouter();

  function onChange(ff: FormFactor) {
    router.push(`/comparisons/${pageTypeId}/brands/${brandId}?metric=${metricKey}&formFactor=${ff}`);
  }

  return <FormFactorToggle value={formFactor} onChange={onChange} />;
}
