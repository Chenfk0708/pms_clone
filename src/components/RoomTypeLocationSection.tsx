import { useEffect, useRef, useState } from 'react'
import type { RoomTypeInfoDraft } from '../services/roomTypeInfo'
import { buildLocationSearchText, formatRegionLabel, getRegionPanelState, resolveRegionSelection, type RegionSelection } from '../services/chinaRegion'
import { getAmapApi, loadAmapScript, type AMapApi, type AMapLngLat, type AMapMapInstance } from '../services/amapLoader'

type RoomTypeLocationForm = Pick<
  RoomTypeInfoDraft['form'],
  | 'locationMode'
  | 'locationProvinceCode'
  | 'locationProvinceName'
  | 'locationCityCode'
  | 'locationCityName'
  | 'locationDistrictCode'
  | 'locationDistrictName'
  | 'streetAddress'
  | 'communityName'
  | 'buildingUnit'
  | 'doorNumber'
  | 'locationLatitude'
  | 'locationLongitude'
>

type RoomTypeLocationSectionProps = {
  form: RoomTypeLocationForm
  onChange: (patch: Partial<RoomTypeLocationForm>) => void
}

type MapStatus = 'missing-key' | 'loading' | 'ready' | 'error'

const defaultMapCenter: AMapLngLat = [113.935, 22.553]
const defaultMapZoom = 15
const mapStatusCopy: Record<MapStatus, { title: string; detail: string }> = {
  'missing-key': {
    title: '高德地图待接入',
    detail: '配置 VITE_AMAP_KEY 后自动加载地图定位，可选配置 VITE_AMAP_SECURITY_JS_CODE。',
  },
  loading: {
    title: '地图加载中',
    detail: '正在加载高德地图脚本和定位能力。',
  },
  ready: {
    title: '地图已加载',
    detail: '',
  },
  error: {
    title: '地图加载失败',
    detail: '请检查高德地图 Key、域名白名单和网络状态。',
  },
}

function parseMapLocation(latitude: string, longitude: string): AMapLngLat | null {
  if (!latitude || !longitude) return null

  const lat = Number(latitude)
  const lng = Number(longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lng, lat] : null
}

function resolveFormRegion(form: RoomTypeLocationForm): RegionSelection {
  return resolveRegionSelection({
    provinceCode: form.locationProvinceCode,
    provinceName: form.locationProvinceName,
    cityCode: form.locationCityCode,
    cityName: form.locationCityName,
    districtCode: form.locationDistrictCode,
    districtName: form.locationDistrictName,
  })
}

export function RoomTypeLocationSection({ form, onChange }: RoomTypeLocationSectionProps) {
  const isIndependent = form.locationMode === 'independent'
  const region = resolveFormRegion(form)
  const locationSummary = formatRegionLabel(region)

  return (
    <section className="room-type-location-section">
      <div className="room-type-edit-page__field-list">
        <div className="room-type-edit-page__field">
          <span>所在位置:</span>
          <div className="room-type-edit-page__radio-row">
            <label>
              <input
                type="radio"
                name="location-mode"
                checked={form.locationMode === 'same-store'}
                onChange={() => onChange({ locationMode: 'same-store' })}
              />
              同门店位置
            </label>
            <label>
              <input
                type="radio"
                name="location-mode"
                checked={form.locationMode === 'independent'}
                onChange={() => onChange({ locationMode: 'independent' })}
              />
              独立位置
            </label>
          </div>
        </div>
      </div>

      {isIndependent ? (
        <div className="room-type-location-section__details">
          <div className="room-type-edit-page__field-list">
            <div className="room-type-edit-page__field room-type-location-section__field--select room-type-location-section__field--required">
              <span>所在城市:</span>
              <RegionCascader
                value={region}
                onChange={(selection) => {
                  onChange({
                    locationProvinceCode: selection.provinceCode,
                    locationProvinceName: selection.provinceName,
                    locationCityCode: selection.cityCode,
                    locationCityName: selection.cityName,
                    locationDistrictCode: selection.districtCode,
                    locationDistrictName: selection.districtName,
                  })
                }}
              />
            </div>

            <label className="room-type-edit-page__field room-type-location-section__field--compact room-type-location-section__field--required">
              <span>街道地址:</span>
              <input
                aria-label="街道地址"
                placeholder="请输入街道地址"
                value={form.streetAddress}
                onChange={(event) => onChange({ streetAddress: event.target.value })}
              />
            </label>

            <label className="room-type-edit-page__field room-type-location-section__field--compact">
              <span>小区名称:</span>
              <input
                aria-label="小区名称"
                placeholder="请输入小区名称"
                value={form.communityName}
                onChange={(event) => onChange({ communityName: event.target.value })}
              />
            </label>

            <label className="room-type-edit-page__field room-type-location-section__field--compact room-type-location-section__field--required">
              <span>单元、门牌号:</span>
              <input
                aria-label="单元、门牌号"
                placeholder="请输入单元、门牌号"
                value={form.buildingUnit}
                onChange={(event) => onChange({ buildingUnit: event.target.value })}
              />
            </label>

            <div className="room-type-location-section__map-field">
              <LocationMapPreview
                addressText={buildLocationSearchText({
                  provinceName: form.locationProvinceName,
                  cityName: form.locationCityName,
                  districtName: form.locationDistrictName,
                  communityName: form.communityName,
                  streetAddress: form.streetAddress,
                  buildingUnit: form.buildingUnit,
                  doorNumber: form.doorNumber,
                })}
                location={parseMapLocation(form.locationLatitude, form.locationLongitude)}
                provinceName={form.locationProvinceName}
                cityName={form.locationCityName}
                onLocationChange={(nextLocation) => onChange(nextLocation)}
              />
            </div>
          </div>
        </div>
      ) : null}

      {!isIndependent && locationSummary ? <p className="room-type-location-section__summary">{locationSummary}</p> : null}
    </section>
  )
}

