const BASE = '/api'

function getToken() {
  return localStorage.getItem('token') || ''
}

export function setAuth(token, user) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

function request(path, method, data, silent) {
  const token = getToken()
  const url = BASE + path
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

  return fetch(queryUrl, opts)
    .then(async (res) => {
      let body = {}
      try { body = await res.json() } catch {}
      if (!res.ok) {
        if (!silent) toast(body.message || '请求失败')
        if (res.status === 401) {
          clearAuth()
          window.location.hash = '#/login'
        }
        return Promise.reject(body)
      }
      if (body.code !== 0) {
        if (!silent) toast(body.message || '操作失败')
        if (body.code === 401) {
          clearAuth()
          window.location.hash = '#/login'
        }
        return Promise.reject(body)
      }
      return body
    })
    .catch((err) => {
      if (!silent && !err.message) toast('网络异常')
      return Promise.reject(err)
    })
}

let toastTimer = null
export function toast(msg) {
  let el = document.getElementById('__toast')
  if (!el) {
    el = document.createElement('div')
    el.id = '__toast'
    el.style.cssText = 'position:fixed;top:40%;left:50%;transform:translateX(-50%);background:rgba(58,46,34,0.92);color:#fff;padding:14px 28px;border-radius:12px;font-size:14px;z-index:9999;pointer-events:none;transition:opacity .2s;opacity:0;max-width:80%;text-align:center;'
    document.body.appendChild(el)
  }
  el.textContent = msg
  el.style.opacity = '1'
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { el.style.opacity = '0' }, 2000)
}

export const api = {
  get:    (p, d, s) => request(p, 'GET',    d, s),
  post:   (p, d, s) => request(p, 'POST',   d, s),
  put:    (p, d, s) => request(p, 'PUT',    d, s),
  del:    (p, d, s) => request(p, 'DELETE', d, s),
  patch:  (p, d, s) => request(p, 'PATCH',  d, s),
}

export default api
