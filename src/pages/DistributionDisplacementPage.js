import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { defaultDistributionDisplacementFilters, loadDistributionDisplacementData, readInitialDistributionDisplacementFilters, } from '../services/distributionDisplacement';
import './DistributionDisplacementPage.css';
const detailColumns = [
    '序号',
    '订单号/渠道单号',
    '置换月份',
    '渠道',
    '房型',
    '房间',
    '联系人',
    '手机号',
    '入住状态',
    '结算状态',
    '入离日期',
    '结算日期',
    '结算金额',
    '置换金额',
    '操作',
];
export function DistributionDisplacementPage() {
    const [filters, setFilters] = useState(() => readInitialDistributionDisplacementFilters());
    const [appliedFilters, setAppliedFilters] = useState(filters);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [showApplyDialog, setShowApplyDialog] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const requestBodyText = useMemo(() => JSON.stringify(data?.requestBody ?? {}), [data?.requestBody]);
    useEffect(() => {
        let active = true;
        loadDistributionDisplacementData(appliedFilters)
            .then((nextData) => {
            if (!active)
                return;
            setData(nextData);
        })
            .catch((nextError) => {
            if (!active)
                return;
            setError(nextError instanceof Error ? nextError.message : String(nextError));
        })
            .finally(() => {
            if (active)
                setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [appliedFilters]);
    function showToast(text, tone = 'success') {
        setToast({ text, tone });
        window.setTimeout(() => setToast(null), 2200);
    }
    function prepareLoad() {
        setLoading(true);
        setError('');
    }
    function updateFilter(key, value) {
        setFilters((current) => ({ ...current, [key]: value, pageNum: 1 }));
    }
    function submitFilters() {
        prepareLoad();
        setAppliedFilters(filters);
        showToast('筛选已更新');
    }
    function resetFilters() {
        prepareLoad();
        setFilters(defaultDistributionDisplacementFilters);
        setAppliedFilters(defaultDistributionDisplacementFilters);
        showToast('筛选已重置');
    }
    function refreshData() {
        prepareLoad();
        setAppliedFilters((current) => ({ ...current }));
        showToast(`刷新完成：${formatDisplayTime(data?.timestamp)}`);
    }
    function exportRows() {
        if (!data || data.rows.length === 0) {
            showToast('当前条件暂无可导出明细', 'error');
            return;
        }
        showToast(`导出任务已创建，共 ${data.pagination.total} 条`);
    }
    return (_jsxs("div", { className: "distribution-displacement-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u7F6E\u6362\u6743\u76CA" }), _jsx("span", { className: "distribution-displacement-service-state", "data-testid": "distribution-displacement-service-state", "data-provider": data?.provider ?? 'mock', "data-endpoint": data?.endpoint ?? 'https://hudson-prod.localhome.cn/edition/replace/order/get', "data-request-body": requestBodyText, "data-trace-id": data?.traceId ?? '' }), toast ? (_jsx("div", { className: `distribution-displacement-toast distribution-displacement-toast--${toast.tone}`, role: "status", children: toast.text })) : null, _jsxs("section", { className: "distribution-displacement-overview", "aria-label": "\u7F6E\u6362\u6982\u51B5", children: [_jsxs("div", { className: "distribution-displacement-section-title", children: [_jsx("h2", { children: "\u7F6E\u6362\u6982\u51B5" }), _jsxs("div", { className: "distribution-displacement-actions", "aria-label": "\u7F6E\u6362\u6743\u76CA\u64CD\u4F5C", children: [_jsx("button", { type: "button", onClick: refreshData, disabled: loading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: exportRows, disabled: loading, children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", className: "distribution-displacement-primary", onClick: () => setShowApplyDialog(true), children: "\u7533\u8BF7\u5C3E\u623F\u7F6E\u6362" })] })] }), _jsxs("div", { className: "distribution-displacement-summary", children: [_jsxs("article", { className: "distribution-displacement-card", tabIndex: 0, "aria-label": "\u5F85\u7F6E\u6362\u91D1\u989D", children: [_jsx("span", { children: "\u5F85\u7F6E\u6362\u91D1\u989D:" }), _jsx("strong", { children: data?.summary.pendingReplaceAmountText ?? '¥0.00' })] }), _jsxs("article", { className: "distribution-displacement-card", tabIndex: 0, "aria-label": "\u5DF2\u7F6E\u6362\u91D1\u989D", children: [_jsx("span", { children: "\u5DF2\u7F6E\u6362\u91D1\u989D:" }), _jsx("strong", { children: data?.summary.completedReplaceAmountText ?? '¥0.00' })] })] })] }), _jsxs("section", { className: "distribution-displacement-detail", "aria-label": "\u7F6E\u6362\u660E\u7EC6", children: [_jsxs("div", { className: "distribution-displacement-detail__title", children: [_jsx("h2", { children: "\u7F6E\u6362\u660E\u7EC6" }), _jsx("span", { "aria-hidden": "true", children: "?" })] }), _jsxs("div", { className: "distribution-displacement-filter", role: "search", "aria-label": "\u65E5\u671F\u7B5B\u9009", children: [_jsx("span", { children: "\u65E5\u671F\u7B5B\u9009:" }), _jsx("button", { type: "button", className: "is-active", "aria-pressed": "true", children: "\u5168\u90E8" }), _jsxs("label", { children: [_jsx("span", { className: "sr-only-heading", children: "\u5F00\u59CB\u65E5\u671F" }), _jsx("input", { "aria-label": "\u5F00\u59CB\u65E5\u671F", type: "date", value: filters.startDate, onChange: (event) => updateFilter('startDate', event.target.value) })] }), _jsx("em", { "aria-hidden": "true", children: "~" }), _jsxs("label", { children: [_jsx("span", { className: "sr-only-heading", children: "\u7ED3\u675F\u65E5\u671F" }), _jsx("input", { "aria-label": "\u7ED3\u675F\u65E5\u671F", type: "date", value: filters.endDate, onChange: (event) => updateFilter('endDate', event.target.value) })] }), _jsx("button", { type: "button", onClick: submitFilters, disabled: loading, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", onClick: resetFilters, disabled: loading, children: "\u91CD\u7F6E" })] }), error ? (_jsxs("div", { className: "distribution-displacement-alert", role: "alert", children: [_jsx("strong", { children: "\u7F6E\u6362\u6743\u76CA\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                                    prepareLoad();
                                    setAppliedFilters((current) => ({ ...current }));
                                }, children: "\u91CD\u8BD5" })] })) : null, _jsx("div", { className: "distribution-displacement-table", "aria-busy": loading, "aria-label": "\u7F6E\u6362\u660E\u7EC6\u8868\u683C", children: _jsxs("table", { "aria-label": "\u7F6E\u6362\u660E\u7EC6\u8868\u683C", children: [_jsx("thead", { children: _jsx("tr", { children: detailColumns.map((column) => (_jsx("th", { children: column }, column))) }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: detailColumns.length, children: _jsx("div", { className: "distribution-displacement-loading", children: "\u6570\u636E\u52A0\u8F7D\u4E2D" }) }) })) : data && data.rows.length > 0 ? (data.rows.map((row, index) => (_jsxs("tr", { children: [_jsx("td", { children: index + 1 }), _jsx("td", { children: row.orderText }), _jsx("td", { children: row.replaceMonth }), _jsx("td", { children: row.channelName }), _jsx("td", { children: row.roomCategoryName }), _jsx("td", { children: row.roomName }), _jsx("td", { children: row.contactName }), _jsx("td", { children: row.contactMobile }), _jsx("td", { children: row.stayStatusLabel }), _jsx("td", { children: row.settlementStatusLabel }), _jsx("td", { children: row.stayDateRange }), _jsx("td", { children: row.settlementDate }), _jsx("td", { children: row.settlementAmountText }), _jsx("td", { children: row.replaceAmountText }), _jsx("td", { children: _jsx("button", { type: "button", className: "distribution-displacement-link-button", "aria-label": `查看 ${row.orderText.split(' / ')[0]} 详情`, onClick: () => setSelectedRow(row), children: "\u67E5\u770B" }) })] }, row.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: detailColumns.length, children: _jsxs("div", { className: "distribution-displacement-empty", children: [_jsx("span", { "aria-hidden": "true" }), _jsx("p", { children: "\u6682\u65E0\u7F6E\u6362\u660E\u7EC6" })] }) }) })) })] }) }), _jsxs("div", { className: "distribution-displacement-pagination", children: ["\u5171 ", data?.pagination.total ?? 0, " \u6761"] })] }), showApplyDialog ? (_jsx("div", { className: "distribution-displacement-modal", role: "presentation", children: _jsxs("div", { className: "distribution-displacement-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u5C3E\u623F\u7F6E\u6362", children: [_jsx("button", { type: "button", className: "distribution-displacement-dialog__close", "aria-label": "\u5173\u95ED\u5C3E\u623F\u7F6E\u6362", onClick: () => setShowApplyDialog(false), children: "\u00D7" }), _jsx("h2", { children: "\u5C3E\u623F\u7F6E\u6362" }), _jsx("div", { className: "distribution-displacement-qr", "aria-label": "\u5C3E\u623F\u7F6E\u6362\u4E8C\u7EF4\u7801", children: _jsx("span", {}) }), _jsx("p", { children: "\u8054\u7CFB\u4E1A\u52A1\u7ECF\u7406\uFF0C\u8FDB\u884C\u5C3E\u623F\u7F6E\u6362" }), _jsx("button", { type: "button", className: "distribution-displacement-primary", onClick: () => setShowApplyDialog(false), children: "\u6211\u77E5\u9053\u4E86" })] }) })) : null, selectedRow ? (_jsx("div", { className: "distribution-displacement-modal", role: "presentation", children: _jsxs("div", { className: "distribution-displacement-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u7F6E\u6362\u660E\u7EC6\u8BE6\u60C5", children: [_jsx("button", { type: "button", className: "distribution-displacement-dialog__close", "aria-label": "\u5173\u95ED\u7F6E\u6362\u660E\u7EC6\u8BE6\u60C5", onClick: () => setSelectedRow(null), children: "\u00D7" }), _jsx("h2", { children: "\u7F6E\u6362\u660E\u7EC6\u8BE6\u60C5" }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u8BA2\u5355" }), _jsx("dd", { children: selectedRow.orderText })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u623F\u578B\u623F\u95F4" }), _jsxs("dd", { children: [selectedRow.roomCategoryName, " / ", selectedRow.roomName] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8054\u7CFB\u4EBA" }), _jsxs("dd", { children: [selectedRow.contactName, " ", selectedRow.contactMobile] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u7F6E\u6362\u91D1\u989D" }), _jsx("dd", { children: selectedRow.replaceAmountText })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u4E1A\u52A1\u5907\u6CE8" }), _jsx("dd", { children: selectedRow.remark })] })] })] }) })) : null] }));
}
function formatDisplayTime(value) {
    if (!value)
        return '2026-05-18 10:00';
    return value.replace('T', ' ').replace('+08:00', '').slice(0, 16);
}
