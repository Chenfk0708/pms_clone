import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createDefaultSmartIdCardReaderFilters, fetchSmartIdCardReaderDashboard, getSmartIdCardReaderRequestSummary, } from '../services/smartIdCardReader';
import './SmartIdCardReaderPage.css';
const datePresetLabels = {
    today: '今日',
    '7d': '近7天',
    '30d': '近30天',
};
const deviceStatusLabels = {
    all: '全部',
    connected: '已连接',
    pending: '待调试',
    warning: '需复核',
};
const emptyPreview = {
    guestName: '',
    maskedIdNumber: '',
    roomType: '读取后将自动匹配订单房型',
    roomNo: '读取后自动展示房间号',
};
const readSuccessPreview = {
    guestName: '张小雅',
    maskedIdNumber: '4401********0621',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    roomNo: '1808',
};
export function SmartIdCardReaderPage() {
    const location = useLocation();
    return _jsx(SmartIdCardReaderPageContent, {}, location.search || '__default__');
}
function SmartIdCardReaderPageContent() {
    const location = useLocation();
    const navigate = useNavigate();
    const defaults = useMemo(() => createDefaultSmartIdCardReaderFilters(new URLSearchParams(location.search)), [location.search]);
    const [dashboard, setDashboard] = useState(null);
    const [filters, setFilters] = useState(defaults);
    const [keyword, setKeyword] = useState(defaults.keyword);
    const [deviceStatus, setDeviceStatus] = useState(defaults.deviceStatus);
    const [datePreset, setDatePreset] = useState(defaults.datePreset);
    const [records, setRecords] = useState([]);
    const [preview, setPreview] = useState(emptyPreview);
    const [currentBrand, setCurrentBrand] = useState('华视');
    const [feedback, setFeedback] = useState('身份证读卡器数据加载中');
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [isBrandListOpen, setIsBrandListOpen] = useState(false);
    const [isStatusListOpen, setIsStatusListOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [reloadSeq, setReloadSeq] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        void fetchSmartIdCardReaderDashboard(filters, controller.signal)
            .then((result) => {
            setDashboard(result);
            setRecords(result.records);
            setPreview(result.guestPreview);
            setCurrentBrand(result.currentBrand);
            setFeedback(result.emptyState?.title ?? '身份证读卡器数据已加载');
            setSelectedRecord(null);
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            const message = error instanceof Error ? error.message : '身份证读卡器数据加载失败，请稍后重试';
            setDashboard(null);
            setRecords([]);
            setPreview(emptyPreview);
            setCurrentBrand('华视');
            setErrorMessage(message);
            setFeedback(message);
        })
            .finally(() => {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        });
        return () => controller.abort();
    }, [filters, reloadSeq]);
    const requestSummary = getSmartIdCardReaderRequestSummary(filters, dashboard?.traceId ?? '');
    const recordCount = records.length;
    function syncSearchParams(nextFilters) {
        const params = new URLSearchParams();
        params.set('campId', nextFilters.campId);
        if (nextFilters.datePreset !== 'today') {
            params.set('datePreset', nextFilters.datePreset);
        }
        if (nextFilters.deviceStatus !== 'all') {
            params.set('deviceStatus', nextFilters.deviceStatus);
        }
        if (nextFilters.keyword) {
            params.set('keyword', nextFilters.keyword);
        }
        if (nextFilters.mockState !== 'success') {
            params.set('mockState', nextFilters.mockState);
        }
        const search = params.toString();
        navigate({
            pathname: '/smartHotel/smartHardware/IDCardReader',
            search: search ? `?${search}` : '',
        }, { replace: true });
    }
    function commitFilters(next, message) {
        setIsLoading(true);
        setErrorMessage('');
        setKeyword(next.keyword);
        setDeviceStatus(next.deviceStatus);
        setDatePreset(next.datePreset);
        setFilters(next);
        setFeedback(message);
        setIsStatusListOpen(false);
        setIsBrandListOpen(false);
        syncSearchParams(next);
    }
    function applyFilters() {
        commitFilters({
            ...filters,
            datePreset,
            deviceStatus,
            keyword: keyword.trim(),
        }, '身份证读卡记录筛选条件已更新');
    }
    function resetFilters() {
        commitFilters({
            ...filters,
            datePreset: defaults.datePreset,
            deviceStatus: 'all',
            keyword: '',
        }, '身份证读卡筛选条件已重置');
    }
    function refreshDashboard() {
        setIsLoading(true);
        setErrorMessage('');
        setFeedback('身份证读卡器数据刷新中');
        setReloadSeq((current) => current + 1);
        setIsStatusListOpen(false);
        setIsBrandListOpen(false);
    }
    function exportRecords() {
        setFeedback(`读卡记录导出任务已创建，共 ${recordCount} 条记录待导出`);
    }
    function readIdCard() {
        setPreview(readSuccessPreview);
        setFeedback('已读取身份证信息，并匹配到待入住订单');
    }
    function clearPreview() {
        setPreview(emptyPreview);
        setFeedback('已清空本次读卡预览');
    }
    function finishSetup() {
        if (!preview.guestName || !preview.maskedIdNumber) {
            setFeedback('请先读取身份证信息，再完成对接');
            return;
        }
        setFeedback(`身份证读卡器已完成对接，住客 ${preview.guestName} 的登记信息已写入 PMS`);
    }
    function retryLoad() {
        setIsLoading(true);
        setErrorMessage('');
        navigate('/smartHotel/smartHardware/IDCardReader', { replace: true });
    }
    return (_jsxs("div", { className: "smart-id-reader-page", "data-provider": dashboard?.provider ?? '', "data-record-count": recordCount, children: [_jsx("div", { "data-testid": "smart-id-reader-service-contract", "data-provider": dashboard?.provider ?? '', "data-mock-state": filters.mockState, "data-device-status": filters.deviceStatus, "data-record-count": String(recordCount), hidden: true, children: requestSummary.join(';') }), _jsxs("section", { className: "smart-id-reader-hero", children: [_jsxs("div", { className: "smart-id-reader-hero__content", children: [_jsx("span", { className: "smart-id-reader-version", children: dashboard?.versionLabel ?? '版本号：v4.10.7' }), _jsx("h1", { children: "\u8EAB\u4EFD\u8BC1\u8BFB\u5361\u5668" }), _jsx("p", { children: "\u63A5\u5165\u8EAB\u4EFD\u8BC1\u8BFB\u5361\u5668\u540E\uFF0C\u53EF\u76F4\u63A5\u8BFB\u53D6\u4F4F\u5BA2\u4FE1\u606F\uFF0C\u81EA\u52A8\u5339\u914D\u8BA2\u5355\u5E76\u8054\u52A8\u5165\u4F4F\u4E0E\u516C\u5B89\u4E0A\u62A5\u6D41\u7A0B\u3002" })] }), _jsxs("div", { className: "smart-id-reader-status-card", children: [_jsx("strong", { children: "\u63A5\u5165\u72B6\u6001" }), _jsx("span", { children: dashboard?.setupStatus ?? '异常待处理' }), _jsx("em", { children: dashboard?.requestedAtLabel ?? '最近同步：--' })] })] }), _jsxs("section", { className: "smart-id-reader-toolbar", "aria-label": "\u8EAB\u4EFD\u8BC1\u8BFB\u5361\u5668\u7B5B\u9009", children: [_jsx("div", { className: "smart-id-reader-date-presets", role: "group", "aria-label": "\u6570\u636E\u8303\u56F4", children: Object.keys(datePresetLabels).map((preset) => (_jsx("button", { type: "button", className: preset === datePreset ? 'is-active' : '', onClick: () => {
                                setDatePreset(preset);
                                setFeedback(`已切换数据范围：${datePresetLabels[preset]}`);
                            }, children: datePresetLabels[preset] }, preset))) }), _jsxs("div", { className: "smart-id-reader-toolbar__actions", children: [_jsxs("div", { className: "smart-id-reader-select-group", children: [_jsx("button", { type: "button", className: "smart-id-reader-filter-button", "aria-haspopup": "listbox", "aria-expanded": isStatusListOpen, onClick: () => setIsStatusListOpen((current) => !current), children: `设备状态：${deviceStatusLabels[deviceStatus]}` }), isStatusListOpen ? (_jsx("div", { className: "smart-id-reader-option-list", role: "listbox", "aria-label": "\u8BBE\u5907\u72B6\u6001\u9009\u9879", children: Object.keys(deviceStatusLabels).map((status) => (_jsx("button", { type: "button", role: "option", "aria-selected": status === deviceStatus, onClick: () => {
                                                setDeviceStatus(status);
                                                setIsStatusListOpen(false);
                                                setFeedback(`已选择设备状态：${deviceStatusLabels[status]}`);
                                            }, children: deviceStatusLabels[status] }, status))) })) : null] }), _jsx("input", { value: keyword, "aria-label": "\u641C\u7D22\u5173\u952E\u8BCD", placeholder: "\u641C\u7D22\u4F4F\u5BA2\u59D3\u540D\u3001\u8EAB\u4EFD\u8BC1\u53F7\u3001\u8BA2\u5355\u53F7", onChange: (event) => setKeyword(event.target.value) }), _jsx("button", { type: "button", onClick: applyFilters, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", className: "is-secondary", onClick: resetFilters, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-secondary", onClick: refreshDashboard, children: "\u5237\u65B0" }), _jsx("button", { type: "button", className: "is-secondary", onClick: exportRecords, disabled: isLoading, children: "\u5BFC\u51FA\u8BB0\u5F55" })] })] }), _jsx("section", { className: "smart-id-reader-metrics", children: (dashboard?.metrics ?? []).map((metric) => (_jsxs("button", { type: "button", className: `smart-id-reader-metric smart-id-reader-metric--${metric.tone}`, onClick: () => setFeedback(`${metric.label}：${metric.value}，${metric.detail}`), children: [_jsx("span", { children: metric.label }), _jsx("strong", { children: metric.value }), _jsx("small", { children: metric.detail })] }, metric.id))) }), _jsxs("div", { className: "smart-id-reader-content", children: [_jsxs("section", { className: "smart-id-reader-card", "aria-label": "\u8EAB\u4EFD\u8BC1\u8BFB\u5361\u5668\u63A5\u5165\u6D41\u7A0B", children: [_jsxs("div", { className: "smart-id-reader-card__head", children: [_jsx("h2", { children: "\u63A5\u5165\u6D41\u7A0B" }), _jsx("p", { children: "\u5EF6\u7EED\u771F\u5B9E\u7AD9\u4E09\u6B65\u63A5\u5165\u6D41\u7A0B\uFF0C\u5E76\u8865\u9F50\u8BBE\u5907\u72B6\u6001\u3001\u8BFB\u5361\u9884\u89C8\u4E0E\u8BB0\u5F55\u8054\u52A8\u95ED\u73AF\u3002" })] }), _jsxs("div", { className: "smart-id-reader-flow", children: [_jsxs("article", { className: "smart-id-reader-step", children: [_jsx("span", { className: "smart-id-reader-step__dot", "aria-hidden": "true" }), _jsxs("div", { className: "smart-id-reader-step__body", children: [_jsx("h3", { children: "\u8BF7\u9009\u62E9\u8BFB\u5361\u5668\u54C1\u724C" }), _jsxs("div", { className: "smart-id-reader-select-group", children: [_jsx("button", { type: "button", className: "smart-id-reader-brand-button", "aria-haspopup": "listbox", "aria-expanded": isBrandListOpen, onClick: () => setIsBrandListOpen((current) => !current), children: currentBrand }), isBrandListOpen ? (_jsx("div", { className: "smart-id-reader-option-list", role: "listbox", "aria-label": "\u8BFB\u5361\u5668\u54C1\u724C\u9009\u9879", children: (dashboard?.brandOptions ?? ['华视']).map((brand) => (_jsx("button", { type: "button", role: "option", "aria-selected": brand === currentBrand, onClick: () => {
                                                                        setCurrentBrand(brand);
                                                                        setIsBrandListOpen(false);
                                                                        setFeedback(`读卡器品牌已切换为 ${brand}`);
                                                                    }, children: brand }, brand))) })) : null] })] })] }), _jsxs("article", { className: "smart-id-reader-step", children: [_jsx("span", { className: "smart-id-reader-step__dot", "aria-hidden": "true" }), _jsxs("div", { className: "smart-id-reader-step__body", children: [_jsx("h3", { children: "\u8BF7\u4E0B\u8F7D\u63D2\u4EF6\uFF08\u5982\u5DF2\u4E0B\u8F7D\uFF0C\u53EF\u8DF3\u8FC7\uFF09" }), _jsxs("div", { className: "smart-id-reader-inline-action", children: [_jsx("span", { children: dashboard?.assistantPackageName ?? 'PMS 助手' }), _jsx("button", { type: "button", onClick: () => setFeedback('PMS 助手安装包下载任务已创建'), children: "PMS\u52A9\u624B\u4E0B\u8F7D" })] })] })] }), _jsxs("article", { className: "smart-id-reader-step smart-id-reader-step--preview", children: [_jsx("span", { className: "smart-id-reader-step__dot", "aria-hidden": "true" }), _jsxs("div", { className: "smart-id-reader-step__body", children: [_jsx("h3", { children: "\u8BF7\u8C03\u8BD5\u8BFB\u5361" }), _jsxs("div", { className: "smart-id-reader-preview", children: [_jsxs("label", { children: [_jsx("span", { children: "\u4F4F\u5BA2\u59D3\u540D" }), _jsx("input", { "aria-label": "\u4F4F\u5BA2\u59D3\u540D", value: preview.guestName, readOnly: true, placeholder: "\u4F4F\u5BA2\u59D3\u540D" })] }), _jsxs("label", { children: [_jsx("span", { children: "\u8EAB\u4EFD\u8BC1\u53F7\u7801" }), _jsx("input", { "aria-label": "\u8EAB\u4EFD\u8BC1\u53F7\u7801", value: preview.maskedIdNumber, readOnly: true, placeholder: "\u8EAB\u4EFD\u8BC1\u53F7\u7801" })] }), _jsxs("div", { className: "smart-id-reader-preview__actions", children: [_jsx("button", { type: "button", onClick: readIdCard, children: "\u8BFB\u8EAB\u4EFD\u8BC1" }), _jsx("button", { type: "button", className: "is-secondary", onClick: clearPreview, children: "\u6E05\u7A7A\u9884\u89C8" })] })] }), _jsxs("div", { className: "smart-id-reader-preview-meta", children: [_jsxs("p", { children: [_jsx("strong", { children: "\u5339\u914D\u623F\u578B" }), _jsx("span", { children: preview.roomType })] }), _jsxs("p", { children: [_jsx("strong", { children: "\u623F\u95F4\u53F7" }), _jsx("span", { children: preview.roomNo })] })] })] })] })] }), _jsx("div", { className: "smart-id-reader-card__footer", children: _jsx("button", { type: "button", onClick: finishSetup, children: "\u5B8C\u6210\u5BF9\u63A5" }) })] }), _jsxs("section", { className: "smart-id-reader-card smart-id-reader-card--records", children: [_jsxs("div", { className: "smart-id-reader-card__head", children: [_jsx("h2", { children: "\u6700\u8FD1\u8BFB\u5361\u8BB0\u5F55" }), _jsx("p", { children: "\u8BFB\u5361\u7ED3\u679C\u4E0E\u5165\u4F4F\u5355\u8054\u52A8\u72B6\u6001\u5168\u90E8\u7531\u7EDF\u4E00\u670D\u52A1\u5C42\u8FD4\u56DE\uFF0C\u5E76\u652F\u6301\u7B5B\u9009\u3001\u7A7A\u6001\u4E0E\u9519\u8BEF\u91CD\u8BD5\u3002" })] }), isLoading ? _jsx("div", { className: "smart-id-reader-loading", children: "\u8EAB\u4EFD\u8BC1\u8BFB\u5361\u5668\u6570\u636E\u52A0\u8F7D\u4E2D" }) : null, errorMessage ? (_jsxs("div", { className: "smart-id-reader-alert", role: "alert", "aria-label": "\u8EAB\u4EFD\u8BC1\u8BFB\u5361\u5668\u52A0\u8F7D\u5931\u8D25", children: [_jsx("strong", { children: "\u8EAB\u4EFD\u8BC1\u8BFB\u5361\u5668\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: errorMessage }), _jsx("button", { type: "button", onClick: retryLoad, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, !isLoading && !errorMessage && !records.length ? (_jsxs("div", { className: "smart-id-reader-empty", role: "status", "aria-label": "\u8EAB\u4EFD\u8BC1\u8BFB\u5361\u8BB0\u5F55\u7A7A\u72B6\u6001", children: [_jsx("strong", { children: dashboard?.emptyState?.title ?? '当前筛选条件下暂无读卡记录' }), _jsx("p", { children: dashboard?.emptyState?.description ?? '请调整筛选条件后重试，或先在前台完成一次设备调试。' })] })) : null, !isLoading && !errorMessage && records.length ? (_jsx("div", { className: "smart-id-reader-table-shell", children: _jsxs("table", { className: "smart-id-reader-table", "aria-label": "\u8EAB\u4EFD\u8BC1\u8BFB\u5361\u8BB0\u5F55\u8868\u683C", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u8BFB\u5361\u65F6\u95F4" }), _jsx("th", { children: "\u4F4F\u5BA2" }), _jsx("th", { children: "\u8EAB\u4EFD\u8BC1\u53F7\u7801" }), _jsx("th", { children: "\u623F\u578B / \u623F\u53F7" }), _jsx("th", { children: "\u8BA2\u5355\u53F7" }), _jsx("th", { children: "\u8BBE\u5907" }), _jsx("th", { children: "\u7ED3\u679C" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: records.map((record) => (_jsxs("tr", { children: [_jsx("td", { children: record.scannedAt }), _jsx("td", { children: record.guestName }), _jsx("td", { children: record.maskedIdNumber }), _jsx("td", { children: `${record.roomType} / ${record.roomNo}` }), _jsx("td", { children: record.orderNo }), _jsx("td", { children: record.deviceName }), _jsx("td", { children: _jsx("span", { className: `smart-id-reader-result smart-id-reader-result--${record.resultTone}`, children: record.result }) }), _jsx("td", { children: _jsx("button", { type: "button", className: "smart-id-reader-link-button", "aria-label": `查看详情 ${record.guestName}`, onClick: () => setSelectedRecord(record), children: "\u67E5\u770B\u8BE6\u60C5" }) })] }, record.id))) })] }) })) : null] })] }), _jsxs("section", { className: "smart-id-reader-card smart-id-reader-card--quick-links", children: [_jsxs("div", { className: "smart-id-reader-card__head", children: [_jsx("h2", { children: "\u5FEB\u6377\u5165\u53E3" }), _jsx("p", { children: "\u8BFB\u5361\u5B8C\u6210\u540E\u53EF\u76F4\u63A5\u8054\u52A8\u95E8\u9501\u3001\u516C\u5B89\u5BF9\u63A5\u3001\u786C\u4EF6\u5546\u57CE\u4E0E\u5168\u5C40\u8BBE\u7F6E\u9875\u9762\u3002" })] }), _jsx("div", { className: "smart-id-reader-quick-links", children: (dashboard?.quickLinks ?? []).map((link) => (_jsxs("button", { type: "button", className: "smart-id-reader-quick-link", onClick: () => navigate(link.path), children: [_jsx("strong", { children: link.label }), _jsx("span", { children: link.description })] }, link.id))) })] }), _jsx("div", { className: "smart-id-reader-feedback", children: _jsx("div", { role: "status", "aria-label": "\u8EAB\u4EFD\u8BC1\u8BFB\u5361\u5668\u64CD\u4F5C\u53CD\u9988", children: feedback }) }), selectedRecord ? (_jsx(RecordDetailDrawer, { record: selectedRecord, onClose: () => setSelectedRecord(null) })) : null] }));
}
function RecordDetailDrawer({ record, onClose, }) {
    return (_jsx("div", { className: "smart-id-reader-drawer-backdrop", onMouseDown: onClose, children: _jsxs("aside", { className: "smart-id-reader-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u8BFB\u5361\u8BB0\u5F55\u8BE6\u60C5", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("strong", { children: "\u8BFB\u5361\u8BB0\u5F55\u8BE6\u60C5" }), _jsx("span", { children: record.guestName })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BFB\u5361\u8BB0\u5F55\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u8BA2\u5355\u53F7" }), _jsx("dd", { children: record.orderNo })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8BFB\u5361\u65F6\u95F4" }), _jsx("dd", { children: record.scannedAt })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8EAB\u4EFD\u8BC1\u53F7\u7801" }), _jsx("dd", { children: record.maskedIdNumber })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u623F\u578B / \u623F\u53F7" }), _jsx("dd", { children: `${record.roomType} / ${record.roomNo}` })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8BBE\u5907" }), _jsx("dd", { children: record.deviceName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5904\u7406\u5907\u6CE8" }), _jsx("dd", { children: record.note })] })] })] }) }));
}
