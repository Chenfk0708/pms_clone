let amapLoaderPromise = null;
export function getAmapApi() {
    if (typeof window === 'undefined')
        return null;
    return window.AMap ?? null;
}
export async function loadAmapScript() {
    if (typeof window === 'undefined')
        return false;
    const key = import.meta.env.VITE_AMAP_KEY?.trim();
    if (!key)
        return false;
    const globalWindow = window;
    if (getAmapApi())
        return true;
    if (!amapLoaderPromise) {
        amapLoaderPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE?.trim();
            if (securityJsCode) {
                globalWindow._AMapSecurityConfig = { securityJsCode };
            }
            script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
            script.async = true;
            script.onload = () => resolve(Boolean(getAmapApi()));
            script.onerror = () => reject(new Error('高德地图脚本加载失败'));
            document.head.appendChild(script);
        }).catch((error) => {
            amapLoaderPromise = null;
            throw error;
        });
    }
    return amapLoaderPromise;
}
