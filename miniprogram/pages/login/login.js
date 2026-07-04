// pages/login/login.js —— 登录 / 注册
const api = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    tab: 'login',          // login | register
    // 登录字段
    account: '',
    password: '',
    // 注册字段
    regUsername: '',
    regEmail: '',
    regPassword: '',
    loading: false
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },

  // 通用输入绑定：data-key 决定写入哪个字段
  onInput(e) {
    this.setData({ [e.currentTarget.dataset.key]: e.detail.value })
  },

  /* ---------- 登录 ---------- */
  submitLogin() {
    const { account, password } = this.data
    if (!account || !password) return api.toast('请输入账号和密码')
    this.setData({ loading: true })
    api.post('/auth/login', { account, password }, true)
      .then(res => {
        api.toast('登录成功')
        app.setAuth(res.data.token, res.data.user)
        app.redirectByRole(res.data.user.role)
      })
      .catch(() => {})
      .then(() => this.setData({ loading: false }))
  },

  /* ---------- 注册 ---------- */
  submitRegister() {
    const { regUsername: username, regEmail: email, regPassword: password } = this.data
    if (!username || !email || !password) return api.toast('请填写完整信息')
    if (username.length < 3 || username.length > 20) return api.toast('用户名长度需为 3-20 位')
    if (password.length < 6) return api.toast('密码长度至少 6 位')
    this.setData({ loading: true })
    api.post('/auth/register', { username, email, password }, true)
      .then(() => {
        api.toast('注册成功，请登录')
        // 注册成功后切到登录页，预填用户名
        this.setData({
          tab: 'login',
          account: username,
          password: '',
          regUsername: '', regEmail: '', regPassword: ''
        })
      })
      .catch(() => {})
      .then(() => this.setData({ loading: false }))
  }
})
