import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setAuth, toast } from '../utils/api'
import './Login.css'

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // 登录表单
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')

  // 注册表单
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const handleLogin = async () => {
    if (!account || !password) return toast('请输入账号和密码')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { account, password }, true)
      toast('登录成功')
      setAuth(res.data.token, res.data.user)
      if (res.data.user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/home', { replace: true })
      }
    } catch {}
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!regUsername || !regEmail || !regPassword) return toast('请填写完整信息')
    if (regUsername.length < 3 || regUsername.length > 20) return toast('用户名长度需为 3-20 位')
    if (regPassword.length < 6) return toast('密码长度至少 6 位')
    setLoading(true)
    try {
      await api.post('/auth/register', {
        username: regUsername,
        email: regEmail,
        password: regPassword
      }, true)
      toast('注册成功，请登录')
      setAccount(regUsername)
      setPassword('')
      setRegUsername('')
      setRegEmail('')
      setRegPassword('')
      setTab('login')
    } catch {}
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="brand">
        <div className="brand-mark">U</div>
        <div className="brand-name">用户管理</div>
        <div className="brand-desc">温暖明亮 · 安全可靠的用户系统</div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>登录</div>
        <div className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>注册</div>
      </div>

      {tab === 'login' ? (
        <div className="card form">
          <div className="field">
            <label className="label">账号</label>
            <input
              className="input"
              placeholder="用户名或邮箱"
              value={account}
              onChange={e => setAccount(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">密码</label>
            <input
              className="input"
              type="password"
              placeholder="至少 6 位"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button className="btn-primary" disabled={loading} onClick={handleLogin}>
            {loading ? '登录中...' : '登 录'}
          </button>
          <div className="hint">默认管理员 admin / admin123</div>
        </div>
      ) : (
        <div className="card form">
          <div className="field">
            <label className="label">用户名</label>
            <input
              className="input"
              placeholder="3-20 位"
              value={regUsername}
              onChange={e => setRegUsername(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">邮箱</label>
            <input
              className="input"
              placeholder="name@example.com"
              value={regEmail}
              onChange={e => setRegEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">密码</label>
            <input
              className="input"
              type="password"
              placeholder="至少 6 位"
              value={regPassword}
              onChange={e => setRegPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
            />
          </div>
          <button className="btn-primary" disabled={loading} onClick={handleRegister}>
            {loading ? '注册中...' : '注 册'}
          </button>
        </div>
      )}
    </div>
  )
}
