export const PMS_USER_CHANGED_EVENT = 'pms:user-changed';
export function getToken() {
    return localStorage.getItem('pms_token');
}
export function setToken(token) {
    localStorage.setItem('pms_token', token);
}
export function clearToken() {
    localStorage.removeItem('pms_token');
    localStorage.removeItem('pms_user');
    clearCurrentCampId();
}
export function getUser() {
    try {
        const raw = localStorage.getItem('pms_user');
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
export function setUser(user) {
    localStorage.setItem('pms_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent(PMS_USER_CHANGED_EVENT, { detail: user }));
}
export function hasPermission(permissionCode, user = getUser()) {
    const permissionCodes = user?.permissionCodes;
    if (!permissionCodes)
        return true;
    return permissionCodes.includes(permissionCode);
}
export function setCurrentCampId(campId) {
    const normalizedCampId = campId === null || campId === undefined ? '' : String(campId).trim();
    if (!normalizedCampId) {
        clearCurrentCampId();
        return;
    }
    localStorage.setItem('pmsCampId', normalizedCampId);
    localStorage.setItem('pms.currentCampId', normalizedCampId);
}
function clearCurrentCampId() {
    localStorage.removeItem('pmsCampId');
    localStorage.removeItem('pms.currentCampId');
}
export function isAuthenticated() {
    return !!getToken();
}
