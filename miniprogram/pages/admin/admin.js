// pages/admin/admin.js —— 管理后台：统计概览 + 用户列表 + 增删改查 + 搜索筛选分页
const api = require('../../utils/api.js')
const app = getApp()

const ROLE_OPTS  = ['全部', '管理员', '普通用户']
const ROLE_VAL   = ['', 'admin', 'user']
const STATUS_OPTS = ['全部', '启用', '禁用']
const STATUS_VAL  = ['', '1', '0']

Page({
  data: {
    me: null,
    // 统计
    stats: { total: 0, active: 0, disabled: 0, admins: 0 },
    // 列表
    list: [],
    page: 1,
    size: 10,
    total: 0,
    totalPages: 0,
    keyword: '',
    roleIdx: 0,
    statusIdx: 0,
    loading: false,
    roleOpts: ROLE_OPTS,
    statusOpts: STATUS_OPTS,
    // 弹窗
    modalShow: false,
    modalMode: 'create',     // create | edit
    form: {
      id: 0, username: '', email: '', password: '', role: 'user', status: 1
    },
    formRoleIdx: 1,
    formStatusIdx: 1
  },

  onLoad() {
    this.setData({ me: app.globalData.user })
    this.refreshAll()
  },

  refreshAll() {
    this.loadStats()
    this.setData({ page: 1 }, () => this.loadList())
  },

  loadStats() {
    api.get('/stats', null, true).then(res => {
      this.setData({ stats: res.data })
    }).catch(() => {})
  },

  loadList() {
    this.setData({ loading: true })
    const params = {
      page: this.data.page,
      size: this.data.size
    }
    if (this.data.keyword) params.keyword = this.data.keyword
    const role = ROLE_VAL[this.data.roleIdx]
    if (role) params.role = role
    const status = STATUS_VAL[this.data.statusIdx]
    if (status) params.status = status

    api.get('/users', params, true)
      .then(res => {
        const d = res.data
        this.setData({
          list: d.list,
          total: d.total,
          totalPages: Math.max(1, Math.ceil(d.total / d.size))
        })
      })
      .catch(() => {})
      .then(() => this.setData({ loading: false }))
  },

  /* ---------- 搜索 / 筛选 ---------- */
  onKeyword(e) { this.setData({ keyword: e.detail.value }) },
  onSearch() { this.setData({ page: 1 }, () => this.loadList()) },
  onRoleChange(e) { this.setData({ roleIdx: +e.detail.value, page: 1 }, () => this.loadList()) },
  onStatusChange(e) { this.setData({ statusIdx: +e.detail.value, page: 1 }, () => this.loadList()) },

  /* ---------- 分页 ---------- */
  prevPage() {
    if (this.data.page <= 1) return
    this.setData({ page: this.data.page - 1 }, () => this.loadList())
  },
  nextPage() {
    if (this.data.page >= this.data.totalPages) return
    this.setData({ page: this.data.page + 1 }, () => this.loadList())
  },

  /* ---------- 新增 ---------- */
  openCreate() {
    this.setData({
      modalShow: true,
      modalMode: 'create',
      form: { id: 0, username: '', email: '', password: '', role: 'user', status: 1 },
      formRoleIdx: 1,
      formStatusIdx: 1
    })
  },

  /* ---------- 编辑 ---------- */
  openEdit(e) {
    const u = e.currentTarget.dataset.user
    this.setData({
      modalShow: true,
      modalMode: 'edit',
      form: {
        id: u.id, username: u.username, email: u.email,
        password: '', role: u.role, status: u.status
      },
      formRoleIdx: u.role === 'admin' ? 0 : 1,
      formStatusIdx: u.status === 1 ? 1 : 0
    })
  },

  onFormInput(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ ['form.' + key]: e.detail.value })
  },
  onFormRoleChange(e) {
    this.setData({ formRoleIdx: +e.detail.value, 'form.role': ROLE_VAL[+e.detail.value] })
  },
  onFormStatusChange(e) {
    const idx = +e.detail.value
    this.setData({ formStatusIdx: idx, 'form.status': idx === 1 ? 1 : 0 })
  },

  /* ---------- 保存 ---------- */
  submitForm() {
    const f = this.data.form
    if (!f.username || !f.email) return api.toast('请填写完整信息')
    if (this.data.modalMode === 'create' && !f.password) return api.toast('请输入密码')
    if (this.data.modalMode === 'edit' && !f.password) {
      // 编辑时不填密码则不传
    }
    const payload = {
      username: f.username,
      email: f.email,
      role: f.role,
      status: f.status
    }
    if (f.password) payload.password = f.password

    const task = this.data.modalMode === 'create'
      ? api.post('/users', payload, true)
      : api.put('/users/' + f.id, payload, true)

    task.then(() => {
      api.toast(this.data.modalMode === 'create' ? '创建成功' : '更新成功')
      this.setData({ modalShow: false })
      this.refreshAll()
    }).catch(() => {})
  },

  closeModal() { this.setData({ modalShow: false }) },

  /* ---------- 状态切换 ---------- */
  toggleStatus(e) {
    const u = e.currentTarget.dataset.user
    const next = u.status === 1 ? 0 : 1
    wx.showModal({
      title: '确认操作',
      content: `确定要${next === 1 ? '启用' : '禁用'}用户「${u.username}」吗？`,
      success: (r) => {
        if (r.confirm) {
          api.patch('/users/' + u.id + '/status', { status: next }, true)
            .then(() => { api.toast('状态已更新'); this.refreshAll() })
            .catch(() => {})
        }
      }
    })
  },

  /* ---------- 删除 ---------- */
  deleteUser(e) {
    const u = e.currentTarget.dataset.user
    wx.showModal({
      title: '删除用户',
      content: `确定删除用户「${u.username}」？此操作不可恢复。`,
      confirmColor: '#DC604A',
      success: (r) => {
        if (r.confirm) {
          api.del('/users/' + u.id, null, true)
            .then(() => { api.toast('删除成功'); this.refreshAll() })
            .catch(() => {})
        }
      }
    })
  },

  /* ---------- 退出登录 ---------- */
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (r) => { if (r.confirm) app.logout() }
    })
  }
})
