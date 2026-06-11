import http from '../utils/request';
export async function fetchCurrentAccount(fallback) {
    const response = await http.get('/auth/me');
    return toAuthUser(response.data.data, fallback);
}
export async function saveCurrentAccount(payload, fallback) {
    const response = await http.post('/auth/account', payload);
    return toAuthUser(response.data.data, fallback);
}
export function toAuthUser(data, fallback = {}) {
    const campId = data?.campId === undefined || data?.campId === null ? fallback.campId ?? '' : String(data.campId);
    const username = data?.username?.trim() || fallback.username || undefined;
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
    };
}
