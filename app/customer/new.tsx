import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, HelperText, useTheme, Text, Appbar } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { createCustomer } from '../../services/customer-service';
import { isValidPhone } from '../../lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Snackbar } from 'react-native-paper';

const MAX = {
  name: 50,
  phone: 20,
  wechat: 50,
  email: 100,
  address: 200,
  note: 500,
  source: 50,
  memberLevel: 20,
};

export default function NewCustomerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId, organizationId } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wechat, setWechat] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [source, setSource] = useState('');
  const [memberLevel, setMemberLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [snack, setSnack] = useState(false);

  const nameErr = !name.trim() ? '请输入姓名' : name.length > MAX.name ? `姓名不超过${MAX.name}字` : '';
  const phoneErr =
    phone.trim() && !isValidPhone(phone) ? '请输入 11 位有效手机号' : '';
  const emailErr = email && !/.+@.+\..+/.test(email) ? '邮箱格式不正确' : '';

  const submit = useCallback(async () => {
    if (!storeId || !organizationId) {
      setErr('缺少门店信息');
      return;
    }
    if (nameErr || phoneErr || emailErr) {
      setErr(nameErr || phoneErr || emailErr);
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const res = await createCustomer({
        organizationId,
        storeId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        wechat: wechat.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        note: note.trim() || undefined,
        source: source.trim() || undefined,
        memberLevel: memberLevel.trim() || undefined,
      });
      const id = res.id ?? (res as { Customer?: { id: string } }).Customer?.id;
      if (id) {
        setSnack(true);
        router.replace(`/customer/${id}` as never);
      } else {
        setErr('创建成功但未返回客户ID');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : '创建失败');
    } finally {
      setSaving(false);
    }
  }, [
    address,
    email,
    emailErr,
    memberLevel,
    name,
    nameErr,
    note,
    organizationId,
    phone,
    phoneErr,
    router,
    source,
    storeId,
    wechat,
  ]);

  if (!storeId || !organizationId) {
    return <Text style={{ padding: 16 }}>请先选择门店</Text>;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="新建客户" titleStyle={{ color: theme.colors.onSurface }} />
        <Appbar.Action icon="check" onPress={() => void submit()} disabled={saving} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TextInput
          label="姓名 *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          maxLength={MAX.name}
          style={styles.input}
        />
        <TextInput
          label="手机"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          keyboardType="phone-pad"
          maxLength={MAX.phone}
          style={styles.input}
        />
        <TextInput
          label="微信"
          value={wechat}
          onChangeText={setWechat}
          mode="outlined"
          maxLength={MAX.wechat}
          style={styles.input}
        />
        <TextInput
          label="邮箱"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          maxLength={MAX.email}
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          label="地址"
          value={address}
          onChangeText={setAddress}
          mode="outlined"
          maxLength={MAX.address}
          style={styles.input}
        />
        <TextInput
          label="备注"
          value={note}
          onChangeText={setNote}
          mode="outlined"
          maxLength={MAX.note}
          multiline
          numberOfLines={3}
          style={styles.input}
        />
        <TextInput
          label="来源"
          value={source}
          onChangeText={setSource}
          mode="outlined"
          maxLength={MAX.source}
          style={styles.input}
        />
        <TextInput
          label="会员等级"
          value={memberLevel}
          onChangeText={setMemberLevel}
          mode="outlined"
          maxLength={MAX.memberLevel}
          style={styles.input}
        />
        {!!(nameErr || phoneErr || emailErr) && (
          <HelperText type="error" visible>
            {nameErr || phoneErr || emailErr}
          </HelperText>
        )}
        {err && <HelperText type="error">{err}</HelperText>}
        <Button mode="contained" onPress={() => void submit()} loading={saving} style={styles.btn}>
          保存
        </Button>
      </ScrollView>
      <Snackbar visible={snack} onDismiss={() => setSnack(false)} duration={2000}>
        已创建
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  input: { marginBottom: 8 },
  btn: { marginTop: 8 },
});
