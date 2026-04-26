import { useState, useEffect } from 'react';
import { fetchOrgPaymentLabelMap } from '../lib/org-payment-channels';

/**
 * 当前组织通道 code→label，用于 getPaymentMethodLabel 第三参；未登录/失败时为空对象（走内置兜底）。
 */
export function useOrgPaymentLabelMap(organizationId: string | null | undefined) {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!organizationId) {
      setMap({});
      return;
    }
    let alive = true;
    fetchOrgPaymentLabelMap(organizationId)
      .then((m) => {
        if (alive) setMap(m);
      })
      .catch(() => {
        if (alive) setMap({});
      });
    return () => {
      alive = false;
    };
  }, [organizationId]);
  return map;
}
