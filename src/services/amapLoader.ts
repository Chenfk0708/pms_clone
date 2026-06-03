let amapLoaderPromise: Promise<boolean> | null = null

export type AMapLngLat = [number, number]

export type AMapMapInstance = {
  setZoomAndCenter: (zoom: number, center: AMapLngLat) => void
  setCenter: (center: AMapLngLat) => void
  clearMap: () => void
  destroy: () => void
}

export type AMapApi = {
  Map: new (container: HTMLElement, options: { zoom?: number; center?: AMapLngLat; viewMode?: string; resizeEnable?: boolean }) => AMapMapInstance
  Marker: new (options: { position: AMapLngLat; anchor?: string }) => {
    setMap: (map: AMapMapInstance | null) => void
  }
  plugin: (plugins: string[], callback: () => void) => void
  Geocoder: new (options: { city?: string }) => {
    getLocation: (
      address: string,
      callback: (status: string, result: { geocodes?: Array<{ location?: { lng: number; lat: number } }> }) => void,
    ) => void
  }
}

type AMapRuntimeWindow = Window & {
  _AMapSecurityConfig?: {
    securityJsCode: string
  }
  AMap?: AMapApi
}

export function getAmapApi(): AMapApi | null {
  if (typeof window === 'undefined') return null
  return (window as AMapRuntimeWindow).AMap ?? null
}

export async function loadAmapScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const key = import.meta.env.VITE_AMAP_KEY?.trim()
  if (!key) return false

  const globalWindow = window as AMapRuntimeWindow
  if (getAmapApi()) return true

  if (!amapLoaderPromise) {
    amapLoaderPromise = new Promise<boolean>((resolve, reject) => {
      const script = document.createElement('script')
      const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE?.trim()
      if (securityJsCode) {
        globalWindow._AMapSecurityConfig = { securityJsCode }
      }

      script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
      script.async = true
      script.onload = () => resolve(Boolean(getAmapApi()))
      script.onerror = () => reject(new Error('高德地图脚本加载失败'))
      document.head.appendChild(script)
    }).catch((error) => {
      amapLoaderPromise = null
      throw error
    })
  }

  return amapLoaderPromise
}
