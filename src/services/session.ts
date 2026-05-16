export type SessionUser = {
  id: string
  name: string
  roleLabel: string
  developmentOnly: boolean
}

// Development-only UI identity. Real API authentication still depends on PMS cookies/session.
const devAdminUser: SessionUser = {
  id: 'dev-admin',
  name: '管理员',
  roleLabel: '开发环境',
  developmentOnly: true,
}

export function getCurrentSessionUser(): SessionUser | null {
  if (!import.meta.env.DEV) return null
  return devAdminUser
}
