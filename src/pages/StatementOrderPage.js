import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { createStatementOrderQuery, exportStatementOrderData, getStatementOrderStoreOptions, loadStatementOrderData, } from '../services/statementOrder';
import './StatementOrderPage.css';
const columns = [
    '订单号',
    '客户信息',
    '产品类型',
    '产品名称',
    '预订时间',
    '渠道',
    '应付金额',
    '实付金额',
    '优惠金额',
    '退款金额',
    '支付手续费',
    '平台服务费',
    '全员分销佣金',
    '支付方式',
    '结算金额',
];
export function StatementOrderPage() {
    const stores = getStatementOrderStoreOptions();
    const [selectedScope, setSelectedScope] = useState('all');
    const [submittedScope, setSubmittedScope] = useState('all');
    const [reloadToken, setReloadToken] = useState(0);
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [exportAudit, setExportAudit] = useState([]);
    const requestReasonRef = useRef('initial');
    const serviceAudit = useMemo(() => {
        const segments = data?.audit ?? [];
        return [...segments, ...exportAudit].join(';');
    }, [data?.audit, exportAudit]);
    useEffect(() => {
        const controller = new AbortController();
        void loadStatementOrderData(submittedScope, controller.signal)
            .then((result) => {
            setData(result);
            setNotice(resolveSuccessNotice(requestReasonRef.current, submittedScope));
        })
            .catch((loadError) => {
            if (loadError instanceof DOMException && loadError.name === 'AbortError')
                return;
            setData(null);
            setNotice('');
            setError(loadError instanceof Error ? loadError.message : '品牌小程序订单服务暂不可用，请稍后重试');
        })
            .finally(() => {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        });
        return () => controller.abort();
    }, [reloadToken, submittedScope]);
    const rows = data?.rows ?? [];
    const pagination = data?.pagination;
    const rangeStart = rows.length ? 1 : 0;
    const rangeEnd = rows.length;
    function reload(scope, reason, pendingNotice) {
        requestReasonRef.current = reason;
        setIsLoading(true);
        setError('');
        setSubmittedScope(scope);
        setNotice(pendingNotice);
        setExportAudit([]);
        setReloadToken((value) => value + 1);
    }
    function resetFilters() {
        setSelectedScope('all');
        reload('all', 'reset', '正在恢复默认筛选条件');
    }
    async function handleExport() {
        setIsExporting(true);
        setNotice('正在生成品牌小程序订单导出任务');
        setError('');
        try {
            const result = await exportStatementOrderData(submittedScope);
            setExportAudit(result.audit);
            setNotice('已生成品牌小程序订单导出任务');
        }
        catch (exportError) {
            setNotice('');
            setError(exportError instanceof Error ? exportError.message : '品牌小程序订单导出任务创建失败，请稍后重试');
        }
        finally {
            setIsExporting(false);
        }
    }
    return (_jsxs("div", { className: "statement-order-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u54C1\u724C\u5C0F\u7A0B\u5E8F\u8BA2\u5355" }), _jsx("div", { className: "sr-only-heading", "aria-label": "\u54C1\u724C\u5C0F\u7A0B\u5E8F\u8BA2\u5355\u6570\u636E\u670D\u52A1", children: serviceAudit }), _jsxs("section", { className: "statement-order-toolbar", "aria-label": "\u54C1\u724C\u5C0F\u7A0B\u5E8F\u8BA2\u5355\u7B5B\u9009", children: [_jsx("div", { className: "statement-order-store", role: "group", "aria-label": "\u95E8\u5E97", children: stores.map((store) => (_jsx("button", { type: "button", "aria-pressed": selectedScope === store.id, className: selectedScope === store.id ? 'is-active' : '', onClick: () => setSelectedScope(store.id), children: store.label }, store.id))) }), _jsxs("div", { className: "statement-order-actions", children: [_jsx("button", { type: "button", className: "is-outline", disabled: isLoading || isExporting, onClick: resetFilters, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-primary", disabled: isLoading || isExporting, onClick: () => reload(selectedScope, 'query', '正在刷新品牌小程序订单'), children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", className: "is-outline", disabled: isLoading || isExporting, onClick: handleExport, children: "\u5BFC\u51FA\u660E\u7EC6" })] })] }), notice ? (_jsx("div", { className: "statement-order-notice", role: "status", children: notice })) : null, error ? (_jsxs("div", { className: "statement-order-alert", role: "alert", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => reload(submittedScope, 'retry', '正在重新加载品牌小程序订单'), children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, _jsxs("section", { className: "statement-order-table-shell", "aria-label": "\u54C1\u724C\u5C0F\u7A0B\u5E8F\u8BA2\u5355\u8868\u683C", children: [_jsxs("header", { className: "statement-order-table-caption", children: [_jsxs("strong", { children: ["\u5171 ", pagination?.total ?? 0, " \u6761\u8BA2\u5355"] }), _jsxs("span", { children: ["\u67E5\u8BE2\u6761\u4EF6\uFF1A", formatScopeText(submittedScope), " \u00B7 ", createStatementOrderQuery(submittedScope).bookingStartDate, " \u81F3", ' ', createStatementOrderQuery(submittedScope).bookingEndDate] })] }), _jsx("div", { className: "statement-order-table-scroll", children: _jsxs("table", { className: "statement-order-table", children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((column) => (_jsx("th", { children: column }, column))) }) }), _jsx("tbody", { children: rows.length ? (rows.map((row) => _jsx(StatementOrderTableRow, { row: row }, row.orderId))) : (_jsx("tr", { className: "statement-order-empty-row", children: _jsx("td", { colSpan: columns.length, children: _jsxs("div", { className: "statement-order-empty", children: [_jsx("span", { "aria-hidden": "true" }), _jsx("p", { children: isLoading ? '正在刷新品牌小程序订单' : '当前条件暂无品牌小程序订单' }), !isLoading ? _jsx("small", { children: "\u6682\u65E0\u6570\u636E" }) : null] }) }) })) })] }) })] }), _jsxs("footer", { className: "statement-order-pagination", "aria-label": "\u54C1\u724C\u5C0F\u7A0B\u5E8F\u8BA2\u5355\u5206\u9875", children: [_jsxs("span", { children: ["\u7B2C ", rangeStart, "-", rangeEnd, " \u6761\uFF0C\u5171 ", pagination?.total ?? 0, " \u6761"] }), _jsx("button", { type: "button", disabled: true, children: "\u4E0A\u4E00\u9875" }), _jsx("button", { type: "button", className: "is-current", children: "1" }), _jsx("button", { type: "button", disabled: true, children: "\u4E0B\u4E00\u9875" })] })] }));
}
function StatementOrderTableRow({ row }) {
    return (_jsxs("tr", { children: [_jsx("td", { children: row.orderId }), _jsx("td", { children: row.customerInfo }), _jsx("td", { children: row.productType }), _jsx("td", { children: row.productName }), _jsx("td", { children: row.bookingTime }), _jsx("td", { children: row.channelName }), _jsx("td", { children: formatAmount(row.payableAmount) }), _jsx("td", { children: formatAmount(row.paidAmount) }), _jsx("td", { children: formatAmount(row.discountAmount) }), _jsx("td", { children: formatAmount(row.refundAmount) }), _jsx("td", { children: formatAmount(row.paymentFee) }), _jsx("td", { children: formatAmount(row.platformServiceFee) }), _jsx("td", { children: formatAmount(row.distributorCommission) }), _jsx("td", { children: row.paymentWayName }), _jsx("td", { children: formatAmount(row.settlementAmount) })] }));
}
function formatAmount(value) {
    return value.toFixed(2);
}
function formatScopeText(scope) {
    return scope === 'current' ? '当前门店' : '全部门店';
}
function resolveSuccessNotice(reason, scope) {
    if (reason === 'initial')
        return '';
    if (reason === 'reset')
        return '已恢复默认筛选条件';
    if (reason === 'retry')
        return '已重新加载品牌小程序订单';
    return scope === 'current' ? '已按当前门店刷新品牌小程序订单' : '已按全部门店刷新品牌小程序订单';
}
