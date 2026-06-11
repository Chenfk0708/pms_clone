import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import { fetchHouseStatusLogs } from '../services/houseStatusLogs';
import './HouseStatusLogsPage.css';
const columns = [
    '房型',
    '房间',
    '房态调整日期',
    '操作内容',
    '调整方式',
    '同步渠道',
    '渠道库存变更',
    '操作人',
    '操作时间',
];
const PAGE_SIZE = 20;
const adjustmentModeOptions = [
    { label: '手动调整', value: '手动调整', apiValue: 1 },
    { label: '系统调整', value: '系统调整', apiValue: 2 },
];
const channelOptions = [
    { label: '自来客', value: '自来客', apiValue: '0' },
    { label: '路客云聚合', value: '路客云聚合', apiValue: '17' },
    { label: '美团民宿', value: '美团民宿', apiValue: '3' },
    { label: '美团酒店', value: '美团酒店', apiValue: '6' },
    { label: '携程', value: '携程', apiValue: '5' },
    { label: '途家', value: '途家', apiValue: '2' },
    { label: '途家直连', value: '途家直连', apiValue: '49' },
    { label: '爱彼迎', value: '爱彼迎', apiValue: '1' },
    { label: '飞猪淘酒店', value: '飞猪淘酒店', apiValue: '8' },
    { label: '飞猪民宿直连', value: '飞猪民宿直连', apiValue: '59' },
    { label: '飞猪酒店直连', value: '飞猪酒店直连', apiValue: '60' },
];
export function HouseStatusLogsPage() {
    const [keyword, setKeyword] = useState('');
    const [adjustmentMode, setAdjustmentMode] = useState('手动调整');
    const [channel, setChannel] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [roomStatusDateStart, setRoomStatusDateStart] = useState('');
    const [roomStatusDateEnd, setRoomStatusDateEnd] = useState('');
    const [operationDateStart, setOperationDateStart] = useState('');
    const [operationDateEnd, setOperationDateEnd] = useState('');
    const [operator, setOperator] = useState('');
    const [logs, setLogs] = useState([]);
    const [selectedStoreId, setSelectedStoreId] = useState('all');
    const [total, setTotal] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('请设置筛选条件后查询房态日志');
    const [error, setError] = useState('');
    const [lastQuery, setLastQuery] = useState(null);
    const campId = useMemo(() => resolveCampId(), []);
    const mockScenario = useMemo(() => resolveMockScenario(), []);
    const { storeOptions, storeLoading } = useStoreOptions();
    function handleSubmit(event) {
        event.preventDefault();
        void runQuery();
    }
    function handleReset() {
        setKeyword('');
        setAdjustmentMode('手动调整');
        setChannel('');
        setRoomStatusDateStart('');
        setRoomStatusDateEnd('');
        setOperationDateStart('');
        setOperationDateEnd('');
        setOperator('');
        setSelectedStoreId('all');
        setLogs([]);
        setTotal(null);
        setError('');
        setMessage('筛选条件已重置');
        setLastQuery(null);
    }
    async function runQuery(query) {
        const nextQuery = query ?? buildQuery();
        setIsLoading(true);
        setError('');
        setMessage('正在查询房态日志...');
        setLastQuery(nextQuery);
        try {
            const data = await fetchHouseStatusLogs(nextQuery);
            setLogs(data.list);
            setTotal(data.total);
            setMessage(data.total > 0 ? `已加载 ${data.total} 条房态日志` : '暂无符合条件的房态日志');
        }
        catch (requestError) {
            setLogs([]);
            setTotal(null);
            setError(`房态日志查询失败：${formatUserFacingError(requestError)}`);
            setMessage('房态日志请求失败');
        }
        finally {
            setIsLoading(false);
        }
    }
    function retryLastQuery() {
        void runQuery(lastQuery ?? buildQuery());
    }
    function buildQuery() {
        const selectedAdjustment = adjustmentModeOptions.find((option) => option.value === adjustmentMode);
        const selectedChannel = channelOptions.find((option) => option.value === channel);
        const query = {
            pageNum: 1,
            pageSize: PAGE_SIZE,
            current: 1,
        };
        if (campId)
            query.campId = campId;
        if (selectedStoreId !== 'all')
            query.poiIds = [selectedStoreId];
        if (mockScenario)
            query.mockScenario = mockScenario;
        if (keyword.trim())
            query.keyword = keyword.trim();
        if (selectedAdjustment)
            query.adjustType = selectedAdjustment.apiValue;
        if (selectedChannel)
            query.channelId = selectedChannel.apiValue;
        if (roomStatusDateStart.trim())
            query.startDate = roomStatusDateStart.trim();
        if (roomStatusDateEnd.trim())
            query.endDate = roomStatusDateEnd.trim();
        if (operationDateStart.trim())
            query.createStartTime = operationDateStart.trim();
        if (operationDateEnd.trim())
            query.createEndTime = operationDateEnd.trim();
        if (operator.trim())
            query.userName = operator.trim();
        return query;
    }
    return (_jsx("div", { className: "page-stack status-log-page", children: _jsxs("section", { className: "status-log-panel", children: [_jsxs("form", { className: "status-log-query", "aria-label": "\u623F\u6001\u65E5\u5FD7\u7B5B\u9009", onSubmit: handleSubmit, children: [_jsxs("div", { className: "status-log-field status-log-store-field", children: [_jsx("span", { children: "\u95E8\u5E97" }), _jsx(StoreSelectControl, { className: "house-status-log-store", label: "\u95E8\u5E97\u8303\u56F4", options: storeOptions.map((store) => ({ id: store.id, name: store.label })), value: selectedStoreId, disabled: storeLoading || isLoading, onChange: (storeId) => setSelectedStoreId(storeId) })] }), _jsxs("label", { className: "status-log-field", children: [_jsx("span", { children: "\u65E5\u5FD7\u5173\u952E\u8BCD" }), _jsx("input", { className: "status-log-query__keyword", "aria-label": "\u65E5\u5FD7\u5173\u952E\u8BCD", type: "text", placeholder: "\u641C\u7D22\u623F\u578B\u540D\u79F0/\u623F\u95F4\u53F7/\u6E20\u9053\u623F\u6E90\u540D\u79F0", value: keyword, onChange: (event) => setKeyword(event.target.value) })] }), _jsxs("label", { className: "status-log-field", children: [_jsx("span", { children: "\u8C03\u6574\u65B9\u5F0F" }), _jsx("select", { className: "status-log-query__select", value: adjustmentMode, "aria-label": "\u8C03\u6574\u65B9\u5F0F", onChange: (event) => setAdjustmentMode(event.target.value), children: adjustmentModeOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { className: "status-log-field", children: [_jsx("span", { children: "\u64CD\u4F5C\u6E20\u9053" }), _jsxs("select", { className: "status-log-query__select", value: channel, "aria-label": "\u64CD\u4F5C\u6E20\u9053", onChange: (event) => setChannel(event.target.value), children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), channelOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))] })] }), expanded ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "status-log-field status-log-range-field", role: "group", "aria-label": "\u623F\u6001\u65E5\u671F", children: [_jsx("span", { children: "\u623F\u6001\u65E5\u671F" }), _jsxs("div", { className: "status-log-range status-log-range--date", children: [_jsx("input", { "aria-label": "\u623F\u6001\u65E5\u671F\u5F00\u59CB", type: "date", placeholder: "\u8BF7\u9009\u62E9", value: roomStatusDateStart, onChange: (event) => setRoomStatusDateStart(event.target.value) }), _jsx("i", { "aria-hidden": "true", children: "-" }), _jsx("input", { "aria-label": "\u623F\u6001\u65E5\u671F\u7ED3\u675F", type: "date", placeholder: "\u8BF7\u9009\u62E9", value: roomStatusDateEnd, onChange: (event) => setRoomStatusDateEnd(event.target.value) })] })] }), _jsxs("div", { className: "status-log-field status-log-range-field", role: "group", "aria-label": "\u64CD\u4F5C\u65E5\u671F", children: [_jsx("span", { children: "\u64CD\u4F5C\u65E5\u671F" }), _jsxs("div", { className: "status-log-range status-log-range--date", children: [_jsx("input", { "aria-label": "\u64CD\u4F5C\u65E5\u671F\u5F00\u59CB", type: "date", placeholder: "\u8BF7\u9009\u62E9", value: operationDateStart, onChange: (event) => setOperationDateStart(event.target.value) }), _jsx("i", { "aria-hidden": "true", children: "-" }), _jsx("input", { "aria-label": "\u64CD\u4F5C\u65E5\u671F\u7ED3\u675F", type: "date", placeholder: "\u8BF7\u9009\u62E9", value: operationDateEnd, onChange: (event) => setOperationDateEnd(event.target.value) })] })] }), _jsxs("label", { className: "status-log-field", children: [_jsx("span", { children: "\u64CD\u4F5C\u4EBA" }), _jsx("input", { className: "status-log-query__operator", type: "text", placeholder: "\u641C\u7D22\u64CD\u4F5C\u4EBA\u540D\u79F0/\u624B\u673A\u53F7", value: operator, onChange: (event) => setOperator(event.target.value) })] })] })) : null, _jsxs("div", { className: "status-log-query__actions", children: [_jsx("button", { type: "button", onClick: handleReset, disabled: isLoading, children: "\u91CD \u7F6E" }), _jsx("button", { type: "submit", className: "is-primary", disabled: isLoading, children: isLoading ? '查询中' : '查 询' }), _jsx("button", { type: "button", className: "is-link", onClick: () => setExpanded((value) => !value), disabled: isLoading, children: expanded ? '收起⌃' : '展开⌄' })] })] }), _jsxs("div", { className: "status-log-feedback", role: "status", "aria-live": "polite", children: [message, total !== null ? _jsxs("span", { children: ["\uFF0C\u5F53\u524D\u663E\u793A ", logs.length, " \u6761"] }) : null] }), error ? (_jsxs("div", { className: "status-log-error", role: "alert", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: retryLastQuery, disabled: isLoading, children: "\u91CD\u8BD5" })] })) : null, _jsxs("table", { className: "status-log-table", "aria-label": "\u623F\u6001\u65E5\u5FD7\u5217\u8868", "aria-busy": isLoading, children: [_jsx("thead", { children: _jsx("tr", { className: "status-log-table__head", children: columns.map((column) => (_jsx("th", { children: column }, column))) }) }), _jsx("tbody", { children: logs.length > 0 ? (logs.map((log, index) => (_jsxs("tr", { className: "status-log-table__row", children: [_jsx("td", { children: log.roomCategoryName || '-' }), _jsx("td", { children: log.roomName || '-' }), _jsx("td", { children: formatDateRange(log) }), _jsx("td", { children: log.operationContent || '-' }), _jsx("td", { children: log.adjustContent || '-' }), _jsx("td", { children: formatChannels(log) }), _jsx("td", { children: formatStockChanges(log) }), _jsx("td", { children: log.userName || '-' }), _jsx("td", { children: log.createTime || '-' })] }, log.roomStatusOperationLogId ?? `${log.createTime}-${index}`)))) : (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, children: _jsxs("div", { className: "status-log-empty", children: [_jsx("div", { className: "status-log-empty__icon", "aria-hidden": "true" }), _jsx("span", { children: isLoading ? '正在加载' : '暂无数据' })] }) }) })) })] })] }) }));
}
function resolveCampId() {
    const params = new URLSearchParams(window.location.search);
    const campIdFromQuery = params.get('campId');
    if (campIdFromQuery)
        return campIdFromQuery;
    for (const key of ['currentCamp', 'camp', 'pms.currentCamp']) {
        const rawValue = window.localStorage.getItem(key);
        if (!rawValue)
            continue;
        try {
            const parsed = JSON.parse(rawValue);
            const campId = parsed.campId ?? parsed.id;
            if (typeof campId === 'string' && campId)
                return campId;
            if (typeof campId === 'number')
                return String(campId);
        }
        catch {
            if (/^\d+$/.test(rawValue))
                return rawValue;
        }
    }
    return '';
}
function resolveMockScenario() {
    const params = new URLSearchParams(window.location.search);
    const scenario = params.get('mockScenario');
    return scenario === 'empty' || scenario === 'error' ? scenario : undefined;
}
function formatUserFacingError(error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('缺少门店上下文'))
        return '缺少门店上下文，无法查询房态日志';
    if (message.includes('房态日志服务暂不可用'))
        return '房态日志服务暂不可用，请稍后重试';
    if (message.includes('真实接口请求失败') || message.includes('Failed to fetch'))
        return '房态日志查询暂时失败，请稍后重试';
    return message;
}
function formatDateRange(log) {
    if (!log.startDate && !log.endDate)
        return '-';
    if (log.startDate === log.endDate || !log.endDate)
        return log.startDate ?? '-';
    if (!log.startDate)
        return log.endDate;
    return `${log.startDate} ~ ${log.endDate}`;
}
function formatChannels(log) {
    const channelLogs = log.channelRoomStatusOperationLogViews?.filter((item) => item.channelName !== '自来客') ?? [];
    if (!channelLogs.length)
        return '-';
    return channelLogs
        .map((item) => {
        const status = item.isSuccess === 0 ? '同步失败' : item.channelRoomCategoryProductName || '-';
        return `${item.channelName || '-'}：${status}`;
    })
        .join('；');
}
function formatStockChanges(log) {
    const channelLogs = log.channelRoomStatusOperationLogViews?.filter((item) => item.channelName !== '自来客') ?? [];
    if (!channelLogs.length)
        return '-';
    return channelLogs.map((item) => `${item.channelName || '-'}：${item.stockContent || '-'}`).join('；');
}
