import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { AmountText } from '../finance/AmountText';
import type { Device } from '../../types/device';
import { BRAND_COLOR } from '../../lib/theme';

interface DeviceCardProProps {
  device: Device;
  onPress: (id: string) => void;
  onOutbound?: (device: Device) => void;
  onDelete?: (device: Device) => void;
}

function getAgeDays(inboundAt: string | null): number | null {
  if (!inboundAt) return null;
  const diff = Date.now() - new Date(inboundAt).getTime();
  return Math.floor(diff / 86400000);
}

function getAgeColor(days: number | null): string {
  if (days === null) return '#9E9E9E';
  if (days < 15) return '#9E9E9E';
  if (days <= 30) return '#E65100';
  return '#C62828';
}

export const DeviceCardPro = React.memo(function DeviceCardPro({
  device,
  onPress,
  onOutbound,
  onDelete,
}: DeviceCardProProps) {
  const theme = useTheme();

  const skuName = device.Sku?.name ?? device.Sku?.Model?.name ?? '未知型号';
  const brandName = device.Sku?.Model?.Brand?.name ?? '';
  const spec = device.DeviceSpec;
  const pricing = device.DevicePricing;
  const ageDays = getAgeDays(device.inboundAt);

  const copySn = useCallback(() => {
    // Clipboard support differs across RN/Expo setups in this repo.
    // Keep UX simple and avoid adding new native deps here.
    Alert.alert('IMEI', device.sn);
  }, [device.sn]);

  const handleOutbound = useCallback(() => {
    onOutbound?.(device);
  }, [onOutbound, device]);

  const handleDelete = useCallback(() => {
    onDelete?.(device);
  }, [onDelete, device]);

  const specParts: string[] = [];
  if (spec?.condition) specParts.push(spec.condition);
  if (spec?.channel) specParts.push(spec.channel);

  const ageDisplay = ageDays !== null ? `${ageDays}天` : '--';
  const ageColor = getAgeColor(ageDays);
  const isSettled = pricing?.settlementStatus === 'SETTLED';

  return (
    <TouchableOpacity onPress={() => onPress(device.id)} activeOpacity={0.7}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        {/* Row 1: Brand + Model + Age */}
        <View style={styles.row1}>
          <Text style={[styles.brandModel, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {brandName} {skuName}
          </Text>
          <View style={[styles.ageBadge, { backgroundColor: `${ageColor}18` }]}>
            <Text style={[styles.ageText, { color: ageColor }]}>
              库龄{ageDisplay}
            </Text>
          </View>
        </View>

        {/* Row 2: Spec line */}
        {specParts.length > 0 && (
          <Text style={[styles.specLine, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
            {specParts.join(' · ')}
          </Text>
        )}

        {/* Row 3: IMEI + Copy */}
        <View style={styles.snRow}>
          <Text style={[styles.snText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
            IMEI: {device.sn}
          </Text>
          <TouchableOpacity onPress={copySn} activeOpacity={0.7}>
            <Text style={styles.copyBtn}>复制</Text>
          </TouchableOpacity>
        </View>

        {/* Row 4: Prices */}
        <View style={styles.priceRow}>
          <AmountText
            value={pricing?.unitCost}
            prefix="成本: ¥"
            style={styles.costPrice}
          />
          <AmountText
            value={pricing?.peerPrice}
            prefix="同行: ¥"
            style={[styles.peerPrice, { color: theme.colors.onSurfaceVariant }]}
          />
          <AmountText
            value={pricing?.retailPrice}
            prefix="零售: ¥"
            style={[styles.retailPrice, { color: theme.colors.onSurfaceVariant }]}
          />
        </View>

        {/* Row 5: Settlement badge */}
        {isSettled && (
          <View style={styles.settledBadge}>
            <Text style={styles.settledText}>已结清</Text>
          </View>
        )}

        {/* Row 6: Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtnOutline} onPress={handleDelete} activeOpacity={0.7}>
            <Text style={styles.actionBtnTextGray}>删除</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnOutline} activeOpacity={0.7}>
            <Text style={styles.actionBtnTextGray}>打印</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnOutline} activeOpacity={0.7}>
            <Text style={styles.actionBtnTextGray}>卖同行</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleOutbound} activeOpacity={0.7}>
            <Text style={styles.actionBtnTextDark}>出库</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandModel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  ageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  specLine: {
    fontSize: 13,
    marginTop: 4,
  },
  snRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  snText: {
    fontSize: 13,
    fontFamily: 'Courier',
    flex: 1,
    marginRight: 8,
  },
  copyBtn: {
    fontSize: 12,
    color: BRAND_COLOR,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  costPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E53935',
  },
  peerPrice: {
    fontSize: 13,
  },
  retailPrice: {
    fontSize: 13,
  },
  settledBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(67,160,71,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  settledText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#43A047',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtnOutline: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionBtnPrimary: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: BRAND_COLOR,
  },
  actionBtnTextGray: {
    fontSize: 12,
    color: '#757575',
  },
  actionBtnTextDark: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '600',
  },
});
