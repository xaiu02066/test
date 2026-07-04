import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { clearAuth, setAuth, toast } from '../utils/api'
import './Home.css'

export default function HomePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    api.get('/auth/profile', null, true).then(res => {
      if (res.code === 0) {
        setUser(res.data)
        setAuth(localStorage.getItem('token'), res.data)
      }
    }).catch(() => {})
  }, [])

  const goAdmin = () => {
    navigate('/admin', { replace: true })
  }

  const handleLogout = () => {
    if (!window.confirm('确定要退出登录吗？')) return
    clearAuth()
    navigate('/login', { replace: true })
  }

  if (!user) {
    return <div className="home-page loading">加载中...</div>
  }

  return (
    <div className="home-page">
      <div className="hero">
        <div className="avatar lg">{user.username[0]?.toUpperCase()}</div>
        <div className="hero-name">{user.username}</div>
        <div className="hero-email">{user.email}</div>
        <div className="hero-badges">
          <span className={`badge ${user.role}`}>{user.role === 'admin' ? '管理员' : '普通用户'}</span>
          <span className={`badge ${user.status === 1 ? 'on' : 'off'}`}>{user.status === 1 ? '启用' : '禁用'}</span>
        </div>
      </div>

      <div className="card info-card">
        <div className="info-row">
          <span className="info-key">用户 ID</span>
          <span className="info-val">{user.id}</span>
        </div>
        <div className="info-row">
          <span className="info-key">用户名</span>
          <span className="info-val">{user.username}</span>
        </div>
        <div className="info-row">
          <span className="info-key">邮箱</span>
          <span className="info-val">{user.email}</span>
        </div>
        <div className="info-row">
          <span className="info-key">角色</span>
          <span className="info-val">{user.role === 'admin' ? '管理员' : '普通用户'}</span>
        </div>
        <div className="info-row">
          <span className="info-key">状态</span>
          <span className={`info-val ${user.status === 1 ? 'text-green' : 'text-red'}`}>
            {user.status === 1 ? '启用' : '禁用'}
          </span>
        </div>
        <div className="info-row">
          <span className="info-key">注册时间</span>
          <span className="info-val">{user.created_at}</span>
        </div>
      </div>

      <div className="actions">
        {user.role === 'admin' && (
          <button className="btn-primary" onClick={goAdmin}>进入管理后台</button>
        )}
        <button className="btn-ghost" onClick={handleLogout}>退出登录</button>
      </div>
    </div>
  )
}
