import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import http from '../utils/request'
import { setCurrentCampId, setToken, setUser } from '../utils/auth'
import { toAuthUser } from '../services/account'
import suyinLogo from '../assets/suyin-logo.svg'
import './LoginPage.css'

interface RegisterRoleOption {
  roleId: number | string
  roleName: string
}

interface RegisterForm {
  username: string
  password: string
  nickName: string
  mobile: string
  email: string
  roleId: string
}

const DEFAULT_CAMP_ID = '10001'

const emptyRegisterForm: RegisterForm = {
  username: '',
  password: '',
  nickName: '',
  mobile: '',
  email: '',
  roleId: '',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [account, setAccount] = useState('root')
  const [password, setPassword] = useState('123456')
  const [registerForm, setRegisterForm] = useState<RegisterForm>(emptyRegisterForm)
  const [roles, setRoles] = useState<RegisterRoleOption[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)

  useEffect(() => {
    if (mode !== 'register') {
      return
    }
    let active = true
    setOptionsLoading(true)
    setError('')
    http
      .get('/auth/register/options', { params: { campId: DEFAULT_CAMP_ID } })
      .then((res) => {
        if (!active) return
        const nextRoles = Array.isArray(res.data?.data?.roles) ? res.data.data.roles : []
        setRoles(nextRoles)
        setRegisterForm((current) => ({
          ...current,
          roleId: current.roleId || String(nextRoles[0]?.roleId ?? ''),
        }))
      })
      .catch((err: any) => {
        if (!active) return
        setRoles([])
        setError(err?.response?.data?.message || err?.message || '角色列表加载失败')
      })
      .finally(() => {
        if (active) setOptionsLoading(false)
      })

    return () => {
      active = false
    }
  }, [mode])

  const completeLogin = (data: any, fallback: Record<string, string> = {}) => {
    const campId = data.campId ? String(data.campId) : DEFAULT_CAMP_ID
    setToken(data.token)
    setCurrentCampId(campId)
    setUser(toAuthUser(data, { ...fallback, campId }))
    navigate('/workspace', { replace: true })
  }

  const handleLogin = async () => {
    if (!account.trim()) {
      setError('请输入账号')
      return
    }
    if (!password.trim()) {
      setError('请输入密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const loginAccount = account.trim()
      const res = await http.post('/auth/login', buildLoginPayload(loginAccount, password))
      completeLogin(res.data.data, { name: loginAccount, mobile: loginAccount })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    const payload = {
      username: registerForm.username.trim(),
      password: registerForm.password,
      nickName: registerForm.nickName.trim(),
      mobile: registerForm.mobile.trim(),
      email: registerForm.email.trim() || undefined,
      campId: Number(DEFAULT_CAMP_ID),
      roleId: registerForm.roleId ? Number(registerForm.roleId) : undefined,
    }

    const validationError = validateRegisterForm(payload)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await http.post('/auth/register', payload)
      completeLogin(res.data.data, { name: payload.nickName, mobile: payload.mobile })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const submit = mode === 'login' ? handleLogin : handleRegister

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand" aria-label="宿银">
          <img src={suyinLogo} alt="宿银" />
        </div>
        <h1 className="login-title">宿银</h1>
        <p className="login-subtitle">聚合房态管理平台</p>

        <div className="login-tabs" role="tablist" aria-label="账号入口">
          <button
            type="button"
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => {
              setMode('login')
              setError('')
            }}
          >
            登录
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'is-active' : ''}
            onClick={() => {
              setMode('register')
              setError('')
            }}
          >
            注册
          </button>
        </div>

        {mode === 'login' ? (
          <>
            <div className="login-field">
              <label>账号/手机号/邮箱</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="请输入账号"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </div>
            <div className="login-field">
              <label>密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </div>
          </>
        ) : (
          <RegisterFields
            form={registerForm}
            roles={roles}
            loading={loading || optionsLoading}
            onChange={(patch) => setRegisterForm((current) => ({ ...current, ...patch }))}
            onEnter={submit}
          />
        )}

        {error && <p className="login-error">{error}</p>}
        <button className="login-btn" onClick={submit} disabled={loading || optionsLoading}>
          {loading ? (mode === 'login' ? '登录中...' : '注册中...') : mode === 'login' ? '登录' : '注册并登录'}
        </button>
        <p className="login-hint">{mode === 'login' ? '管理员账号：root / 123456' : '注册后会按所选角色分配权限'}</p>
      </div>
    </div>
  )
}

function RegisterFields({
  form,
  roles,
  loading,
  onChange,
  onEnter,
}: {
  form: RegisterForm
  roles: RegisterRoleOption[]
  loading: boolean
  onChange: (patch: Partial<RegisterForm>) => void
  onEnter: () => void
}) {
  return (
    <>
      <div className="login-field">
        <label>登录账号</label>
        <input
          type="text"
          value={form.username}
          onChange={(e) => onChange({ username: e.target.value })}
          placeholder="字母开头，3-32 位"
          disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        />
      </div>
      <div className="login-field">
        <label>密码</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => onChange({ password: e.target.value })}
          placeholder="至少 6 位"
          disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        />
      </div>
      <div className="login-field">
        <label>姓名</label>
        <input
          type="text"
          value={form.nickName}
          onChange={(e) => onChange({ nickName: e.target.value })}
          placeholder="请输入姓名"
          disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        />
      </div>
      <div className="login-field">
        <label>手机号</label>
        <input
          type="tel"
          value={form.mobile}
          onChange={(e) => onChange({ mobile: e.target.value })}
          placeholder="请输入手机号"
          disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        />
      </div>
      <div className="login-field">
        <label>邮箱</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="选填"
          disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        />
      </div>
      <div className="login-field">
        <label>角色</label>
        <select value={form.roleId} onChange={(e) => onChange({ roleId: e.target.value })} disabled={loading || roles.length === 0}>
          {roles.length === 0 ? <option value="">角色加载中</option> : null}
          {roles.map((role) => (
            <option key={String(role.roleId)} value={String(role.roleId)}>
              {role.roleName}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

function buildLoginPayload(account: string, password: string) {
  if (/^1[3-9]\d{9}$/.test(account)) {
    return { mobile: account, password }
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) {
    return { email: account, password }
  }
  return { username: account, password }
}

function validateRegisterForm(payload: {
  username: string
  password: string
  nickName: string
  mobile: string
  email?: string
  roleId?: number
}) {
  if (!/^[A-Za-z][A-Za-z0-9_]{2,31}$/.test(payload.username)) {
    return '登录账号需为 3-32 位字母、数字或下划线，且以字母开头'
  }
  if (payload.password.trim().length < 6) {
    return '密码长度不能少于 6 位'
  }
  if (!/^[\p{L}\s]{2,30}$/u.test(payload.nickName)) {
    return '姓名格式不正确'
  }
  if (!/^1[3-9]\d{9}$/.test(payload.mobile)) {
    return '手机号格式不正确'
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return '邮箱格式不正确'
  }
  if (!payload.roleId) {
    return '请选择角色'
  }
  return ''
}
