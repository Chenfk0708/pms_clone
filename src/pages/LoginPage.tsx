import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import http from '../utils/request'
import { setCurrentCampId, setToken, setUser } from '../utils/auth'
import './LoginPage.css'

export function LoginPage() {
  const navigate = useNavigate()
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!mobile.trim()) {
      setError('请输入手机号')
      return
    }
    if (!password.trim()) {
      setError('请输入密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await http.post('/auth/login', { mobile: mobile.trim(), password })
      const { data } = res.data
      const campId = data.campId ? String(data.campId) : ''
      setToken(data.token)
      setCurrentCampId(campId)
      setUser({
        id: String(data.userId),
        name: data.roleName || mobile,
        mobile: mobile,
        roleName: data.roleName || '',
        campId,
        campName: data.campName ? String(data.campName) : campId,
      })
      navigate('/workspace', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">路客云 PMS</h1>
        <p className="login-subtitle">聚合房态管理平台</p>
        <div className="login-field">
          <label>手机号</label>
          <input
            type="text"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="请输入手机号"
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <div className="login-field">
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="演示环境请输入 demo-login"
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        {error && <p className="login-error">{error}</p>}
        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? '登录中...' : '登 录'}
        </button>
        <p className="login-hint">演示密码：demo-login</p>
      </div>
    </div>
  )
}
