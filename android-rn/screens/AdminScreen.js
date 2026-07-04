// screens/AdminScreen.js —— 管理后台：统计 + 用户列表 + CRUD + 搜索筛选分页
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  View, Text, TextInput, Pressable, FlatList, Modal,
  Alert, ActivityIndicator, StyleSheet, RefreshControl,
} from 'react-native'
import { useNavigation, CommonActions } from '@react-navigation/native'
import api, { clearAuth, getStoredUser, toast } from '../utils/api'
import { colors, layout, sharedStyles } from '../theme'

const PAGE_SIZE = 10

// 角色筛选选项（value 为 '' 表示全部）
const ROLE_FILTERS = [
  { label: '全部角色', value: '' },
  { label: '管理员', value: 'admin' },
  { label: '普通用户', value: 'user' },
]
const STATUS_FILTERS = [
  { label: '全部状态', value: '' },
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' },
]
const ROLE_FORM_OPTS = [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' },
]
const STATUS_FORM_OPTS = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
]

const EMPTY_FORM = {
  id: 0, username: '', email: '', password: '', role: 'user', status: 1,
}

export default function AdminScreen() {
  const navigation = useNavigation()
  const [me, setMe] = useState(null)

  const [stats, setStats] = useState({ total: 0, active: 0, disabled: 0, admins: 0 })
  const [list, setList] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [keyword, setKeyword] = useState('')
  const [roleIdx, setRoleIdx] = useState(0)
  const [statusIdx, setStatusIdx] = useState(0)

  // 弹窗
  const [modalShow, setModalShow] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  // ====== 数据加载 ======
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/stats', null, true)
      setStats(res.data)
    } catch {}
  }, [])

  const loadList = useCallback(async (p = page) => {
    setLoading(true)
    const params = { page: p, size: PAGE_SIZE }
    if (keyword) params.keyword = keyword
    const role = ROLE_FILTERS[roleIdx].value
    if (role) params.role = role
    const status = STATUS_FILTERS[statusIdx].value
    if (status) params.status = status

    try {
      const res = await api.get('/users', params, true)
      setList(res.data.list)
      setTotal(res.data.total)
      setTotalPages(Math.max(1, Math.ceil(res.data.total / res.data.size)))
    } catch {}
    setLoading(false)
  }, [page, keyword, roleIdx, statusIdx])

  const refreshAll = useCallback(() => {
    loadStats()
    setPage(1)
    loadList(1)
  }, [loadStats, loadList])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([loadStats(), loadList(1)])
    setRefreshing(false)
  }, [loadStats, loadList])

  useEffect(() => {
    (async () => {
      const u = await getStoredUser()
      setMe(u)
    })()
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ====== 搜索 / 筛选 ======
  const onSearch = useCallback(() => {
    setPage(1)
    loadList(1)
  }, [loadList])

  const onRoleChange = useCallback((idx) => {
    setRoleIdx(idx)
    setPage(1)
    setTimeout(() => loadList(1), 0)
  }, [loadList])

  const onStatusChange = useCallback((idx) => {
    setStatusIdx(idx)
    setPage(1)
    setTimeout(() => loadList(1), 0)
  }, [loadList])

  // ====== 分页 ======
  const prevPage = useCallback(() => {
    if (page <= 1) return
    const p = page - 1
    setPage(p)
    loadList(p)
  }, [page, loadList])

  const nextPage = useCallback(() => {
    if (page >= totalPages) return
    const p = page + 1
    setPage(p)
    loadList(p)
  }, [page, totalPages, loadList])

  // ====== CRUD ======
  const openCreate = useCallback(() => {
    setModalMode('create')
    setForm(EMPTY_FORM)
    setModalShow(true)
  }, [])

  const openEdit = useCallback((u) => {
    setModalMode('edit')
    setForm({
      id: u.id, username: u.username, email: u.email,
      password: '', role: u.role, status: u.status,
    })
    setModalShow(true)
  }, [])

  const onFormInput = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }, [])

  const submitForm = useCallback(async () => {
    if (!form.username || !form.email) return toast('请填写完整信息')
    if (modalMode === 'create' && !form.password) return toast('请输入密码')

    const payload = {
      username: form.username,
      email: form.email,
      role: form.role,
      status: form.status,
    }
    if (form.password) payload.password = form.password

    setSubmitting(true)
    try {
      if (modalMode === 'create') {
        await api.post('/users', payload, true)
        toast('创建成功')
      } else {
        await api.put('/users/' + form.id, payload, true)
        toast('更新成功')
      }
      setModalShow(false)
      refreshAll()
    } catch {}
    setSubmitting(false)
  }, [form, modalMode, refreshAll])

  const toggleStatus = useCallback((u) => {
    const next = u.status === 1 ? 0 : 1
    Alert.alert(
      '确认操作',
      `确定要${next === 1 ? '启用' : '禁用'}用户「${u.username}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await api.patch(`/users/${u.id}/status`, { status: next }, true)
              toast('状态已更新')
              refreshAll()
            } catch {}
          },
        },
      ]
    )
  }, [refreshAll])

  const deleteUser = useCallback((u) => {
    Alert.alert(
      '确认删除',
      `确定删除用户「${u.username}」？此操作不可恢复。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.del('/users/' + u.id, null, true)
              toast('删除成功')
              refreshAll()
            } catch {}
          },
        },
      ]
    )
  }, [refreshAll])

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

  // ====== 渲染 ======
  const renderStat = useCallback(({ item }) => (
    <View style={[sharedStyles.card, styles.statCard, { borderColor: item.color }]}>
      <Text style={[styles.statNum, { color: item.color }]}>{item.value}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
    </View>
  ), [])

  const statData = useMemo(() => [
    { key: 'total', label: '用户总数', value: stats.total, color: colors.text },
    { key: 'active', label: '启用', value: stats.active, color: colors.green },
    { key: 'disabled', label: '禁用', value: stats.disabled, color: colors.red },
    { key: 'admins', label: '管理员', value: stats.admins, color: colors.accent },
  ], [stats])

  const renderItem = useCallback(({ item: u }) => (
    <MemoizedUserRow
      user={u}
      onEdit={openEdit}
      onToggle={toggleStatus}
      onDelete={deleteUser}
    />
  ), [openEdit, toggleStatus, deleteUser])

  const renderEmpty = useCallback(() => {
    if (loading) return null
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>∅</Text>
        <Text style={styles.emptyText}>暂无用户数据</Text>
      </View>
    )
  }, [loading])

  return (
    <View style={sharedStyles.container}>
      {/* 顶部栏 */}
      <View style={styles.topbar}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>U</Text>
          </View>
          <View>
            <Text style={styles.brandName}>用户管理后台</Text>
            <Text style={styles.brandSub}>{me?.username || ''} · 管理员</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.6 }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>退出</Text>
        </Pressable>
      </View>

      {/* 统计卡 */}
      <FlatList
        data={statData}
        renderItem={renderStat}
        keyExtractor={item => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContent}
        scrollEnabled={false}
      />

      {/* 工具栏：搜索 + 筛选 */}
      <View style={[sharedStyles.card, styles.toolbar]}>
        <View style={styles.searchRow}>
          <TextInput
            style={[sharedStyles.input, styles.searchInput]}
            placeholder="搜索用户名 / 邮箱"
            placeholderTextColor={colors.textDim}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
          <Pressable
            style={({ pressed }) => [sharedStyles.btnPrimary, styles.searchBtn, pressed && { opacity: 0.85 }]}
            onPress={onSearch}
          >
            <Text style={sharedStyles.btnPrimaryText}>搜索</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {ROLE_FILTERS.map((r, i) => (
            <Pressable
              key={r.value + i}
              style={({ pressed }) => [
                styles.chip,
                roleIdx === i && styles.chipActive,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => onRoleChange(i)}
            >
              <Text style={[styles.chipText, roleIdx === i && styles.chipTextActive]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((s, i) => (
            <Pressable
              key={s.value + i}
              style={({ pressed }) => [
                styles.chip,
                statusIdx === i && styles.chipActive,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => onStatusChange(i)}
            >
              <Text style={[styles.chipText, statusIdx === i && styles.chipTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
            onPress={openCreate}
          >
            <Text style={styles.addBtnText}>+ 新增</Text>
          </Pressable>
        </View>
      </View>

      {/* 列表标题 */}
      <View style={styles.listTitleRow}>
        <Text style={styles.listTitle}>用户列表（共 {total} 人）</Text>
        {loading && <ActivityIndicator color={colors.accent} size="small" />}
      </View>

      <FlatList
        data={list}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />
        }
      />

      {/* 分页 */}
      {totalPages > 0 && (
        <View style={styles.pager}>
          <Pressable
            style={({ pressed }) => [
              styles.pageBtn,
              page <= 1 && styles.pageBtnDis,
              pressed && page > 1 && { opacity: 0.6 },
            ]}
            disabled={page <= 1}
            onPress={prevPage}
          >
            <Text style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDis]}>上一页</Text>
          </Pressable>
          <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.pageBtn,
              page >= totalPages && styles.pageBtnDis,
              pressed && page < totalPages && { opacity: 0.6 },
            ]}
            disabled={page >= totalPages}
            onPress={nextPage}
          >
            <Text style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDis]}>下一页</Text>
          </Pressable>
        </View>
      )}

      {/* 新增 / 编辑弹窗 */}
      <UserModal
        visible={modalShow}
        mode={modalMode}
        form={form}
        submitting={submitting}
        onInput={onFormInput}
        onClose={() => setModalShow(false)}
        onSubmit={submitForm}
      />
    </View>
  )
}

// ====== 用户行组件（memo 化，遵循 list-performance-item-memo） ======
const UserRow = ({ user, onEdit, onToggle, onDelete }) => {
  const initial = (user.username[0] || 'U').toUpperCase()
  return (
    <View style={[sharedStyles.card, styles.userCard]}>
      <View style={styles.userMain}>
        <View style={sharedStyles.avatar}>
          <Text style={sharedStyles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userLine1}>
            <Text style={styles.userName}>{user.username}</Text>
            <Text style={[sharedStyles.badge, user.role === 'admin' ? sharedStyles.badgeAdmin : sharedStyles.badgeUser]}>
              {user.role === 'admin' ? '管理员' : '用户'}
            </Text>
            <Text style={[sharedStyles.badge, user.status === 1 ? sharedStyles.badgeOn : sharedStyles.badgeOff]}>
              {user.status === 1 ? '启用' : '禁用'}
            </Text>
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
        </View>
      </View>
      <View style={styles.userActions}>
        <Pressable
          style={({ pressed }) => [styles.actBtn, styles.actToggle, pressed && { opacity: 0.6 }]}
          onPress={() => onToggle(user)}
        >
          <Text style={styles.actToggleText}>{user.status === 1 ? '禁用' : '启用'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actBtn, styles.actEdit, pressed && { opacity: 0.6 }]}
          onPress={() => onEdit(user)}
        >
          <Text style={styles.actEditText}>编辑</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actBtn, styles.actDel, pressed && { opacity: 0.6 }]}
          onPress={() => onDelete(user)}
        >
          <Text style={styles.actDelText}>删除</Text>
        </Pressable>
      </View>
    </View>
  )
}

