import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { createCampInfoImportTask, fetchCampInfoDetail, fetchCampInfoOverview, fetchCampInfoSortData, saveCampInfoDetail, saveCampInfoSort, } from '../services/campInfo';
import { validateOptionalContactPhone } from '../utils/inputValidation';
import './CampInfoPage.css';
const defaultQuery = { keyword: '', page: 1, pageSize: 20 };
const CAMP_INFO_PHOTO_STORAGE_KEY = 'pms.campInfoUploadedPhotos';
const NEW_CAMP_INFO_STORE_ID = 'new-camp-info-store';
const campInfoTypeOptions = ['酒店', '公寓', '民宿'];
const campInfoCityOptions = ['深圳市', '广州市', '上海市', '北京市'];
const emptyCampInfoEditForm = {
    storeName: '',
    typeLabel: '',
    phone: '',
    cityPath: '',
    streetAddress: '',
    communityName: '',
    unitNo: '',
    fullAddress: '',
    plainIntro: '',
    richIntro: '',
};
function createEmptyCampInfoDetail(storeId) {
    return {
        provider: 'mock',
        endpoint: 'camp-info-new-store-form',
        traceId: `mock-shezhi--xinxi-weihu--mendian-xinxi-new-${storeId}`,
        timestamp: new Date().toISOString(),
        store: {
            id: storeId,
            campId: storeId,
            name: '',
            typeLabel: '',
            coverLabel: '门店图片预览',
            address: '',
            cityLabel: '',
            phone: '',
            tagLine: '',
            listedRoomTypeCount: 0,
            roomTypes: [],
        },
        albumImageCount: 0,
        cityPath: '',
        streetAddress: '',
        communityName: '',
        unitNo: '',
        fullAddress: '',
        plainIntro: '',
        richIntro: '',
        mapCopyright: '© 2026 AutoNavi - GS(2023)4677号',
    };
}
function isCampInfoUploadedPhoto(value) {
    if (!value || typeof value !== 'object')
        return false;
    const photo = value;
    return (typeof photo.id === 'string' &&
        typeof photo.name === 'string' &&
        typeof photo.mimeType === 'string' &&
        typeof photo.size === 'number' &&
        typeof photo.dataUrl === 'string' &&
        photo.dataUrl.startsWith('data:image/') &&
        typeof photo.uploadedAt === 'string');
}
function readCampInfoPhotoStore() {
    if (typeof window === 'undefined')
        return {};
    const rawValue = window.localStorage.getItem(CAMP_INFO_PHOTO_STORAGE_KEY);
    if (!rawValue)
        return {};
    try {
        const parsedValue = JSON.parse(rawValue);
        return Object.fromEntries(Object.entries(parsedValue)
            .filter((entry) => Array.isArray(entry[1]))
            .map(([storeId, photos]) => [storeId, photos.filter(isCampInfoUploadedPhoto)]));
    }
    catch (error) {
        console.warn('Failed to read camp info uploaded photos from localStorage', error);
        return {};
    }
}
function readCampInfoUploadedPhotos(storeId) {
    return readCampInfoPhotoStore()[storeId] ?? [];
}
function writeCampInfoUploadedPhotos(storeId, photos) {
    if (typeof window === 'undefined')
        return;
    const photoStore = readCampInfoPhotoStore();
    window.localStorage.setItem(CAMP_INFO_PHOTO_STORAGE_KEY, JSON.stringify({
        ...photoStore,
        [storeId]: photos,
    }));
}
function readCampInfoUploadedCovers(storeIds) {
    const photoStore = readCampInfoPhotoStore();
    return Object.fromEntries(storeIds.map((storeId) => [storeId, photoStore[storeId]?.[0]]));
}
function createCampInfoCoverPhoto(detail) {
    const coverImageDataUrl = detail.store.coverImageDataUrl;
    if (!coverImageDataUrl?.startsWith('data:image/'))
        return null;
    return {
        id: `${detail.store.id}-backend-cover`,
        name: `${detail.store.name || '门店'}封面`,
        mimeType: coverImageDataUrl.slice(5, coverImageDataUrl.indexOf(';')) || 'image/*',
        size: coverImageDataUrl.length,
        dataUrl: coverImageDataUrl,
        uploadedAt: detail.timestamp,
    };
}
function resolveCampInfoUploadedPhotos(storeId, detail) {
    const localPhotos = readCampInfoUploadedPhotos(storeId);
    const coverPhoto = detail ? createCampInfoCoverPhoto(detail) : null;
    if (!coverPhoto)
        return localPhotos;
    if (localPhotos.some((photo) => photo.dataUrl === coverPhoto.dataUrl))
        return localPhotos;
    return [coverPhoto, ...localPhotos];
}
function createCampInfoPhotoId(file, index) {
    return `${Date.now()}-${index}-${file.name.replace(/\W+/g, '-')}`;
}
function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }
            reject(new Error('图片读取失败'));
        });
        reader.addEventListener('error', () => reject(new Error('图片读取失败')));
        reader.readAsDataURL(file);
    });
}
function CampInfoRoomImage({ room }) {
    if (room.imageUrl) {
        return _jsx("img", { className: "camp-info-room-image", src: room.imageUrl, alt: `${room.name}房型图片` });
    }
    if (room.imageKey.startsWith('api-')) {
        return (_jsx("div", { className: "camp-info-room-image camp-info-room-image--empty", "aria-label": `${room.name}暂无图片`, children: "\u6682\u65E0\u56FE\u7247" }));
    }
    return _jsx("div", { className: `camp-info-room-image camp-info-room-image--${room.imageKey}`, "aria-label": `${room.name}房型图片` });
}
export function CampInfoPage() {
    const location = useLocation();
    if (location.pathname.endsWith('/detail'))
        return _jsx(CampInfoDetailPage, {});
    if (location.pathname.endsWith('/edit') || location.pathname.endsWith('/new'))
        return _jsx(CampInfoEditPage, {});
    if (location.pathname.endsWith('/sort'))
        return _jsx(CampInfoSortPage, {});
    return _jsx(CampInfoListPage, {});
}
function CampInfoListPage() {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState(defaultQuery.keyword);
    const [appliedQuery, setAppliedQuery] = useState(defaultQuery);
    const [overview, setOverview] = useState(null);
    const [loadIntent, setLoadIntent] = useState('initial');
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [, setStatusMessage] = useState('门店信息加载中');
    const [expandedStoreIds, setExpandedStoreIds] = useState([]);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [selectedImportOptionId, setSelectedImportOptionId] = useState('room-types');
    const [reloadSeed, setReloadSeed] = useState(0);
    const [uploadedCovers, setUploadedCovers] = useState({});
    useEffect(() => {
        const controller = new AbortController();
        fetchCampInfoOverview(appliedQuery, controller.signal)
            .then((nextOverview) => {
            setOverview(nextOverview);
            setExpandedStoreIds((current) => current.filter((item) => nextOverview.stores.some((store) => store.id === item)));
            setUploadedCovers(readCampInfoUploadedCovers(nextOverview.stores.map((store) => store.id)));
            setStatusMessage(resolveLoadMessage(loadIntent));
        })
            .catch((error) => {
            if (controller.signal.aborted)
                return;
            setErrorMessage(error instanceof Error ? error.message : '门店信息加载失败');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setLoading(false);
        });
        return () => controller.abort();
    }, [appliedQuery, loadIntent, reloadSeed]);
    const contractPayload = overview
        ? {
            provider: overview.provider,
            endpoint: overview.endpoint,
            traceId: overview.traceId,
            timestamp: overview.timestamp,
            request: overview.request,
            observedEndpoints: overview.observedEndpoints,
            pagination: overview.pagination,
        }
        : null;
    async function handleImportConfirm() {
        const result = await createCampInfoImportTask(selectedImportOptionId);
        setShowImportDialog(false);
        setStatusMessage(result.message);
    }
    function toggleExpanded(storeId) {
        setExpandedStoreIds((current) => current.includes(storeId) ? current.filter((item) => item !== storeId) : [...current, storeId]);
    }
    return (_jsxs("div", { className: "camp-info-page", children: [contractPayload ? (_jsx("pre", { "data-testid": "camp-info-contract", className: "camp-info-contract", hidden: true, children: JSON.stringify(contractPayload) })) : null, _jsxs("section", { className: "camp-info-query", "aria-label": "\u95E8\u5E97\u4FE1\u606F\u7B5B\u9009", children: [_jsxs("label", { children: [_jsx("span", { children: "\u95E8\u5E97\u540D\u79F0" }), _jsx("input", { value: keyword, onChange: (event) => setKeyword(event.target.value), placeholder: "\u8BF7\u8F93\u5165\u95E8\u5E97\u540D\u79F0", disabled: loading })] }), _jsxs("div", { className: "camp-info-query__actions", children: [_jsx("button", { type: "button", className: "is-primary", disabled: loading, onClick: () => {
                                    setLoading(true);
                                    setErrorMessage('');
                                    setStatusMessage('门店信息加载中');
                                    setLoadIntent('query');
                                    setAppliedQuery({ ...defaultQuery, keyword });
                                }, children: "\u67E5 \u8BE2" }), _jsx("button", { type: "button", disabled: loading, onClick: () => {
                                    setKeyword('');
                                    setLoading(true);
                                    setErrorMessage('');
                                    setStatusMessage('门店信息加载中');
                                    setLoadIntent('reset');
                                    setAppliedQuery(defaultQuery);
                                }, children: "\u91CD \u7F6E" })] })] }), errorMessage ? (_jsx(CampInfoErrorState, { message: errorMessage, onRetry: () => {
                    setLoading(true);
                    setErrorMessage('');
                    setStatusMessage('门店信息加载中');
                    setLoadIntent('retry');
                    setReloadSeed((value) => value + 1);
                } })) : null, !errorMessage ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "camp-info-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "\u5F53\u524D\u7CFB\u7EDF\u95E8\u5E97\uFF1A" }), _jsx("strong", { children: overview?.summary.activeStoreText ?? '--/--' }), _jsxs("em", { children: ["\uFF08", overview?.summary.effectivePeriod ?? '待刷新', "\uFF09"] })] }), _jsxs("div", { className: "camp-info-summary__actions", children: [_jsx("button", { type: "button", className: "is-primary", disabled: loading, onClick: () => navigate('/InformationMaintenance/campInfo/new'), children: "\u65B0\u5EFA\u95E8\u5E97" }), _jsx("button", { type: "button", className: "is-primary", disabled: loading, onClick: () => setShowImportDialog(true), children: "\u4E00\u952E\u5BFC\u5165" }), _jsx("button", { type: "button", className: "is-primary", disabled: loading, onClick: () => navigate('/InformationMaintenance/campInfo/sort'), children: "\u95E8\u5E97\u6392\u5E8F" })] })] }), loading ? _jsx(CampInfoLoadingState, {}) : null, !loading && overview?.state === 'empty' ? (_jsxs("section", { className: "camp-info-empty", role: "status", "aria-label": "\u95E8\u5E97\u4FE1\u606F\u7A7A\u6001", children: [_jsx("h2", { children: overview.emptyMessage }), _jsx("p", { children: "\u8BF7\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\uFF0C\u6216\u7EE7\u7EED\u7EF4\u62A4\u5F53\u524D\u95E8\u5E97\u8D44\u6599\u3002" })] })) : null, !loading && overview?.state === 'success' ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "camp-info-table", role: "table", "aria-label": "\u95E8\u5E97\u4FE1\u606F\u5217\u8868", children: [_jsxs("div", { className: "camp-info-table__head", role: "row", children: [_jsx("div", { role: "columnheader" }), _jsx("div", { role: "columnheader", children: "\u95E8\u5E97\u540D\u79F0" }), _jsx("div", { role: "columnheader", children: "\u95E8\u5E97\u7C7B\u578B" }), _jsx("div", { role: "columnheader", children: "\u56FE\u7247" }), _jsx("div", { role: "columnheader", children: "\u5730\u5740" }), _jsx("div", { role: "columnheader", children: "\u4E0A\u67B6\u623F\u578B\u6570\u91CF" }), _jsx("div", { role: "columnheader", children: "\u64CD\u4F5C" })] }), _jsx("div", { className: "camp-info-table__body", children: overview.stores.map((store) => {
                                            const expanded = expandedStoreIds.includes(store.id);
                                            const uploadedCover = uploadedCovers[store.id];
                                            const coverDataUrl = store.coverImageDataUrl ?? uploadedCover?.dataUrl;
                                            return (_jsxs("div", { className: "camp-info-table__group", children: [_jsxs("div", { className: "camp-info-table__row", role: "row", children: [_jsx("div", { role: "cell", children: _jsx("button", { type: "button", className: expanded ? 'camp-info-expand is-open' : 'camp-info-expand', "aria-label": "\u5C55\u5F00\u95E8\u5E97\u623F\u578B", "aria-expanded": expanded, onClick: () => toggleExpanded(store.id), children: expanded ? '−' : '+' }) }), _jsxs("div", { role: "cell", children: [_jsx("strong", { children: store.name }), _jsx("small", { children: store.tagLine })] }), _jsx("div", { role: "cell", children: store.typeLabel }), _jsx("div", { role: "cell", children: coverDataUrl ? (_jsx("img", { className: "camp-info-thumb", src: coverDataUrl, alt: `${store.name}封面` })) : (_jsx("div", { className: "camp-info-thumb is-empty", "aria-label": store.coverLabel, children: "\u6682\u65E0\u56FE\u7247" })) }), _jsx("div", { role: "cell", children: store.address }), _jsx("div", { role: "cell", children: store.listedRoomTypeCount }), _jsxs("div", { role: "cell", className: "camp-info-actions", children: [_jsx("button", { type: "button", onClick: () => navigate(`/InformationMaintenance/campInfo/detail?storeId=${store.id}`), children: "\u8BE6\u60C5" }), _jsx("button", { type: "button", onClick: () => navigate(`/InformationMaintenance/campInfo/edit?storeId=${store.id}`), children: "\u7F16\u8F91" }), _jsx("button", { type: "button", onClick: () => setStatusMessage('当前门店已下架，待重新启用后恢复展示'), children: "\u4E0B\u67B6" }), _jsx("button", { type: "button", className: "is-danger", onClick: () => setStatusMessage('删除操作已进入确认队列，请先处理门店关联房型'), children: "\u5220\u9664" })] })] }), expanded ? (_jsx("div", { className: "camp-info-room-detail", role: "rowgroup", "aria-label": "\u95E8\u5E97\u623F\u578B\u660E\u7EC6", children: store.roomTypes.map((room) => (_jsxs("article", { className: "camp-info-room-row", children: [_jsx(CampInfoRoomImage, { room: room }), _jsxs("div", { children: [_jsxs("p", { children: ["\u623F\u578B\u540D\u79F0: ", room.name] }), _jsxs("p", { children: ["\u623F\u95F4\u6570\u91CF: ", room.roomCount] })] }), _jsxs("div", { children: ["\u623F\u95F4: ", room.roomLabel] }), _jsxs("div", { className: "camp-info-room-actions", children: [_jsx("button", { type: "button", onClick: () => setStatusMessage(`已打开 ${room.name} 的房型修改入口`), children: "\u4FEE\u6539" }), _jsx("button", { type: "button", onClick: () => setStatusMessage(`已查看 ${room.name} 的房间清单`), children: "\u623F\u95F4" }), _jsx("button", { type: "button", onClick: () => setStatusMessage(`${room.name} 已加入联动关房检查队列`), children: "\u8054\u52A8\u5173\u623F" }), _jsx("button", { type: "button", className: "is-danger", onClick: () => setStatusMessage(`${room.name} 删除前需要先处理在线售卖商品`), children: "\u5220\u9664" })] })] }, room.id))) })) : null] }, store.id));
                                        }) })] }), _jsxs("footer", { className: "camp-info-pagination", children: [_jsxs("span", { children: ["\u7B2C ", (overview.pagination.page - 1) * overview.pagination.pageSize + 1, "-", overview.pagination.total, " \u6761/\u603B\u5171", ' ', overview.pagination.total, " \u6761"] }), _jsx("button", { type: "button", "aria-current": "page", onClick: () => setStatusMessage('当前已定位到第 1 页'), children: "1" }), _jsx("button", { type: "button", onClick: () => setStatusMessage('当前每页展示 20 条门店记录'), children: "20 \u6761/\u9875" })] })] })) : null] })) : null, showImportDialog && overview ? (_jsx("div", { className: "camp-info-modal-backdrop", children: _jsxs("section", { className: "camp-info-limit-modal camp-info-import-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u4E00\u952E\u5BFC\u5165", children: [_jsx("h2", { children: "\u4E00\u952E\u5BFC\u5165" }), _jsx("p", { children: "\u5BFC\u5165\u95E8\u5E97\u57FA\u7840\u8D44\u6599\uFF0C\u4FDD\u6301\u95E8\u5E97\u3001\u623F\u578B\u4E0E\u6392\u5E8F\u4FE1\u606F\u540C\u6B65\u3002" }), _jsx("div", { className: "camp-info-import-options", children: overview.importOptions.map((item) => (_jsxs("label", { className: selectedImportOptionId === item.id ? 'is-active' : '', children: [_jsx("input", { type: "radio", name: "camp-info-import", value: item.id, checked: selectedImportOptionId === item.id, onChange: () => setSelectedImportOptionId(item.id) }), _jsx("strong", { children: item.label }), _jsx("span", { children: item.description })] }, item.id))) }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setShowImportDialog(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => void handleImportConfirm(), children: "\u5F00\u59CB\u5BFC\u5165" })] })] }) })) : null] }));
}
function CampInfoDetailPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const storeId = searchParams.get('storeId') ?? 'store-qianhai-001';
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [activeTab, setActiveTab] = useState('basic');
    const [reloadSeed, setReloadSeed] = useState(0);
    const [uploadedPhotos, setUploadedPhotos] = useState([]);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setErrorMessage('');
        setDetail(null);
        setUploadedPhotos([]);
        fetchCampInfoDetail(storeId, controller.signal)
            .then((nextDetail) => {
            setDetail(nextDetail);
            setUploadedPhotos(resolveCampInfoUploadedPhotos(storeId, nextDetail));
        })
            .catch((error) => {
            if (controller.signal.aborted)
                return;
            setErrorMessage(error instanceof Error ? error.message : '门店详情加载失败');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setLoading(false);
        });
        return () => controller.abort();
    }, [reloadSeed, storeId]);
    const tags = detail?.store.tagLine.split('/').map((item) => item.trim()).filter(Boolean) ?? [];
    return (_jsxs("div", { className: "camp-info-page camp-info-detail-page", children: [_jsxs("div", { className: "camp-info-detail-breadcrumb", "aria-label": "\u95E8\u5E97\u4FE1\u606F\u8DEF\u5F84", children: [_jsx("button", { type: "button", onClick: () => navigate('/InformationMaintenance/campInfo'), children: "\u95E8\u5E97\u4FE1\u606F" }), _jsx("span", { children: "/" }), _jsx("strong", { children: "\u8BE6\u60C5" })] }), _jsxs("section", { className: "camp-info-detail-shell", children: [_jsxs("div", { className: "camp-info-detail-shell__header", children: [_jsxs("div", { className: "camp-info-detail-tabs", role: "tablist", "aria-label": "\u95E8\u5E97\u8BE6\u60C5\u9875\u7B7E", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'basic', className: activeTab === 'basic' ? 'is-active' : '', onClick: () => setActiveTab('basic'), children: "\u57FA\u7840\u4FE1\u606F" }), _jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'detail', className: activeTab === 'detail' ? 'is-active' : '', onClick: () => setActiveTab('detail'), children: "\u8BE6\u7EC6\u4FE1\u606F" })] }), _jsx("button", { type: "button", className: "is-primary camp-info-detail-edit", onClick: () => navigate(`/InformationMaintenance/campInfo/edit?storeId=${storeId}`), children: "\u7F16\u8F91" })] }), loading ? _jsx(CampInfoLoadingState, {}) : null, errorMessage ? (_jsx(CampInfoErrorState, { message: errorMessage, onRetry: () => {
                            setReloadSeed((value) => value + 1);
                        } })) : null, !loading && detail ? (_jsxs("div", { className: "camp-info-detail-content", children: [_jsxs("div", { className: "camp-info-detail-title", children: [_jsx("h1", { children: detail.store.name }), _jsx("p", { children: "\u95E8\u5E97\u8D44\u6599\u4E0E\u623F\u578B\u4FE1\u606F\u7EDF\u4E00\u6309\u5F53\u524D\u670D\u52A1\u8FD4\u56DE\u7ED3\u679C\u5C55\u793A\uFF0C\u5B57\u6BB5\u6309\u76EE\u6807\u9875\u5E03\u5C40\u91CD\u65B0\u5BF9\u9F50\u3002" })] }), activeTab === 'basic' ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "camp-info-detail-facts", "aria-label": "\u95E8\u5E97\u57FA\u7840\u4FE1\u606F", children: [_jsxs("article", { className: "camp-info-detail-field", children: [_jsx("span", { children: "\u95E8\u5E97\u7C7B\u578B" }), _jsx("strong", { children: detail.store.typeLabel })] }), _jsxs("article", { className: "camp-info-detail-field", children: [_jsx("span", { children: "\u8054\u7CFB\u7535\u8BDD" }), _jsx("strong", { children: detail.store.phone })] }), _jsxs("article", { className: "camp-info-detail-field", children: [_jsx("span", { children: "\u6240\u5728\u57CE\u5E02" }), _jsx("strong", { children: detail.cityPath })] }), _jsxs("article", { className: "camp-info-detail-field", children: [_jsx("span", { children: "\u95E8\u5E97\u6807\u7B7E" }), _jsx("div", { className: "camp-info-detail-tags", "aria-label": "\u95E8\u5E97\u6807\u7B7E\u5217\u8868", children: tags.map((item) => (_jsx("b", { children: item }, item))) })] }), _jsxs("article", { className: "camp-info-detail-field is-wide", children: [_jsx("span", { children: "\u8BE6\u7EC6\u5730\u5740" }), _jsx("strong", { children: detail.fullAddress })] }), _jsxs("article", { className: "camp-info-detail-field is-wide", children: [_jsx("span", { children: "\u95E8\u5E97\u56FE\u7247" }), _jsx("div", { className: "camp-info-detail-photo-grid", "aria-label": "\u95E8\u5E97\u56FE\u7247", children: uploadedPhotos.length > 0 ? (uploadedPhotos.map((photo, index) => (_jsx("img", { className: "camp-info-photo", src: photo.dataUrl, alt: `${photo.name}${index === 0 ? ' 封面' : ''}` }, photo.id)))) : (_jsx("div", { className: "camp-info-photo-empty", children: "\u6682\u65E0\u56FE\u7247" })) })] })] }), _jsxs("section", { className: "camp-info-detail-map-card", "aria-label": "\u95E8\u5E97\u5730\u56FE", children: [_jsxs("div", { className: "camp-info-detail-map-card__header", children: [_jsx("strong", { children: "\u5730\u56FE\u4F4D\u7F6E" }), _jsx("span", { children: detail.mapCopyright })] }), _jsx("div", { className: "camp-info-detail-map", children: _jsx("div", { className: "camp-info-detail-map__marker" }) })] })] })) : (_jsxs("section", { className: "camp-info-detail-panel", "aria-label": "\u95E8\u5E97\u8BE6\u7EC6\u4FE1\u606F", children: [_jsxs("article", { className: "camp-info-detail-note", children: [_jsx("span", { children: "\u95E8\u5E97\u4ECB\u7ECD" }), _jsxs("p", { children: [detail.store.name, " \u5F53\u524D\u5DF2\u540C\u6B65 ", detail.store.listedRoomTypeCount, " \u4E2A\u4E0A\u67B6\u623F\u578B\uFF0C\u5DF2\u4E0A\u4F20\u95E8\u5E97\u56FE\u7247 ", uploadedPhotos.length, " \u5F20\uFF0C\u6807\u7B7E\u4E0E\u57CE\u5E02\u4FE1\u606F\u53EF\u76F4\u63A5\u7528\u4E8E OTA \u6E20\u9053\u5C55\u793A\u3002"] })] }), _jsxs("article", { className: "camp-info-detail-note", children: [_jsx("span", { children: "\u5730\u5740\u62C6\u5206" }), _jsxs("p", { children: ["\u8857\u9053\u5730\u5740\uFF1A", detail.streetAddress, _jsx("br", {}), "\u5C0F\u533A\u540D\u79F0\uFF1A", detail.communityName, _jsx("br", {}), "\u5355\u5143\u95E8\u724C\uFF1A", detail.unitNo] })] }), _jsx("section", { className: "camp-info-detail-room-list", "aria-label": "\u623F\u578B\u6982\u89C8", children: detail.store.roomTypes.map((room) => (_jsxs("article", { className: "camp-info-detail-room-card", children: [_jsx(CampInfoRoomImage, { room: room }), _jsxs("div", { children: [_jsx("strong", { children: room.name }), _jsxs("p", { children: ["\u623F\u95F4\u6570\u91CF\uFF1A", room.roomCount] }), _jsx("p", { children: room.roomLabel })] })] }, room.id))) })] }))] })) : null] })] }));
}
function CampInfoEditPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [newStoreDraftId] = useState(() => `${NEW_CAMP_INFO_STORE_ID}-${Date.now()}`);
    const isNewStore = location.pathname.endsWith('/new');
    const storeId = isNewStore ? newStoreDraftId : searchParams.get('storeId') ?? 'store-qianhai-001';
    const [detail, setDetail] = useState(null);
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);
    const [uploadedPhotos, setUploadedPhotos] = useState([]);
    const [mapZoom, setMapZoom] = useState(12);
    const [step, setStep] = useState('basic');
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const fileInputRef = useRef(null);
    useEffect(() => {
        setLoading(true);
        setErrorMessage('');
        setDetail(null);
        setForm(null);
        setTagInput('');
        setTags([]);
        setUploadedPhotos([]);
        setMapZoom(12);
        setStep('basic');
        setSaving(false);
        setFormErrors({});
        if (isNewStore) {
            const nextDetail = createEmptyCampInfoDetail(storeId);
            setDetail(nextDetail);
            setForm({ ...emptyCampInfoEditForm });
            setUploadedPhotos(resolveCampInfoUploadedPhotos(storeId, nextDetail));
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        fetchCampInfoDetail(storeId, controller.signal)
            .then((nextDetail) => {
            setDetail(nextDetail);
            setForm({
                storeName: nextDetail.store.name,
                typeLabel: nextDetail.store.typeLabel,
                phone: nextDetail.store.phone,
                cityPath: nextDetail.cityPath,
                streetAddress: nextDetail.streetAddress,
                communityName: nextDetail.communityName,
                unitNo: nextDetail.unitNo,
                fullAddress: nextDetail.fullAddress,
                plainIntro: nextDetail.plainIntro,
                richIntro: nextDetail.richIntro,
            });
            setTags(nextDetail.store.tagLine.split('/').map((item) => item.trim()).filter(Boolean));
            setUploadedPhotos(resolveCampInfoUploadedPhotos(storeId, nextDetail));
        })
            .catch((error) => {
            if (controller.signal.aborted)
                return;
            setErrorMessage(error instanceof Error ? error.message : '门店详情加载失败');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setLoading(false);
        });
        return () => controller.abort();
    }, [isNewStore, storeId]);
    function updateForm(field, value) {
        setForm((current) => (current ? { ...current, [field]: value } : current));
        setFormErrors((current) => {
            if (field !== 'storeName' && field !== 'phone')
                return current;
            return { ...current, [field]: undefined };
        });
    }
    function validateBasicInfo() {
        if (!form)
            return false;
        const nextErrors = {};
        if (!form.storeName.trim())
            nextErrors.storeName = '门店名称不能为空';
        const phoneError = validateOptionalContactPhone(form.phone);
        if (phoneError)
            nextErrors.phone = phoneError;
        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setErrorMessage('');
            return false;
        }
        return true;
    }
    function addTag() {
        const nextTag = tagInput.trim();
        if (!nextTag || tags.includes(nextTag))
            return;
        setTags((current) => [...current, nextTag]);
        setTagInput('');
    }
    function persistPhotos(nextPhotos) {
        setUploadedPhotos(nextPhotos);
        writeCampInfoUploadedPhotos(storeId, nextPhotos);
    }
    async function handlePhotoUpload(event) {
        const selectedFiles = Array.from(event.currentTarget.files ?? []);
        event.currentTarget.value = '';
        const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));
        if (imageFiles.length === 0)
            return;
        try {
            const nextPhotos = await Promise.all(imageFiles.map(async (file, index) => ({
                id: createCampInfoPhotoId(file, index),
                name: file.name,
                mimeType: file.type,
                size: file.size,
                dataUrl: await readFileAsDataUrl(file),
                uploadedAt: new Date().toISOString(),
            })));
            setUploadedPhotos((current) => {
                const mergedPhotos = [...current, ...nextPhotos];
                writeCampInfoUploadedPhotos(storeId, mergedPhotos);
                return mergedPhotos;
            });
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : '图片读取失败');
        }
    }
    function removePhoto(photoId) {
        persistPhotos(uploadedPhotos.filter((photo) => photo.id !== photoId));
    }
    function reversePhotos() {
        persistPhotos([...uploadedPhotos].reverse());
    }
    async function handleSaveAndExit() {
        if (!detail || !form)
            return;
        if (!validateBasicInfo()) {
            setStep('basic');
            return;
        }
        const storeName = form.storeName.trim();
        setSaving(true);
        setErrorMessage('');
        try {
            await saveCampInfoDetail({
                storeId,
                campId: isNewStore ? undefined : detail.store.campId,
                poiId: isNewStore ? undefined : storeId,
                campName: storeName,
                name: storeName,
                typeName: form.typeLabel,
                campTypeName: form.typeLabel,
                phone: form.phone,
                contactNumber: form.phone,
                cityName: form.cityPath,
                cityPath: form.cityPath,
                address: form.fullAddress,
                streetAddress: form.streetAddress,
                communityName: form.communityName,
                unitNo: form.unitNo,
                fullAddress: form.fullAddress,
                tags,
                plainIntro: form.plainIntro,
                richIntro: form.richIntro,
                coverImageDataUrl: uploadedPhotos[0]?.dataUrl,
                photoCount: uploadedPhotos.length,
            });
            navigate('/InformationMaintenance/campInfo');
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : '门店信息保存失败');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "camp-info-page camp-info-edit-page", children: [_jsxs("div", { className: "camp-info-edit-breadcrumb", "aria-label": "\u95E8\u5E97\u4FE1\u606F\u8DEF\u5F84", children: [_jsx("button", { type: "button", disabled: saving, onClick: () => navigate('/InformationMaintenance/campInfo'), children: "\u95E8\u5E97\u4FE1\u606F" }), _jsx("span", { children: "/" }), _jsx("strong", { children: isNewStore ? '新建门店' : '编辑' })] }), _jsxs("nav", { className: "camp-info-edit-steps", "aria-label": "\u95E8\u5E97\u4FE1\u606F\u6B65\u9AA4", children: [_jsxs("span", { className: `camp-info-step ${step === 'basic' ? 'is-active' : 'is-complete'}`, children: [_jsx("b", { children: step === 'detail' ? '✓' : '1' }), "\u57FA\u672C\u4FE1\u606F"] }), _jsx("i", {}), _jsxs("span", { className: `camp-info-step ${step === 'detail' ? 'is-active' : ''}`, children: [_jsx("b", { children: "2" }), "\u8BE6\u7EC6\u4ECB\u7ECD"] })] }), loading ? _jsx(CampInfoLoadingState, {}) : null, errorMessage ? _jsx(CampInfoErrorState, { message: errorMessage, onRetry: () => navigate(0) }) : null, detail && form ? (_jsxs(_Fragment, { children: [_jsx("pre", { "data-testid": "camp-info-detail-contract", className: "camp-info-contract", hidden: true, children: JSON.stringify({
                            endpoint: detail.endpoint,
                            provider: detail.provider,
                            traceId: detail.traceId,
                            timestamp: detail.timestamp,
                        }) }), step === 'basic' ? (_jsx("section", { className: "camp-info-form-card camp-info-edit-basic", "aria-label": "\u57FA\u672C\u4FE1\u606F", children: _jsxs("div", { className: "camp-info-edit-form", children: [_jsxs("label", { className: "camp-info-edit-row", children: [_jsx("span", { children: "* \u95E8\u5E97\u540D\u79F0:" }), _jsxs("div", { className: "camp-info-edit-field", children: [_jsx("input", { "aria-label": "\u95E8\u5E97\u540D\u79F0", value: form.storeName, onChange: (event) => updateForm('storeName', event.target.value) }), formErrors.storeName ? _jsx("small", { className: "camp-info-field-error", children: formErrors.storeName }) : null] })] }), _jsxs("label", { className: "camp-info-edit-row", children: [_jsx("span", { children: "* \u95E8\u5E97\u7C7B\u578B:" }), _jsxs("select", { "aria-label": "\u95E8\u5E97\u7C7B\u578B", value: form.typeLabel, onChange: (event) => updateForm('typeLabel', event.target.value), children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), campInfoTypeOptions.map((item) => (_jsx("option", { value: item, children: item }, item)))] })] }), _jsxs("label", { className: "camp-info-edit-row", children: [_jsx("span", { children: "* \u8054\u7CFB\u7535\u8BDD:" }), _jsxs("div", { className: "camp-info-edit-field", children: [_jsx("input", { "aria-label": "\u8054\u7CFB\u7535\u8BDD", value: form.phone, onChange: (event) => updateForm('phone', event.target.value) }), formErrors.phone ? _jsx("small", { className: "camp-info-field-error", children: formErrors.phone }) : null] })] }), _jsxs("div", { className: "camp-info-edit-row camp-info-edit-tag-row", children: [_jsx("span", { children: "\u95E8\u5E97\u6807\u7B7E:" }), _jsx("input", { value: tagInput, onChange: (event) => setTagInput(event.target.value), onKeyDown: (event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    addTag();
                                                }
                                            }, placeholder: "\u8BF7\u8F93\u5165\u95E8\u5E97\u6807\u7B7E" }), _jsx("button", { type: "button", onClick: addTag, children: "+ \u6DFB\u52A0\u95E8\u5E97\u6807\u7B7E" }), _jsx("div", { className: "camp-info-tags", "aria-label": "\u95E8\u5E97\u6807\u7B7E\u5217\u8868", children: tags.map((item) => (_jsx("button", { type: "button", onClick: () => setTags((current) => current.filter((tag) => tag !== item)), title: "\u70B9\u51FB\u79FB\u9664\u6807\u7B7E", children: item }, item))) })] }), _jsxs("div", { className: "camp-info-edit-row camp-info-edit-photo-row", children: [_jsx("span", { children: "* \u95E8\u5E97\u56FE\u7247:" }), _jsxs("div", { className: "camp-info-edit-photo-grid", "aria-label": "\u95E8\u5E97\u56FE\u7247", children: [uploadedPhotos.length > 0 ? (uploadedPhotos.map((photo, index) => (_jsxs("figure", { className: "camp-info-photo-item", children: [_jsx("img", { className: "camp-info-photo", src: photo.dataUrl, alt: `${photo.name}${index === 0 ? ' 封面' : ''}` }), index === 0 ? _jsx("span", { children: "\u5C01\u9762" }) : null, _jsx("button", { type: "button", "aria-label": `删除${photo.name}`, onClick: () => removePhoto(photo.id), children: "\u00D7" })] }, photo.id)))) : (_jsx("div", { className: "camp-info-photo-empty", children: "\u6682\u65E0\u56FE\u7247" })), _jsx("input", { ref: fileInputRef, type: "file", className: "camp-info-upload-input", accept: "image/*", multiple: true, "aria-label": "\u4E0A\u4F20\u95E8\u5E97\u56FE\u7247", onChange: (event) => void handlePhotoUpload(event) }), _jsxs("button", { type: "button", className: "camp-info-upload-button", onClick: () => fileInputRef.current?.click(), children: ["+", _jsx("span", { children: "\u4E0A\u4F20" })] })] }), _jsxs("p", { children: [_jsx("em", { children: "\u7B2C\u4E00\u5F20\u56FE\u7247\u5C06\u4F1A\u4F5C\u4E3A\u5C01\u9762" }), _jsx("button", { type: "button", disabled: uploadedPhotos.length < 2, onClick: reversePhotos, children: "\u8C03\u6574\u56FE\u7247\u987A\u5E8F" })] })] }), _jsxs("label", { className: "camp-info-edit-row", children: [_jsx("span", { children: "* \u6240\u5728\u57CE\u5E02:" }), _jsxs("select", { "aria-label": "\u6240\u5728\u57CE\u5E02", value: form.cityPath, onChange: (event) => updateForm('cityPath', event.target.value), children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), [form.cityPath, ...campInfoCityOptions]
                                                    .map((item) => item.trim())
                                                    .filter(Boolean)
                                                    .filter((item, index, list) => list.indexOf(item) === index)
                                                    .map((item) => (_jsx("option", { value: item, children: item }, item)))] })] }), _jsxs("label", { className: "camp-info-edit-row", children: [_jsx("span", { children: "* \u8857\u9053\u5730\u5740:" }), _jsx("input", { value: form.streetAddress, onChange: (event) => updateForm('streetAddress', event.target.value) })] }), _jsxs("label", { className: "camp-info-edit-row", children: [_jsx("span", { children: "\u5C0F\u533A\u540D\u79F0:" }), _jsx("input", { value: form.communityName, onChange: (event) => updateForm('communityName', event.target.value) })] }), _jsxs("label", { className: "camp-info-edit-row", children: [_jsx("span", { children: "* \u5355\u5143\u3001\u95E8\u724C\u53F7:" }), _jsx("input", { value: form.unitNo, onChange: (event) => updateForm('unitNo', event.target.value) })] }), _jsxs("label", { className: "camp-info-edit-row camp-info-address", children: [_jsx("span", { children: "* \u8BE6\u7EC6\u5730\u5740:" }), _jsx("textarea", { value: form.fullAddress, onChange: (event) => updateForm('fullAddress', event.target.value) })] }), _jsxs("div", { className: "camp-info-edit-row camp-info-map", children: [_jsx("span", { children: "\u5730\u56FE\u4F4D\u7F6E:" }), _jsxs("div", { className: "camp-info-map__canvas", "aria-label": "\u5730\u56FE\u4F4D\u7F6E\u9884\u89C8", children: [_jsx("button", { type: "button", "aria-label": "\u653E\u5927\u5730\u56FE", onClick: () => setMapZoom((value) => Math.min(value + 1, 18)), children: "+" }), _jsx("button", { type: "button", "aria-label": "\u7F29\u5C0F\u5730\u56FE", onClick: () => setMapZoom((value) => Math.max(value - 1, 3)), children: "\u2212" }), _jsx("div", { className: "camp-info-map__marker" }), _jsxs("small", { children: [detail.mapCopyright, " \u00B7 zoom ", mapZoom] })] }), _jsx("p", { children: "\u82E5\u5730\u56FE\u81EA\u52A8\u83B7\u53D6\u5750\u6807\u6709\u8BEF\uFF0C\u8BF7\u62D6\u52A8\u56FE\u6807\u81F3\u6B63\u786E\u5750\u6807" })] })] }) })) : (_jsx("section", { className: "camp-info-form-card camp-info-edit-detail", "aria-label": "\u8BE6\u7EC6\u4ECB\u7ECD", children: _jsxs("div", { className: "camp-info-edit-form camp-info-edit-form--detail", children: [_jsxs("label", { className: "camp-info-edit-row camp-info-edit-text-row", children: [_jsx("span", { children: "\u6587\u5B57\u4ECB\u7ECD:" }), _jsx("textarea", { "aria-label": "\u6587\u5B57\u4ECB\u7ECD", value: form.plainIntro, onChange: (event) => updateForm('plainIntro', event.target.value), placeholder: "\u8BF7\u8F93\u5165\u6587\u5B57\u4ECB\u7ECD" })] }), _jsxs("div", { className: "camp-info-edit-row camp-info-rich-row", children: [_jsx("span", { children: "\u56FE\u6587\u4ECB\u7ECD:" }), _jsxs("div", { className: "camp-info-rich-editor", children: [_jsxs("div", { className: "camp-info-rich-editor__toolbar", "aria-label": "\u56FE\u6587\u4ECB\u7ECD\u5DE5\u5177\u680F", children: [['H', 'B', 'I', 'U', 'S'].map((item) => (_jsx("button", { type: "button", "aria-label": `格式 ${item}`, children: item }, item))), _jsx("select", { "aria-label": "\u5B57\u53F7", children: _jsx("option", { children: "\u5B57\u53F7" }) }), _jsx("select", { "aria-label": "\u884C\u9AD8", children: _jsx("option", { children: "\u884C\u9AD8" }) }), ['≡', '☰', '↶', '↷', 'Link', 'Img'].map((item, index) => (_jsx("button", { type: "button", "aria-label": `编辑工具 ${index + 1}`, children: item }, `${item}-${index}`))), _jsx("button", { type: "button", className: "camp-info-rich-editor__preview", children: "\u9884\u89C8" })] }), _jsx("textarea", { "aria-label": "\u56FE\u6587\u4ECB\u7ECD", value: form.richIntro, onChange: (event) => updateForm('richIntro', event.target.value), placeholder: "\u8BF7\u8F93\u5165\u6B63\u6587" })] })] })] }) }))] })) : null, detail && form ? (_jsx("footer", { className: "camp-info-edit-footer", children: step === 'basic' ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", disabled: saving, onClick: () => navigate('/InformationMaintenance/campInfo'), children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "is-primary", disabled: saving, onClick: () => validateBasicInfo() && setStep('detail'), children: "\u4E0B\u4E00\u6B65" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", disabled: saving, onClick: () => setStep('basic'), children: "\u4E0A\u4E00\u6B65" }), _jsx("button", { type: "button", className: "is-primary", disabled: saving, onClick: () => void handleSaveAndExit(), children: saving ? '保存中...' : '保存并退出' })] })) })) : null] }));
}
function CampInfoSortPage() {
    const [activeTab, setActiveTab] = useState('store');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [statusMessage, setStatusMessage] = useState('门店排序加载中');
    const [reloadSeed, setReloadSeed] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        fetchCampInfoSortData(activeTab, controller.signal)
            .then((nextData) => {
            setData(nextData);
            setStatusMessage('排序数据已更新');
        })
            .catch((error) => {
            if (controller.signal.aborted)
                return;
            setErrorMessage(error instanceof Error ? error.message : '门店排序加载失败');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setLoading(false);
        });
        return () => controller.abort();
    }, [activeTab, reloadSeed]);
    return (_jsxs("div", { className: "camp-info-page camp-info-sort-page", children: [_jsxs("section", { className: "camp-info-toolbar", children: [_jsxs("div", { children: [_jsx("h1", { children: "\u95E8\u5E97\u6392\u5E8F" }), _jsx("p", { children: "\u6309\u4E1A\u52A1\u5C55\u793A\u987A\u5E8F\u7EF4\u62A4\u95E8\u5E97\u3001\u623F\u578B\u548C\u5546\u54C1\u6392\u5E8F\u3002" })] }), _jsx(CampInfoStatus, { message: statusMessage })] }), data ? (_jsx("pre", { "data-testid": "camp-info-sort-contract", className: "camp-info-contract", hidden: true, children: JSON.stringify({
                    endpoint: data.endpoint,
                    provider: data.provider,
                    traceId: data.traceId,
                    timestamp: data.timestamp,
                    activeTab: data.activeTab,
                }) })) : null, _jsx("div", { className: "camp-info-sort-tabs", role: "tablist", "aria-label": "\u6392\u5E8F\u7C7B\u578B", children: [
                    ['store', '门店排序'],
                    ['roomType', '房型排序'],
                    ['goods', '商品排序'],
                ].map(([key, label]) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === key, onClick: () => {
                        setLoading(true);
                        setErrorMessage('');
                        setStatusMessage('门店排序加载中');
                        setActiveTab(key);
                    }, children: label }, key))) }), loading ? _jsx(CampInfoLoadingState, { compact: true }) : null, errorMessage ? (_jsx(CampInfoErrorState, { message: errorMessage, onRetry: () => {
                    setLoading(true);
                    setErrorMessage('');
                    setStatusMessage('门店排序加载中');
                    setReloadSeed((value) => value + 1);
                }, compact: true })) : null, !loading && data ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "camp-info-sort-help", children: "\u62D6\u62FD\u5373\u53EF\u8FDB\u884C\u6392\u5E8F\uFF0C\u9009\u5B9A\u6392\u5E8F\u65B9\u5F0F\u4E4B\u540E\uFF0C\u7CFB\u7EDF\u5C06\u6309\u7167\u4E0B\u65B9\u987A\u5E8F\u5C55\u793A" }), _jsx("section", { className: "camp-info-sort-list", "aria-label": activeTab === 'store' ? '门店排序列表' : activeTab === 'roomType' ? '房型排序列表' : '商品排序列表', children: data.items.map((item) => (_jsxs("article", { className: "camp-info-sort-item", children: [_jsx("span", { className: "camp-info-drag-handle", children: "\u22EE\u22EE" }), _jsx("strong", { children: item.label })] }, item.id))) }), _jsx("button", { type: "button", className: "camp-info-save-sort is-primary", onClick: async () => {
                            const result = await saveCampInfoSort(activeTab, data.items.map((item) => item.id));
                            setStatusMessage(result.message);
                        }, children: "\u4FDD\u5B58\u6392\u5E8F" })] })) : null] }));
}
function CampInfoStatus({ message }) {
    return message ? (_jsx("div", { role: "status", "aria-label": "\u95E8\u5E97\u4FE1\u606F\u64CD\u4F5C\u53CD\u9988", className: "camp-info-status", children: message })) : null;
}
function CampInfoLoadingState({ compact = false }) {
    return (_jsxs("section", { className: compact ? 'camp-info-loading is-compact' : 'camp-info-loading', "aria-live": "polite", children: [_jsx("div", { className: "camp-info-loading__spinner" }), _jsx("strong", { children: "\u95E8\u5E97\u4FE1\u606F\u52A0\u8F7D\u4E2D" }), _jsx("p", { children: "\u6B63\u5728\u540C\u6B65\u5F53\u524D\u95E8\u5E97\u8D44\u6599\u3001\u623F\u578B\u548C\u6392\u5E8F\u4FE1\u606F\u3002" })] }));
}
function CampInfoErrorState({ message, onRetry, compact = false, }) {
    return (_jsxs("section", { className: compact ? 'camp-info-error is-compact' : 'camp-info-error', role: "alert", children: [_jsx("strong", { children: message }), _jsx("p", { children: "\u8BF7\u91CD\u65B0\u52A0\u8F7D\u5F53\u524D\u95E8\u5E97\u4FE1\u606F\uFF0C\u786E\u8BA4\u63A5\u53E3\u5951\u7EA6\u4E0E\u6570\u636E\u72B6\u6001\u540E\u518D\u7EE7\u7EED\u64CD\u4F5C\u3002" }), _jsx("button", { type: "button", className: "is-primary", onClick: onRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] }));
}
function resolveLoadMessage(intent) {
    if (intent === 'query')
        return '已按当前条件更新门店信息';
    if (intent === 'reset')
        return '筛选条件已重置';
    return '门店信息已更新';
}
