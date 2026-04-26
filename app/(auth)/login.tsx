import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {  Button, HelperText, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore, type StoreInfo } from '../../stores/auth-store';
import { loginWithEmail, getUserStores } from '../../services/auth-service';
import { setAuthToken } from '../../lib/storage';
import { APP_DISPLAY_NAME, COMPANY_NAME } from '../../lib/constants';
import { API_BASE } from '../../lib/api';
import { getApiBaseUrl } from '../../lib/storage';

export default function LoginScreen() {
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  const handleLogin = useCallback(async () => {
    if (loading) return;
    if (!email.trim()) {
      setError('请输入邮箱');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginWithEmail(email.trim(), password);

      // Store token immediately so that getUserStores can use it
      setAuthToken(result.token);

      const userStores = await getUserStores();
      const stores: StoreInfo[] = userStores.map((s) => ({
        storeId: s.storeId,
        storeName: s.storeName,
        organizationId: s.organizationId,
        orgName: s.orgName,
      }));

      if (stores.length === 0) {
        Alert.alert('提示', '未能获取门店信息，无法继续使用。请联系管理员。');
        return;
      }

      setAuth(result.user, result.token, stores);
      router.replace('/(tabs)');
    } catch (err) {
      const base = getApiBaseUrl() ?? API_BASE;
      const msg = err instanceof Error ? err.message : '登录失败，请重试';
      setError(msg === 'Network Error' ? `网络错误（${base}）` : msg);
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, setAuth, router]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>{APP_DISPLAY_NAME}</Text>
          <Text style={[styles.companyName, { color: theme.colors.onSurfaceVariant }]}>{COMPANY_NAME}</Text>
          <Text style={[styles.apiHint, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
            服务器: {API_BASE}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.outline }]}
            placeholder="邮箱"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
            placeholder="密码"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          {error ? <HelperText type="error">{error}</HelperText> : null}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginBtn}
            labelStyle={styles.loginBtnLabel}
          >
            登录
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  companyName: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
  },
  apiHint: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 8,
    maxWidth: 280,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
  },
  loginBtn: {
    marginTop: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  loginBtnLabel: {
    fontSize: 16,
    color: '#212121',
    paddingVertical: 4,
  },
});
