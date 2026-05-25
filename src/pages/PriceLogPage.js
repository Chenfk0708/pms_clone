import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { createPriceLogExportRequest, fetchPriceLogs, getDefaultPriceLogAdjustmentOptions, getDefaultPriceLogChannelOptions, resolvePriceLogQueryFromLocation, } from '../services/priceLogs';
import './PriceLogPage.css';
const columns = ['房型', '价格日期', '操作内容', '调整方式', '同步渠道', '渠道价格', '操作人', '操作时间', '操作'];
const PAGE_SIZE = 20;
export function PriceLogPage() {
    const [keyword, setKeyword] = useState('');
    const [submittedKeyword, setSubmittedKeyword] = useState('');
    const [adjustmentMode, setAdjustmentMode] = useState('手动调整');
    const [channel, setChannel] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [openSelect, setOpenSelect] = useState(null);
    const [adjustmentStart, setAdjustmentStart] = useState('');
    const [adjustmentEnd, setAdjustmentEnd] = useState('');
    const [operationStart, setOperationStart] = useState('');
    const [operationEnd, setOperationEnd] = useState('');
    const [operator, setOperator] = useState('');
    const [submittedOperator, setSubmittedOperator] = useState('');
    const [refreshTick, setRefreshTick] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('调价日志已加载');
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    const [selectedLog, setSelectedLog] = useState(null);
    const campId = useMemo(() => resolveCampId(), []);
    const locationQuery = useMemo(() => resolvePriceLogQueryFromLocation(window.location), []);
    const channelOptions = data?.channelOptions ?? getDefaultPriceLogChannelOptions();
    const adjustmentOptions = data?.adjustmentOptions ?? getDefaultPriceLogAdjustmentOptions();
    const currentQuery = useMemo(() => ({
        provider: locationQuery.provider,
        mockState: locationQuery.mockState,
        campId: campId || '1796067693589061634',
        keyword: submittedKeyword,
        adjustmentMode,
        channelId: channel,
        adjustmentStart,
        adjustmentEnd,
        operationStart,
        operationEnd,
        operator: submittedOperator,
        page: 1,
        pageSize: PAGE_SIZE,
    }), [
        adjustmentEnd,
        adjustmentMode,
        adjustmentStart,
        campId,
        channel,
        locationQuery.mockState,
        locationQuery.provider,
        operationEnd,
        operationStart,
        submittedKeyword,
        submittedOperator,
    ]);
    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => {
            if (controller.signal.aborted)
                return;
            setIsLoading(true);
            setError('');
        });
        fetchPriceLogs(currentQuery, controller.signal)
            .then((result) => {
            setData(result.view);
        })
            .catch((requestError) => {
            if (requestError instanceof DOMException && requestError.name === 'AbortError')
                return;
            setData(null);
            setError(requestError instanceof Error ? requestError.message : '调价日志数据加载失败，请稍后重试');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setIsLoading(false);
        });
        return () => controller.abort();
    }, [currentQuery, refreshTick]);
    function handleSubmit(event) {
        event.preventDefault();
        setOpenSelect(null);
        setSubmittedKeyword(keyword.trim());
        setSubmittedOperator(operator.trim());
        setMessage('查询完成');
    }
    function handleReset() {
        setKeyword('');
        setSubmittedKeyword('');
        setAdjustmentMode('手动调整');
        setChannel('');
        setAdjustmentStart('');
        setAdjustmentEnd('');
        setOperationStart('');
        setOperationEnd('');
        setOperator('');
        setSubmittedOperator('');
        setOpenSelect(null);
        setSelectedLog(null);
        setError('');
        setRefreshTick((tick) => tick + 1);
        setMessage('筛选条件已重置');
    }
    function handleRefresh() {
        setOpenSelect(null);
        setRefreshTick((tick) => tick + 1);
        setMessage('已刷新');
    }
    function handleExport() {
        const exportRequest = createPriceLogExportRequest(currentQuery);
        window.localStorage.setItem('pms.priceLog.lastExportRequest', JSON.stringify(exportRequest));
        setMessage('导出任务已创建');
    }
    return (_jsxs("div", { className: "price-log-page", children: [_jsxs("section", { className: "price-log-panel", children: [_jsxs("form", { className: `price-log-query${expanded ? ' is-expanded' : ''}`, "aria-label": "\u8C03\u4EF7\u65E5\u5FD7\u7B5B\u9009", onSubmit: handleSubmit, children: [_jsxs("label", { className: "price-log-field price-log-field--keyword", children: [_jsx("span", { children: "\u65E5\u5FD7\u5173\u952E\u8BCD" }), _jsx("input", { type: "text", "aria-label": "\u65E5\u5FD7\u5173\u952E\u8BCD", placeholder: "\u641C\u7D22\u623F\u578B\u540D\u79F0/\u623F\u95F4\u53F7/\u6E20\u9053\u623F\u6E90\u540D\u79F0", value: keyword, onChange: (event) => setKeyword(event.target.value), disabled: isLoading })] }), _jsxs("div", { className: "price-log-field price-log-field--adjustment", children: [_jsx("span", { children: "\u8C03\u6574\u65B9\u5F0F" }), _jsx(PriceLogSelect, { ariaLabel: `调整方式 ${adjustmentMode}`, listLabel: "\u8C03\u6574\u65B9\u5F0F", valueLabel: adjustmentMode, options: adjustmentOptions, open: openSelect === 'adjustment', disabled: isLoading, onToggle: () => setOpenSelect(openSelect === 'adjustment' ? null : 'adjustment'), onSelect: (option) => {
                                            setAdjustmentMode(option.label);
                                            setOpenSelect(null);
                                        } })] }), _jsxs("div", { className: "price-log-field price-log-field--channel", children: [_jsx("span", { children: "\u6E20\u9053" }), _jsx(PriceLogSelect, { ariaLabel: `渠道 ${channelOptions.find((option) => option.value === channel)?.label ?? '请选择'}`, listLabel: "\u6E20\u9053", valueLabel: channelOptions.find((option) => option.value === channel)?.label ?? '请选择', options: channelOptions, open: openSelect === 'channel', disabled: isLoading, optionClassName: "price-log-options--channel", onToggle: () => setOpenSelect(openSelect === 'channel' ? null : 'channel'), onSelect: (option) => {
                                            setChannel(option.value);
                                            setOpenSelect(null);
                                        } })] }), expanded ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "price-log-field price-log-field--date price-log-field--adjust-time", children: [_jsx("span", { children: "\u8C03\u6574\u65F6\u95F4" }), _jsxs("div", { className: "price-log-date-range", role: "group", "aria-label": "\u8C03\u6574\u65F6\u95F4", children: [_jsx("input", { "aria-label": "\u8C03\u6574\u65F6\u95F4\u5F00\u59CB", type: "text", placeholder: "\u8BF7\u9009\u62E9", value: adjustmentStart, onChange: (event) => setAdjustmentStart(event.target.value), disabled: isLoading }), _jsx("span", { "aria-hidden": "true", children: "\u2192" }), _jsx("input", { "aria-label": "\u8C03\u6574\u65F6\u95F4\u7ED3\u675F", type: "text", placeholder: "\u8BF7\u9009\u62E9", value: adjustmentEnd, onChange: (event) => setAdjustmentEnd(event.target.value), disabled: isLoading })] })] }), _jsxs("label", { className: "price-log-field price-log-field--date price-log-field--operation-date", children: [_jsx("span", { children: "\u64CD\u4F5C\u65E5\u671F" }), _jsxs("div", { className: "price-log-date-range", role: "group", "aria-label": "\u64CD\u4F5C\u65E5\u671F", children: [_jsx("input", { "aria-label": "\u64CD\u4F5C\u65E5\u671F\u5F00\u59CB", type: "text", placeholder: "\u8BF7\u9009\u62E9", value: operationStart, onChange: (event) => setOperationStart(event.target.value), disabled: isLoading }), _jsx("span", { "aria-hidden": "true", children: "\u2192" }), _jsx("input", { "aria-label": "\u64CD\u4F5C\u65E5\u671F\u7ED3\u675F", type: "text", placeholder: "\u8BF7\u9009\u62E9", value: operationEnd, onChange: (event) => setOperationEnd(event.target.value), disabled: isLoading })] })] }), _jsxs("label", { className: "price-log-field price-log-field--operator", children: [_jsx("span", { children: "\u64CD\u4F5C\u4EBA\u59D3\u540D" }), _jsx("input", { "aria-label": "\u64CD\u4F5C\u4EBA\u59D3\u540D", type: "text", placeholder: "\u641C\u7D22\u64CD\u4F5C\u4EBA\u540D\u79F0/\u624B\u673A\u53F7", value: operator, onChange: (event) => setOperator(event.target.value), disabled: isLoading })] })] })) : null, _jsxs("div", { className: "price-log-query__actions", children: [_jsx("button", { type: "button", onClick: handleExport, disabled: isLoading, children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", onClick: handleRefresh, disabled: isLoading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: handleReset, disabled: isLoading, children: "\u91CD \u7F6E" }), _jsx("button", { type: "submit", className: "is-primary", disabled: isLoading, children: isLoading ? '查询中' : '查 询' }), _jsx("button", { type: "button", className: "is-link", disabled: isLoading, onClick: () => {
                                            setExpanded((value) => !value);
                                            setOpenSelect(null);
                                        }, children: expanded ? '收起' : '展开' })] })] }), _jsxs("div", { className: "price-log-table", role: "table", "aria-label": "\u8C03\u4EF7\u65E5\u5FD7\u5217\u8868", "aria-busy": isLoading, children: [_jsx("div", { className: "price-log-table__head", role: "row", children: columns.map((column) => (_jsx("div", { role: "columnheader", children: column }, column))) }), data?.rows.map((row) => (_jsxs("div", { className: "price-log-table__row", role: "row", children: [_jsx("div", { role: "cell", children: row.roomType }), _jsx("div", { role: "cell", children: row.priceDate }), _jsx("div", { role: "cell", children: row.actionContent }), _jsx("div", { role: "cell", children: row.adjustmentMode }), _jsx("div", { role: "cell", children: row.channel }), _jsx("div", { role: "cell", children: row.channelPrice }), _jsx("div", { role: "cell", children: row.operator }), _jsx("div", { role: "cell", children: row.operationTime }), _jsx("div", { role: "cell", children: _jsx("button", { type: "button", onClick: () => setSelectedLog(row), "aria-label": `查看详情 ${row.id}`, children: "\u67E5\u770B\u8BE6\u60C5" }) })] }, row.id))), isLoading ? (_jsxs("div", { className: "price-log-empty", children: [_jsx("div", { className: "price-log-empty__icon", "aria-hidden": "true" }), _jsx("span", { children: "\u6B63\u5728\u52A0\u8F7D" })] })) : null, !isLoading && !error && (!data || data.rows.length === 0) ? (_jsxs("div", { className: "price-log-empty", children: [_jsx("div", { className: "price-log-empty__icon", "aria-hidden": "true" }), _jsx("span", { children: "\u6682\u65E0\u6570\u636E" })] })) : null] }), _jsxs("div", { className: "price-log-feedback", role: "status", "aria-label": "\u8C03\u4EF7\u65E5\u5FD7\u64CD\u4F5C\u53CD\u9988", "aria-live": "polite", children: [message, data ? _jsxs("span", { children: ["\uFF1B\u5171 ", data.pagination.total, " \u6761"] }) : null] }), error ? (_jsxs("div", { className: "price-log-error", role: "alert", "aria-label": "\u8C03\u4EF7\u65E5\u5FD7\u6570\u636E\u9519\u8BEF", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: handleRefresh, disabled: isLoading, children: "\u91CD\u8BD5" })] })) : null] }), selectedLog ? (_jsx("div", { className: "price-log-dialog-backdrop", role: "presentation", children: _jsxs("section", { className: "price-log-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u8C03\u4EF7\u65E5\u5FD7\u8BE6\u60C5", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u8C03\u4EF7\u65E5\u5FD7\u8BE6\u60C5" }), _jsx("button", { type: "button", onClick: () => setSelectedLog(null), "aria-label": "\u5173\u95ED\u8BE6\u60C5", children: "\u00D7" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u65E5\u5FD7\u7F16\u53F7" }), _jsx("dd", { children: selectedLog.id })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u623F\u578B" }), _jsx("dd", { children: selectedLog.roomType })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u64CD\u4F5C\u5185\u5BB9" }), _jsx("dd", { children: selectedLog.actionContent })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u540C\u6B65\u6E20\u9053" }), _jsx("dd", { children: selectedLog.channel })] })] })] }) })) : null] }));
}
function PriceLogSelect({ ariaLabel, listLabel, valueLabel, options, open, disabled, optionClassName, onToggle, onSelect, }) {
    return (_jsxs("div", { className: "price-log-select", children: [_jsx("button", { type: "button", "aria-haspopup": "listbox", "aria-label": ariaLabel, "aria-expanded": open, onClick: onToggle, disabled: disabled, children: valueLabel }), open ? (_jsx("div", { className: `price-log-options ${optionClassName ?? ''}`, role: "listbox", "aria-label": listLabel, children: options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": option.label === valueLabel, onClick: () => onSelect(option), children: option.label }, `${option.value}-${option.label}`))) })) : null] }));
}
function resolveCampId() {
    const params = new URLSearchParams(window.location.search);
    const queryCampId = params.get('campId');
    if (queryCampId)
        return queryCampId;
    for (const key of ['currentCamp', 'camp', 'pms.currentCamp', 'pms.currentCampId']) {
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
