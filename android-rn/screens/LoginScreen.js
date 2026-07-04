// screens/LoginScreen.js —— 登录 / 注册
import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, KeyboardAvoidingView,
  ScrollView, Platform, StyleSheet, Alert,
} from 'react-native'
import { useNavigation, CommonActions } from '@react-navigation/native'
import api, { saveAuth, toast } from '../utils/api'
import { colors, sharedStyles } from '../theme'

export default function LoginScreen() {
  const navigation = useNavigation()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)

  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const redirectByRole = (role) => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: role === 'admin' ? 'Admin' : 'Home' }],
      })
    )
  }

  const handleLogin = async () => {
    if (!account || !password) return toast('请输入账号和密码')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { account, password }, true)
      toast('登录成功')
      await saveAuth(res.data.token, res.data.user)
      redirectByRole(res.data.user.role)
    } catch {}
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!regUsername || !regEmail || !regPassword) return toast('请填写完整信息')
    if (regUsername.length < 3 || regUsername.length > 20) return toast('用户名长度需为 3-20 位')
    if (regPassword.length < 6) return toast('密码长度至少 6 位')
    setLoading(true)
    try {
      await api.post('/auth/register', {
        username: regUsername, email: regEmail, password: regPassword,
      }, true)
      toast('注册成功，请登录')
      setAccount(regUsername)
      setPassword('')
      setRegUsername(''); setRegEmail(''); setRegPassword('')
      setTab('login')
    } catch {}
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* 品牌区 */}
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>U</Text>
          </View>
          <Text style={styles.brandName}>用户管理</Text>
          <Text style={styles.brandDesc}>温暖明亮 · 安全可靠的用户系统</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'login' && styles.tabActive]}
            onPress={() => setTab('login')}
          >
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>登录</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'register' && styles.tabActive]}
            onPress={() => setTab('register')}
          >
            <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>注册</Text>
          </Pressable>
        </View>

        {/* 表单卡片 */}
        <View style={[sharedStyles.card, styles.form]}>
          {tab === 'login' ? (
            <>
              <View style={styles.field}>
                <Text style={sharedStyles.label}>账号</Text>
                <TextInput
                  style={sharedStyles.input}
                  placeholder="用户名或邮箱"
                  placeholderTextColor={colors.textDim}
                  value={account}
                  onChangeText={setAccount}
                />
              </View>
              <View style={styles.field}>
                <Text style={sharedStyles.label}>密码</Text>
                <TextInput
                  style={sharedStyles.input}
                  placeholder="至少 6 位"
                  placeholderTextColor={colors.textDim}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleLogin}
                />
              </View>
              <Pressable
                style={({ pressed }) => [sharedStyles.btnPrimary, pressed && { opacity: 0.85 }]}
                disabled={loading}
                onPress={handleLogin}
              >
                <Text style={sharedStyles.btnPrimaryText}>
                  {loading ? '登录中...' : '登 录'}
                </Text>
              </Pressable>
              <Text style={styles.hint}>默认管理员 admin / admin123</Text>
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={sharedStyles.label}>用户名</Text>
                <TextInput
                  style={sharedStyles.input}
                  placeholder="3-20 位"
                  placeholderTextColor={colors.textDim}
                  value={regUsername}
                  onChangeText={setRegUsername}
                />
              </View>
              <View style={styles.field}>
                <Text style={sharedStyles.label}>邮箱</Text>
                <TextInput
                  style={sharedStyles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textDim}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={regEmail}
                  onChangeText={setRegEmail}
                />
              </View>
              <View style={styles.field}>
                <Text style={sharedStyles.label}>密码</Text>
                <TextInput
                  style={sharedStyles.input}
                  placeholder="至少 6 位"
                  placeholderTextColor={colors.textDim}
                  secureTextEntry
                  value={regPassword}
                  onChangeText={setRegPassword}
                  onSubmitEditing={handleRegister}
                />
              </View>
              <Pressable
                style={({ pressed }) => [sharedStyles.btnPrimary, pressed && { opacity: 0.85 }]}
                disabled={loading}
                onPress={handleRegister}
              >
                <Text style={sharedStyles.btnPrimaryText}>
                  {loading ? '注册中...' : '注 册'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 28, paddingTop: 60 },
  brand: { alignItems: 'center', marginBottom: 44 },
  brandMark: {
    width: 68, height: 68, borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  brandMarkText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  brandName: { fontSize: 28, fontWeight: '800', color: colors.text },
  brandDesc: { fontSize: 13, color: colors.textMute, marginTop: 6 },
  tabs: {
    flexDirection: 'row', gap: 6, marginBottom: 22,
    backgroundColor: colors.bgSoft, padding: 6, borderRadius: 14,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.accent },
  tabText: { fontSize: 15, color: colors.textMute },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  form: { padding: 24 },
  field: { marginBottom: 18 },
  hint: { textAlign: 'center', fontSize: 12, color: colors.textDim, marginTop: 16 },
})
