export type SessionUser = {
  id: string
  name: string
  roleLabel: string
  developmentOnly: boolean
  avatar?: string
}

// Development-only UI identity. Real API authentication still depends on PMS cookies/session.
const devAdminUser: SessionUser = {
  id: 'dev-admin',
  name: '管理员',
  roleLabel: '开发环境',
  developmentOnly: true,
}

export function getCurrentSessionUser(): SessionUser | null {
  const storedUser = readStoredSessionUser()
  if (storedUser) return storedUser
  if (!import.meta.env.DEV) return null
  return devAdminUser
}

function readStoredSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem('pms_user')
    if (!raw) return null
    const user = JSON.parse(raw) as Partial<{
      id: string
      name: string
      roleName: string
      roleLabel: string
      avatar: string
    }>
    const name = user.name?.trim()
    if (!name) return null

    return {
      id: user.id?.trim() || 'current-user',
      name,
      roleLabel: user.roleLabel?.trim() || user.roleName?.trim() || '管理员',
      developmentOnly: false,
      avatar: user.avatar?.trim() || undefined,
    }
  } catch {
    return null
  }
}
