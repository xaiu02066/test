import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { clearAuth, getUser, toast } from '../utils/api'
import './Admin.css'

const ROLE_OPTS = ['全部', '管理员', '普通用户']
const ROLE_VAL = ['', 'admin', 'user']
const STATUS_OPTS = ['全部', '启用', '禁用']
const STATUS_VAL = ['', '1', '0']

export default function AdminPage() {
  const navigate = useNavigate()
  const me = getUser()

  const [stats, setStats] = useState({ total: 0, active: 0, disabled: 0, admins: 0 })
  const [list, setList] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [roleIdx, setRoleIdx] = useState(0)
  const [statusIdx, setStatusIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const pageSize = 10

  // 弹窗
  const [modalShow, setModalShow] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [form, setForm] = useState({
    id: 0, username: '', email: '', password: '', role: 'user', status: 1
  })
  const [formRoleIdx, setFormRoleIdx] = useState(1)
  const [formStatusIdx, setFormStatusIdx] = useState(1)

  const loadStats = () => {
    api.get('/stats', null, true).then(res => setStats(res.data)).catch(() => {})
  }

  const loadList = (p = page) => {
    setLoading(true)
    const params = { page: p, size: pageSize }
    if (keyword) params.keyword = keyword
    const role = ROLE_VAL[roleIdx]
    if (role) params.role = role
    const status = STATUS_VAL[statusIdx]
    if (status) params.status = status

    api.get('/users', params, true)
      .then(res => {
        setList(res.data.list)
        setTotal(res.data.total)
        setTotalPages(Math.max(1, Math.ceil(res.data.total / res.data.size)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const refreshAll = () => {
    loadStats()
    setPage(1)
    loadList(1)
  }

  useEffect(() => {
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSearch = () => {
    setPage(1)
    loadList(1)
  }

  const onRoleChange = (e) => {
    const idx = +e.target.value
    setRoleIdx(idx)
    setPage(1)
    setTimeout(() => loadList(1), 0)
  }

  const onStatusChange = (e) => {
    const idx = +e.target.value
    setStatusIdx(idx)
    setPage(1)
    setTimeout(() => loadList(1), 0)
  }

  const prevPage = () => {
    if (page <= 1) return
    const p = page - 1
    setPage(p)
    loadList(p)
  }

  const nextPage = () => {
    if (page >= totalPages) return
    const p = page + 1
    setPage(p)
    loadList(p)
  }

  const openCreate = () => {
    setModalMode('create')
    setForm({ id: 0, username: '', email: '', password: '', role: 'user', status: 1 })
    setFormRoleIdx(1)
    setFormStatusIdx(1)
    setModalShow(true)
  }

  const openEdit = (u) => {
    setModalMode('edit')
    setForm({ id: u.id, username: u.username, email: u.email, password: '', role: u.role, status: u.status })
    setFormRoleIdx(u.role === 'admin' ? 1 : 0)
    setFormStatusIdx(u.status === 1 ? 1 : 0)
    setModalShow(true)
  }

  const onFormInput = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  const onFormRoleChange = (e) => {
    const idx = +e.target.value
    setFormRoleIdx(idx)
    setForm(prev => ({ ...prev, role: ROLE_VAL[idx] || 'user' }))
  }

  const onFormStatusChange = (e) => {
    const idx = +e.target.value
    setFormStatusIdx(idx)
    setForm(prev => ({ ...prev, status: idx === 1 ? 1 : 0 }))
  }

  const submitForm = async () => {
    if (!form.username || !form.email) return toast('请填写完整信息')
    if (modalMode === 'create' && !form.password) return toast('请输入密码')

    const payload = {
      username: form.username,
      email: form.email,
      role: form.role,
      status: form.status
    }
    if (form.password) payload.password = form.password

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
  }

  const toggleStatus = async (u) => {
    const next = u.status === 1 ? 0 : 1
    if (!window.confirm(`确定要${next === 1 ? '启用' : '禁用'}用户「${u.username}」吗？`)) return
    try {
      await api.patch(`/users/${u.id}/status`, { status: next }, true)
      toast('状态已更新')
      refreshAll()
    } catch {}
  }

  const deleteUser = async (u) => {
    if (!window.confirm(`确定删除用户「${u.username}」？此操作不可恢复。`)) return
    try {
      await api.del('/users/' + u.id, null, true)
      toast('删除成功')
      refreshAll()
    } catch {}
  }

  const handleLogout = () => {
    if (!window.confirm('确定要退出登录吗？')) return
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-page">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">U</div>
          <div>
            <div className="brand-name">用户管理后台</div>
            <div className="brand-sub">{me?.username} · 管理员</div>
          </div>
        </div>
        <div className="logout" onClick={handleLogout}>退出</div>
      </div>

      <div className="stats">
        <div className="stat card">
          <div className="stat-num">{stats.total}</div>
          <div className="stat-label">用户总数</div>
        </div>
        <div className="stat card">
          <div className="stat-num green">{stats.active}</div>
          <div className="stat-label">启用</div>
        </div>
        <div className="stat card">
          <div className="stat-num red">{stats.disabled}</div>
          <div className="stat-label">禁用</div>
        </div>
        <div className="stat card">
          <div className="stat-num accent">{stats.admins}</div>
          <div className="stat-label">管理员</div>
        </div>
      </div>

      <div className="toolbar card">
        <div className="search-row">
          <input
            className="search-input"
            placeholder="搜索用户名 / 邮箱"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
          />
          <div className="search-btn" onClick={onSearch}>搜索</div>
        </div>
        <div className="filter-row">
          <select className="picker" value={roleIdx} onChange={onRoleChange}>
            {ROLE_OPTS.map((r, i) => <option key={i} value={i}>角色：{r}</option>)}
          </select>
          <select className="picker" value={statusIdx} onChange={onStatusChange}>
            {STATUS_OPTS.map((s, i) => <option key={i} value={i}>状态：{s}</option>)}
          </select>
          <div className="add-btn" onClick={openCreate}>+ 新增</div>
        </div>
      </div>

      <div className="list-title">用户列表（共 {total} 人）</div>

      {!loading && list.length === 0 && (
        <div className="empty">
          <div className="empty-ic">∅</div>
          <div>暂无用户数据</div>
        </div>
      )}

      {list.map(u => (
        <div className="user card" key={u.id}>
          <div className="avatar">{u.username[0]?.toUpperCase()}</div>
          <div className="info">
            <div className="line1">
              <span className="uname">{u.username}</span>
              <span className={`badge ${u.role}`}>{u.role === 'admin' ? '管理员' : '用户'}</span>
              <span className={`badge ${u.status === 1 ? 'on' : 'off'}`}>{u.status === 1 ? '启用' : '禁用'}</span>
            </div>
            <div className="line2">{u.email}</div>
          </div>
          <div className="actions">
            <div className="act toggle" onClick={() => toggleStatus(u)}>{u.status === 1 ? '禁用' : '启用'}</div>
            <div className="act edit" onClick={() => openEdit(u)}>编辑</div>
            <div className="act del" onClick={() => deleteUser(u)}>删除</div>
          </div>
        </div>
      ))}

      {totalPages > 0 && (
        <div className="pager">
          <div className={`page-btn ${page <= 1 ? 'dis' : ''}`} onClick={prevPage}>上一页</div>
          <div className="page-info">{page} / {totalPages}</div>
          <div className={`page-btn ${page >= totalPages ? 'dis' : ''}`} onClick={nextPage}>下一页</div>
        </div>
      )}

      <div className="bottom-space" />

      {modalShow && (
        <div className="modal-mask" onClick={() => setModalShow(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{modalMode === 'create' ? '新增用户' : '编辑用户'}</div>

            <div className="m-field">
              <label className="m-label">用户名</label>
              <input
                className="input"
                placeholder="3-20 位"
                value={form.username}
                onChange={e => onFormInput('username', e.target.value)}
              />
            </div>
            <div className="m-field">
              <label className="m-label">邮箱</label>
              <input
                className="input"
                placeholder="name@example.com"
                value={form.email}
                onChange={e => onFormInput('email', e.target.value)}
              />
            </div>
            <div className="m-field">
              <label className="m-label">密码</label>
              <input
                className="input"
                type="password"
                placeholder={modalMode === 'edit' ? '留空则不修改' : '至少 6 位'}
                value={form.password}
                onChange={e => onFormInput('password', e.target.value)}
              />
            </div>
            <div className="m-field">
              <label className="m-label">角色</label>
              <select className="picker" value={formRoleIdx} onChange={onFormRoleChange}>
                {ROLE_OPTS.slice(1).map((r, i) => <option key={i} value={i + 1}>{r}</option>)}
              </select>
            </div>
            <div className="m-field">
              <label className="m-label">状态</label>
              <select className="picker" value={formStatusIdx} onChange={onFormStatusChange}>
                {STATUS_OPTS.slice(1).map((s, i) => <option key={i} value={i + 1}>{s}</option>)}
              </select>
            </div>

            <div className="modal-btns">
              <button className="btn-ghost" onClick={() => setModalShow(false)}>取消</button>
              <button className="btn-primary" onClick={submitForm}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
