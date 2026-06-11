import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCurrentAccount, saveCurrentAccount } from '../services/account'
import { getUser, setUser, type AuthUser } from '../utils/auth'
import { validateOptionalEmail, validatePersonName } from '../utils/inputValidation'
import './AccountSettingPage.css'

type AccountFormErrors = Partial<Record<'name' | 'email', string>>

const fallbackAccount: AuthUser = {
  id: 'current-user',
  name: '当前用户',
  mobile: '',
  roleName: '管理员',
  campName: '宿银',
  email: '',
  wechat: '',
  passwordSet: false,
}

export function AccountSettingPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const successFeedbackTimerRef = useRef<number | null>(null)
  const [account, setAccount] = useState<AuthUser>(() => ({ ...fallbackAccount, ...getUser() }))
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formErrors, setFormErrors] = useState<AccountFormErrors>({})

  useEffect(() => {
    let ignore = false
    const fallback = getUser() ?? account

    setLoading(true)
    fetchCurrentAccount(fallback)
      .then((nextAccount) => {
        if (ignore) return
        setAccount(nextAccount)
        setUser(nextAccount)
      })
      .catch((error) => {
        if (ignore) return
        setFeedback(error?.message || '账号信息加载失败')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => () => clearSuccessFeedbackTimer(), [])

  function clearSuccessFeedbackTimer() {
    if (successFeedbackTimerRef.current === null) return
    window.clearTimeout(successFeedbackTimerRef.current)
    successFeedbackTimerRef.current = null
  }

  function showFeedback(message: string) {
    clearSuccessFeedbackTimer()
    setFeedback(message)
  }

  function showSuccessFeedback(message: string) {
    clearSuccessFeedbackTimer()
    setFeedback(message)
    successFeedbackTimerRef.current = window.setTimeout(() => {
      setFeedback((current) => (current === message ? '' : current))
      successFeedbackTimerRef.current = null
    }, 2500)
  }

  function updateAccount(nextPatch: Partial<AuthUser>) {
    setAccount((current) => ({ ...current, ...nextPatch }))
    setFormErrors((current) => {
      const nextErrors = { ...current }
      if ('name' in nextPatch) delete nextErrors.name
      if ('email' in nextPatch) delete nextErrors.email
      return nextErrors
    })
    showFeedback('')
  }

  function handleAvatarChange(file: File | undefined) {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (result) updateAccount({ avatar: result })
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    const trimmedName = account.name.trim()
    const nextErrors: AccountFormErrors = {
      name: validatePersonName(trimmedName),
      email: validateOptionalEmail(account.email || ''),
    }
    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as keyof AccountFormErrors]) delete nextErrors[key as keyof AccountFormErrors]
    })
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      showFeedback('请先修正账号信息格式')
      return
    }

    const wantsPasswordChange = Boolean(newPassword || confirmPassword)
    if (wantsPasswordChange && (!oldPassword || !newPassword || !confirmPassword)) {
      showFeedback('修改密码需要输入原密码、新密码和确认密码')
      return
    }
    if (wantsPasswordChange && newPassword !== confirmPassword) {
      showFeedback('两次输入的新密码不一致')
      return
    }

    setSaving(true)
    showFeedback('')
    try {
      const nextAccount = await saveCurrentAccount(
        {
          nickName: trimmedName,
          email: account.email?.trim() || undefined,
          wechat: account.wechat?.trim() || undefined,
          avatarUrl: account.avatar || undefined,
          oldPassword: wantsPasswordChange ? oldPassword : undefined,
          newPassword: wantsPasswordChange ? newPassword : undefined,
        },
        account,
      )
      setAccount(nextAccount)
      setUser(nextAccount)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showSuccessFeedback('账号信息已保存')
    } catch (error: any) {
      showFeedback(error?.message || '账号信息保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="account-setting-page" aria-label="账号设置">
      <header className="account-setting-header">
        <nav aria-label="账号设置路径">
          <Link to="/setting/member">成员列表</Link>
          <span>/</span>
          <strong>账号设置</strong>
        </nav>
        <button type="button" className="account-save-button" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
      </header>

      <div className="account-setting-section-title">账号信息</div>

      {loading ? <div className="account-setting-loading">账号信息加载中...</div> : null}

      {feedback ? (
        <div className="account-setting-feedback" role="status" aria-label="账号设置操作反馈">
          {feedback}
        </div>
      ) : null}

      <div className="account-setting-form">
        <div className="account-setting-row account-setting-row--avatar">
          <span>头像</span>
          <button type="button" className="account-avatar-uploader" onClick={() => fileInputRef.current?.click()}>
            {account.avatar ? <img src={account.avatar} alt="当前头像" /> : <DefaultAccountAvatar />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            aria-label="上传头像"
            onChange={(event) => handleAvatarChange(event.target.files?.[0])}
          />
        </div>

        <label className="account-setting-row">
          <span>姓名</span>
          <div className="account-setting-field">
            <input value={account.name} onChange={(event) => updateAccount({ name: event.target.value })} />
            {formErrors.name ? <small className="account-setting-field-error">{formErrors.name}</small> : null}
          </div>
        </label>

        <div className="account-setting-row">
          <span>手机号</span>
          <strong>{account.mobile || '-'}</strong>
        </div>

        <label className="account-setting-row">
          <span>邮箱</span>
          <div className="account-setting-field">
            <input type="email" value={account.email || ''} onChange={(event) => updateAccount({ email: event.target.value })} />
            {formErrors.email ? <small className="account-setting-field-error">{formErrors.email}</small> : null}
          </div>
        </label>

        <label className="account-setting-row">
          <span>微信</span>
          <input value={account.wechat || ''} onChange={(event) => updateAccount({ wechat: event.target.value })} />
        </label>

        <div className="account-setting-password-block" aria-label="登录密码">
          <div className="account-setting-row">
            <span>登录密码</span>
            <strong>{account.passwordSet ? '已设置' : '暂未设置'}</strong>
          </div>
          <label className="account-setting-row">
            <span>原密码</span>
            <input
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
            />
          </label>
          <label className="account-setting-row">
            <span>新密码</span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label className="account-setting-row">
            <span>确认密码</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        </div>
      </div>
    </section>
  )
}

function DefaultAccountAvatar() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="#f0f1f4" />
      <circle cx="40" cy="32" r="14" fill="#dedfe3" />
      <path d="M16 69c4.8-13 13-19.5 24-19.5S59.2 56 64 69" fill="#dedfe3" />
    </svg>
  )
}
