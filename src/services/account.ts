import http from '../utils/request'
import type { AuthUser } from '../utils/auth'

export interface AccountUpdatePayload {
  nickName: string
  email?: string
  wechat?: string
  avatarUrl?: string
  oldPassword?: string
  newPassword?: string
}

interface AccountApiUser {
  userId?: string | number
  username?: string
  mobile?: string
  email?: string
  nickName?: string
  avatarUrl?: string
  wechat?: string
  passwordSet?: boolean
  roleName?: string
  campId?: string | number
  campName?: string
  permissionCodes?: string[]
}

export async function fetchCurrentAccount(fallback?: Partial<AuthUser>): Promise<AuthUser> {
  const response = await http.get('/auth/me')
  return toAuthUser(response.data.data, fallback)
}

export async function saveCurrentAccount(payload: AccountUpdatePayload, fallback?: Partial<AuthUser>): Promise<AuthUser> {
  const response = await http.post('/auth/account', payload)
  return toAuthUser(response.data.data, fallback)
}

export function toAuthUser(data: AccountApiUser, fallback: Partial<AuthUser> = {}): AuthUser {
  const campId = data?.campId === undefined || data?.campId === null ? fallback.campId ?? '' : String(data.campId)
  const username = data?.username?.trim() || fallback.username || undefined
  return {
    id: data?.userId === undefined || data?.userId === null ? fallback.id ?? 'current-user' : String(data.userId),
    username,
    name: data?.nickName?.trim() || fallback.name || username || data?.mobile || '当前用户',
    mobile: data?.mobile?.trim() || fallback.mobile || '',
    roleName: data?.roleName?.trim() || fallback.roleName || '',
    campId,
    campName: data?.campName?.trim() || fallback.campName || campId || '宿银',
    avatar: data?.avatarUrl?.trim() || fallback.avatar || undefined,
    email: data?.email?.trim() || '',
    wechat: data?.wechat?.trim() || '',
    passwordSet: Boolean(data?.passwordSet),
    permissionCodes: Array.isArray(data?.permissionCodes)
      ? data.permissionCodes.map((code) => String(code)).filter(Boolean)
      : fallback.permissionCodes,
  }
}