const MemoizedUserRow = memo(UserRow)

// ====== 新增 / 编辑弹窗 ======
const UserModal = ({ visible, mode, form, submitting, onInput, onClose, onSubmit }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalMask} onPress={onClose}>
        <Pressable style={[sharedStyles.card, styles.modal]} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{mode === 'create' ? '新增用户' : '编辑用户'}</Text>

          <View style={styles.modalField}>
            <Text style={sharedStyles.label}>用户名</Text>
            <TextInput
              style={sharedStyles.input}
              placeholder="3-20 位"
              placeholderTextColor={colors.textDim}
              value={form.username}
              onChangeText={(v) => onInput('username', v)}
            />
          </View>
          <View style={styles.modalField}>
            <Text style={sharedStyles.label}>邮箱</Text>
            <TextInput
              style={sharedStyles.input}
              placeholder="name@example.com"
              placeholderTextColor={colors.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(v) => onInput('email', v)}
            />
          </View>
          <View style={styles.modalField}>
            <Text style={sharedStyles.label}>密码</Text>
            <TextInput
              style={sharedStyles.input}
              placeholder={mode === 'edit' ? '留空则不修改' : '至少 6 位'}
              placeholderTextColor={colors.textDim}
              secureTextEntry
              value={form.password}
              onChangeText={(v) => onInput('password', v)}
            />
          </View>

          <View style={styles.modalField}>
            <Text style={sharedStyles.label}>角色</Text>
            <View style={styles.modalChips}>
              {ROLE_FORM_OPTS.map(opt => (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.chip,
                    form.role === opt.value && styles.chipActive,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => onInput('role', opt.value)}
                >
                  <Text style={[styles.chipText, form.role === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.modalField}>
            <Text style={sharedStyles.label}>状态</Text>
            <View style={styles.modalChips}>
              {STATUS_FORM_OPTS.map(opt => (
                <Pressable
                  key={String(opt.value)}
                  style={({ pressed }) => [
                    styles.chip,
                    form.status === opt.value && styles.chipActive,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => onInput('status', opt.value)}
                >
                  <Text style={[styles.chipText, form.status === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.modalBtns}>
            <Pressable
              style={({ pressed }) => [sharedStyles.btnGhost, styles.modalBtn, pressed && { opacity: 0.6 }]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={sharedStyles.btnGhostText}>取消</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [sharedStyles.btnPrimary, styles.modalBtn, pressed && { opacity: 0.85 }]}
              onPress={onSubmit}
              disabled={submitting}
            >
              <Text style={sharedStyles.btnPrimaryText}>
                {submitting ? '保存中...' : '保 存'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  // 顶部栏
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.padding,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: colors.bgElev,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  brandMarkText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  brandName: { fontSize: 17, fontWeight: '700', color: colors.text },
  brandSub: { fontSize: 12, color: colors.textMute, marginTop: 2 },
  logoutBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.redSoft, borderRadius: 8,
  },
  logoutText: { color: colors.red, fontSize: 13, fontWeight: '600' },

  // 统计卡
  statsContent: { paddingHorizontal: layout.padding, paddingVertical: 12, gap: 10 },
  statCard: {
    width: 140, marginRight: 10, padding: 14,
    borderLeftWidth: 4,
  },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 13, color: colors.textMute, marginTop: 4 },

  // 工具栏
  toolbar: { marginHorizontal: layout.padding, padding: 14 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchInput: { flex: 1 },
  searchBtn: { width: 88, height: 50 },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.bgSoft, borderRadius: 8,
    borderWidth: 1, borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: { fontSize: 13, color: colors.textMute },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  addBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.green, borderRadius: 8,
    marginLeft: 'auto',
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // 列表
  listTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: layout.padding, paddingVertical: 10,
  },
  listTitle: { fontSize: 14, fontWeight: '600', color: colors.textMute },
  listContent: { paddingHorizontal: layout.padding, paddingBottom: 24 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, color: colors.textDim, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.textMute },

  // 用户行
  userCard: { padding: 14, marginBottom: 10 },
  userMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  userInfo: { flex: 1, marginLeft: 12 },
  userLine1: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  userName: { fontSize: 16, fontWeight: '700', color: colors.text },
  userEmail: { fontSize: 13, color: colors.textMute, marginTop: 4 },
  userActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: 12 },
  actBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
  },
  actToggle: { backgroundColor: colors.bgSoft },
  actToggleText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  actEdit: { backgroundColor: colors.greenSoft },
  actEditText: { color: colors.green, fontSize: 13, fontWeight: '600' },
  actDel: { backgroundColor: colors.redSoft },
  actDelText: { color: colors.red, fontSize: 13, fontWeight: '600' },

  // 分页
  pager: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingVertical: 12,
    backgroundColor: colors.bgElev,
    borderTopWidth: 1, borderTopColor: colors.borderSoft,
  },
  pageBtn: {
    paddingHorizontal: 18, paddingVertical: 8,
    backgroundColor: colors.accent, borderRadius: 8,
  },
  pageBtnDis: { backgroundColor: colors.bgSoft },
  pageBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  pageBtnTextDis: { color: colors.textDim },
  pageInfo: { fontSize: 14, fontWeight: '600', color: colors.text, minWidth: 56, textAlign: 'center' },

  // 弹窗
  modalMask: {
    flex: 1, backgroundColor: 'rgba(58, 46, 34, 0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modal: { width: '100%', padding: 22, borderRadius: layout.radiusLg },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 18, textAlign: 'center' },
  modalField: { marginBottom: 14 },
  modalChips: { flexDirection: 'row', gap: 8 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: { flex: 1 },
})
