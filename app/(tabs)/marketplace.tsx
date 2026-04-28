import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function MarketplaceScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>同行市集</Text>
        <Text style={styles.heroSubtitle}>即将上线</Text>
      </View>

      <View style={[styles.featureCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={styles.featureTitle}>即将支持</Text>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🔍</Text>
          <View style={styles.featureText}>
            <Text style={[styles.featureName, { color: theme.colors.onSurface }]}>找货发布</Text>
            <Text style={styles.featureDesc}>一键发布库存到同行市集</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🤝</Text>
          <View style={styles.featureText}>
            <Text style={[styles.featureName, { color: theme.colors.onSurface }]}>同行交易</Text>
            <Text style={styles.featureDesc}>0佣金，安全有保障</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📊</Text>
          <View style={styles.featureText}>
            <Text style={[styles.featureName, { color: theme.colors.onSurface }]}>行情参考</Text>
            <Text style={styles.featureDesc}>实时同行报价，定价不再纠结</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🚀</Text>
          <View style={styles.featureText}>
            <Text style={[styles.featureName, { color: theme.colors.onSurface }]}>多渠道销货</Text>
            <Text style={styles.featureDesc}>多平台发布，流速更快</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  heroSection: {
    backgroundColor: '#FFD700',
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(51,51,51,0.7)',
    fontWeight: '500',
  },
  featureCard: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: '#9E9E9E',
  },
});
