export interface AuthUser {
  id: string
  username?: string
  name: string
  mobile: string
  roleName: string
  campId?: string
  campName: string
  avatar?: string
  email?: string
  wechat?: string
  passwordSet?: boolean
  permissionCodes?: string[]
}

export const PMS_USER_CHANGED_EVENT = 'pms:user-changed'

export function getToken(): string | null {
  return localStorage.getItem('pms_token')
}

export function setToken(token: string) {
  localStorage.setItem('pms_token', token)
}

export function clearToken() {
  localStorage.removeItem('pms_token')
  localStorage.removeItem('pms_user')
  clearCurrentCampId()
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('pms_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setUser(user: AuthUser) {
  localStorage.setItem('pms_user', JSON.stringify(user))
  window.dispatchEvent(new CustomEvent<AuthUser>(PMS_USER_CHANGED_EVENT, { detail: user }))
}

export function hasPermission(permissionCode: string, user: AuthUser | null = getUser()): boolean {
  const permissionCodes = user?.permissionCodes
  if (!permissionCodes) return true
  return permissionCodes.includes(permissionCode)
}

export function setCurrentCampId(campId: string | number | null | undefined) {
  const normalizedCampId = campId === null || campId === undefined ? '' : String(campId).trim()
  if (!normalizedCampId) {
    clearCurrentCampId()
    return
  }

  localStorage.setItem('pmsCampId', normalizedCampId)
  localStorage.setItem('pms.currentCampId', normalizedCampId)
}

function clearCurrentCampId() {
  localStorage.removeItem('pmsCampId')
  localStorage.removeItem('pms.currentCampId')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
