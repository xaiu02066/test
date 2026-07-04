// screens/HomeScreen.js —— 个人主页
import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, Pressable, ScrollView, Alert,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { useNavigation, CommonActions } from '@react-navigation/native'
import api, { clearAuth, getStoredToken, saveAuth } from '../utils/api'
import { colors, layout, sharedStyles } from '../theme'

export default function HomeScreen() {
  const navigation = useNavigation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/auth/profile', null, true)
        if (res.code === 0) {
          setUser(res.data)
          // 同步更新本地缓存的用户信息
          const token = await getStoredToken()
          if (token) await saveAuth(token, res.data)
        }
      } catch {}
      setLoading(false)
    })()
  }, [])

  const goAdmin = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Admin' }],
      })
    )
  }, [navigation])

  const handleLogout = useCallback(() => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          await clearAuth()
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          )
        },
      },
    ])
  }, [navigation])

  if (loading || !user) {
    return (
      <View style={[sharedStyles.container, styles.loadingBox]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    )
  }

  const initial = (user.username[0] || 'U').toUpperCase()

  const infoRows = [
    { key: 'ID', value: String(user.id) },
    { key: '用户名', value: user.username },
    { key: '邮箱', value: user.email },
    { key: '角色', value: user.role === 'admin' ? '管理员' : '普通用户' },
    {
      key: '状态',
      value: user.status === 1 ? '启用' : '禁用',
      color: user.status === 1 ? colors.green : colors.red,
    },
    { key: '注册时间', value: user.created_at || '-' },
  ]

  return (
    <ScrollView
      style={sharedStyles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero 头部 */}
      <View style={styles.hero}>
        <View style={[sharedStyles.avatar, styles.heroAvatar]}>
          <Text style={[sharedStyles.avatarText, { fontSize: 36 }]}>{initial}</Text>
        </View>
        <Text style={styles.heroName}>{user.username}</Text>
        <Text style={styles.heroEmail}>{user.email}</Text>
        <View style={styles.heroBadges}>
          <Text style={[sharedStyles.badge, user.role === 'admin' ? sharedStyles.badgeAdmin : sharedStyles.badgeUser]}>
            {user.role === 'admin' ? '管理员' : '普通用户'}
          </Text>
          <Text style={[sharedStyles.badge, user.status === 1 ? sharedStyles.badgeOn : sharedStyles.badgeOff]}>
            {user.status === 1 ? '启用' : '禁用'}
          </Text>
        </View>
      </View>

      {/* 信息卡片 */}
      <View style={[sharedStyles.card, styles.infoCard]}>
        {infoRows.map((row, idx) => (
          <View
            key={row.key}
            style={[
              styles.infoRow,
              idx < infoRows.length - 1 && styles.infoRowBorder,
            ]}
          >
            <Text style={styles.infoKey}>{row.key}</Text>
            <Text style={[styles.infoVal, row.color && { color: row.color }]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {/* 操作按钮 */}
      <View style={styles.actions}>
        {user.role === 'admin' && (
          <Pressable
            style={({ pressed }) => [sharedStyles.btnPrimary, pressed && { opacity: 0.85 }]}
            onPress={goAdmin}
          >
            <Text style={sharedStyles.btnPrimaryText}>进入管理后台</Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [sharedStyles.btnGhost, pressed && { opacity: 0.6 }]}
          onPress={handleLogout}
        >
          <Text style={sharedStyles.btnGhostText}>退出登录</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingBox: {
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12, fontSize: 14, color: colors.textMute,
  },
  content: {
    padding: layout.padding,
    paddingTop: 60,
    paddingBottom: 40,
  },
  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  heroAvatar: {
    width: 92, height: 92, borderRadius: 24,
  },
  heroName: {
    fontSize: 24, fontWeight: '800', color: colors.text,
    marginTop: 14,
  },
  heroEmail: {
    fontSize: 14, color: colors.textMute, marginTop: 4,
  },
  heroBadges: {
    flexDirection: 'row', gap: 8, marginTop: 12,
  },
  // 信息卡
  infoCard: { padding: 4 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14,
  },
  infoRowBorder: {
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  infoKey: { fontSize: 14, color: colors.textMute },
  infoVal: { fontSize: 14, color: colors.text, fontWeight: '600' },
  // 操作
  actions: { gap: 12, marginTop: 24 },
})
