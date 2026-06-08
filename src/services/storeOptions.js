export const STORE_OPTIONS_ENDPOINT = '/select/poi/page/get';
export async function fetchStoreOptions(input = {}) {
    const campId = input.campId?.trim() || resolveCurrentCampId();
    const body = {
        campId,
        pageNum: 1,
        pageSize: input.pageSize ?? 100,
    };
    const response = await postHudson(`${input.baseUrl ?? '/api'}${STORE_OPTIONS_ENDPOINT}`, body, input.signal);
    const stores = adaptStoreOptions(response.data);
    return input.includeAll === false ? stores : [{ id: 'all', label: '全部门店' }, ...stores];
}
export function resolveCurrentCampId() {
    return (readRuntimeConfig('pmsCampId') ||
        readRuntimeConfig('pms.currentCampId') ||
        readCampIdFromStoredObject('pms.currentCamp') ||
        readCampIdFromStoredObject('pms.camp') ||
        import.meta.env.VITE_PMS_CAMP_ID?.trim() ||
        '10001');
}
function adaptStoreOptions(payload) {
    const list = Array.isArray(payload) ? payload : asArray(asRecord(payload).list);
    const stores = list
        .map((item) => {
        const record = asRecord(item);
        return {
            id: readString(record.poiId ?? record.id ?? record.value ?? record.storeId, ''),
            label: readString(record.poiName ?? record.name ?? record.label ?? record.storeName, ''),
            address: readString(record.address, ''),
            contactNumber: readString(record.contactNumber, ''),
        };
    })
        .filter((item) => item.id && item.label);
    const seen = new Set();
    return stores.filter((item) => {
        if (seen.has(item.id))
            return false;
        seen.add(item.id);
        return true;
    });
}
async function postHudson(url, body, signal) {
    const headers = new Headers({ 'content-type': 'application/json' });
    const token = readRuntimeConfig('pms_token');
    if (token)
        headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(body),
        signal,
    });
    const payload = (await response.json().catch(() => null));
    if (!response.ok) {
        throw new Error(payload?.errorMsg || payload?.message || `门店列表加载失败：HTTP ${response.status}`);
    }
    if (!payload || payload.success === false || (payload.code !== undefined && payload.code !== 0)) {
        throw new Error(payload?.errorMsg || payload?.message || payload?.errorCode?.toString() || '门店列表加载失败');
    }
    return payload;
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function readCampIdFromStoredObject(key) {
    const text = readRuntimeConfig(key);
    if (!text)
        return '';
    try {
        const value = JSON.parse(text);
        return readString(value.campId ?? value.id, '');
    }
    catch {
        return '';
    }
}
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
function readString(value, fallback) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
