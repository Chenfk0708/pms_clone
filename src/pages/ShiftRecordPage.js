import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildShiftRecordRequest, createDefaultShiftRecordFilters, exportShiftRecords, fetchShiftRecordDashboard, } from '../services/shiftRecord';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './ShiftRecordPage.css';
export function ShiftRecordPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const initialFilters = useMemo(() => createDefaultShiftRecordFilters(new URLSearchParams(location.search)), [location.search]);
    const [filters, setFilters] = useState(initialFilters);
    const [dashboard, setDashboard] = useState(null);
    const [submittedFilters, setSubmittedFilters] = useState(initialFilters);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [feedback, setFeedback] = useState('交接班记录加载中');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportAudit, setExportAudit] = useState([]);
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: (dashboard?.stores ?? fallbackStores()).map((store) => ({
            id: store.value,
            label: store.label,
        })),
    });
    const loadDashboard = useCallback(async (nextFilters, reason) => {
        setIsLoading(true);
        setError('');
        setSelectedDetail(null);
        setExportAudit([]);
        setSubmittedFilters(nextFilters);
        setFeedback(reason === 'retry' ? '正在重新加载交接班记录' : '交接班记录加载中');
        try {
            const nextDashboard = await fetchShiftRecordDashboard(nextFilters);
            setDashboard(nextDashboard);
            setFeedback(resolveFeedback(reason, nextDashboard.rows.length));
        }
        catch (loadError) {
            setDashboard(null);
            setFeedback('');
            setError(loadError instanceof Error ? loadError.message : '交接班记录加载失败，请稍后重试');
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadDashboard(initialFilters, 'initial');
        }, 0);
        return () => window.clearTimeout(timer);
    }, [initialFilters, loadDashboard]);
    const serviceContract = useMemo(() => {
        const parts = [...(dashboard?.audit ?? []), ...exportAudit];
        return parts.join(';');
    }, [dashboard?.audit, exportAudit]);
    const stores = storeOptions.map((store) => ({ value: store.id, label: store.label }));
    const employees = dashboard?.employees ?? fallbackEmployees();
    const rows = dashboard?.rows ?? [];
    const canExport = Boolean(dashboard && rows.length > 0 && !error && !isLoading && !isExporting);
    const request = buildShiftRecordRequest(submittedFilters);
    function updateFilter(key, value) {
        setFilters((current) => ({ ...current, [key]: value }));
    }
    function handleSubmit(event) {
        event.preventDefault();
        void loadDashboard(filters, 'query');
    }
    function handleReset() {
        const nextFilters = createDefaultShiftRecordFilters(new URLSearchParams(location.search));
        setFilters(nextFilters);
        void loadDashboard(nextFilters, 'reset');
    }
    async function handleExport() {
        setIsExporting(true);
        setError('');
        setFeedback('正在创建交接班导出任务');
        try {
            const result = await exportShiftRecords(submittedFilters);
            setExportAudit(result.audit);
            setFeedback('交接班导出任务已创建');
        }
        catch (exportError) {
            setFeedback('');
            setError(exportError instanceof Error ? exportError.message : '交接班导出任务创建失败，请稍后重试');
        }
        finally {
            setIsExporting(false);
        }
    }
    return (_jsxs("div", { className: "shift-record-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u4EA4\u63A5\u73ED" }), _jsx("div", { className: "sr-only-heading", "aria-label": "\u4EA4\u63A5\u73ED\u6570\u636E\u670D\u52A1", children: serviceContract }), _jsx("div", { className: "sr-only-heading", role: "status", "aria-label": "\u4EA4\u63A5\u73ED\u64CD\u4F5C\u53CD\u9988", children: feedback }), _jsxs("form", { className: "shift-record-query", "aria-label": "\u4EA4\u63A5\u73ED\u7B5B\u9009", onSubmit: handleSubmit, children: [_jsxs("label", { children: [_jsx("span", { children: "\u5F00\u59CB\u65E5\u671F" }), _jsx("input", { "aria-label": "\u5F00\u59CB\u65E5\u671F", type: "date", value: filters.startDate, disabled: isLoading, onChange: (event) => updateFilter('startDate', event.target.value) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u7ED3\u675F\u65E5\u671F" }), _jsx("input", { "aria-label": "\u7ED3\u675F\u65E5\u671F", type: "date", value: filters.endDate, disabled: isLoading, onChange: (event) => updateFilter('endDate', event.target.value) })] }), _jsx(StoreSelectControl, { label: "\u95E8\u5E97", options: stores.map((option) => ({ id: option.value, name: option.label })), value: filters.storeId, disabled: isLoading || storeLoading, onChange: (storeId) => updateFilter('storeId', storeId) }), _jsxs("label", { children: [_jsx("span", { children: "\u4EA4\u73ED\u4EBA" }), _jsx("select", { "aria-label": "\u4EA4\u73ED\u4EBA", value: filters.handoverUserId, disabled: isLoading, onChange: (event) => updateFilter('handoverUserId', event.target.value), children: employees.map((option) => (_jsx("option", { value: option.value, children: resolveEmployeeLabel(option) }, `handover-${option.value}`))) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u63A5\u73ED\u4EBA" }), _jsx("select", { "aria-label": "\u63A5\u73ED\u4EBA", value: filters.receiverUserId, disabled: isLoading, onChange: (event) => updateFilter('receiverUserId', event.target.value), children: employees.map((option) => (_jsx("option", { value: option.value, children: resolveEmployeeLabel(option) }, `receiver-${option.value}`))) })] }), _jsxs("div", { className: "shift-record-actions", children: [_jsx("button", { type: "submit", className: "is-primary", disabled: isLoading || isExporting, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", disabled: isLoading || isExporting, onClick: handleReset, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", disabled: !canExport, onClick: handleExport, children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", className: "is-setting", disabled: isLoading || isExporting, onClick: () => navigate('/setting/shiftSetting'), children: "\u8BBE \u7F6E" })] })] }), _jsxs("section", { className: "shift-record-current", "aria-label": "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6", children: [_jsx("span", { children: resolveOptionLabel(stores, submittedFilters.storeId, '全部门店') }), _jsx("span", { children: submittedFilters.startDate || '开始日期不限' }), _jsx("span", { children: submittedFilters.endDate || '结束日期不限' }), _jsx("span", { children: resolveEmployeeFilterLabel(employees, submittedFilters.handoverUserId, '全部交班人') }), _jsx("span", { children: resolveEmployeeFilterLabel(employees, submittedFilters.receiverUserId, '全部接班人') }), _jsxs("span", { children: ["\u7B2C ", request.pageNum, " \u9875"] })] }), error ? (_jsxs("section", { className: "shift-record-error", role: "alert", "aria-label": "\u4EA4\u63A5\u73ED\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u4EA4\u63A5\u73ED\u6570\u636E\u5F02\u5E38" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => void loadDashboard(submittedFilters, 'retry'), children: "\u91CD\u8BD5" })] })) : null, _jsxs("section", { className: "shift-record-table-wrap", "aria-label": "\u4EA4\u63A5\u73ED\u8868\u683C", children: [_jsxs("header", { className: "shift-record-table-caption", children: [_jsxs("strong", { children: ["\u5171 ", dashboard?.pagination.total ?? 0, " \u6761\u4EA4\u63A5\u8BB0\u5F55"] }), _jsxs("span", { children: ["\u5F53\u524D\u8BF7\u6C42\uFF1A", request.campId, " / pageSize ", request.pageSize] })] }), _jsx("div", { className: "shift-record-table-scroll", children: _jsxs("table", { className: "shift-record-table", children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((column) => (_jsx("th", { children: column }, column))) }) }), _jsx("tbody", { children: rows.length > 0 ? (rows.map((row) => (_jsxs("tr", { "data-testid": "shift-record-row", children: [_jsx("td", { children: row.handoverDate }), _jsx("td", { children: row.shiftName }), _jsx("td", { children: row.handoverUserName }), _jsx("td", { children: row.handoverTime }), _jsx("td", { children: row.receiverUserName }), _jsx("td", { children: row.receiverTime }), _jsx("td", { children: _jsx("span", { className: `shift-record-status ${row.workStatus === 1 ? 'is-complete' : 'is-review'}`, children: row.status }) }), _jsx("td", { children: row.handoverRemark }), _jsx("td", { children: row.receiverRemark }), _jsx("td", { children: row.systemGeneratedAt }), _jsx("td", { children: _jsx("button", { type: "button", "aria-label": `查看详情 ${row.id}`, onClick: () => setSelectedDetail(row), children: "\u67E5\u770B\u8BE6\u60C5" }) })] }, row.id)))) : (_jsx("tr", { className: "shift-record-empty-row", children: _jsx("td", { colSpan: columns.length, children: _jsxs("div", { className: "shift-record-empty", children: [_jsx("span", { "aria-hidden": "true" }), _jsx("p", { children: isLoading ? '交接班记录加载中' : '暂无数据' }), !isLoading ? _jsx("small", { children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u6682\u65E0\u4EA4\u63A5\u73ED\u8BB0\u5F55" }) : null] }) }) })) })] }) })] }), selectedDetail ? _jsx(ShiftRecordDetailDialog, { row: selectedDetail, onClose: () => setSelectedDetail(null) }) : null] }));
}
function ShiftRecordDetailDialog({ row, onClose }) {
    const report = row.workReportDetail;
    const incomeSources = report?.workIncomeSourceList ?? [];
    const paymentTypes = report?.paymentTypeList ?? [];
    const workGoods = report?.workGoods ?? [];
    const shiftPeriod = report?.workUserStartDate || report?.workUserEndDate
        ? `${report?.workUserStartDate || '--'} - ${report?.workUserEndDate || '--'}`
        : '--';
    return (_jsx("div", { className: "shift-record-modal-mask", children: _jsxs("section", { role: "dialog", "aria-modal": "true", "aria-label": "\u4EA4\u63A5\u73ED\u8BE6\u60C5", className: "shift-record-modal", children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("h3", { children: "\u4EA4\u63A5\u73ED\u8BE6\u60C5" }), _jsx("p", { children: row.id })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: onClose, children: "\u5173\u95ED\u8BE6\u60C5" })] }), _jsxs("dl", { className: "shift-record-detail-grid", children: [_jsxs("div", { children: [_jsx("dt", { children: "\u95E8\u5E97" }), _jsx("dd", { children: row.storeName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u73ED\u6B21" }), _jsxs("dd", { children: [row.handoverDate, " / ", row.shiftName] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u4EA4\u73ED\u4EBA" }), _jsx("dd", { children: row.handoverUserName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u63A5\u73ED\u4EBA" }), _jsx("dd", { children: row.receiverUserName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u4EA4\u73ED\u72B6\u6001" }), _jsx("dd", { children: row.status })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u4EA4\u73ED\u65F6\u6BB5" }), _jsx("dd", { children: shiftPeriod })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u51C0\u6536\u5165" }), _jsx("dd", { children: formatMoney(report?.netIncome) })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u603B\u6536\u5165" }), _jsx("dd", { children: formatMoney(report?.generalIncome) })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u603B\u652F\u51FA" }), _jsx("dd", { children: formatMoney(report?.totalExpenditure) })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u7CFB\u7EDF\u751F\u6210\u65F6\u95F4" }), _jsx("dd", { children: row.systemGeneratedAt })] })] }), _jsx(ShiftRecordDetailList, { title: "\u6536\u6B3E\u6765\u6E90", items: incomeSources.map((item) => ({
                        key: item.sourceName,
                        name: item.sourceName,
                        summary: `收入 ${formatMoney(item.income)} / 支出 ${formatMoney(item.expend)}`,
                        remark: item.remark,
                    })) }), _jsx(ShiftRecordDetailList, { title: "\u652F\u4ED8\u65B9\u5F0F", items: paymentTypes.map((item) => ({
                        key: item.paymentName,
                        name: item.paymentName,
                        summary: `收入 ${formatMoney(item.income)} / 支出 ${formatMoney(item.expend)}`,
                        remark: item.remark,
                    })) }), _jsx(ShiftRecordDetailList, { title: "\u4EA4\u73ED\u7269\u54C1", items: workGoods.map((item) => ({
                        key: item.id,
                        name: item.goodsName,
                        summary: `库存 ${item.goodsNumber}`,
                        remark: item.remark,
                    })) }), report?.remark ? (_jsxs("section", { className: "shift-record-detail-note", children: [_jsx("h4", { children: "\u4EA4\u73ED\u6458\u8981" }), _jsx("p", { children: report.remark })] })) : null, _jsxs("section", { className: "shift-record-detail-note", children: [_jsx("h4", { children: "\u4EA4\u73ED\u5907\u6CE8" }), _jsx("p", { children: row.handoverRemark })] }), _jsxs("section", { className: "shift-record-detail-note", children: [_jsx("h4", { children: "\u63A5\u73ED\u5907\u6CE8" }), _jsx("p", { children: row.receiverRemark })] })] }) }));
}
function ShiftRecordDetailList({ title, items, }) {
    if (items.length === 0)
        return null;
    return (_jsxs("section", { className: "shift-record-detail-section", children: [_jsx("h4", { children: title }), _jsx("ul", { className: "shift-record-detail-list", children: items.map((item) => (_jsxs("li", { children: [_jsx("strong", { children: item.name }), _jsx("span", { children: item.summary }), item.remark ? _jsx("small", { children: item.remark }) : null] }, item.key))) })] }));
}
const columns = ['交班日期', '交班班次', '交班人', '交班时间', '接班人', '接班时间', '交接状态', '交班备注', '接班备注', '系统生成时间', '操作'];
function resolveFeedback(reason, rowCount) {
    if (rowCount === 0)
        return '当前筛选条件暂无交接班记录';
    if (reason === 'query')
        return '已按筛选条件更新交接班记录';
    if (reason === 'reset')
        return '已恢复默认筛选条件';
    if (reason === 'retry')
        return '已重新加载交接班记录';
    return '已加载交接班记录';
}
function resolveOptionLabel(options, value, fallback) {
    return options.find((item) => item.value === value)?.label || fallback;
}
function resolveEmployeeLabel(option) {
    return option.value === 'all' ? '全部员工' : option.label;
}
function resolveEmployeeFilterLabel(options, value, fallback) {
    if (value === 'all')
        return fallback;
    return options.find((item) => item.value === value)?.label || fallback;
}
function formatMoney(value) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return '--';
    return `¥${value.toFixed(2)}`;
}
function fallbackStores() {
    return [
        { value: 'all', label: '全部门店' },
        { value: '1796425098638573570', label: '天落会宿公寓(前海壹方城宝安中心店)' },
    ];
}
function fallbackEmployees() {
    return [
        { value: 'all', label: '全部员工' },
        { value: '1796067693261905922', label: '路客云6TS5' },
        { value: '1796067693261905933', label: '陈早班' },
    ];
}
