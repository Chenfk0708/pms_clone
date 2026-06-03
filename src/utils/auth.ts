export interface AuthUser {
  id: string
  name: string
  mobile: string
  roleName: string
  campId?: string
  campName: string
}

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
