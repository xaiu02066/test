// utils/api.js —— 请求封装：自动注入 token、统一错误处理、401 自动登出
//
// ====== 后端地址配置 ======
// 开发者工具调试：用 http://127.0.0.1:5000 或 http://localhost:5000 即可
// 手机真机调试：把下面的地址换成 "http://<你电脑的局域网IP>:5000"
//   （在电脑 PowerShell 执行 ipconfig 可查看 IPv4 地址，例如 192.168.1.10）
// 线上环境：换成你的服务器 https 域名
//
// 注意：小程序只能请求已配置的合法域名，开发期请在开发者工具勾选
//   「详情 → 本地设置 → 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」
const BASE_URL = 'http://127.0.0.1:5000'

/**
 * 核心请求方法
 * @param {string} path  接口路径，如 '/auth/login'
 * @param {string} method HTTP 方法
 * @param {object} data   请求数据
 * @param {boolean} silent 是否静默（不弹 toast）
 */
function request(path, method, data, silent) {
  const app = getApp()
  const token = app.globalData.token
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + '/api' + path,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? ('Bearer ' + token) : ''
      },
      success: (res) => {
        const body = res.data || {}
        // HTTP 层失败
        if (res.statusCode < 200 || res.statusCode >= 300) {
          if (!silent) toast(body.message || '请求失败')
          // 401：登录态失效，自动登出
          if (res.statusCode === 401) {
            app.logout()
          }
          reject(body)
          return
        }
        // 业务层失败
        if (body.code !== 0) {
          if (!silent) toast(body.message || '操作失败')
          if (body.code === 401) app.logout()
          reject(body)
          return
        }
        resolve(body)
      },
      fail: (err) => {
        if (!silent) toast('网络异常，请检查后端是否启动')
        reject(err)
      }
    })
  })
}

function toast(msg) {
  wx.showToast({ title: msg, icon: 'none', duration: 2200 })
}

module.exports = {
  BASE_URL,
  get:    (path, data, silent) => request(path, 'GET',    data, silent),
  post:   (path, data, silent) => request(path, 'POST',   data, silent),
  put:    (path, data, silent) => request(path, 'PUT',    data, silent),
  del:    (path, data, silent) => request(path, 'DELETE', data, silent),
  patch:  (path, data, silent) => request(path, 'PATCH',  data, silent),
  toast
}
