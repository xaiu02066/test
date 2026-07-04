// app.js —— 小程序全局入口
const api = require('./utils/api.js')

App({
  globalData: {
    token: '',
    user: null
  },

  onLaunch() {
    // 启动时读取本地缓存的登录态
    const token = wx.getStorageSync('token')
    const user = wx.getStorageSync('user')
    if (token && user) {
      this.globalData.token = token
      this.globalData.user = user
      // 静默校验 token 是否仍然有效
      api.get('/auth/profile').then(res => {
        if (res.code === 0) {
          this.globalData.user = res.data
          wx.setStorageSync('user', res.data)
          this.redirectByRole(res.data.role)
        } else {
          this.logout()
        }
      }).catch(() => {
        // 网络异常时不强制登出，保留本地态等用户操作时再处理
      })
    } else {
      this.redirectToLogin()
    }
  },

  /** 保存登录态 */
  setAuth(token, user) {
    this.globalData.token = token
    this.globalData.user = user
    wx.setStorageSync('token', token)
    wx.setStorageSync('user', user)
  },

  /** 清除登录态并跳回登录页 */
  logout() {
    this.globalData.token = ''
    this.globalData.user = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('user')
    this.redirectToLogin()
  },

  redirectToLogin() {
    wx.reLaunch({ url: '/pages/login/login' })
  },

  /** 根据角色跳转主页 */
  redirectByRole(role) {
    if (role === 'admin') {
      wx.reLaunch({ url: '/pages/admin/admin' })
    } else {
      wx.reLaunch({ url: '/pages/home/home' })
    }
  }
})
