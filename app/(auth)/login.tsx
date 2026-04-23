import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Button, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore, type StoreInfo } from '../../stores/auth-store';
import { loginWithEmail, getUserStores } from '../../services/auth-service';
import { setAuthToken } from '../../lib/storage';
import { COMPANY_NAME } from '../../lib/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  const handleLogin = useCallback(async () => {
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

      let stores: StoreInfo[] = [];
      try {
        const userStores = await getUserStores();
        stores = userStores.map((s) => ({
          storeId: s.storeId,
          storeName: s.storeName,
          organizationId: s.organizationId,
          orgName: s.orgName,
        }));
      } catch {
        // stores fetch might fail, continue anyway
      }

      setAuth(result.user, result.token, stores);
      router.replace('/(tabs)');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : '登录失败，请重试';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [email, password, setAuth, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>嫩叶ERP</Text>
          <Text style={styles.companyName}>{COMPANY_NAME}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="邮箱"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="密码"
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
  },
  loginBtn: {
    marginTop: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  loginBtnLabel: {
    fontSize: 16,
    paddingVertical: 4,
  },
});