function RegionCascader({
  value,
  onChange,
}: {
  value: RegionSelection
  onChange: (selection: RegionSelection) => void
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)

  const panel = getRegionPanelState(value)
  const activeProvince = panel.activeProvince ?? panel.provinces[0] ?? null
  const activeCity = panel.activeCity ?? activeProvince?.cities[0] ?? null
  const activeDistrict = panel.activeDistrict ?? activeCity?.districts[0] ?? null
  const displayLabel = formatRegionLabel(value)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (event.target instanceof Node && rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  function selectProvince(code: string) {
    const nextProvince = panel.provinces.find((item) => item.code === code)
    if (!nextProvince) return
    const nextCity = nextProvince.cities.find((item) => item.code === value.cityCode) ?? nextProvince.cities[0] ?? null
    const nextDistrict = nextCity?.districts.find((item) => item.code === value.districtCode) ?? nextCity?.districts[0] ?? null
    onChange({
      provinceCode: nextProvince.code,
      provinceName: nextProvince.name,
      cityCode: nextCity?.code ?? '',
      cityName: nextCity?.name ?? '',
      districtCode: nextDistrict?.code ?? '',
      districtName: nextDistrict?.name ?? '',
    })
  }

  function selectCity(code: string) {
    if (!activeProvince) return
    const nextCity = activeProvince.cities.find((item) => item.code === code)
    if (!nextCity) return
    const nextDistrict = nextCity.districts.find((item) => item.code === value.districtCode) ?? nextCity.districts[0] ?? null
    onChange({
      provinceCode: activeProvince.code,
      provinceName: activeProvince.name,
      cityCode: nextCity.code,
      cityName: nextCity.name,
      districtCode: nextDistrict?.code ?? '',
      districtName: nextDistrict?.name ?? '',
    })
  }

  function selectDistrict(code: string) {
    if (!activeProvince || !activeCity) return
    const nextDistrict = activeCity.districts.find((item) => item.code === code)
    if (!nextDistrict) return
    onChange({
      provinceCode: activeProvince.code,
      provinceName: activeProvince.name,
      cityCode: activeCity.code,
      cityName: activeCity.name,
      districtCode: nextDistrict.code,
      districtName: nextDistrict.name,
    })
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="room-type-region-picker">
      <button
        type="button"
        className="room-type-region-picker__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{displayLabel || '请选择所在城市'}</span>
        <em aria-hidden="true">⌄</em>
      </button>

      {open ? (
        <div className="room-type-region-picker__panel" role="listbox" aria-label="所在城市选项">
          <div className="room-type-region-picker__column">
            {panel.provinces.map((province) => (
              <button
                key={province.code}
                type="button"
                role="option"
                aria-selected={province.code === activeProvince?.code}
                className={province.code === activeProvince?.code ? 'is-active' : ''}
                onClick={() => selectProvince(province.code)}
              >
                <span>{province.name}</span>
                <i aria-hidden="true">›</i>
              </button>
            ))}
          </div>

          <div className="room-type-region-picker__column">
            {activeProvince?.cities.map((city) => (
              <button
                key={city.code}
                type="button"
                role="option"
                aria-selected={city.code === activeCity?.code}
                className={city.code === activeCity?.code ? 'is-active' : ''}
                onClick={() => selectCity(city.code)}
              >
                <span>{city.name}</span>
                <i aria-hidden="true">›</i>
              </button>
            ))}
          </div>

          <div className="room-type-region-picker__column">
            {activeCity?.districts.map((district) => (
              <button
                key={district.code}
                type="button"
                role="option"
                aria-selected={district.code === activeDistrict?.code}
                className={district.code === activeDistrict?.code ? 'is-active' : ''}
                onClick={() => selectDistrict(district.code)}
              >
                <span>{district.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LocationMapPreview({
  addressText,
  location,
  provinceName,
  cityName,
  onLocationChange,
}: {
  addressText: string
  location: [number, number] | null
  provinceName: string
  cityName: string
  onLocationChange: (patch: Partial<RoomTypeLocationForm>) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<AMapMapInstance | null>(null)
  const amapApiRef = useRef<AMapApi | null>(null)
  const mapCenterRef = useRef<AMapLngLat>(location ?? defaultMapCenter)
  const mapZoomRef = useRef(defaultMapZoom)
  const onLocationChangeRef = useRef(onLocationChange)
  const [status, setStatus] = useState<MapStatus>('missing-key')
  const locationKey = location ? `${location[0]},${location[1]}` : ''
  const statusCopy = mapStatusCopy[status]

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    let cancelled = false

    async function bootstrapMap() {
      const hasKey = Boolean(import.meta.env.VITE_AMAP_KEY?.trim())
      if (!hasKey || !containerRef.current) {
        setStatus('missing-key')
        return
      }

      setStatus('loading')
      try {
        const loaded = await loadAmapScript()
        const amap = getAmapApi()
        if (cancelled || !loaded || !amap || !containerRef.current) return

        amapApiRef.current = amap

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new amap.Map(containerRef.current, {
            zoom: defaultMapZoom,
            center: mapCenterRef.current,
            viewMode: '2D',
            resizeEnable: true,
          })
        }

        mapInstanceRef.current.setZoomAndCenter(defaultMapZoom, mapCenterRef.current)
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void bootstrapMap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!locationKey) return

    const [lng, lat] = locationKey.split(',').map(Number)
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return

    const nextCenter: AMapLngLat = [lng, lat]
    mapCenterRef.current = nextCenter
    if (status === 'ready') {
      mapInstanceRef.current?.setCenter(nextCenter)
    }
  }, [locationKey, status])

  useEffect(() => {
    const amap = amapApiRef.current ?? getAmapApi()
    if (status !== 'ready' || !amap || !mapInstanceRef.current || !addressText.trim()) return

    let cancelled = false
    amap.plugin(['AMap.Geocoder'], () => {
      if (cancelled) return
      const geocoder = new amap.Geocoder({ city: cityName || provinceName })
      geocoder.getLocation(addressText, (nextStatus, result) => {
        if (cancelled || nextStatus !== 'complete') return
        const firstLocation = result.geocodes?.[0]?.location
        if (!firstLocation) return

        const nextCenter: AMapLngLat = [firstLocation.lng, firstLocation.lat]
        mapCenterRef.current = nextCenter
        mapInstanceRef.current?.clearMap()
        mapInstanceRef.current?.setZoomAndCenter(defaultMapZoom, nextCenter)
        const marker = new amap.Marker({ position: nextCenter, anchor: 'bottom-center' })
        marker.setMap(mapInstanceRef.current)
        onLocationChangeRef.current({
          locationLongitude: String(firstLocation.lng),
          locationLatitude: String(firstLocation.lat),
        })
      })
    })

    return () => {
      cancelled = true
    }
  }, [addressText, cityName, provinceName, status])

  useEffect(() => {
    return () => {
      mapInstanceRef.current?.destroy()
      mapInstanceRef.current = null
    }
  }, [])

  function setMapZoom(nextZoom: number) {
    mapZoomRef.current = nextZoom
    mapInstanceRef.current?.setZoomAndCenter(nextZoom, mapCenterRef.current)
  }

  return (
    <div className={`room-type-map-preview${status === 'missing-key' ? ' is-placeholder' : ''}`}>
      <div ref={containerRef} className="room-type-map-preview__canvas" aria-label="地图预览" />
      {status !== 'ready' ? (
        <div className="room-type-map-preview__overlay" aria-hidden="true">
          <strong>{statusCopy.title}</strong>
          <span>{statusCopy.detail}</span>
        </div>
      ) : null}

      <div className="room-type-map-preview__badge">高德地图</div>

      <div className="room-type-map-preview__controls" aria-hidden="true">
        <button type="button" onClick={() => setMapZoom(mapZoomRef.current + 1)}>
          ⊕
        </button>
        <button type="button" onClick={() => setMapZoom(mapZoomRef.current - 1)}>
          −
        </button>
      </div>

      {status === 'error' ? <div className="room-type-map-preview__status">地图加载失败</div> : null}
    </div>
  )
}
