import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { Portal, Text, Badge, useTheme } from 'react-native-paper';
import type { BrandItem, ModelItem } from '../../services/inventory-service';
import { getBrands, getModels } from '../../services/inventory-service';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.floor(SCREEN_WIDTH * 0.3);
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;
const ANIMATION_DURATION = 280;

interface BrandModelPickerProps {
  visible: boolean;
  onDismiss: () => void;
  organizationId: string;
  selectedBrandId?: string;
  selectedModelId?: string;
  onSelect: (brandId?: string, modelId?: string) => void;
}

export function BrandModelPicker({
  visible,
  onDismiss,
  organizationId,
  selectedBrandId,
  selectedModelId,
  onSelect,
}: BrandModelPickerProps) {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string | undefined>(selectedBrandId);
  const [activeModelId, setActiveModelId] = useState<string | undefined>(selectedModelId);
  const [loading, setLoading] = useState(false);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setActiveBrandId(selectedBrandId);
      setActiveModelId(selectedModelId);
    }
  }, [visible, selectedBrandId, selectedModelId]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  // Fetch brands on open
  useEffect(() => {
    if (!visible || !organizationId) return;
    setLoading(true);
    getBrands(organizationId)
      .then(setBrands)
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, [visible, organizationId]);

  // Fetch models when brand changes
  useEffect(() => {
    if (!visible || !organizationId || !activeBrandId) {
      setModels([]);
      return;
    }
    setLoading(true);
    getModels(organizationId, activeBrandId)
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, [visible, organizationId, activeBrandId]);

  const handleBrandPress = useCallback((brandId: string) => {
    setActiveBrandId(brandId);
    setActiveModelId(undefined);
  }, []);

  const handleAllBrands = useCallback(() => {
    setActiveBrandId(undefined);
    setActiveModelId(undefined);
  }, []);

  const handleConfirm = useCallback(() => {
    onSelect(activeBrandId, activeModelId);
    onDismiss();
  }, [activeBrandId, activeModelId, onSelect, onDismiss]);

  const handleClearAll = useCallback(() => {
    setActiveBrandId(undefined);
    setActiveModelId(undefined);
    onSelect();
    onDismiss();
  }, [onSelect, onDismiss]);

  const isSelectedBrand = (id: string) => activeBrandId === id;
  const isSelectedModel = (id: string) => activeModelId === id;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });

  const surfaceColor = theme.dark ? theme.colors.elevation.level2 : '#FFFFFF';

  const renderBrand = useCallback(
    ({ item }: { item: BrandItem }) => {
      const selected = isSelectedBrand(item.id);
      return (
        <TouchableOpacity
          style={[
            styles.brandItem,
            selected && { backgroundColor: '#FF6D00' },
          ]}
          onPress={() => handleBrandPress(item.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.brandName,
              { color: selected ? '#FFFFFF' : theme.colors.onSurface },
              selected && styles.brandNameSelected,
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Badge
            style={[styles.badge, selected && styles.badgeSelected]}
            size={18}
          >
            {item.deviceCount}
          </Badge>
        </TouchableOpacity>
      );
    },
    [theme, handleBrandPress, isSelectedBrand],
  );

  const renderModel = useCallback(
    ({ item }: { item: ModelItem }) => {
      const selected = isSelectedModel(item.id);
      return (
        <TouchableOpacity
          style={[
            styles.modelItem,
            selected && { backgroundColor: '#FF6D00' },
          ]}
          onPress={() => setActiveModelId(item.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.modelName,
              { color: selected ? '#FFFFFF' : theme.colors.onSurface },
              selected && styles.modelNameSelected,
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Badge
            style={[styles.badge, selected && styles.badgeSelected]}
            size={18}
          >
            {item.deviceCount}
          </Badge>
        </TouchableOpacity>
      );
    },
    [theme, isSelectedModel],
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          {loading ? '加载中...' : '暂无数据'}
        </Text>
      </View>
    ),
    [theme, loading],
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={onDismiss}>
          <Animated.View
            style={[
              styles.overlay,
              { backgroundColor: 'rgba(0,0,0,0.4)' },
              { opacity: opacityAnim },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: SHEET_HEIGHT,
              backgroundColor: surfaceColor,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                { backgroundColor: theme.dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              选择品牌和型号
            </Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearButton}>清除</Text>
            </TouchableOpacity>
          </View>

          {/* Body: sidebar + content */}
          <View style={styles.body}>
            {/* Left: Brand list */}
            <View style={[styles.sidebar, { backgroundColor: theme.colors.elevation.level1 }]}>
              <TouchableOpacity
                style={[
                  styles.brandItem,
                  !activeBrandId && { backgroundColor: '#FF6D00' },
                ]}
                onPress={handleAllBrands}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.brandName,
                    {
                      color: !activeBrandId ? '#FFFFFF' : theme.colors.onSurface,
                    },
                    !activeBrandId && styles.brandNameSelected,
                  ]}
                >
                  全部品牌
                </Text>
              </TouchableOpacity>
              <FlatList
                data={brands}
                keyExtractor={(item) => item.id}
                renderItem={renderBrand}
                ListEmptyComponent={ListEmptyComponent}
                showsVerticalScrollIndicator={false}
              />
            </View>

            {/* Right: Model list */}
            <View style={styles.content}>
              {activeBrandId ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.modelItem,
                      !activeModelId && { backgroundColor: '#FF6D00' },
                    ]}
                    onPress={() => setActiveModelId(undefined)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modelName,
                        {
                          color: !activeModelId ? '#FFFFFF' : theme.colors.onSurface,
                        },
                        !activeModelId && styles.modelNameSelected,
                      ]}
                    >
                      全部型号
                    </Text>
                  </TouchableOpacity>
                  <FlatList
                    data={models}
                    keyExtractor={(item) => item.id}
                    renderItem={renderModel}
                    ListEmptyComponent={ListEmptyComponent}
                    showsVerticalScrollIndicator={false}
                  />
                </>
              ) : (
                <View style={styles.placeholder}>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    请先选择品牌
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom buttons */}
          <View style={[styles.buttonRow, { borderTopColor: theme.colors.elevation.level3 }]}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.colors.onSurfaceVariant }]}>
                取消
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>确定</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  clearButton: {
    fontSize: 14,
    color: '#FF6D00',
    fontWeight: '600',
  },
  body: {
    flexDirection: 'row',
    flex: 1,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(128,128,128,0.2)',
  },
  content: {
    flex: 1,
  },
  brandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  brandName: {
    fontSize: 14,
    flex: 1,
    marginRight: 6,
  },
  brandNameSelected: {
    fontWeight: '600',
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modelName: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  modelNameSelected: {
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'rgba(128,128,128,0.3)',
  },
  badgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.4)',
  },
  confirmButton: {
    backgroundColor: '#FF6D00',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
