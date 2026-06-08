import { useEffect, useMemo, useState } from 'react';
import { fetchStoreOptions, resolveCurrentCampId } from '../services/storeOptions';
export function useStoreOptions(input = {}) {
    const normalizedFallbackOptions = normalizeFallbackOptions(input.fallbackOptions, input.includeAll !== false);
    const fallbackKey = createStoreOptionsKey(normalizedFallbackOptions);
    const fallbackOptions = useMemo(() => normalizedFallbackOptions, [fallbackKey]);
    const [storeOptions, setStoreOptions] = useState(fallbackOptions);
    const [storeLoading, setStoreLoading] = useState(false);
    const enabled = input.enabled !== false;
    useEffect(() => {
        if (!enabled) {
            setStoreOptions(fallbackOptions);
            setStoreLoading(false);
            return undefined;
        }
        const controller = new AbortController();
        setStoreLoading(true);
        fetchStoreOptions({
            campId: resolveCurrentCampId(),
            includeAll: input.includeAll,
            signal: controller.signal,
        })
            .then((options) => setStoreOptions(options.length > 0 ? options : fallbackOptions))
            .catch(() => setStoreOptions(fallbackOptions))
            .finally(() => {
            if (!controller.signal.aborted)
                setStoreLoading(false);
        });
        return () => controller.abort();
    }, [enabled, fallbackKey, input.includeAll]);
    return { storeOptions, storeLoading };
}
function createStoreOptionsKey(options) {
    return options.map((option) => `${option.id}:${option.label}`).join('|');
}
function normalizeFallbackOptions(options, includeAll) {
    const normalized = options?.length ? options : includeAll ? [{ id: 'all', label: '全部门店' }] : [];
    if (!includeAll || normalized.some((option) => option.id === 'all'))
        return normalized;
    return [{ id: 'all', label: '全部门店' }, ...normalized];
}
