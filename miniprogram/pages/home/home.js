// pages/home/home.js —— 个人主页
const api = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    user: null
  },

  onShow() {
    // 每次进入刷新一次资料，保持状态最新
    api.get('/auth/profile', null, true).then(res => {
      if (res.code === 0) {
        this.setData({ user: res.data })
        app.globalData.user = res.data
        wx.setStorageSync('user', res.data)
      }
    }).catch(() => {})
  },

  goAdmin() {
    wx.reLaunch({ url: '/pages/admin/admin' })
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (r) => { if (r.confirm) app.logout() }
    })
  }
})
