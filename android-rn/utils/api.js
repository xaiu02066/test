// utils/api.js —— 请求封装：自动注入 JWT、401 自动登出、Toast 提示
import { Alert, Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// ====== 后端地址配置 ======
// 模拟器：用 http://10.0.2.2:5000（Android 模拟器访问宿主机的特殊 IP）
// 真机调试：用 http://<你电脑的局域网IP>:5000，例如 http://192.168.101.219:5000
//   （在电脑 PowerShell 执行 ipconfig 查看 IPv4 地址）
// 局域网 IP 写下面：
export const BASE_URL = 'http://10.0.2.2:5000'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export async function saveAuth(token, user) {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
}

export async function clearAuth() {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(USER_KEY)
}

export async function getStoredToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY)
}

export async function getStoredUser() {
  const s = await SecureStore.getItemAsync(USER_KEY)
  try { return s ? JSON.parse(s) : null } catch { return null }
}

let toastFn = null
export function setToastHandler(fn) { toastFn = fn }

export function toast(msg) {
  if (toastFn) { toastFn(msg); return }
  // 兜底：用 Alert
  Alert.alert('提示', msg)
}

async function request(path, method, data, silent) {
  const token = await getStoredToken()
  const url = BASE_URL + '/api' + path

  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }
  if (token) opts.headers.Authorization = 'Bearer ' + token
  if (data && method !== 'GET') opts.body = JSON.stringify(data)

  let queryUrl = url
  if (data && method === 'GET') {
    const params = new URLSearchParams()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, v)
    })
    const qs = params.toString()
    if (qs) queryUrl += '?' + qs
  }

  try {
    const res = await fetch(queryUrl, opts)
    let body = {}
    try { body = await res.json() } catch {}

    if (!res.ok) {
      if (!silent) toast(body.message || '请求失败')
      if (res.status === 401) {
        await clearAuth()
        // 通过全局事件通知 App 跳转登录
        EventEmitter.emit('unauthorized')
      }
      return Promise.reject(body)
    }
    if (body.code !== 0) {
      if (!silent) toast(body.message || '操作失败')
      if (body.code === 401) {
        await clearAuth()
        EventEmitter.emit('unauthorized')
      }
      return Promise.reject(body)
    }
    return body
  } catch (err) {
    if (!silent && !err.message) toast('网络异常，请检查后端是否启动')
    return Promise.reject(err)
  }
}

// 极简事件总线，用于 401 时通知导航跳转
export const EventEmitter = {
  listeners: {},
  on(evt, fn) { (this.listeners[evt] ||= []).push(fn) },
  off(evt, fn) {
    if (!this.listeners[evt]) return
    this.listeners[evt] = this.listeners[evt].filter(f => f !== fn)
  },
  emit(evt, ...args) {
    (this.listeners[evt] || []).forEach(fn => fn(...args))
  }
}

export const api = {
  get:    (p, d, s) => request(p, 'GET',    d, s),
  post:   (p, d, s) => request(p, 'POST',   d, s),
  put:    (p, d, s) => request(p, 'PUT',    d, s),
  del:    (p, d, s) => request(p, 'DELETE', d, s),
  patch:  (p, d, s) => request(p, 'PATCH',  d, s),
}

export default api
