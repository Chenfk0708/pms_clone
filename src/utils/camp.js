const DEFAULT_CAMP_ID = '10001';
export function resolveCurrentCampId(fallback = DEFAULT_CAMP_ID) {
    if (typeof window === 'undefined')
        return fallback;
    return (readRuntimeValue('pmsCampId') ||
        readRuntimeValue('pms.currentCampId') ||
        readCampIdFromStoredObject('pms.currentCamp') ||
        readCampIdFromStoredObject('pms.camp') ||
        fallback);
}
function readRuntimeValue(key) {
    return window.localStorage.getItem(key)?.trim() || '';
}
function readCampIdFromStoredObject(key) {
    const rawValue = readRuntimeValue(key);
    if (!rawValue)
        return '';
    try {
        const value = JSON.parse(rawValue);
        const campId = value.campId ?? value.id;
        return typeof campId === 'string' || typeof campId === 'number' ? String(campId).trim() : '';
    }
    catch {
        return '';
    }
}
