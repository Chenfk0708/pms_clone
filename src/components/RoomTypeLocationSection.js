import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { buildLocationSearchText, formatRegionLabel, getRegionPanelState, resolveRegionSelection } from '../services/chinaRegion';
import { getAmapApi, loadAmapScript } from '../services/amapLoader';
const defaultMapCenter = [113.935, 22.553];
const defaultMapZoom = 15;
const mapStatusCopy = {
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
};
function parseMapLocation(latitude, longitude) {
    if (!latitude || !longitude)
        return null;
    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lng, lat] : null;
}
function resolveFormRegion(form) {
    return resolveRegionSelection({
        provinceCode: form.locationProvinceCode,
        provinceName: form.locationProvinceName,
        cityCode: form.locationCityCode,
        cityName: form.locationCityName,
        districtCode: form.locationDistrictCode,
        districtName: form.locationDistrictName,
    });
}
export function RoomTypeLocationSection({ form, onChange }) {
    const isIndependent = form.locationMode === 'independent';
    const region = resolveFormRegion(form);
    const locationSummary = formatRegionLabel(region);
    return (_jsxs("section", { className: "room-type-location-section", children: [_jsx("div", { className: "room-type-edit-page__field-list", children: _jsxs("div", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u6240\u5728\u4F4D\u7F6E:" }), _jsxs("div", { className: "room-type-edit-page__radio-row", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "location-mode", checked: form.locationMode === 'same-store', onChange: () => onChange({ locationMode: 'same-store' }) }), "\u540C\u95E8\u5E97\u4F4D\u7F6E"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "location-mode", checked: form.locationMode === 'independent', onChange: () => onChange({ locationMode: 'independent' }) }), "\u72EC\u7ACB\u4F4D\u7F6E"] })] })] }) }), isIndependent ? (_jsx("div", { className: "room-type-location-section__details", children: _jsxs("div", { className: "room-type-edit-page__field-list", children: [_jsxs("div", { className: "room-type-edit-page__field room-type-location-section__field--select room-type-location-section__field--required", children: [_jsx("span", { children: "\u6240\u5728\u57CE\u5E02:" }), _jsx(RegionCascader, { value: region, onChange: (selection) => {
                                        onChange({
                                            locationProvinceCode: selection.provinceCode,
                                            locationProvinceName: selection.provinceName,
                                            locationCityCode: selection.cityCode,
                                            locationCityName: selection.cityName,
                                            locationDistrictCode: selection.districtCode,
                                            locationDistrictName: selection.districtName,
                                        });
                                    } })] }), _jsxs("label", { className: "room-type-edit-page__field room-type-location-section__field--compact room-type-location-section__field--required", children: [_jsx("span", { children: "\u8857\u9053\u5730\u5740:" }), _jsx("input", { "aria-label": "\u8857\u9053\u5730\u5740", placeholder: "\u8BF7\u8F93\u5165\u8857\u9053\u5730\u5740", value: form.streetAddress, onChange: (event) => onChange({ streetAddress: event.target.value }) })] }), _jsxs("label", { className: "room-type-edit-page__field room-type-location-section__field--compact", children: [_jsx("span", { children: "\u5C0F\u533A\u540D\u79F0:" }), _jsx("input", { "aria-label": "\u5C0F\u533A\u540D\u79F0", placeholder: "\u8BF7\u8F93\u5165\u5C0F\u533A\u540D\u79F0", value: form.communityName, onChange: (event) => onChange({ communityName: event.target.value }) })] }), _jsxs("label", { className: "room-type-edit-page__field room-type-location-section__field--compact room-type-location-section__field--required", children: [_jsx("span", { children: "\u5355\u5143\u3001\u95E8\u724C\u53F7:" }), _jsx("input", { "aria-label": "\u5355\u5143\u3001\u95E8\u724C\u53F7", placeholder: "\u8BF7\u8F93\u5165\u5355\u5143\u3001\u95E8\u724C\u53F7", value: form.buildingUnit, onChange: (event) => onChange({ buildingUnit: event.target.value }) })] }), _jsx("div", { className: "room-type-location-section__map-field", children: _jsx(LocationMapPreview, { addressText: buildLocationSearchText({
                                    provinceName: form.locationProvinceName,
                                    cityName: form.locationCityName,
                                    districtName: form.locationDistrictName,
                                    communityName: form.communityName,
                                    streetAddress: form.streetAddress,
                                    buildingUnit: form.buildingUnit,
                                    doorNumber: form.doorNumber,
                                }), location: parseMapLocation(form.locationLatitude, form.locationLongitude), provinceName: form.locationProvinceName, cityName: form.locationCityName, onLocationChange: (nextLocation) => onChange(nextLocation) }) })] }) })) : null, !isIndependent && locationSummary ? _jsx("p", { className: "room-type-location-section__summary", children: locationSummary }) : null] }));
}
function RegionCascader({ value, onChange, }) {
    const rootRef = useRef(null);
    const [open, setOpen] = useState(false);
    const panel = getRegionPanelState(value);
    const activeProvince = panel.activeProvince ?? panel.provinces[0] ?? null;
    const activeCity = panel.activeCity ?? activeProvince?.cities[0] ?? null;
    const activeDistrict = panel.activeDistrict ?? activeCity?.districts[0] ?? null;
    const displayLabel = formatRegionLabel(value);
    useEffect(() => {
        if (!open)
            return;
        function handlePointerDown(event) {
            if (event.target instanceof Node && rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [open]);
    function selectProvince(code) {
        const nextProvince = panel.provinces.find((item) => item.code === code);
        if (!nextProvince)
            return;
        const nextCity = nextProvince.cities.find((item) => item.code === value.cityCode) ?? nextProvince.cities[0] ?? null;
        const nextDistrict = nextCity?.districts.find((item) => item.code === value.districtCode) ?? nextCity?.districts[0] ?? null;
        onChange({
            provinceCode: nextProvince.code,
            provinceName: nextProvince.name,
            cityCode: nextCity?.code ?? '',
            cityName: nextCity?.name ?? '',
            districtCode: nextDistrict?.code ?? '',
            districtName: nextDistrict?.name ?? '',
        });
    }
    function selectCity(code) {
        if (!activeProvince)
            return;
        const nextCity = activeProvince.cities.find((item) => item.code === code);
        if (!nextCity)
            return;
        const nextDistrict = nextCity.districts.find((item) => item.code === value.districtCode) ?? nextCity.districts[0] ?? null;
        onChange({
            provinceCode: activeProvince.code,
            provinceName: activeProvince.name,
            cityCode: nextCity.code,
            cityName: nextCity.name,
            districtCode: nextDistrict?.code ?? '',
            districtName: nextDistrict?.name ?? '',
        });
    }
    function selectDistrict(code) {
        if (!activeProvince || !activeCity)
            return;
        const nextDistrict = activeCity.districts.find((item) => item.code === code);
        if (!nextDistrict)
            return;
        onChange({
            provinceCode: activeProvince.code,
            provinceName: activeProvince.name,
            cityCode: activeCity.code,
            cityName: activeCity.name,
            districtCode: nextDistrict.code,
            districtName: nextDistrict.name,
        });
        setOpen(false);
    }
    return (_jsxs("div", { ref: rootRef, className: "room-type-region-picker", children: [_jsxs("button", { type: "button", className: "room-type-region-picker__button", "aria-haspopup": "listbox", "aria-expanded": open, onClick: () => setOpen((current) => !current), children: [_jsx("span", { children: displayLabel || '请选择所在城市' }), _jsx("em", { "aria-hidden": "true", children: "\u2304" })] }), open ? (_jsxs("div", { className: "room-type-region-picker__panel", role: "listbox", "aria-label": "\u6240\u5728\u57CE\u5E02\u9009\u9879", children: [_jsx("div", { className: "room-type-region-picker__column", children: panel.provinces.map((province) => (_jsxs("button", { type: "button", role: "option", "aria-selected": province.code === activeProvince?.code, className: province.code === activeProvince?.code ? 'is-active' : '', onClick: () => selectProvince(province.code), children: [_jsx("span", { children: province.name }), _jsx("i", { "aria-hidden": "true", children: "\u203A" })] }, province.code))) }), _jsx("div", { className: "room-type-region-picker__column", children: activeProvince?.cities.map((city) => (_jsxs("button", { type: "button", role: "option", "aria-selected": city.code === activeCity?.code, className: city.code === activeCity?.code ? 'is-active' : '', onClick: () => selectCity(city.code), children: [_jsx("span", { children: city.name }), _jsx("i", { "aria-hidden": "true", children: "\u203A" })] }, city.code))) }), _jsx("div", { className: "room-type-region-picker__column", children: activeCity?.districts.map((district) => (_jsx("button", { type: "button", role: "option", "aria-selected": district.code === activeDistrict?.code, className: district.code === activeDistrict?.code ? 'is-active' : '', onClick: () => selectDistrict(district.code), children: _jsx("span", { children: district.name }) }, district.code))) })] })) : null] }));
}
function LocationMapPreview({ addressText, location, provinceName, cityName, onLocationChange, }) {
    const containerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const amapApiRef = useRef(null);
    const mapCenterRef = useRef(location ?? defaultMapCenter);
    const mapZoomRef = useRef(defaultMapZoom);
    const onLocationChangeRef = useRef(onLocationChange);
    const [status, setStatus] = useState('missing-key');
    const locationKey = location ? `${location[0]},${location[1]}` : '';
    const statusCopy = mapStatusCopy[status];
    useEffect(() => {
        onLocationChangeRef.current = onLocationChange;
    }, [onLocationChange]);
    useEffect(() => {
        let cancelled = false;
        async function bootstrapMap() {
            const hasKey = Boolean(import.meta.env.VITE_AMAP_KEY?.trim());
            if (!hasKey || !containerRef.current) {
                setStatus('missing-key');
                return;
            }
            setStatus('loading');
            try {
                const loaded = await loadAmapScript();
                const amap = getAmapApi();
                if (cancelled || !loaded || !amap || !containerRef.current)
                    return;
                amapApiRef.current = amap;
                if (!mapInstanceRef.current) {
                    mapInstanceRef.current = new amap.Map(containerRef.current, {
                        zoom: defaultMapZoom,
                        center: mapCenterRef.current,
                        viewMode: '2D',
                        resizeEnable: true,
                    });
                }
                mapInstanceRef.current.setZoomAndCenter(defaultMapZoom, mapCenterRef.current);
                setStatus('ready');
            }
            catch {
                if (!cancelled)
                    setStatus('error');
            }
        }
        void bootstrapMap();
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        if (!locationKey)
            return;
        const [lng, lat] = locationKey.split(',').map(Number);
        if (!Number.isFinite(lng) || !Number.isFinite(lat))
            return;
        const nextCenter = [lng, lat];
        mapCenterRef.current = nextCenter;
        if (status === 'ready') {
            mapInstanceRef.current?.setCenter(nextCenter);
        }
    }, [locationKey, status]);
    useEffect(() => {
        const amap = amapApiRef.current ?? getAmapApi();
        if (status !== 'ready' || !amap || !mapInstanceRef.current || !addressText.trim())
            return;
        let cancelled = false;
        amap.plugin(['AMap.Geocoder'], () => {
            if (cancelled)
                return;
            const geocoder = new amap.Geocoder({ city: cityName || provinceName });
            geocoder.getLocation(addressText, (nextStatus, result) => {
                if (cancelled || nextStatus !== 'complete')
                    return;
                const firstLocation = result.geocodes?.[0]?.location;
                if (!firstLocation)
                    return;
                const nextCenter = [firstLocation.lng, firstLocation.lat];
                mapCenterRef.current = nextCenter;
                mapInstanceRef.current?.clearMap();
                mapInstanceRef.current?.setZoomAndCenter(defaultMapZoom, nextCenter);
                const marker = new amap.Marker({ position: nextCenter, anchor: 'bottom-center' });
                marker.setMap(mapInstanceRef.current);
                onLocationChangeRef.current({
                    locationLongitude: String(firstLocation.lng),
                    locationLatitude: String(firstLocation.lat),
                });
            });
        });
        return () => {
            cancelled = true;
        };
    }, [addressText, cityName, provinceName, status]);
    useEffect(() => {
        return () => {
            mapInstanceRef.current?.destroy();
            mapInstanceRef.current = null;
        };
    }, []);
    function setMapZoom(nextZoom) {
        mapZoomRef.current = nextZoom;
        mapInstanceRef.current?.setZoomAndCenter(nextZoom, mapCenterRef.current);
    }
    return (_jsxs("div", { className: `room-type-map-preview${status === 'missing-key' ? ' is-placeholder' : ''}`, children: [_jsx("div", { ref: containerRef, className: "room-type-map-preview__canvas", "aria-label": "\u5730\u56FE\u9884\u89C8" }), status !== 'ready' ? (_jsxs("div", { className: "room-type-map-preview__overlay", "aria-hidden": "true", children: [_jsx("strong", { children: statusCopy.title }), _jsx("span", { children: statusCopy.detail })] })) : null, _jsx("div", { className: "room-type-map-preview__badge", children: "\u9AD8\u5FB7\u5730\u56FE" }), _jsxs("div", { className: "room-type-map-preview__controls", "aria-hidden": "true", children: [_jsx("button", { type: "button", onClick: () => setMapZoom(mapZoomRef.current + 1), children: "\u2295" }), _jsx("button", { type: "button", onClick: () => setMapZoom(mapZoomRef.current - 1), children: "\u2212" })] }), status === 'error' ? _jsx("div", { className: "room-type-map-preview__status", children: "\u5730\u56FE\u52A0\u8F7D\u5931\u8D25" }) : null] }));
}
